#if os(iOS)
import SwiftUI
import XCTest
@testable import Kozmos

/// Decision 132's three field ends, on the simulator, read and pressed
/// through the accessibility tree VoiceOver walks.
///
/// - GAP-161: a `clearable` Search draws a clear while it holds text, named in
///   the product's words; pressing it empties the field, tells the product,
///   sends `search_cleared` without the query, and gives the field the focus
///   back.
/// - GAP-098: NumberInput's `unit` is drawn in the field and heard after the
///   value, once, by its spoken name; it is never part of the value.
/// - GAP-163: Slider's `showValue` draws the value beside the track at rest,
///   formatted by the product.
///
/// What VoiceOver hears from the text field and the slider is read in the
/// interaction suite (UITestHost): this process loads no UIKit accessibility
/// for them.
final class KozmosFieldEndsTests: XCTestCase {
    private final class TestWindow: UIWindow {
        override var safeAreaInsets: UIEdgeInsets { .zero }
    }

    private final class Query: ObservableObject {
        @Published var text: String
        init(_ text: String) { self.text = text }
    }

    private struct HostedSearch: View {
        @ObservedObject var query: Query
        var clearable = true
        var clearLabel = "Clear search"
        var onClear: () -> Void = {}
        var body: some View {
            KozmosSearch(text: $query.text, placeholder: "Search places", clearable: clearable,
                         clearLabel: clearLabel, onClear: onClear)
        }
    }

    // MARK: Search

    @MainActor func testAClearableSearchDrawsItsClearOnlyWhileItHoldsText() async throws {
        try await withAutomation {
            let full = try await show { HostedSearch(query: Query("Gate 12")) }
            defer { full.isHidden = true }
            XCTAssertEqual(buttons(in: full).compactMap(\.accessibilityLabel), ["Clear search"])

            let empty = try await show { HostedSearch(query: Query("")) }
            defer { empty.isHidden = true }
            XCTAssertEqual(buttons(in: empty).count, 0, "an empty field draws a clear")

            let plain = try await show { HostedSearch(query: Query("Gate 12"), clearable: false) }
            defer { plain.isHidden = true }
            XCTAssertEqual(buttons(in: plain).count, 0, "a Search that is not clearable draws a clear")

            let disabled = try await show { HostedSearch(query: Query("Gate 12")).disabled(true) }
            defer { disabled.isHidden = true }
            XCTAssertEqual(buttons(in: disabled).count, 0, "a disabled Search draws a clear")
        }
    }

    @MainActor func testTheClearIsNamedInTheProductsWords() async throws {
        try await withAutomation {
            let window = try await show { HostedSearch(query: Query("Gate 12"), clearLabel: "Suche löschen") }
            defer { window.isHidden = true }
            XCTAssertEqual(buttons(in: window).compactMap(\.accessibilityLabel), ["Suche löschen"])
        }
    }

    @MainActor func testClearingEmptiesTheFieldTellsTheProductAndReturnsTheFocus() async throws {
        try await withAutomation {
            let query = Query("Gate 12")
            var cleared = 0
            var events: [KozmosAnalyticsEvent] = []
            let window = try await show {
                HostedSearch(query: query, onClear: { cleared += 1 })
                    .environment(\.kozmosAnalytics) { events.append($0) }
            }
            defer { window.isHidden = true }
            let field = try XCTUnwrap(textFields(in: window).first)
            XCTAssertFalse(field.isFirstResponder)
            let clear = try XCTUnwrap(buttons(in: window).first)
            XCTAssertTrue(clear.accessibilityActivate(), "the clear took no press")
            try await Task.sleep(nanoseconds: 350_000_000)
            XCTAssertEqual(query.text, "")
            XCTAssertEqual(cleared, 1)
            XCTAssertEqual(events.map(\.eventName), ["search_cleared"])
            XCTAssertEqual(events.map(\.component), ["Search"])
            XCTAssertNil(events.first?.properties, "the clear sent the query")
            XCTAssertTrue(field.isFirstResponder, "the focus did not come back to the field")
            XCTAssertEqual(buttons(in: window).count, 0, "the clear is still drawn")
        }
    }

    /// The field is 44 tall, the clear's target, before and after the clear
    /// appears: typing the first letter does not make it grow.
    @MainActor func testTheFieldKeepsItsHeightWhenTheClearAppears() {
        func height(_ text: String) -> CGFloat {
            UIHostingController(rootView: KozmosSearch(text: .constant(text), clearable: true))
                .sizeThatFits(in: CGSize(width: 320, height: 400)).height
        }
        XCTAssertEqual(height(""), 44, accuracy: 0.5)
        XCTAssertEqual(height("Gate 12"), 44, accuracy: 0.5)
    }

    // MARK: NumberInput

    /// The field's spoken value: the value, then the unit by its spoken name
    /// (the drawn unit without one); none without a unit or a value. What
    /// VoiceOver then hears is read in the interaction suite
    /// (`testNumberInputsUnitIsHeardAfterTheValue`): this process loads no
    /// UIKit accessibility for a text field.
    @MainActor func testTheUnitIsSpokenAfterTheValue() {
        XCTAssertEqual(KozmosNumberInput(value: .constant(15), unit: "m", unitLabel: "metres").spokenValue, "15 metres")
        XCTAssertEqual(KozmosNumberInput(value: .constant(2.5), unit: "km").spokenValue, "2.5 km")
        XCTAssertNil(KozmosNumberInput(value: .constant(15)).spokenValue)
        XCTAssertNil(KozmosNumberInput(value: .constant(nil), unit: "m").spokenValue)
        XCTAssertNil(KozmosNumberInput(value: .constant(15), unit: "").spokenValue)
    }

