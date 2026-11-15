import XCTest
import SwiftUI
#if os(iOS)
import UIKit
import Darwin
#endif
@testable import Kozmos

/// GAP-152, as VoiceOver hears it: a tab with an icon is still one button
/// named by its title, selected or not, and the icon says nothing, even one
/// its caller named: unhidden, a named icon makes the tab "Icon, Hours".
///
/// The tree is read as VoiceOver reads it, with accessibility automation
/// on: without it, SwiftUI builds no accessibility tree in a unit test.
final class KozmosTabsIconAccessibilityTests: XCTestCase {
    #if os(iOS)
    private static let tabs = [("hours", "Hours", "clock"), ("access", "Access", "figure.roll"), ("reviews", "Reviews", "star")]

    private struct IconTabs: View {
        @State var selection: String

        var body: some View {
            KozmosTabs(selection: $selection) {
                KozmosTabsList {
                    ForEach(KozmosTabsIconAccessibilityTests.tabs, id: \.0) { value, title, symbol in
                        // Each icon named, as a product's KozmosIcon with an
                        // accessibilityLabel would be: the tab still says only
                        // its title.
                        KozmosTabsTrigger(value: value, title: title, selection: $selection) {
                            Image(systemName: symbol).accessibilityLabel("Icon")
                        }
                    }
                }
            }
            .frame(width: 360)
        }
    }

    @MainActor func testATabWithAnIconIsOneButtonNamedByItsTitle() async throws {
        try await inspect(IconTabs(selection: "access")) { window in
            let all = self.elements(window)
            XCTAssertEqual(all.map { $0.accessibilityLabel ?? "-" }, Self.tabs.map(\.1),
                           "the elements VoiceOver reaches; the tree:\n\(self.describe(window))")
            for (element, tab) in zip(all, Self.tabs) {
                XCTAssertTrue(element.accessibilityTraits.contains(.button), "\(tab.1) is not a button")
                XCTAssertEqual(element.accessibilityTraits.contains(.selected), tab.0 == "access", "\(tab.1)'s selected trait")
            }
        }
    }

    // MARK: - Reading the tree

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

    @MainActor private func describe(_ node: NSObject, depth: Int = 0) -> String {
        let line = String(repeating: "  ", count: depth)
            + "\(type(of: node)) traits=\(node.accessibilityTraits.rawValue) element=\(node.isAccessibilityElement) label=\(node.accessibilityLabel ?? "-")"
        let below = (children(node) ?? []).map { describe($0, depth: depth + 1) }
        return ([line] + below).joined(separator: "\n")
    }
    #endif
}
