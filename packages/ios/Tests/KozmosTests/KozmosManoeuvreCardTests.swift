#if os(iOS)
import SwiftUI
import UIKit
import XCTest
@testable import Kozmos

/// The manoeuvre card on a 390 phone, as MAP-111 asks for it and VoiceOver
/// meets it: the whole instruction (GAP-094), every step of an itinerary
/// taller than the open card's cap (GAP-100), and VoiceOver's focus going
/// with the disclosure (the review's T4).
final class KozmosManoeuvreCardTests: XCTestCase {
    /// US1-DE-Turn: two lines cut it before the turn itself, "rechts ab".
    private let german = "Biegen Sie bei Marlow Apotheke auf der linken Seite rechts ab"
    /// A 390 phone, less the map's 16 on each side.
    private let cardWidth: CGFloat = 358
    /// One line of the instruction's text style.
    private let line = UIFont.preferredFont(forTextStyle: .title3).lineHeight

    /// US1-DE-List: a German itinerary taller than the open card's cap.
    private let germanSteps = [
        KozmosItineraryStep(id: "1", instruction: "Gehen Sie geradeaus am Brunnenhof vorbei", type: .straight),
        KozmosItineraryStep(id: "2", instruction: "Nehmen Sie die Rolltreppe beim Brunnenhof nach oben zu Ebene 1", type: .escalatorUp),
        KozmosItineraryStep(id: "3", instruction: "Biegen Sie bei Marlow Apotheke auf der linken Seite rechts ab", type: .right, isCurrent: true),
        KozmosItineraryStep(id: "4", instruction: "Gehen Sie durch den Verbindungsgang zum Terminal B", type: .transition),
        KozmosItineraryStep(id: "5", instruction: "Biegen Sie hinter dem Informationsschalter links ab", type: .left),
        KozmosItineraryStep(id: "6", instruction: "Nehmen Sie den Aufzug nach unten zur Ankunftsebene", type: .liftDown),
        KozmosItineraryStep(id: "7", instruction: "Gehen Sie geradeaus bis zum Ausgang der Gepäckausgabe", type: .straight),
        KozmosItineraryStep(id: "8", instruction: "Biegen Sie an der Wechselstube rechts ab", type: .right),
        KozmosItineraryStep(id: "9", instruction: "Sie haben Ihr Ziel erreicht", type: .destination),
    ]

    private func germanItinerary() -> KozmosItinerary {
        KozmosItinerary(origin: "Haupteingang", steps: germanSteps, destination: "Flughafen-Shuttles",
                        originLabel: "Von", destinationLabel: "Nach", label: "Wegbeschreibung")
    }

    /// How tall `view` is laid out at the card's width on a 390 phone.
    @MainActor private func height(_ view: some View) -> CGFloat {
        UIHostingController(rootView: view)
            .sizeThatFits(in: CGSize(width: cardWidth, height: .greatestFiniteMagnitude)).height
    }

    /// The closed card, with no detail, so its height is the instruction's.
    private func closedCard(_ instruction: String) -> some View {
        KozmosManoeuvreCard(type: .right, instruction: instruction, isExpanded: false, onToggle: {}) { EmptyView() }
    }

    // MARK: GAP-094, the whole instruction

    /// The German turn takes three lines at 358: the card grows to all of
    /// them. Cut at two, the row is only two thirds of a line taller than a
    /// one-line instruction beside its 32-point arrow; whole, it is more than
    /// a line and a half taller.
    @MainActor func testTheClosedCardShowsTheWholeInstruction() {
        let grown = height(closedCard(german)) - height(closedCard("Turn right"))
        XCTAssertGreaterThan(grown, line * 1.5,
                             "the card is \(grown)pt taller than with a one-line instruction: the instruction is cut before 'rechts ab'")
    }

