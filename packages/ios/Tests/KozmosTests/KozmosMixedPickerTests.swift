import SwiftUI
import XCTest
@testable import Kozmos

/// GAP-255, decision 188: MultiSelect, TimePicker, DatePicker and
/// DateRangePicker take GAP-153's mixed state. Mixed, a field shows none of
/// its own value, "Multiple values" in its place, said once; a choice is the
/// visitor's edit; "Reset to multiple values" is offered once it is edited.
/// As React's and Compose's do.
final class KozmosMixedPickerTests: XCTestCase {
    private let gates = [
        KozmosListboxOption(value: "a1", label: "Gate A1"),
        KozmosListboxOption(value: "b2", label: "Gate B2"),
    ]

    // Mixed, no option is chosen: the field shows none, the list checks none.
    func testAMixedMultiSelectShowsNoChoice() {
        let mixed = KozmosMultiSelect(selectedValues: .constant(["a1", "b2"]), options: gates, mixed: true)
        XCTAssertEqual(mixed.shownValues, [])
        XCTAssertEqual(mixed.listSelection.wrappedValue, [])
        let chosen = KozmosMultiSelect(selectedValues: .constant(["a1"]), options: gates)
        XCTAssertEqual(chosen.shownValues, ["a1"])
    }

    // A choice from a mixed field is that option alone, never added to the
    // values the field hid: the product writes it over every feature's own.
    func testAChoiceFromAMixedMultiSelectIsThatOptionAlone() {
        var written: [[String]] = []
        let binding = Binding<[String]>(get: { ["a1"] }, set: { written.append($0) })
        let mixed = KozmosMultiSelect(selectedValues: binding, options: gates, mixed: true)
        var list = mixed.listSelection
        list.wrappedValue.append("b2")
        XCTAssertEqual(written, [["b2"]])
        _ = list
    }

    #if os(iOS)
    @MainActor func testAMixedMultiSelectSaysTheMixedLabelOnceWithNoChipsOrClear() async throws {
        let old = try XCTUnwrap(setAutomation(1))
        defer { _ = setAutomation(old) }
        let window = host(KozmosMultiSelect(
            selectedValues: .constant(["a1"]), options: gates, label: "Gates", defaultOpen: true, mixed: true
        ))
        defer { window.isHidden = true }
        let field = try await drawn("the field", in: window) { textFields(in: window).first }
        XCTAssertEqual(field.text, "")
        XCTAssertEqual(field.placeholder, "Multiple values")
        // Open (defaultOpen) and drawn: its chevron says Close. The list's
        // rows sit in a scroll view this tree does not reach; that none is
        // checked is testAMixedMultiSelectShowsNoChoice's.
        _ = try await drawn("the open field", in: window) {
            elements(in: window).first { $0.accessibilityLabel == "Close options" }
        }
        let found = elements(in: window)
        XCTAssertFalse(found.contains { $0.accessibilityLabel == "Gate A1" }, "no chip: \(describe(found))")
        XCTAssertFalse(found.contains { $0.accessibilityLabel == "Clear selected options" }, "nothing to clear")
        XCTAssertFalse(found.contains { $0.accessibilityLabel == "Reset to multiple values" }, "no reset while mixed")
    }

    @MainActor func testAnEditedMultiSelectOffersTheResetAndItCallsBack() async throws {
        let old = try XCTUnwrap(setAutomation(1))
        defer { _ = setAutomation(old) }
        let written = Written()
        let window = host(KozmosMultiSelect(
            selectedValues: .constant(["a1"]), options: gates, label: "Gates",
            onResetMixed: { written.resets += 1 }
        ))
        defer { window.isHidden = true }
        let reset = try await drawn("the reset", in: window) {
            elements(in: window).first { $0.accessibilityLabel == "Reset to multiple values" }
        }
        XCTAssertTrue(reset.accessibilityTraits.contains(.button))
        XCTAssertTrue(reset.accessibilityActivate())
        try await until("the reset calls back") { written.resets == 1 }
    }

