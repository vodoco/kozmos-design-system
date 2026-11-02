import XCTest
import SwiftUI
#if os(iOS)
import UIKit
import Darwin
#endif
@testable import Kozmos

/// Accordion's boxed form (decision 149), drawn and read back: the sections
/// of Pointr Cloud's building editor. A header is 44 here, this platform's
/// target, where React's is the density's control height, 40 compact and 44
/// touch. `disabled` and `loading` are new on this platform: before them a
/// trigger took every tap.
final class KozmosAccordionBoxedTests: XCTestCase {
    private struct Mark: View {
        var body: some View { KozmosIcon("home-line") }
    }

    /// Open, closed, disabled and loading, in that order, 8 apart: the open
    /// header at 0, its 30 of content at 52, then 90, 142 and 194.
    private struct Sections: View {
        @State var open: String? = "open"
        var loading = true

        var body: some View {
            KozmosAccordion(variant: .boxed) {
                KozmosAccordionItem {
                    KozmosAccordionTrigger(value: "open", title: "Building details", selection: $open, label: "Step 1/5") { Mark() }
                    KozmosAccordionContent(value: "open", selection: $open) { Color.clear.frame(height: 30) }
                }
                KozmosAccordionItem {
                    KozmosAccordionTrigger(value: "closed", title: "Location", selection: $open, label: "Step 2/5") { Mark() }
                    KozmosAccordionContent(value: "closed", selection: $open) { Text("Where it is") }
                }
                KozmosAccordionItem(disabled: true) {
                    KozmosAccordionTrigger(value: "disabled", title: "Levels", selection: $open, label: "Step 3/5") { Mark() }
                    KozmosAccordionContent(value: "disabled", selection: $open) { Text("The levels") }
                }
                KozmosAccordionItem {
                    KozmosAccordionTrigger(value: "loading", title: "Floor plans", selection: $open, label: "Step 4/5", loading: loading,
                                           loadingLabel: "Yükleniyor") { Mark() }
                    KozmosAccordionContent(value: "loading", selection: $open) { Text("The plans") }
                }
            }
            .frame(width: 408)
            .frame(maxHeight: .infinity, alignment: .top)
        }
    }

    #if os(iOS)
    private static let size = CGSize(width: 408, height: 300)
    private static let schemes: [ColorScheme] = [.light, .dark]

    private func draw<V: View>(_ view: V, _ scheme: ColorScheme) async throws -> RenderedPixels {
        try await RenderedPixels.render(
            view
                .background(scheme == .dark ? Color.black : Color.white)
                .environment(\.colorScheme, scheme),
            size: Self.size
        )
    }

    /// A test for the token as this scheme resolves it, read off a swatch.
    @MainActor private func ink(_ colour: Color, _ scheme: ColorScheme, tolerance: Int = 6) throws -> (UInt8, UInt8, UInt8) -> Bool {
        let token = try DrawnPixels.resolved(colour, in: scheme)
        return { r, g, b in
            abs(Int(r) - Int(token.r)) <= tolerance && abs(Int(g) - Int(token.g)) <= tolerance && abs(Int(b) - Int(token.b)) <= tolerance
        }
    }

    private static let whole = CGRect(origin: .zero, size: size)

    @MainActor func testTheOpenHeaderIsTheThemes900At44Tall() async throws {
        for scheme in Self.schemes {
            let drawn = try await draw(Sections(), scheme)
            let fill = try ink(KozmosColors.primitivesColorsTheme900, scheme)
            let box = try XCTUnwrap(drawn.boundingBox(in: Self.whole, where: fill), "\(scheme): nothing is theme 900")
            XCTAssertEqual(box.minY, 0, accuracy: 0.7, "\(scheme): \(box)")
            XCTAssertEqual(box.height, 44, accuracy: 0.7, "\(scheme): \(box)")
            XCTAssertEqual(box.width, 408, accuracy: 0.7, "\(scheme): \(box)")
        }
    }

