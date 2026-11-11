import SwiftUI
import XCTest
@testable import Kozmos

/// GAP-153: a field of a multi-selection whose values differ shows "Multiple
/// values", is said with it once, keeps it until edited, and offers "Reset to
/// multiple values" once edited. As React's and Compose's fields do.
final class KozmosMixedValueTests: XCTestCase {
    func testTheResetIsOfferedOnlyWhenGivenAndNotMixed() {
        XCTAssertTrue(KozmosMixedValue.showsReset(mixed: false, onReset: {}, disabled: false))
        XCTAssertFalse(KozmosMixedValue.showsReset(mixed: true, onReset: {}, disabled: false))
        XCTAssertFalse(KozmosMixedValue.showsReset(mixed: false, onReset: nil, disabled: false))
        XCTAssertFalse(KozmosMixedValue.showsReset(mixed: false, onReset: {}, disabled: true))
        XCTAssertFalse(KozmosMixedValue.showsReset(mixed: false, onReset: {}, disabled: false, readOnly: true))
    }

    func testTheSelectFieldShowsTheMixedLabelInPlaceOfAChoice() {
        let mixed = KozmosSelectField(value: "POI", placeholder: "Type", mixed: true)
        XCTAssertEqual(mixed.shownText, "Multiple values")
        XCTAssertTrue(mixed.showsPlaceholder)
        let chosen = KozmosSelectField(value: "POI", placeholder: "Type")
        XCTAssertEqual(chosen.shownText, "POI")
        XCTAssertFalse(chosen.showsPlaceholder)
        XCTAssertEqual(KozmosSelectField(value: nil, placeholder: "Type").shownText, "Type")
        XCTAssertEqual(
            KozmosSelectField(value: "POI", placeholder: "Type", mixed: true, mixedLabel: "Mehrere Werte").shownText,
            "Mehrere Werte"
        )
    }

    #if os(iOS)
    /// A field across a multi-selection, as Pointr Cloud's editors hold it.
    private struct EditedName: View {
        @State var edit: String?
        var body: some View {
            KozmosInput(
                text: Binding(get: { edit ?? "" }, set: { edit = $0 }),
                label: "Name",
                mixed: edit == nil,
                onResetMixed: { edit = nil }
            )
        }
    }

    @MainActor func testAMixedInputSaysTheMixedLabelAndOffersNoReset() async throws {
        let old = try XCTUnwrap(setAutomation(1))
        defer { _ = setAutomation(old) }
        let window = host(EditedName(edit: nil))
        defer { window.isHidden = true }
        try await Task.sleep(nanoseconds: 300_000_000)
        let field = try XCTUnwrap(textFields(in: window).first)
        XCTAssertEqual(field.text, "")
        XCTAssertEqual(field.placeholder, "Multiple values")
        XCTAssertFalse(elements(in: window).contains { $0.accessibilityLabel == "Reset to multiple values" })
    }

    @MainActor func testTheSelectFieldSaysItsNameThenItsValue() async throws {
        let old = try XCTUnwrap(setAutomation(1))
        defer { _ = setAutomation(old) }
        let window = host(KozmosSelect(value: "POI", placeholder: "Choose", label: "Type", mixed: true) { Text("POI") })
        defer { window.isHidden = true }
        try await Task.sleep(nanoseconds: 300_000_000)
        let found = elements(in: window)
        let field = try XCTUnwrap(found.first { ($0.accessibilityValue ?? "").contains("Multiple values") }, describe(found))
        XCTAssertEqual(field.accessibilityLabel, "Type")
        XCTAssertEqual(found.filter { ($0.accessibilityLabel ?? "") == "Type" }.count, 1, describe(found))
    }

    /// A Combobox's bindings, kept to read what the field wrote.
    private final class Written {
        var values: [String] = []
        var texts: [String] = []
    }

    /// A mixed Combobox the visitor types a query into once it is drawn.
    private struct TypedQuery: View {
        let written: Written
        @State private var text = ""
        var body: some View {
            KozmosCombobox(
                value: Binding(get: { "" }, set: { written.values.append($0) }),
                inputValue: Binding(get: { text }, set: { text = $0; written.texts.append($0) }),
                options: [KozmosListboxOption(value: "b2", label: "Gate B2")],
                label: "Gate", mixed: true
            )
            .task {
                try? await Task.sleep(nanoseconds: 100_000_000)
                text = "B"
            }
        }
    }

    @MainActor func testAMixedComboboxsClearEmptiesOnlyTheQuery() async throws {
        let old = try XCTUnwrap(setAutomation(1))
        defer { _ = setAutomation(old) }
        let written = Written()
        let window = host(TypedQuery(written: written))
        defer { window.isHidden = true }
        try await Task.sleep(nanoseconds: 500_000_000)
        let clear = try XCTUnwrap(elements(in: window).first { $0.accessibilityLabel == "Clear selection" }, describe(elements(in: window)))
        XCTAssertTrue(clear.accessibilityActivate())
        try await Task.sleep(nanoseconds: 200_000_000)
        XCTAssertEqual(written.texts.last, "")
        XCTAssertEqual(written.values, [], "no empty choice is reported while mixed")
    }