    /// A product that wants a limit asks for one: `instructionLines`, which
    /// cuts the instruction at that many lines, as React's and Compose's do.
    /// Under one line is no limit.
    @MainActor func testAProductCanStillCutTheInstruction() {
        func grown(_ lines: Int?) -> CGFloat {
            height(KozmosManoeuvreCard(type: .right, instruction: german, instructionLines: lines,
                                       isExpanded: false, onToggle: {}) { EmptyView() })
                - height(closedCard("Turn right"))
        }
        XCTAssertGreaterThan(grown(nil), line * 1.5, "unset, the instruction is cut")
        XCTAssertGreaterThan(grown(0), line * 1.5, "a limit of 0 cuts the instruction")
        let two = grown(2)
        XCTAssertGreaterThan(two, line * 0.3, "cut at two lines, the card is no taller than at one")
        XCTAssertLessThan(two, line * 1.2, "cut at two lines, the card is taller than two lines")
        XCTAssertEqual(grown(1), 0, accuracy: 1, "cut at one line, the card is taller than a one-line instruction")
    }

    func testTheInstructionIsCutAtWholeLinesOrNotAtAll() {
        typealias Card = KozmosManoeuvreCard<EmptyView>
        XCTAssertNil(Card.instructionLineLimit(nil))
        XCTAssertNil(Card.instructionLineLimit(0))
        XCTAssertNil(Card.instructionLineLimit(-2))
        XCTAssertEqual(Card.instructionLineLimit(1), 1)
        XCTAssertEqual(Card.instructionLineLimit(3), 3)
    }

    // MARK: T4, VoiceOver's focus through the disclosure

    /// Where VoiceOver goes as the card opens or closes, from the part it was
    /// on — React's rule for keyboard focus. VoiceOver itself does not run in
    /// the Simulator: this is the rule the card applies, through
    /// `@AccessibilityFocusState` as FloorSelector's column does.
    func testVoiceOverFocusGoesWithTheDisclosure() {
        typealias Card = KozmosManoeuvreCard<EmptyView>
        // Opening takes the instruction away: focus on it follows to the itinerary.
        XCTAssertEqual(Card.voiceOverFocus(afterExpanding: true, from: .instruction), .itinerary)
        // Closing takes the itinerary away and silences the grab bar: focus
        // on either goes back to the instruction.
        XCTAssertEqual(Card.voiceOverFocus(afterExpanding: false, from: .bar), .instruction)
        XCTAssertEqual(Card.voiceOverFocus(afterExpanding: false, from: .itinerary), .instruction)
        // Focus elsewhere, or on a part that stays, is left where it is: a
        // tap with VoiceOver off, or the product opening the card while
        // VoiceOver is on its own controls, moves nothing.
        XCTAssertNil(Card.voiceOverFocus(afterExpanding: true, from: nil))
        XCTAssertNil(Card.voiceOverFocus(afterExpanding: false, from: nil))
        XCTAssertNil(Card.voiceOverFocus(afterExpanding: true, from: .bar))
        XCTAssertNil(Card.voiceOverFocus(afterExpanding: true, from: .itinerary))
        XCTAssertNil(Card.voiceOverFocus(afterExpanding: false, from: .instruction))
    }

    // MARK: GAP-100, every step reachable

    /// SwiftUI hands its elements to UIKit only while the accessibility
    /// runtime is on, as it is under VoiceOver: without it a hosting view
    /// reports none (measured on iOS 26.5, 2026-09-29: none before, every
    /// element after). The switch is libAccessibility's automation flag,
    /// the one Cash App's AccessibilitySnapshot sets to read SwiftUI in
    /// process. Each test that reads the tree turns it on and puts back
    /// what it found.
    private var automationWas: Int32?

    private static let accessibility = dlopen("/usr/lib/libAccessibility.dylib", RTLD_NOW)

    private func setAutomation(_ on: Int32) -> Int32? {
        typealias Get = @convention(c) () -> Int32
        typealias Set = @convention(c) (Int32) -> Void
        guard let library = Self.accessibility,
              let get = dlsym(library, "_AXSAutomationEnabled"),
              let set = dlsym(library, "_AXSSetAutomationEnabled") else { return nil }
        let was = unsafeBitCast(get, to: Get.self)()
        unsafeBitCast(set, to: Set.self)(on)
        return was
    }

