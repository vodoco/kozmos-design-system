import XCTest
import SwiftUI
#if os(iOS)
import UIKit
import Darwin
#endif
@testable import Kozmos

/// GAP-222, decision 216: ChipInput, a field that takes free text and holds
/// each entry as a removable chip inside it. Return or a comma adds the text,
/// Delete in the empty field removes the last entry, and each chip's remove
/// is named in the product's words.
final class KozmosChipInputTests: XCTestCase {
    func testACommaAddsWhatComesBeforeItTrimmedAndKeepsTheRestTyped() {
        let result = KozmosChipInputEdit.typed("  coffee ,te", into: ["wifi"])
        XCTAssertEqual(result?.entries, ["wifi", "coffee"])
        XCTAssertEqual(result?.text, "te")
        XCTAssertEqual(result?.added, ["coffee"])
        XCTAssertNil(KozmosChipInputEdit.typed("coffee", into: []), "text with no comma is only typed")
    }

    func testAPastedListAddsEachLineAndPart() {
        let result = KozmosChipInputEdit.typed("coffee, tea\nwater", into: [])
        XCTAssertEqual(result?.entries, ["coffee", "tea"])
        XCTAssertEqual(result?.text, "water")
    }

    func testReturnAddsTheTrimmedTextAndLeavesAnEmptyFieldToTheHost() {
        XCTAssertEqual(KozmosChipInputEdit.submitted(" tea ", into: ["coffee"])?.entries, ["coffee", "tea"])
        XCTAssertEqual(KozmosChipInputEdit.submitted(" tea ", into: ["coffee"])?.text, "")
        XCTAssertNil(KozmosChipInputEdit.submitted("   ", into: ["coffee"]))
    }

    func testADuplicateAddsNothingAndKeepsItsText() {
        let result = KozmosChipInputEdit.submitted("coffee", into: ["coffee"])
        XCTAssertEqual(result?.entries, ["coffee"])
        XCTAssertEqual(result?.text, "coffee")
        XCTAssertEqual(result?.duplicate, "coffee")
        XCTAssertEqual(result?.added, [])
    }

    func testDeleteInTheEmptyFieldRemovesTheLastEntry() {
        XCTAssertEqual(KozmosChipInputEdit.deletedInEmptyField(["coffee", "tea"]), ["coffee"])
        XCTAssertNil(KozmosChipInputEdit.deletedInEmptyField([]))
    }

    #if os(iOS)
    @MainActor private final class Held: ObservableObject {
        @Published var values: [String]
        init(_ values: [String]) { self.values = values }
    }

    private struct Host: View {
        @ObservedObject var held: Held
        let readOnly: Bool
        var body: some View {
            KozmosChipInput(
                values: $held.values,
                label: "Anahtar kelimeler",
                readOnly: readOnly,
                removeLabel: { "\($0) kaldır" }
            )
        }
    }

    @MainActor func testTheOnScreenKeyboardsDeleteInTheEmptyFieldRemovesTheLastEntry() async throws {
        let held = Held(["kahve", "çay"])
        try await inspect(Host(held: held, readOnly: false)) { window in
            let field = try XCTUnwrap(self.textField(in: window), "no UITextField in the field")
            field.deleteBackward()
            try await Task.sleep(nanoseconds: 100_000_000)
            XCTAssertEqual(held.values, ["kahve"])
        }
    }

    @MainActor func testReadOnlyTheEmptyFieldsDeleteRemovesNothing() async throws {
        let held = Held(["kahve", "çay"])
        try await inspect(Host(held: held, readOnly: true)) { window in
            let field = try XCTUnwrap(self.textField(in: window), "no UITextField in the field")
            field.deleteBackward()
            try await Task.sleep(nanoseconds: 100_000_000)
            XCTAssertEqual(held.values, ["kahve", "çay"])
        }
    }

    @MainActor func testEachChipsRemoveIsNamedByRemoveLabelAndTheFieldByItsLabel() async throws {
        let held = Held(["kahve", "çay"])
        try await inspect(Host(held: held, readOnly: false)) { window in
            let all = self.elements(window)
            let names = all.compactMap { $0.accessibilityLabel }
            XCTAssertTrue(names.contains("kahve kaldır"), "names: \(names)")
            XCTAssertTrue(names.contains("çay kaldır"), "names: \(names)")
            XCTAssertTrue(names.contains("Anahtar kelimeler"), "the text field is not an element named by the label: \(names)")
            // One line tall, not every point the window offers.
            XCTAssertEqual(self.textField(in: window)?.frame.height, 36)
        }
    }

    @MainActor private func textField(in view: UIView) -> UITextField? {
        if let field = view as? UITextField { return field }
        for child in view.subviews { if let field = textField(in: child) { return field } }
        return nil
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
        try await Task.sleep(nanoseconds: 300_000_000)
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

    @MainActor private func elements(_ node: NSObject) -> [NSObject] {
        if node.accessibilityElementsHidden { return [] }
        if let view = node as? UIView, view.isHidden || view.alpha == 0 { return [] }
        if node.isAccessibilityElement { return [node] }
        return (children(node) ?? []).flatMap { elements($0) }
    }
    #endif
}
