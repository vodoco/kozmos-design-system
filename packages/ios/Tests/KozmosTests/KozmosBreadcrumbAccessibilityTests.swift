import XCTest
import SwiftUI
#if os(iOS)
import UIKit
import Darwin
#endif
@testable import Kozmos

/// React's breadcrumb tells a screen reader which crumb is the page it is on
/// (`aria-current="page"`, on a disabled link) and hides its separators
/// (`aria-hidden`). VoiceOver heard the current crumb only as a dimmed button,
/// and read each separator as "Forward" between the crumbs. The current
/// crumb is now selected, the platform's word for the current item of a set
/// (as the bottom navigation's current tab is), and the separators are
/// decoration.
///
/// The trail is read on its own: an in-process walk cannot read the elements
/// inside a SwiftUI scroll view (see KozmosManoeuvreCardTests), and the
/// breadcrumb holds its trail in one. The tree is read with accessibility
/// automation on: without it, SwiftUI builds no accessibility tree in a unit
/// test.
final class KozmosBreadcrumbAccessibilityTests: XCTestCase {
    #if os(iOS)
    private static let items = ["Home", "Terminal 2", "Gate 14"]

    @MainActor func testOnlyTheCurrentPageIsSelectedAndTheSeparatorsAreSilent() async throws {
        try await inspect(KozmosBreadcrumb(items: Self.items, onSelect: { _ in }).trail) { window in
            let crumbs = self.elements(window)
            XCTAssertEqual(crumbs.map { $0.accessibilityLabel ?? "-" }, Self.items, "what VoiceOver walks; the tree:\n\(self.describe(window))")
            XCTAssertEqual(crumbs.map { $0.accessibilityTraits.contains(.selected) }, [false, false, true], "the selected trait")
            XCTAssertEqual(crumbs.map { $0.accessibilityTraits.contains(.notEnabled) }, [false, false, true], "the dimmed trait")
            XCTAssertTrue(crumbs.allSatisfy { $0.accessibilityTraits.contains(.button) }, "a crumb is no longer a button")
        }
    }

    /// VoiceOver's double tap on an earlier crumb still goes there.
    @MainActor func testActivatingAnEarlierCrumbSelectsIt() async throws {
        var chosen: [Int] = []
        try await inspect(KozmosBreadcrumb(items: Self.items, onSelect: { chosen.append($0) }).trail) { window in
            let terminal = try XCTUnwrap(self.elements(window).first { $0.accessibilityLabel == "Terminal 2" })
            XCTAssertTrue(terminal.accessibilityActivate(), "VoiceOver cannot activate the crumb")
            try await Task.sleep(nanoseconds: 200_000_000)
            XCTAssertEqual(chosen, [1])
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
        try await Task.sleep(nanoseconds: 300_000_000)
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

    /// The tree, for a failure's message: each node's class, traits and name.
    @MainActor private func describe(_ node: NSObject, depth: Int = 0) -> String {
        let line = String(repeating: "  ", count: depth)
            + "\(type(of: node)) traits=\(node.accessibilityTraits.rawValue) element=\(node.isAccessibilityElement) label=\(node.accessibilityLabel ?? "-")"
        let below = (children(node) ?? []).map { describe($0, depth: depth + 1) }
        return ([line] + below).joined(separator: "\n")
    }
    #endif
}
