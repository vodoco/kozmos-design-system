import XCTest
import SwiftUI
#if os(iOS)
import UIKit
import Darwin
#endif
@testable import Kozmos

/// GAP-164, as VoiceOver hears it: a Select option with a count is named
/// with it, "Gates, 12", since the system menu reads an item with a
/// subtitle by its title alone. Without a count the option is named by its
/// label, as before. The count is never part of the label, so the closed
/// select, which shows a label, does not repeat it.
///
/// This reads the element each option builds, outside a menu, where its two
/// Texts would read "Gates, 12" even without the name the option gives
/// itself. That the system menu draws the count as the item's subtitle and
/// reads the item by that name, and by its title alone without it, was read
/// from a real menu opened in the interaction host.
///
/// The tree is read as VoiceOver reads it, with accessibility automation
/// on: without it, SwiftUI builds no accessibility tree in a unit test.
final class KozmosSelectItemCountTests: XCTestCase {
    #if os(iOS)
    private struct Options: View {
        @State var selection = "gates"

        var body: some View {
            VStack {
                KozmosSelectItem(value: "gates", label: "Gates", count: 12, selection: $selection)
                KozmosSelectItem(value: "cafes", label: "Cafes", count: 1234, selection: $selection)
                KozmosSelectItem(value: "toilets", label: "Toilets", selection: $selection)
            }
        }
    }

    /// The count is read with the label, in the reader's own number format,
    /// and an option with none is named by its label alone.
    @MainActor func testASelectOptionsCountIsReadWithItsLabel() async throws {
        try await inspect(Options()) { window in
            let names = self.elements(window).map { $0.accessibilityLabel ?? "-" }
            XCTAssertEqual(names, ["Gates, 12", "Cafes, \(1234.formatted())", "Toilets"],
                           "the tree:\n\(self.describe(window))")
        }
    }

    /// The count is not part of the option's label: a trigger that shows the
    /// chosen option's label shows no count.
    @MainActor func testASelectOptionsLabelCarriesNoCount() {
        let option = KozmosSelectItem(value: "gates", label: "Gates", count: 12, selection: .constant("gates"))
        XCTAssertEqual(option.label, "Gates")
        XCTAssertEqual(option.count, 12)
        XCTAssertNil(KozmosSelectItem(value: "toilets", label: "Toilets", selection: .constant("")).count)
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