    /// Turns the accessibility runtime on for this test, as VoiceOver does.
    private func readAsVoiceOverDoes() throws {
        automationWas = try XCTUnwrap(setAutomation(1), "libAccessibility has no automation switch here")
    }

    override func tearDown() {
        if let was = automationWas { _ = setAutomation(was) }
        automationWas = nil
        super.tearDown()
    }

    /// No safe areas, as the snapshot strategy's own window has none.
    private final class Window: UIWindow {
        override var safeAreaInsets: UIEdgeInsets { .zero }
    }

    /// `view` alone in a 390 × 844 window, as a phone holds the card.
    @MainActor private func host(_ view: some View) async -> UIWindow {
        let window = Window(frame: CGRect(x: 0, y: 0, width: 390, height: 844))
        window.rootViewController = UIHostingController(
            rootView: VStack { view; Spacer(minLength: 0) }
                .padding(16)
                .frame(width: 390, height: 844, alignment: .top)
                .background(Color.white)
        )
        window.makeKeyAndVisible()
        await settle()
        return window
    }

    @MainActor private func settle() async {
        for _ in 0..<10 {
            RunLoop.main.run(until: Date().addingTimeInterval(0.03))
            await Task.yield()
        }
    }

    /// The elements VoiceOver can land on under `node`, in its order: a
    /// container is opened, an element is not, and a hidden subtree is
    /// skipped — as UIKit hands SwiftUI's elements to VoiceOver.
    @MainActor private func voiceOverElements(in node: NSObject) -> [NSObject] {
        if node.accessibilityElementsHidden { return [] }
        if let view = node as? UIView, view.isHidden || view.alpha == 0 { return [] }
        if node.isAccessibilityElement { return [node] }
        let children: [NSObject]
        if let elements = node.accessibilityElements as? [NSObject], !elements.isEmpty {
            children = elements
        } else if case let count = node.accessibilityElementCount(), count != NSNotFound, count > 0 {
            children = (0..<count).compactMap { node.accessibilityElement(at: $0) as? NSObject }
        } else if let view = node as? UIView {
            children = view.subviews
        } else {
            children = []
        }
        return children.flatMap { voiceOverElements(in: $0) }
    }

    /// The first scroll view under `view`, depth first.
    private func scrollView(in view: UIView) -> UIScrollView? {
        if let scroll = view as? UIScrollView { return scroll }
        for subview in view.subviews {
            if let found = scrollView(in: subview) { return found }
        }
        return nil
    }

    /// VoiceOver moves by element, so what it needs of the open card is each
    /// part of the itinerary as an element of its own, in order, then the
    /// way to close the card. A short German itinerary, one that fits under
    /// the cap.
    @MainActor func testVoiceOverHearsEachPartOfTheItineraryInOrder() async throws {
        try readAsVoiceOverDoes()
        let steps = Array(germanSteps.prefix(2)) + [germanSteps[8]]
        let window = await host(
            KozmosManoeuvreCard(type: .right, instruction: german, isExpanded: true, onToggle: {},
                                collapseLabel: "Wegbeschreibung ausblenden") {
                KozmosItinerary(origin: "Haupteingang", steps: steps, destination: "Flughafen-Shuttles",
                                originLabel: "Von", destinationLabel: "Nach", label: "Wegbeschreibung")
            }
        )
        defer { window.isHidden = true }
        XCTAssertEqual(
            voiceOverElements(in: window).compactMap(\.accessibilityLabel),
            ["Von, Haupteingang"] + steps.map(\.instruction) + ["Nach, Flughafen-Shuttles", "Wegbeschreibung ausblenden"]
        )
    }