    /// Corners are the control radius: outside a 16 corner at (4, 4), and
    /// inside it at (6, 6), which a 12 corner would not tell from a 16.
    @MainActor func testTheHeadersCornersAreTheControlRadius() async throws {
        let drawn = try await draw(Sections(), .light)
        let fill = try ink(KozmosColors.primitivesColorsTheme900, .light)
        let at = { (x: CGFloat, y: CGFloat) -> Bool in
            let pixel = drawn.color(at: CGPoint(x: x, y: y))
            return fill(pixel.r, pixel.g, pixel.b)
        }
        XCTAssertFalse(at(4, 4), "(4, 4) is inside the corner")
        XCTAssertTrue(at(6, 6), "(6, 6) is outside the corner")
        XCTAssertTrue(at(204, 22), "the middle of the header is not filled")
    }

    @MainActor func testTheSectionsAre8Apart() async throws {
        for scheme in Self.schemes {
            let drawn = try await draw(Sections(), scheme)
            let grey = try ink(KozmosColors.primitivesColorsBackground100, scheme)
            let first = try XCTUnwrap(drawn.boundingBox(in: CGRect(x: 0, y: 138, width: 408, height: 52), where: grey), "\(scheme): no disabled header")
            let second = try XCTUnwrap(drawn.boundingBox(in: CGRect(x: 0, y: 190, width: 408, height: 52), where: grey), "\(scheme): no loading header")
            XCTAssertEqual(first.minY, 142, accuracy: 0.7, "\(scheme): \(first)")
            XCTAssertEqual(first.height, 44, accuracy: 0.7, "\(scheme): \(first)")
            XCTAssertEqual(second.minY - first.maxY, 8, accuracy: 0.7, "\(scheme): \(first), \(second)")
        }
    }

    /// The label and title read on the fill in both themes, because each is
    /// drawn in the token that turns over with it, and nothing else does:
    /// white in both themes would be 1.41:1 in the dark.
    @MainActor func testTheOpenHeadersWordsAreTheirTokens() async throws {
        for scheme in Self.schemes {
            let drawn = try await draw(Sections(), scheme)
            let row = CGRect(x: 36, y: 2, width: 200, height: 40)
            let title = try ink(KozmosColors.primitivesColorsForeground1000, scheme, tolerance: 30)
            let label = try ink(KozmosColors.primitivesColorsTheme300, scheme, tolerance: 30)
            XCTAssertGreaterThan(drawn.count(in: row, where: title), 20, "\(scheme): no title ink")
            XCTAssertGreaterThan(drawn.count(in: row, where: label), 8, "\(scheme): no label ink")
        }
    }

    /// A closed header has a chevron to see, so its absence below means
    /// something; a disabled header has none, and a loading one has a spinner.
    @MainActor func testADisabledHeaderDrawsNoChevronAndALoadingOneASpinner() async throws {
        for scheme in Self.schemes {
            let drawn = try await draw(Sections(), scheme)
            let page = try ink(KozmosColors.primitivesColorsBackground0, scheme)
            let grey = try ink(KozmosColors.primitivesColorsBackground100, scheme)
            let mark = { (top: CGFloat) in CGRect(x: 378, y: top + 12, width: 22, height: 20) }
            let inked = { (top: CGFloat, ground: (UInt8, UInt8, UInt8) -> Bool) in
                drawn.count(in: mark(top)) { r, g, b in !ground(r, g, b) }
            }
            XCTAssertGreaterThan(inked(90, page), 10, "\(scheme): the closed header's chevron is missing, so this reads nothing")
            XCTAssertEqual(inked(142, grey), 0, "\(scheme): the disabled header draws a chevron")
            XCTAssertGreaterThan(inked(194, grey), 10, "\(scheme): the loading header draws no spinner")
        }
    }