    /// The unit is never part of the value: the field holds the number alone.
    @MainActor func testTheUnitIsNotInTheValue() async throws {
        let window = try await show { KozmosNumberInput(value: .constant(15), label: "Width", unit: "m") }
        defer { window.isHidden = true }
        XCTAssertEqual(try XCTUnwrap(textFields(in: window).first).text, "15")
    }

    /// The unit takes room inside the field, so the text field is narrower
    /// by it: drawn, never laid over the value.
    @MainActor func testTheUnitIsDrawnInsideTheField() async throws {
        let plain = try await show { KozmosNumberInput(value: .constant(15)) }
        defer { plain.isHidden = true }
        let united = try await show { KozmosNumberInput(value: .constant(15), unit: "km/h") }
        defer { united.isHidden = true }
        let without = try XCTUnwrap(textFields(in: plain).first).bounds.width
        let with = try XCTUnwrap(textFields(in: united).first).bounds.width
        XCTAssertLessThan(with, without - 16, "the unit took no room in the field")
    }

    // MARK: Slider

    /// The readout takes room on the slider's row, so the track is shorter
    /// by it: it is drawn at rest, with no hover, focus or drag.
    @MainActor func testTheReadoutIsDrawnBesideTheTrack() async throws {
        let bare = try await show { KozmosSlider(value: .constant(0.6)) }
        defer { bare.isHidden = true }
        let shown = try await show { KozmosSlider(value: .constant(0.6), showValue: true) }
        defer { shown.isHidden = true }
        let without = try XCTUnwrap(views(UISlider.self, in: bare).first).bounds.width
        let with = try XCTUnwrap(views(UISlider.self, in: shown).first).bounds.width
        XCTAssertLessThan(with, without - 8, "the readout took no room beside the track")
    }

    /// The readout is foreground 400; disabled, it is dimmed with the slider,
    /// to foreground 500, as NumberInput's unit is. Read from the ink.
    @MainActor func testADisabledSlidersReadoutIsDimmed() async throws {
        func readoutInk(_ enabled: Bool) async throws -> (r: UInt8, g: UInt8, b: UInt8) {
            let size = CGSize(width: 320, height: 44)
            let view = KozmosSlider(value: .constant(50), range: 0...100, showValue: true)
                .disabled(!enabled)
                .background(Color.white)
                .environment(\.colorScheme, .light)
            let pixels = try await RenderedPixels.render(view, size: size)
            var best: (r: UInt8, g: UInt8, b: UInt8) = (255, 255, 255)
            var y: CGFloat = 0
            while y < size.height {
                var x: CGFloat = 290
                while x < size.width {
                    let c = pixels.color(at: CGPoint(x: x, y: y))
                    if Int(c.r) + Int(c.g) + Int(c.b) < Int(best.r) + Int(best.g) + Int(best.b) { best = c }
                    x += 1 / pixels.scale
                }
                y += 1 / pixels.scale
            }
            return best
        }
        let enabled = try await readoutInk(true)
        let disabled = try await readoutInk(false)
        // #5D626F and #747B8B.
        XCTAssertEqual(Double(enabled.r), 0x5D, accuracy: 8, "the readout is not foreground 400: \(enabled)")
        XCTAssertEqual(Double(disabled.r), 0x74, accuracy: 8, "a disabled readout is not foreground 500: \(disabled)")
    }

    @MainActor func testTheReadoutIsTheNumberOrTheProductsFormat() {
        XCTAssertEqual(KozmosSlider(value: .constant(50), range: 0...100, showValue: true).readout, "50")
        XCTAssertEqual(KozmosSlider(value: .constant(0.25), showValue: true).readout, "0.25")
        XCTAssertEqual(KozmosSlider(value: .constant(0.6), showValue: true,
                                    formatValue: { "\(Int(($0 * 100).rounded())) %" }).readout, "60 %")
    }

    // MARK: Helpers

    /// `content` in a phone-sized window, once it has been laid out.
    @MainActor private func show<Content: View>(@ViewBuilder _ content: () -> Content) async throws -> UIWindow {
        let window = TestWindow(frame: CGRect(x: 0, y: 0, width: 390, height: 300))
        window.rootViewController = UIHostingController(
            rootView: content().padding(16).environment(\.colorScheme, .light))
        window.makeKeyAndVisible()
        try await Task.sleep(nanoseconds: 350_000_000)
        return window
    }

    @MainActor private func textFields(in view: UIView) -> [UITextField] {
        if let field = view as? UITextField { return [field] }
        return view.subviews.flatMap { textFields(in: $0) }
    }

    @MainActor private func buttons(in window: UIWindow) -> [NSObject] {
        elements(in: window).filter { $0.accessibilityTraits.contains(.button) }
    }

    @MainActor private func views<V: UIView>(_ type: V.Type, in view: UIView) -> [V] {
        if let match = view as? V { return [match] }
        return view.subviews.flatMap { views(type, in: $0) }
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

    @MainActor private func withAutomation(_ body: () async throws -> Void) async throws {
        let old = try XCTUnwrap(setAutomation(1))
        defer { _ = setAutomation(old) }
        try await body()
    }

    // Activate the simulator accessibility tree, as the other hosted AX tests do.
    // This test-only hook is never linked into the library.
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
}
#endif
