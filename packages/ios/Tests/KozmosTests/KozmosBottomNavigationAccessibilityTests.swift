import XCTest
import SwiftUI
#if os(iOS)
import UIKit
import Darwin
#endif
@testable import Kozmos

/// The bottom navigation's selected tile says so with the platform's selected
/// state alone, which VoiceOver says in the person's language, as React's
/// tile is `aria-current="page"`. It also had the value "Selected", English in
/// every language, so VoiceOver said "Selected" after the selected state.
///
/// Three tiles with the middle one selected, so neither end can pass by
/// standing in for "the first" or "the last". The tree is read as VoiceOver
/// reads it, with accessibility automation on: without it, SwiftUI builds no
/// accessibility tree in a unit test.
final class KozmosBottomNavigationAccessibilityTests: XCTestCase {
    #if os(iOS)
    private static let titles = ["Home", "Maps", "Alerts"]

    @MainActor func testOnlyTheSelectedTileIsSelectedAndNoTileHasAnEnglishValue() async throws {
        let bar = KozmosBottomNavigation(selection: .constant(1),
                                         items: [(icon: "house", title: "Home"), (icon: "map", title: "Maps"), (icon: "bell", title: "Alerts")])
            .frame(width: 390)
        try await inspect(bar) { window in
            let tiles = try self.tiles(in: window)
            XCTAssertEqual(tiles.map { $0.accessibilityTraits.contains(.selected) }, [false, true, false],
                           "the selected trait; the tree:\n\(self.describe(window))")
            XCTAssertEqual(tiles.map { $0.accessibilityValue ?? "" }, ["", "", ""], "the values")
            XCTAssertTrue(tiles.allSatisfy { $0.accessibilityTraits.contains(.button) }, "a tile is no longer a button")
        }
    }

    // MARK: - Reading the tree

    /// The three tiles, in order, each found once by its name.
    @MainActor private func tiles(in window: UIWindow) throws -> [NSObject] {
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

    /// The tree, for a failure's message: each node's class, traits, name and value.
    @MainActor private func describe(_ node: NSObject, depth: Int = 0) -> String {
        let line = String(repeating: "  ", count: depth)
            + "\(type(of: node)) traits=\(node.accessibilityTraits.rawValue) element=\(node.isAccessibilityElement) "
            + "label=\(node.accessibilityLabel ?? "-") value=\(node.accessibilityValue ?? "-")"
        let below = (children(node) ?? []).map { describe($0, depth: depth + 1) }
        return ([line] + below).joined(separator: "\n")
    }
    #endif
}