    /// The icon at the start and the chevron at the end, mirrored right to
    /// left, on a closed header.
    @MainActor func testRightToLeftMirrorsTheMarks() async throws {
        let drawn = try await draw(Sections().environment(\.layoutDirection, .rightToLeft), .light)
        let page = try ink(KozmosColors.primitivesColorsBackground0, .light)
        let inked = { (x: CGFloat) in
            drawn.count(in: CGRect(x: x, y: 102, width: 20, height: 20)) { r, g, b in !page(r, g, b) }
        }
        // The mark's own box, 9 from each end; the words are between them.
        XCTAssertGreaterThan(inked(379), 10, "no icon at the right")
        XCTAssertGreaterThan(inked(9), 10, "no chevron at the left")
    }

    /// At an accessibility size a header grows with its words and clips none,
    /// where a fixed height would cut them. Laid out, not drawn: the hosted
    /// snapshot gives the view its own traits.
    @MainActor func testAHeaderGrowsWithLargeText() {
        func height(_ textSize: DynamicTypeSize) -> CGFloat {
            let header = KozmosAccordion(variant: .boxed) {
                KozmosAccordionItem {
                    KozmosAccordionTrigger(value: "one", title: "Building details", selection: .constant(nil), label: "Step 1/5") { Mark() }
                }
            }
            .environment(\.dynamicTypeSize, textSize)
            return UIHostingController(rootView: header)
                .sizeThatFits(in: CGSize(width: 408, height: CGFloat.greatestFiniteMagnitude))
                .height
        }
        XCTAssertEqual(height(.large), 44, accuracy: 0.5, "at the default size")
        XCTAssertGreaterThan(height(.accessibility3), 60, "at accessibility3")
    }

    @MainActor func testTheDocsSnippetDraws() async throws {
        struct Host: View {
            @State var open: String? = "details"
            var body: some View { BuildingSections(open: $open, levelsLoading: true, plansReached: false).frame(width: 408) }
        }
        let drawn = try await draw(Host().frame(maxHeight: .infinity, alignment: .top), .light)
        let fill = try ink(KozmosColors.primitivesColorsTheme900, .light)
        XCTAssertEqual(try XCTUnwrap(drawn.boundingBox(in: Self.whole, where: fill)).height, 44, accuracy: 0.7)
    }

    // MARK: - What VoiceOver hears

    @MainActor func testATriggerSaysItsLabelThenItsTitle() async throws {
        try await inspect(Sections()) { window in
            let trigger = try self.element(named: "Step 1/5, Building details", in: window)
            XCTAssertTrue(trigger.accessibilityTraits.contains(.button))
            XCTAssertFalse(trigger.accessibilityTraits.contains(.notEnabled), "an enabled trigger reads dimmed")
            XCTAssertNil(trigger.accessibilityValue, "an idle trigger says a value")
        }
    }

    @MainActor func testADisabledTriggerReadsDimmedAndOpensNothing() async throws {
        try await inspect(Sections()) { window in
            let trigger = try self.element(named: "Step 3/5, Levels", in: window)
            XCTAssertTrue(trigger.accessibilityTraits.contains(.notEnabled), "it reads as enabled")
            XCTAssertFalse(trigger.accessibilityActivate(), "VoiceOver can activate it")
            try await Task.sleep(nanoseconds: 300_000_000)
            XCTAssertFalse(self.elements(window).contains { $0.accessibilityLabel == "The levels" }, "it opened")
        }
    }

    @MainActor func testALoadingTriggerSaysSoInTheProductsWordsAndOpensNothing() async throws {
        try await inspect(Sections()) { window in
            let trigger = try self.element(named: "Step 4/5, Floor plans", in: window)
            XCTAssertEqual(trigger.accessibilityValue, "Yükleniyor")
            XCTAssertTrue(trigger.accessibilityTraits.contains(.notEnabled), "it reads as enabled")
            XCTAssertFalse(trigger.accessibilityActivate(), "VoiceOver can activate it")
            try await Task.sleep(nanoseconds: 300_000_000)
            XCTAssertFalse(self.elements(window).contains { $0.accessibilityLabel == "The plans" }, "it opened")
        }
    }