    /// Past the cap the itinerary scrolls, so VoiceOver can reach its every
    /// step: it sits in a scroll view (VoiceOver scrolls one to the element
    /// it moves to, and with three fingers) that is taller inside than the
    /// 320 it shows, and that scroll view is in VoiceOver's tree, before the
    /// way to close the card. An in-process walk cannot read the elements
    /// inside a SwiftUI scroll view, even a bare one (measured on iOS 26.5,
    /// 2026-09-29), so the steps themselves were read from outside the app,
    /// as VoiceOver reads them, with XCUITest that day: all nine steps and
    /// both endpoints are in the tree, and the destination, below the cap,
    /// scrolls into view — before this change and after it.
    @MainActor func testTheItineraryPastTheCapScrollsInVoiceOversTree() async throws {
        try readAsVoiceOverDoes()
        let window = await host(
            KozmosManoeuvreCard(type: .right, instruction: german, isExpanded: true, onToggle: {},
                                collapseLabel: "Wegbeschreibung ausblenden") { germanItinerary() }
        )
        defer { window.isHidden = true }
        let scroll = try XCTUnwrap(scrollView(in: window), "the itinerary taller than the cap is in no scroll view")
        XCTAssertEqual(scroll.bounds.height, 320, accuracy: 1, "the itinerary is not capped at 320")
        XCTAssertGreaterThan(scroll.contentSize.height, scroll.bounds.height + 40,
                             "the German itinerary fits under the cap: this proves nothing")
        let tree = voiceOverTree(in: window)
        let scrollAt = try XCTUnwrap(tree.firstIndex { $0 === scroll }, "the scrolling itinerary is not in VoiceOver's tree")
        let closeAt = try XCTUnwrap(tree.firstIndex { $0.accessibilityLabel == "Wegbeschreibung ausblenden" },
                                    "VoiceOver finds no way to close the card")
        XCTAssertLessThan(scrollAt, closeAt, "VoiceOver reaches the way to close the card before the itinerary")
        scroll.setContentOffset(CGPoint(x: 0, y: scroll.contentSize.height - scroll.bounds.height), animated: false)
        await settle()
        XCTAssertGreaterThan(scroll.contentOffset.y, 40, "the itinerary does not scroll to its end")
    }

    /// Every node VoiceOver visits under `node`, containers included, in its order.
    @MainActor private func voiceOverTree(in node: NSObject) -> [NSObject] {
        if node.accessibilityElementsHidden { return [] }
        if let view = node as? UIView, view.isHidden || view.alpha == 0 { return [] }
        if node.isAccessibilityElement { return [node] }
        let children: [NSObject]
        if let elements = node.accessibilityElements as? [NSObject], !elements.isEmpty {
            children = elements
        } else if case let count = node.accessibilityElementCount(), count != NSNotFound, count > 0 {
            children = (0..<count).compactMap { node.accessibilityElement(at: $0) as? NSObject }
        } else if let view = node as? UIView {
            children = view.subviews
        } else {
            children = []
        }
        return [node] + children.flatMap { voiceOverTree(in: $0) }
    }

    /// Closed, the grab bar is silent: the instruction row is the one way in,
    /// a button VoiceOver hears as the whole instruction.
    @MainActor func testTheClosedCardIsOneButtonThatReadsTheWholeInstruction() async throws {
        try readAsVoiceOverDoes()
        let window = await host(
            KozmosManoeuvreCard(type: .right, instruction: german, detail: "40 m · Ebene 1", isExpanded: false, onToggle: {},
                                expandLabel: "Wegbeschreibung zeigen") { germanItinerary() }
        )
        defer { window.isHidden = true }
        let elements = voiceOverElements(in: window)
        let labels = elements.compactMap(\.accessibilityLabel)
        XCTAssertFalse(labels.contains("Wegbeschreibung zeigen"), "the closed grab bar is not silent: \(labels)")
        let row = try XCTUnwrap(elements.first { $0.accessibilityLabel == "\(german), 40 m · Ebene 1" },
                                "VoiceOver does not hear the whole instruction among \(labels)")
        XCTAssertTrue(row.accessibilityTraits.contains(.button))
        XCTAssertFalse(labels.contains("Gehen Sie geradeaus am Brunnenhof vorbei"), "the closed card shows its itinerary")
    }
}
#endif
