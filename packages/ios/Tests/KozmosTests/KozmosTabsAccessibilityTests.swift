import XCTest
import SwiftUI
#if os(iOS)
import UIKit
import Darwin
#endif
@testable import Kozmos

/// React's tabs are Radix's: a `tablist` of `tab`s, the selected one
/// `aria-selected`. VoiceOver is told the same here: the selected trigger is
/// selected and the others are not, and on iOS 17 and later the list is a tab
/// bar that holds the tabs (WCAG 4.1.2).
/// Until then each trigger was a plain button, and the selected tab was shown
/// only by its segment.
///
/// Three tabs with the middle one selected, so neither end can pass by
/// standing in for "the first" or "the last". The tree is read as VoiceOver
/// reads it, with accessibility automation on: without it, SwiftUI builds no
/// accessibility tree in a unit test.
final class KozmosTabsAccessibilityTests: XCTestCase {
    #if os(iOS)
    private static let titles = ["Hours", "Access", "Reviews"]

    private struct PlaceTabs: View {
        @State var selection: String

        var body: some View {
            KozmosTabs(selection: $selection) {
                KozmosTabsList {
                    ForEach(KozmosTabsAccessibilityTests.titles, id: \.self) { title in
                        KozmosTabsTrigger(value: title.lowercased(), title: title, selection: $selection)
                    }
                }
                KozmosTabsContent(value: "hours", selection: $selection) { Text("Open until six") }
                KozmosTabsContent(value: "access", selection: $selection) { Text("Step-free entrance") }
                KozmosTabsContent(value: "reviews", selection: $selection) { Text("Four stars") }
            }
            .frame(width: 360)
        }
    }

    @MainActor func testOnlyTheSelectedTabIsSelected() async throws {
        try await inspect(PlaceTabs(selection: "access")) { window in
            let tabs = try self.tabs(in: window)
            for (title, tab) in zip(Self.titles, tabs) {
                XCTAssertTrue(tab.accessibilityTraits.contains(.button), "\(title) is no longer a button")
                XCTAssertEqual(tab.accessibilityTraits.contains(.selected), title == "Access",
                               "\(title)'s selected trait; the tree:\n\(self.describe(window))")
            }
        }
    }

    @MainActor func testTheListIsATabBarThatHoldsTheTabs() async throws {
        try XCTSkipUnless(ProcessInfo.processInfo.isOperatingSystemAtLeast(OperatingSystemVersion(majorVersion: 17, minorVersion: 0, patchVersion: 0)),
                          "SwiftUI names a tab bar from iOS 17")
        try await inspect(PlaceTabs(selection: "access")) { window in
            let bars = self.containers(window).filter { $0.accessibilityTraits.contains(.tabBar) }
            XCTAssertEqual(bars.count, 1, "the tab bars; the tree:\n\(self.describe(window))")
            let bar = try XCTUnwrap(bars.first)
            // The bar contains its tabs and swallows none of them: the
            // elements in it are the three tabs VoiceOver reaches, each its
            // own element with its own name.
            let inBar = self.elements(bar)
            XCTAssertEqual(inBar.map(\.accessibilityLabel), Self.titles)
            let tabs = try self.tabs(in: window)
            XCTAssertEqual(inBar.count, tabs.count)
            for (held, tab) in zip(inBar, tabs) { XCTAssertTrue(held === tab, "\(tab.accessibilityLabel ?? "-") is not in the bar") }
            // The panel is not in the bar.
            XCTAssertTrue(self.elements(window).contains { $0.accessibilityLabel == "Step-free entrance" })
        }
    }

    /// VoiceOver's double tap still runs the tab, and the trait follows the
    /// selection to the tab it chose.
    @MainActor func testActivatingATabMovesTheSelection() async throws {
        try await inspect(PlaceTabs(selection: "hours")) { window in
            let reviews = try XCTUnwrap(self.elements(window).first { $0.accessibilityLabel == "Reviews" })
            XCTAssertTrue(reviews.accessibilityActivate(), "VoiceOver cannot activate the tab")
            try await Task.sleep(nanoseconds: 200_000_000)
            let tabs = try self.tabs(in: window)
            XCTAssertEqual(tabs.map { $0.accessibilityTraits.contains(.selected) }, [false, false, true],
                           "the tree:\n\(self.describe(window))")
            XCTAssertTrue(self.elements(window).contains { $0.accessibilityLabel == "Four stars" }, "the panel did not follow")
        }
    }

    // MARK: - Reading the tree

    /// The three tabs, in order, each found once by its name.
    @MainActor private func tabs(in window: UIWindow) throws -> [NSObject] {
        let all = elements(window)
        return try Self.titles.map { title in
            let found = all.filter { $0.accessibilityLabel == title }
            XCTAssertEqual(found.count, 1, "elements named \(title)")
            return try XCTUnwrap(found.first, "no element named \(title)")
        }
    }

    @MainActor private func inspect<V: View>(_ view: V, check: (UIWindow) async throws -> Void) async throws {
        typealias Get = @convention(c) () -> Int32
        typealias Set = @convention(c) (Int32) -> Void
        let library = try XCTUnwrap(dlopen("/usr/lib/libAccessibility.dylib", RTLD_NOW))
        let get = unsafeBitCast(try XCTUnwrap(dlsym(library, "_AXSAutomationEnabled")), to: Get.self)
        let set = unsafeBitCast(try XCTUnwrap(dlsym(library, "_AXSSetAutomationEnabled")), to: Set.self)
        let old = get(); set(1); defer { set(old) }
        let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 390, height: 844))
        window.rootViewController = UIHostingController(rootView: view)
        window.makeKeyAndVisible()
        defer { window.isHidden = true }
        try await Task.sleep(nanoseconds: 200_000_000)
        try await check(window)
    }

    /// A node's children as VoiceOver walks them, or nil for an element or a hidden node.
    @MainActor private func children(_ node: NSObject) -> [NSObject]? {
        if node.accessibilityElementsHidden { return nil }
        if let view = node as? UIView, view.isHidden || view.alpha == 0 { return nil }
        if node.isAccessibilityElement { return nil }
        if let values = node.accessibilityElements as? [NSObject], !values.isEmpty { return values }
        if case let count = node.accessibilityElementCount(), count != NSNotFound, count > 0 {
            return (0..<count).compactMap { node.accessibilityElement(at: $0) as? NSObject }
        }
        return (node as? UIView)?.subviews ?? []
    }

    /// Every element under `node`, in VoiceOver's order.
    @MainActor private func elements(_ node: NSObject) -> [NSObject] {
        if node.accessibilityElementsHidden { return [] }
        if let view = node as? UIView, view.isHidden || view.alpha == 0 { return [] }
        if node.isAccessibilityElement { return [node] }
        return (children(node) ?? []).flatMap { elements($0) }
    }

    /// Every node under `node` that holds elements without being one, outermost first.
    @MainActor private func containers(_ node: NSObject) -> [NSObject] {
        guard let children = children(node) else { return [] }
        return [node] + children.flatMap { containers($0) }
    }

    /// The tree, for a failure's message: each node's class, traits and name.
    @MainActor private func describe(_ node: NSObject, depth: Int = 0) -> String {
        let line = String(repeating: "  ", count: depth)
            + "\(type(of: node)) traits=\(node.accessibilityTraits.rawValue) element=\(node.isAccessibilityElement) label=\(node.accessibilityLabel ?? "-")"
        let below = (children(node) ?? []).map { describe($0, depth: depth + 1) }
        return ([line] + below).joined(separator: "\n")
    }
    #endif
}
