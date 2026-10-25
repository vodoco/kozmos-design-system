import XCTest
import SwiftUI
#if os(iOS)
import UIKit
import Darwin
#endif
@testable import Kozmos

/// A selected navigation item says so with the platform's selected state,
/// which VoiceOver says in the person's language, as React's item is
/// `aria-current`. It said it with the value "Selected", English in every
/// language, and had no selected state.
///
/// Three items with the middle one selected, so neither end can pass by
/// standing in for "the first" or "the last", in a side list and in a rail,
/// one selected by `selected` and one by `state`. The tree is read as
/// VoiceOver reads it, with accessibility automation on: without it, SwiftUI
/// builds no accessibility tree in a unit test.
final class KozmosNavigationItemAccessibilityTests: XCTestCase {
    #if os(iOS)
    private static let labels = ["Home", "Levels", "Settings"]

    private struct Items: View {
        let placement: KozmosNavigationItemPlacement
        let selectedByState: Bool

        var body: some View {
            VStack(spacing: 0) {
                ForEach(KozmosNavigationItemAccessibilityTests.labels, id: \.self) { label in
                    let chosen = label == "Levels"
                    KozmosNavigationItem(label: label, placement: placement,
                                         content: placement == .rail ? .iconLabel : .label,
                                         state: chosen && selectedByState ? .selected : .default,
                                         selected: chosen && !selectedByState) {
                        KozmosIcon("home-line", size: placement == .rail ? .lg : .md)
                    }
                }
            }
            .frame(width: placement == .rail ? 96 : 240)
        }
    }

    @MainActor func testOnlyTheSelectedItemIsSelectedAndNoItemHasAnEnglishValue() async throws {
        for (placement, selectedByState) in [(KozmosNavigationItemPlacement.side, false), (.rail, true)] {
            try await inspect(Items(placement: placement, selectedByState: selectedByState)) { window in
                let items = try self.items(in: window)
                let name = "\(placement)"
                XCTAssertEqual(items.map { $0.accessibilityTraits.contains(.selected) }, [false, true, false],
                               "\(name): the selected trait; the tree:\n\(self.describe(window))")
                XCTAssertEqual(items.map { $0.accessibilityValue ?? "" }, ["", "", ""], "\(name): the values")
                XCTAssertTrue(items.allSatisfy { $0.accessibilityTraits.contains(.button) }, "\(name): an item is no longer a button")
            }
        }
    }

    // MARK: - Reading the tree

    /// The three items, in order, each found once by its name.
    @MainActor private func items(in window: UIWindow) throws -> [NSObject] {
        let all = elements(window)
        return try Self.labels.map { label in
            let found = all.filter { $0.accessibilityLabel == label }
            XCTAssertEqual(found.count, 1, "elements named \(label)")
            return try XCTUnwrap(found.first, "no element named \(label)")
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
