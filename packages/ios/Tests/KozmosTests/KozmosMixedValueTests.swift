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

    // Decision of 11 Nov: a step from a mixed field would write one number
    // over every selected feature's own.
    func testANumberInputsSteppersAreDisabledWhileMixed() {
        XCTAssertTrue(KozmosNumberInput(value: .constant(4), mixed: true).steppersDisabled)
        XCTAssertFalse(KozmosNumberInput(value: .constant(4)).steppersDisabled)
    }

    // GAP-153 with GAP-098: the unit stays, said after the mixed label,
    // never after the hidden value.
    func testAMixedNumberInputWithAUnitSaysTheLabelThenTheUnit() {
        let mixed = KozmosNumberInput(value: .constant(4), mixed: true, unit: "m", unitLabel: "metres")
        XCTAssertEqual(mixed.spokenValue, "Multiple values, metres")
        XCTAssertTrue(mixed.steppersDisabled)
        XCTAssertEqual(KozmosNumberInput(value: .constant(4), unit: "m", unitLabel: "metres").spokenValue, "4 metres")
    }

    func testAMixedNumberInputReportsOnlyNumbers() {
        XCTAssertEqual(KozmosNumberInput.draftValue("-", mixed: true, drafting: false), .some(nil))
        XCTAssertEqual(KozmosNumberInput.draftValue("-.", mixed: true, drafting: false), .some(nil))
        XCTAssertEqual(KozmosNumberInput.draftValue("-5", mixed: true, drafting: false), .some(-5))
        XCTAssertEqual(KozmosNumberInput.draftValue("-0.5", mixed: false, drafting: true), .some(-0.5))
        XCTAssertEqual(KozmosNumberInput.draftValue("-5", mixed: false, drafting: false), nil)
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

    @MainActor func testAMixedNumberInputsSteppersAreReadAsDimmed() async throws {
        let old = try XCTUnwrap(setAutomation(1))
        defer { _ = setAutomation(old) }
        for mixed in [true, false] {
            let window = host(KozmosNumberInput(value: .constant(4), label: "Height", mixed: mixed))
            defer { window.isHidden = true }
            try await Task.sleep(nanoseconds: 300_000_000)
            let steppers = elements(in: window).filter {
                $0.accessibilityLabel == "Increase value" || $0.accessibilityLabel == "Decrease value"
            }
            XCTAssertEqual(steppers.count, 2, describe(elements(in: window)))
            XCTAssertEqual(steppers.allSatisfy { $0.accessibilityTraits.contains(.notEnabled) }, mixed, "mixed=\(mixed)")
        }
    }

    @MainActor func testAnUnlabelledSelectFieldSetsNoEmptyName() async throws {
        let old = try XCTUnwrap(setAutomation(1))
        defer { _ = setAutomation(old) }
        let window = host(KozmosSelectField(value: nil, placeholder: "Choose", mixed: true))
        defer { window.isHidden = true }
        try await Task.sleep(nanoseconds: 300_000_000)
        let found = elements(in: window)
        let field = try XCTUnwrap(found.first { ($0.accessibilityValue ?? "").contains("Multiple values") }, describe(found))
        XCTAssertNotEqual(field.accessibilityLabel, "", describe(found))
    }

    // GAP-153 with GAP-154: the copy stays, disabled while mixed: nothing is
    // copied, and "Copied" is never said over nothing.
    @MainActor func testAMixedInputsCopyIsDisabled() async throws {
        let old = try XCTUnwrap(setAutomation(1))
        defer { _ = setAutomation(old) }
        let written = Written()
        let window = host(KozmosInput(
            text: .constant("FID-1"), label: "Feature ID", action: .copy(onCopy: { written.texts.append($0) }),
            mixed: true
        ))
        defer { window.isHidden = true }
        try await Task.sleep(nanoseconds: 300_000_000)
        XCTAssertEqual(try XCTUnwrap(textFields(in: window).first).text, "")
        let copy = try XCTUnwrap(elements(in: window).first { $0.accessibilityLabel == "Copy" }, describe(elements(in: window)))
        XCTAssertTrue(copy.accessibilityTraits.contains(.notEnabled), "the copy is disabled while mixed")
        _ = copy.accessibilityActivate()
        try await Task.sleep(nanoseconds: 200_000_000)
        XCTAssertEqual(written.texts, [], "nothing is copied")
    }

    /// A NumberInput across a multi-selection: mixed until a number is typed.
    private struct EditedHeight: View {
        let written: Written
        @State private var edit: Double??
        var body: some View {
            KozmosNumberInput(
                value: Binding(get: { edit ?? nil }, set: { edit = .some($0); written.texts.append($0.map { "\($0)" } ?? "nil") }),
                label: "Height",
                mixed: edit == nil
            )
        }
    }

    // Focused, UIKit writes the field's empty text back: a mixed field took
    // that for an edit and wrote nil, which a product writes over every
    // feature, before a key was pressed. Typed text ("-5", "-0.5") is
    // reported only once it is a number: testAMixedNumberInputReportsOnlyNumbers.
    // A hosted SwiftUI TextField takes no typing from a test, so the typing
    // itself is not driven here.
    @MainActor func testFocusingAMixedNumberInputWritesNothing() async throws {
        let written = Written()
        let window = host(EditedHeight(written: written))
        defer { window.isHidden = true }
        try await Task.sleep(nanoseconds: 300_000_000)
        let field = try XCTUnwrap(textFields(in: window).first)
        XCTAssertTrue(field.becomeFirstResponder())
        try await Task.sleep(nanoseconds: 400_000_000)
        XCTAssertEqual(written.texts, [], "nothing is written over the several values")
        XCTAssertEqual(field.placeholder, "Multiple values")
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

    /// A Combobox whose field turns mixed, or leaves and comes back, once drawn.
    private struct Turning: View {
        let written: Written
        let startsMixed: Bool
        let comesBack: Bool
        @State private var mixed: Bool
        @State private var shown = true
        @State private var text: String
        init(written: Written, startsMixed: Bool, text: String, comesBack: Bool) {
            self.written = written
            self.startsMixed = startsMixed
            self.comesBack = comesBack
            _mixed = State(initialValue: startsMixed)
            _text = State(initialValue: text)
        }
        var body: some View {
            VStack {
                if shown {
                    KozmosCombobox(
                        value: .constant("b2"),
                        inputValue: Binding(get: { text }, set: { text = $0; written.texts.append($0) }),
                        options: [KozmosListboxOption(value: "b2", label: "Gate B2")],
                        label: "Gate", mixed: mixed
                    )
                }
            }
            .task {
                try? await Task.sleep(nanoseconds: 100_000_000)
                if comesBack {
                    // Scrolled away and back, or a tab left and returned to.
                    shown = false
                    try? await Task.sleep(nanoseconds: 100_000_000)
                    shown = true
                } else {
                    // Out of mixed by an edit, and back by a reset.
                    mixed = false
                    try? await Task.sleep(nanoseconds: 300_000_000)
                    mixed = true
                }
            }
        }
    }

    @MainActor func testAComboboxEmptiesItsTextAsItTurnsMixed() async throws {
        let written = Written()
        // Drawn mixed, then edited and reset: the text goes once, on the turn
        // to mixed, never as the field appears.
        let window = host(Turning(written: written, startsMixed: true, text: "Gate B2", comesBack: false))
        defer { window.isHidden = true }
        try await Task.sleep(nanoseconds: 1_200_000_000)
        XCTAssertEqual(written.texts, [""], "the text goes on the turn to mixed, and only then")
    }

    @MainActor func testAQueryTypedWhileMixedSurvivesTheFieldComingBack() async throws {
        let written = Written()
        let window = host(Turning(written: written, startsMixed: true, text: "B", comesBack: true))
        defer { window.isHidden = true }
        try await Task.sleep(nanoseconds: 600_000_000)
        XCTAssertEqual(written.texts, [], "nothing empties the visitor's query")
        let field = try XCTUnwrap(textFields(in: window).first)
        XCTAssertEqual(field.text, "B")
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