    /// Each temporal field, mixed, says the mixed label once and no value.
    @MainActor func testEachMixedTemporalFieldSaysTheMixedLabelOnce() async throws {
        let old = try XCTUnwrap(setAutomation(1))
        defer { _ = setAutomation(old) }
        let day = Date(timeIntervalSince1970: 1_779_667_200) // 25 May 2026
        let fields: [(String, AnyView, Int)] = [
            ("time", AnyView(KozmosTimePicker(selection: .constant(day), label: "Opens", mixed: true)), 1),
            ("date", AnyView(KozmosDatePicker(selection: .constant(day), label: "Opens on", mixed: true)), 1),
            ("range", AnyView(KozmosDateRangePicker(
                startDate: .constant(day), endDate: .constant(day.addingTimeInterval(86_400)), label: "Open", mixed: true
            )), 2),
        ]
        for (name, view, count) in fields {
            let window = host(view)
            defer { window.isHidden = true }
            let said = try await drawn("the \(name) field's mixed label", in: window) { () -> [NSObject]? in
                let found = elements(in: window).filter { saysMixed($0) }
                return found.isEmpty ? nil : found
            }
            // Settle, then count: once per field, never twice.
            try await Task.sleep(nanoseconds: 300_000_000)
            let found = elements(in: window)
            XCTAssertEqual(found.filter { saysMixed($0) }.count, count, "\(name): \(describe(found))")
            XCTAssertEqual(said.count, count, "\(name): \(describe(found))")
            XCTAssertFalse(
                found.contains { ($0.accessibilityValue ?? "").contains("2026") || ($0.accessibilityLabel ?? "").contains("2026") },
                "\(name) says no date of its own: \(describe(found))"
            )
            XCTAssertFalse(found.contains { $0.accessibilityLabel == "Reset to multiple values" }, "\(name): no reset while mixed")
        }
    }

    @MainActor func testAnEditedTemporalFieldOffersTheResetAndItCallsBack() async throws {
        let old = try XCTUnwrap(setAutomation(1))
        defer { _ = setAutomation(old) }
        let written = Written()
        let reset = { written.resets += 1 }
        let fields: [(String, AnyView)] = [
            ("time", AnyView(KozmosTimePicker(selection: .constant(Date()), label: "Opens", onResetMixed: reset))),
            ("date", AnyView(KozmosDatePicker(selection: .constant(Date()), label: "Opens on", onResetMixed: reset))),
            ("range", AnyView(KozmosDateRangePicker(label: "Open", onResetMixed: reset))),
        ]
        for (index, (name, view)) in fields.enumerated() {
            let window = host(view)
            defer { window.isHidden = true }
            let button = try await drawn("the \(name) reset", in: window) { () -> NSObject? in
                let found = elements(in: window).filter { $0.accessibilityLabel == "Reset to multiple values" }
                return found.count == 1 ? found[0] : nil
            }
            XCTAssertTrue(button.accessibilityTraits.contains(.button), name)
            XCTAssertTrue(button.accessibilityActivate(), name)
            try await until("the \(name) reset calls back") { written.resets == index + 1 }
        }
    }

    @MainActor func testNoResetWhileDisabledOrReadOnly() async throws {
        let old = try XCTUnwrap(setAutomation(1))
        defer { _ = setAutomation(old) }
        let views: [AnyView] = [
            AnyView(KozmosDatePicker(selection: .constant(Date()), label: "Day", disabled: true, onResetMixed: {})),
            AnyView(KozmosTimePicker(selection: .constant(Date()), label: "Time", readOnly: true, onResetMixed: {})),
            AnyView(KozmosMultiSelect(selectedValues: .constant(["a1"]), options: gates, label: "Gates", disabled: true, onResetMixed: {})),
        ]
        for view in views {
            let window = host(view)
            defer { window.isHidden = true }
            // Nothing should be drawn, so there is nothing to wait for: a
            // settle as long as the enabled fields take to draw their reset.
            try await Task.sleep(nanoseconds: 1_000_000_000)
            XCTAssertFalse(elements(in: window).contains { $0.accessibilityLabel == "Reset to multiple values" })
        }
    }

    private final class Written {
        var resets = 0
    }

    @MainActor private func saysMixed(_ node: NSObject) -> Bool {
        (node.accessibilityValue ?? "").contains("Multiple values")
            || (node.accessibilityLabel ?? "").contains("Multiple values")
            || ((node as? UITextField)?.placeholder ?? "").contains("Multiple values")
    }

    @MainActor private func textFields(in view: UIView) -> [UITextField] {
        if let field = view as? UITextField { return [field] }
        return view.subviews.flatMap { textFields(in: $0) }
    }

    @MainActor private func drawn<T>(_ what: String, in window: UIWindow, _ find: () -> T?) async throws -> T {
        let deadline = Date().addingTimeInterval(10)
        while Date() <= deadline {
            if let found = find() { return found }
            try await Task.sleep(nanoseconds: 50_000_000)
        }
        return try XCTUnwrap(find(), "\(what) was never drawn: \(describe(elements(in: window)))")
    }

    @MainActor private func until(_ what: String, _ done: () -> Bool) async throws {
        let deadline = Date().addingTimeInterval(10)
        while !done() {
            if Date() > deadline { XCTFail("\(what) never happened"); return }
            try await Task.sleep(nanoseconds: 50_000_000)
        }
    }

    @MainActor private func host<V: View>(_ view: V) -> UIWindow {
        let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 390, height: 600))
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