    @MainActor func testAComboboxEmptiesItsTextAsItIsMixed() async throws {
        let written = Written()
        let window = host(KozmosCombobox(
            value: .constant("b2"),
            inputValue: Binding(get: { "Gate B2" }, set: { written.texts.append($0) }),
            options: [KozmosListboxOption(value: "b2", label: "Gate B2")],
            label: "Gate", mixed: true
        ))
        defer { window.isHidden = true }
        try await Task.sleep(nanoseconds: 300_000_000)
        XCTAssertEqual(written.texts, [""], "the choice's label is emptied, as React's is")
    }

    @MainActor func testAnEditedInputOffersTheResetAndShowsItsValue() async throws {
        let old = try XCTUnwrap(setAutomation(1))
        defer { _ = setAutomation(old) }
        let window = host(EditedName(edit: "Gate B2"))
        defer { window.isHidden = true }
        try await Task.sleep(nanoseconds: 300_000_000)
        let field = try XCTUnwrap(textFields(in: window).first)
        XCTAssertEqual(field.text, "Gate B2")
        let found = elements(in: window)
        let reset = try XCTUnwrap(found.first { $0.accessibilityLabel == "Reset to multiple values" }, describe(found))
        XCTAssertTrue(reset.accessibilityTraits.contains(.button))
    }

    @MainActor func testEachFieldIsSaidAsMixed() async throws {
        let old = try XCTUnwrap(setAutomation(1))
        defer { _ = setAutomation(old) }
        let fields: [AnyView] = [
            AnyView(KozmosNumberInput(value: .constant(4), label: "Height", mixed: true)),
            AnyView(KozmosCombobox(
                value: .constant("a1"), options: [KozmosListboxOption(value: "a1", label: "Gate A1")],
                label: "Gate", mixed: true
            )),
        ]
        for view in fields {
            let window = host(view)
            defer { window.isHidden = true }
            try await Task.sleep(nanoseconds: 300_000_000)
            let field = try XCTUnwrap(textFields(in: window).first)
            XCTAssertEqual(field.text, "")
            XCTAssertEqual(field.placeholder, "Multiple values")
        }
        // Select's field is one element whose value is the mixed label.
        let window = host(KozmosSelect(value: "POI", placeholder: "Type", mixed: true) { Text("POI") })
        defer { window.isHidden = true }
        try await Task.sleep(nanoseconds: 300_000_000)
        let found = elements(in: window)
        XCTAssertTrue(found.contains { ($0.accessibilityValue ?? "").contains("Multiple values") || ($0.accessibilityLabel ?? "").contains("Multiple values") }, describe(found))
        XCTAssertFalse(found.contains { ($0.accessibilityValue ?? "") == "POI" || ($0.accessibilityLabel ?? "") == "POI" }, describe(found))
    }

    @MainActor private func textFields(in view: UIView) -> [UITextField] {
        if let field = view as? UITextField { return [field] }
        return view.subviews.flatMap { textFields(in: $0) }
    }

    @MainActor private func host<V: View>(_ view: V) -> UIWindow {
        let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 390, height: 500))
        window.rootViewController = UIHostingController(rootView: view)
        window.makeKeyAndVisible()
        return window
    }

    @MainActor private func describe(_ found: [NSObject]) -> String {
        found.map { "\($0.accessibilityLabel ?? "-")=\($0.accessibilityValue ?? "-")" }.joined(separator: ", ")
    }

    @MainActor private func elements(in node: NSObject) -> [NSObject] {
        if node.accessibilityElementsHidden { return [] }
        if let view = node as? UIView, view.isHidden || view.alpha == 0 { return [] }
        if node.isAccessibilityElement { return [node] }
        let children: [NSObject]
        if let items = node.accessibilityElements as? [NSObject], !items.isEmpty { children = items }
        else if case let count = node.accessibilityElementCount(), count != NSNotFound, count > 0 {
            children = (0..<count).compactMap { node.accessibilityElement(at: $0) as? NSObject }
        } else if let view = node as? UIView { children = view.subviews }
        else { children = [] }
        return children.flatMap { elements(in: $0) }
    }

    // Activate the simulator accessibility tree, as the other hosted AX tests do.
    private static let accessibility = dlopen("/usr/lib/libAccessibility.dylib", RTLD_NOW)
    private func setAutomation(_ on: Int32) -> Int32? {
        typealias Get = @convention(c) () -> Int32
        typealias Set = @convention(c) (Int32) -> Void
        guard let library = Self.accessibility,
              let get = dlsym(library, "_AXSAutomationEnabled"),
              let set = dlsym(library, "_AXSSetAutomationEnabled") else { return nil }
        let old = unsafeBitCast(get, to: Get.self)()
        unsafeBitCast(set, to: Set.self)(on)
        return old
    }
    #endif
}
