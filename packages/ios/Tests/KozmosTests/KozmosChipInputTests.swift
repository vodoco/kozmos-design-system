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

    // React's entry_added and entry_removed (GAP-234's follow-up): one
    // entry_added per entry an edit adds, with its `value`, for a comma,
    // a pasted list or Return, never for an entry already in the field; one
    // entry_removed per entry removed, by Delete in the empty field or by a
    // chip's remove; nothing while the field is read-only or disabled. Each
    // test ends with an event the field sends, so each fails against a
    // field that sends none.

    @MainActor private final class Sent {
        var events: [KozmosAnalyticsEvent] = []
        /// Each event as `name value`, after checking it is ChipInput's.
        var said: [String] {
            events.map { event in
                guard event.component == "ChipInput", case .string(let value)? = event.properties?["value"],
                      event.properties?.count == 1 else {
                    return "unexpected \(event.component) \(event.eventName) \(String(describing: event.properties))"
                }
                return "\(event.eventName) \(value)"
            }
        }
    }

    @MainActor private final class Lockable: ObservableObject {
        @Published var values: [String]
        @Published var readOnly = false
        @Published var disabled = false
        init(_ values: [String]) { self.values = values }
    }

    private struct TrackedHost: View {
        @ObservedObject var held: Lockable
        let sent: Sent
        var body: some View {
            KozmosChipInput(
                values: $held.values,
                label: "Anahtar kelimeler",
                disabled: held.disabled,
                readOnly: held.readOnly,
                removeLabel: { "\($0) kaldır" }
            )
            .environment(\.kozmosAnalytics) { event in sent.events.append(event) }
        }
    }

    /// Types `text` into the field as the keyboard or a paste does: the
    /// field's whole new text, then its editing-changed action, called on
    /// the coordinator itself (a hosted window's `sendActions` reaches no
    /// target).
    @MainActor private func type(_ text: String, into field: UITextField) async throws {
        field.text = text
        let coordinator = try XCTUnwrap(field.delegate as? KozmosChipInputTextField.Coordinator)
        coordinator.edited(field)
        try await Task.sleep(nanoseconds: 100_000_000)
    }

    @MainActor private func pressReturn(in field: UITextField) async throws {
        _ = field.delegate?.textFieldShouldReturn?(field)
        try await Task.sleep(nanoseconds: 100_000_000)
    }

    @MainActor func testEachEntryACommaAPasteOrReturnAddsSendsEntryAddedAndADuplicateNone() async throws {
        let held = Lockable(["kahve"])
        let sent = Sent()
        try await inspect(TrackedHost(held: held, sent: sent)) { window in
            let field = try XCTUnwrap(self.textField(in: window), "no UITextField in the field")
            // A pasted list: çay and su are added, kahve is already there.
            // (A UITextField keeps no line break; KozmosChipInputEdit's own
            // tests split on them.)
            try await self.type("çay, kahve,su,kola", into: field)
            XCTAssertEqual(held.values, ["kahve", "çay", "su"])
            XCTAssertEqual(sent.said, ["entry_added çay", "entry_added su"])
            // Return on the duplicate left typed adds nothing and sends nothing.
            try await self.pressReturn(in: field)
            XCTAssertEqual(held.values, ["kahve", "çay", "su"])
            XCTAssertEqual(sent.said, ["entry_added çay", "entry_added su"], "a duplicate was reported")
            // A comma typed after one entry.
            try await self.type("kola,", into: field)
            // Return with the field holding only spaces leaves Return to the host.
            try await self.type("   ", into: field)
            try await self.pressReturn(in: field)
            // Return adds what is typed.
            try await self.type(" ayran ", into: field)
            try await self.pressReturn(in: field)
            XCTAssertEqual(held.values, ["kahve", "çay", "su", "kola", "ayran"])
            XCTAssertEqual(sent.said, ["entry_added çay", "entry_added su", "entry_added kola", "entry_added ayran"])
        }
    }

    @MainActor func testDeleteInTheEmptyFieldAndAChipsRemoveSendEntryRemoved() async throws {
        let held = Lockable(["kahve", "çay", "su"])
        let sent = Sent()
        try await inspect(TrackedHost(held: held, sent: sent)) { window in
            let field = try XCTUnwrap(self.textField(in: window), "no UITextField in the field")
            field.deleteBackward()
            try await Task.sleep(nanoseconds: 100_000_000)
            XCTAssertEqual(held.values, ["kahve", "çay"])
            let remove = try XCTUnwrap(
                self.elements(window).first { $0.accessibilityLabel == "kahve kaldır" },
                "no remove named kahve kaldır")
            XCTAssertTrue(remove.accessibilityActivate(), "kahve's remove did not activate")
            try await Task.sleep(nanoseconds: 100_000_000)
            XCTAssertEqual(held.values, ["çay"])
            XCTAssertEqual(sent.said, ["entry_removed su", "entry_removed kahve"])
        }
    }

    @MainActor func testAReadOnlyOrDisabledFieldSendsNothing() async throws {
        let held = Lockable(["kahve", "çay"])
        let sent = Sent()
        try await inspect(TrackedHost(held: held, sent: sent)) { window in
            let field = try XCTUnwrap(self.textField(in: window), "no UITextField in the field")
            for lock in [\Lockable.readOnly, \Lockable.disabled] {
                held[keyPath: lock] = true
                try await Task.sleep(nanoseconds: 200_000_000)
                field.deleteBackward()
                try await self.type("su,", into: field)
                try await self.type("ayran", into: field)
                try await self.pressReturn(in: field)
                if let remove = self.elements(window).first(where: { $0.accessibilityLabel == "kahve kaldır" }) {
                    _ = remove.accessibilityActivate()
                    try await Task.sleep(nanoseconds: 100_000_000)
                }
                XCTAssertEqual(held.values, ["kahve", "çay"], "\(lock) changed the entries")
                XCTAssertEqual(sent.said, [], "\(lock) sent events")
                held[keyPath: lock] = false
                try await Task.sleep(nanoseconds: 200_000_000)
            }
            // Unlocked again, the same Delete removes and reports.
            try await self.type("", into: field)
            field.deleteBackward()
            try await Task.sleep(nanoseconds: 100_000_000)
            XCTAssertEqual(held.values, ["kahve"])
            XCTAssertEqual(sent.said, ["entry_removed çay"])
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