    /// When the product clears `loading`, the same trigger opens.
    @MainActor func testATriggerOpensOnceLoadingEnds() async throws {
        try await inspect(Sections(loading: false)) { window in
            let trigger = try self.element(named: "Step 4/5, Floor plans", in: window)
            XCTAssertNil(trigger.accessibilityValue)
            XCTAssertFalse(trigger.accessibilityTraits.contains(.notEnabled))
            XCTAssertTrue(trigger.accessibilityActivate(), "VoiceOver cannot activate it")
            try await Task.sleep(nanoseconds: 400_000_000)
            XCTAssertTrue(self.elements(window).contains { $0.accessibilityLabel == "The plans" }, "it did not open")
        }
    }

    /// `disabled` is the item's in the default form as well, and an open
    /// item's content stays, as React's does.
    @MainActor func testTheDefaultFormTakesDisabledAndKeepsItsOpenContent() async throws {
        struct Rows: View {
            @State var open: String? = "hours"
            var body: some View {
                KozmosAccordion {
                    KozmosAccordionItem(disabled: true) {
                        KozmosAccordionTrigger(value: "hours", title: "Opening hours", selection: $open)
                        KozmosAccordionContent(value: "hours", selection: $open) { Text("Nine to five") }
                    }
                }
                .frame(width: 360)
            }
        }
        try await inspect(Rows()) { window in
            let trigger = try self.element(named: "Opening hours", in: window)
            XCTAssertTrue(trigger.accessibilityTraits.contains(.notEnabled))
            XCTAssertFalse(trigger.accessibilityActivate())
            try await Task.sleep(nanoseconds: 300_000_000)
            XCTAssertTrue(self.elements(window).contains { $0.accessibilityLabel == "Nine to five" }, "the open content went")
        }
    }

    // MARK: - Reading the tree

    @MainActor private func element(named label: String, in window: UIWindow) throws -> NSObject {
        let found = elements(window).filter { $0.accessibilityLabel == label }
        XCTAssertEqual(found.count, 1, "elements named \(label); found \(elements(window).compactMap(\.accessibilityLabel))")
        return try XCTUnwrap(found.first, "no element named \(label)")
    }

    @MainActor private func inspect<V: View>(_ view: V, check: (UIWindow) async throws -> Void) async throws {
        typealias Get = @convention(c) () -> Int32
        typealias Set = @convention(c) (Int32) -> Void
        let library = try XCTUnwrap(dlopen("/usr/lib/libAccessibility.dylib", RTLD_NOW))
        let get = unsafeBitCast(try XCTUnwrap(dlsym(library, "_AXSAutomationEnabled")), to: Get.self)
        let set = unsafeBitCast(try XCTUnwrap(dlsym(library, "_AXSSetAutomationEnabled")), to: Set.self)
        let old = get(); set(1); defer { set(old) }
        let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 430, height: 844))
        window.rootViewController = UIHostingController(rootView: view)
        window.makeKeyAndVisible()
        defer { window.isHidden = true }
        try await Task.sleep(nanoseconds: 300_000_000)
        try await check(window)
    }

    /// Every element under `node`, in VoiceOver's order.
    @MainActor private func elements(_ node: NSObject) -> [NSObject] {
        if node.accessibilityElementsHidden { return [] }
        if let view = node as? UIView, view.isHidden || view.alpha == 0 { return [] }
        if node.isAccessibilityElement { return [node] }
        if let values = node.accessibilityElements as? [NSObject], !values.isEmpty { return values.flatMap { elements($0) } }
        if case let count = node.accessibilityElementCount(), count != NSNotFound, count > 0 {
            return (0..<count).compactMap { node.accessibilityElement(at: $0) as? NSObject }.flatMap { elements($0) }
        }
        return ((node as? UIView)?.subviews ?? []).flatMap { elements($0) }
    }
    #endif
}
