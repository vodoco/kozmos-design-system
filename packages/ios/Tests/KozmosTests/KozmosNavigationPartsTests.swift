import XCTest
import SwiftUI
@testable import Kozmos

/// The navigation parts the prototype has and the system lacked: the
/// manoeuvre card over the map, the itinerary it opens into, the progress
/// rail, and the summary's navigation layout. Measured where they are drawn.
final class KozmosNavigationPartsTests: XCTestCase {
    // MARK: What VoiceOver hears

    func testTheClosedCardReadsInstructionThenDetail() {
        XCTAssertEqual(KozmosManoeuvreCard<EmptyView>.accessibilityDescription(instruction: "Turn left", detail: "58 m · 1 min"),
                       "Turn left, 58 m · 1 min")
        XCTAssertEqual(KozmosManoeuvreCard<EmptyView>.accessibilityDescription(instruction: "Turn left", detail: nil), "Turn left")
        XCTAssertEqual(KozmosManoeuvreCard<EmptyView>.accessibilityDescription(instruction: "Turn left", detail: ""), "Turn left")
    }

    // MARK: The rail's arithmetic

    func testWaypointLayoutPreservesCoincidentSemanticsAndAvoidsVisualCollisions() {
        let points = [
            KozmosRouteProgressWaypoint(id: "end", position: 1, type: .destination, label: "Destination"),
            KozmosRouteProgressWaypoint(id: "lift", position: 0.5, type: .liftUp, label: "Elevator to level 2"),
            KozmosRouteProgressWaypoint(id: "same", position: 0.5, type: .right, label: "Turn right"),
            KozmosRouteProgressWaypoint(id: "start", position: 0, type: .straight, label: "Entrance")
        ]
        XCTAssertEqual(KozmosRouteProgressRail.validWaypoints(points).map(\.id), ["start", "lift", "same", "end"])
        XCTAssertEqual(KozmosRouteProgressRail.visibleWaypoints(points, width: 300, progress: nil).map(\.id), ["start", "lift", "end"])
        XCTAssertEqual(KozmosRouteProgressRail.visibleWaypoints(points, width: 300, progress: 0.5).map(\.id), ["start", "end"])
        XCTAssertTrue(KozmosRouteProgressRail.visibleWaypoints(points, width: 20, progress: nil).isEmpty)
        XCTAssertEqual(KozmosRouteProgressRail.visibleWaypoints(points, width: 54, progress: nil).count, 1)
        XCTAssertEqual(KozmosRouteProgressRail.validWaypoints(points + [
            KozmosRouteProgressWaypoint(id: "lift", position: 0.1, type: .left, label: "Ambiguous"),
            KozmosRouteProgressWaypoint(id: "bad", position: .nan, type: .left, label: "Invalid")
        ]).map(\.id), ["start", "same", "end"])
    }

    func testNonFiniteProgressStaysAtTheStart() {
        for progress in [Double.nan, Double.infinity, -Double.infinity] {
            XCTAssertEqual(KozmosRouteProgressRail.discLeading(progress: progress, width: 300), 10)
        }
    }

    /// The disc starts just after the start dot, ends just before the end
    /// dot, and never leaves the rail whatever progress it is given.
    func testTheDiscTravelsFromAfterTheStartDotToBeforeTheEndDot() {
        XCTAssertEqual(KozmosRouteProgressRail.discLeading(progress: 0, width: 300), 10)
        XCTAssertEqual(KozmosRouteProgressRail.discLeading(progress: 1, width: 300), 256)
        XCTAssertEqual(KozmosRouteProgressRail.discLeading(progress: 0.5, width: 300), 133)
        XCTAssertEqual(KozmosRouteProgressRail.discLeading(progress: -1, width: 300), 10)
        XCTAssertEqual(KozmosRouteProgressRail.discLeading(progress: 2, width: 300), 256)
        XCTAssertEqual(KozmosRouteProgressRail.discLeading(progress: 0.5, width: 20), 4, "a tiny rail scales its dots and disc inside its own bounds")
    }

    func testAnItineraryStepIsNotCurrentUnlessSaid() {
        let step = KozmosItineraryStep(id: "1", instruction: "Turn left", type: .left)
        XCTAssertFalse(step.isCurrent)
        XCTAssertEqual(step.id, "1")
    }

    #if os(iOS)
    @MainActor func testLongEndpointNamesAreNotVisuallyTruncatedAtTwoLines() async throws {
        let view = ZStack(alignment: .topLeading) {
            Color.white
            KozmosItinerary(origin: "", steps: [], destination: Array(repeating: "International arrivals reception", count: 5).joined(separator: " "), originLabel: "", destinationLabel: "")
                .frame(width: 180, alignment: .leading)
                .environment(\.colorScheme, .light)
        }
        let pixels = try await RenderedPixels.render(view, size: CGSize(width: 180, height: 400))
        XCTAssertGreaterThan(pixels.count(in: CGRect(x: 0, y: 100, width: 180, height: 250), where: RenderedPixels.isDarkText), 200,
            "The visible name must continue beyond two lines, not only survive in VoiceOver")
    }

    @MainActor func testWaypointsAndCompletedTrackAreActuallyDrawn() async throws {
        let size = CGSize(width: 300, height: 34)
        let points = [KozmosRouteProgressWaypoint(id: "gallery", position: 0.5, type: .left, label: "Gallery")]
        let marker = KozmosRouteProgressRail(progress: nil, type: .left, label: "Journey", waypoints: points)
            .environment(\.colorScheme, .light).background(Color.white)
        let pixels = try await RenderedPixels.render(marker, size: size)
        XCTAssertGreaterThan(pixels.count(in: CGRect(x: 138, y: 0, width: 24, height: 34), where: RenderedPixels.isDarkText), 20)
        for known in [true, false] {
            let view = KozmosRouteProgressRail(progress: known ? 0.5 : nil, type: .left, label: "Journey", showCompletedTrack: true)
                .environment(\.colorScheme, .light).background(Color.white)
            let drawn = try await RenderedPixels.render(view, size: size)
            let completed = drawn.count(in: CGRect(x: 50, y: 14, width: 50, height: 6), where: RenderedPixels.isTheme)
            if known { XCTAssertGreaterThan(completed, 100) } else { XCTAssertEqual(completed, 0) }
        }
    }
    @MainActor func testRailMirrorsTimelineAndOmitsUnknownPosition() async throws {
        let size = CGSize(width: 300, height: 34)
        for direction in [LayoutDirection.leftToRight, .rightToLeft] {
            let view = KozmosRouteProgressRail(progress: 0.25, type: .left, label: "Journey")
                .environment(\.layoutDirection, direction).environment(\.colorScheme, .light).background(Color.white)
            let pixels = try await RenderedPixels.render(view, size: size)
            let disc = try XCTUnwrap(pixels.boundingBox(in: CGRect(x: 12, y: 0, width: 276, height: 34), where: RenderedPixels.isTheme))
            let leading = KozmosRouteProgressRail.discLeading(progress: 0.25, width: 300)
            XCTAssertEqual(disc.minX, direction == .leftToRight ? leading : 300 - 34 - leading, accuracy: 1.5)
            XCTAssertEqual(disc.width, 34, accuracy: 1.5)
        }
        let unknown = KozmosRouteProgressRail(progress: nil, type: .left, label: "Journey", valueText: "Position unavailable")
            .environment(\.colorScheme, .light).background(Color.white)
        let pixels = try await RenderedPixels.render(unknown, size: size)
        XCTAssertEqual(pixels.count(in: CGRect(origin: .zero, size: size), where: RenderedPixels.isTheme), 0)
    }
    @MainActor func testDefaultManoeuvreUsesOpaqueThemeFill() async throws {
        for scheme in [ColorScheme.light, .dark] {
            for expanded in [false, true] {
                let view = KozmosManoeuvreCard(type: .left, instruction: "Turn left", detail: "20 m", isExpanded: expanded, onToggle: {}) {
                    KozmosItinerary(origin: "Start", steps: [KozmosItineraryStep(id: "a", instruction: [KozmosInstructionPart(text: "Continue", role: .secondary)], type: .left, duration: "1 min")], destination: "End")
                }.padding(16).environment(\.colorScheme, scheme).background(Color.gray)
                let pixels = try await RenderedPixels.render(view, size: CGSize(width: 360, height: 360))
                let region = CGRect(x: 16, y: 0, width: 328, height: 360)
                let fill = scheme == .light ? (16, 81, 232) : (88, 135, 243)
                let bounds = try XCTUnwrap(pixels.boundingBox(in: region) {
                    abs(Int($0) - fill.0) < 4 && abs(Int($1) - fill.1) < 4 && abs(Int($2) - fill.2) < 4
                }, "missing exact theme fill in \(scheme)")
                XCTAssertGreaterThan(bounds.width * bounds.height, 10000)
                let onFill = scheme == .light ? 255 : 0
                XCTAssertGreaterThan(pixels.count(in: bounds.insetBy(dx: 12, dy: 12)) {
                    abs(Int($0) - onFill) < 4 && abs(Int($1) - onFill) < 4 && abs(Int($2) - onFill) < 4
                }, 100, "missing contrasting content in \(scheme), expanded \(expanded)")
            }
        }
    }
    @MainActor func testItineraryDrawsDurationWithoutDistance() async throws {
        let view = KozmosItinerary(origin: "", steps: [
            KozmosItineraryStep(id: "a", instruction: "", type: .left, duration: "0 min")
        ], destination: "", originLabel: "", destinationLabel: "")
            .frame(maxWidth: .infinity, alignment: .leading)
            .environment(\.colorScheme, .light).background(Color.white)
        let pixels = try await RenderedPixels.render(view, size: CGSize(width: 240, height: 120))
        let text = pixels.count(in: CGRect(x: 55, y: 0, width: 180, height: 120), where: RenderedPixels.isInk)
        XCTAssertGreaterThan(text, 40, "the duration-only itinerary metric is absent")
    }
    // MARK: Drawn

    /// The secondary danger foreground, #B01736 in light: the End button's
    /// outline and label.
    private static func isDanger(_ r: UInt8, _ g: UInt8, _ b: UInt8) -> Bool { r > 140 && g < 80 && b < 110 && Int(r) > Int(b) + 60 }
    /// The marker a test puts in a slot to see where the slot is drawn.
    private static func isMarker(_ r: UInt8, _ g: UInt8, _ b: UInt8) -> Bool { g > 150 && r < 120 && b < 140 }

    /// The disc sits where the progress says, on the rail's own arithmetic.
    @MainActor func testTheRailsDiscSitsWhereTheProgressSays() async throws {
        let size = CGSize(width: 300, height: 34)
        for progress in [0.5, 1.0] {
            let view = KozmosRouteProgressRail(progress: progress, type: .left, label: "Step 2 of 4")
                .background(Color.white)
            let pixels = try await RenderedPixels.render(view, size: size)
            // Past the start dot, the only theme fill is the disc.
            let disc = try XCTUnwrap(pixels.boundingBox(in: CGRect(x: 12, y: 0, width: size.width - 12, height: size.height),
                                                        where: RenderedPixels.isTheme), "no disc drawn at \(progress)")
            XCTAssertEqual(disc.width, KozmosRouteProgressRail.disc, accuracy: 1.5, "the disc is not 34 wide at \(progress)")
            XCTAssertEqual(disc.minX, KozmosRouteProgressRail.discLeading(progress: progress, width: size.width), accuracy: 1.5,
                           "the disc is not where progress \(progress) puts it")
            let start = try XCTUnwrap(pixels.boundingBox(in: CGRect(x: 0, y: 0, width: 12, height: size.height), where: RenderedPixels.isTheme),
                                      "no start dot drawn")
            XCTAssertEqual(start.width, KozmosRouteProgressRail.dot, accuracy: 1.5)
        }
    }

    /// Closed, the card shows the manoeuvre and none of the itinerary; open,
    /// the itinerary and none of the manoeuvre.
    @MainActor func testTheCardShowsTheItineraryInsteadOfTheManoeuvreWhenOpen() async throws {
        let size = CGSize(width: 360, height: 220)
        for expanded in [false, true] {
            let view = KozmosManoeuvreCard(type: .left, instruction: "Turn left", detail: "58 m · 1 min",
                                           isExpanded: expanded, onToggle: {}, appearance: .background) {
                Color.green.frame(height: 40)
            }
            .padding(16)
            .background(Color.white)
            let pixels = try await RenderedPixels.render(view, size: size)
            let whole = CGRect(origin: .zero, size: size)
            let marker = pixels.boundingBox(in: whole, where: Self.isMarker)
            let instruction = pixels.boundingBox(in: whole, where: RenderedPixels.isDarkText)
            let arrow = pixels.boundingBox(in: whole, where: RenderedPixels.isTheme)
            if expanded {
                XCTAssertNotNil(marker, "the open card does not show its itinerary")
                XCTAssertNil(instruction, "the open card still shows the instruction")
                XCTAssertNil(arrow, "the open card still shows the arrow")
            } else {
                XCTAssertNil(marker, "the closed card shows its itinerary")
                let text = try XCTUnwrap(instruction, "the closed card shows no instruction")
                let icon = try XCTUnwrap(arrow, "the closed card shows no arrow")
                XCTAssertLessThan(icon.maxX, text.minX, "the arrow is not before the instruction")
            }
        }
    }

    /// Open, the card is as tall as its itinerary — not its whole allowance —
    /// and no taller than the cap, past which the itinerary scrolls.
    @MainActor func testTheOpenCardHugsAShortItineraryAndCapsALongOne() async throws {
        let size = CGSize(width: 360, height: 600)
        for (itineraryHeight, name) in [(CGFloat(40), "short"), (CGFloat(800), "long")] {
            let view = KozmosManoeuvreCard(type: .left, instruction: "Turn left", isExpanded: true, onToggle: {}) {
                Color.green.frame(height: itineraryHeight)
            }
            .padding(16)
            .background(Color.white)
            let pixels = try await RenderedPixels.render(view, size: size)
            let whole = CGRect(origin: .zero, size: size)
            let marker = try XCTUnwrap(pixels.boundingBox(in: whole, where: Self.isMarker), "no itinerary in the \(name) card")
            let card = try XCTUnwrap(pixels.boundingBox(in: whole, where: RenderedPixels.isInk), "no \(name) card")
            if itineraryHeight < 320 {
                XCTAssertEqual(marker.height, itineraryHeight, accuracy: 1.5, "the short itinerary is not shown whole")
                XCTAssertLessThan(card.height, 140, "the card does not hug its short itinerary")
            } else {
                XCTAssertEqual(marker.height, 320, accuracy: 1.5, "the long itinerary is not cut at the cap")
                XCTAssertLessThan(card.height, 460, "the card grows past the cap")
            }
        }
    }

    /// One step is emphasised in the theme colour: the current one, and only
    /// when there is one.
    @MainActor func testTheCurrentStepAloneIsEmphasised() async throws {
        let size = CGSize(width: 320, height: 200)
        func itinerary(current: Int?) -> some View {
            KozmosItinerary(
                origin: "Terminal B Checkpoint",
                steps: [
                    KozmosItineraryStep(id: "1", instruction: "Go straight", type: .straight, isCurrent: current == 0),
                    KozmosItineraryStep(id: "2", instruction: "Turn left", type: .left, isCurrent: current == 1),
                    KozmosItineraryStep(id: "3", instruction: "Turn right", type: .right, isCurrent: current == 2),
                ],
                destination: "Admirals Lounge")
            .padding(16)
            .background(Color.white)
        }
        let whole = CGRect(origin: .zero, size: size)
        let none = try await RenderedPixels.render(itinerary(current: nil), size: size)
        XCTAssertNil(none.boundingBox(in: whole, where: RenderedPixels.isTheme), "a step is emphasised with none current")

        let second = try await RenderedPixels.render(itinerary(current: 1), size: size)
        let emphasised = try XCTUnwrap(second.boundingBox(in: whole, where: RenderedPixels.isTheme), "the current step is not emphasised")
        XCTAssertLessThan(emphasised.height, 24, "more than one row is emphasised")
        let text = try XCTUnwrap(second.boundingBox(in: whole, where: RenderedPixels.isDarkText), "no other step is drawn")
        XCTAssertLessThan(text.minY, emphasised.minY, "the current step is not between the others")
        XCTAssertGreaterThan(text.maxY, emphasised.maxY, "the current step is not between the others")
    }

    /// The navigation layout: End in the danger outline on the title's row,
    /// the time, distance and arrival on one row under it, the progress slot
    /// under that.
    @MainActor func testTheNavigationSummaryPutsEndBesideTheTitleAndTheStatsOnOneRow() async throws {
        let size = CGSize(width: 360, height: 180)
        let view = KozmosRouteSummary(destination: "Admirals Lounge", durationText: "5 min", distanceText: "241 m",
                                      arrivalText: "Arrive 14:32", onEndRoute: {}) {
            Color.green.frame(height: 6)
        }
        .padding(16)
        .background(Color.white)
        let pixels = try await RenderedPixels.render(view, size: size)
        let whole = CGRect(origin: .zero, size: size)
        let end = try XCTUnwrap(pixels.boundingBox(in: whole, where: Self.isDanger), "no End button in the danger colour")
        // The title: the dark text left of the End button.
        let title = try XCTUnwrap(pixels.boundingBox(in: CGRect(x: 0, y: 0, width: end.minX - 4, height: end.maxY + 4),
                                                     where: RenderedPixels.isDarkText), "no title beside End")
        XCTAssertGreaterThan(end.midY, title.minY, "End is not on the title's row")
        XCTAssertLessThan(end.midY, title.maxY, "End is not on the title's row")
        let stats = try XCTUnwrap(pixels.boundingBox(in: CGRect(x: 0, y: max(end.maxY, title.maxY) + 4, width: size.width, height: size.height),
                                                     where: RenderedPixels.isDarkText), "no stats row under the title")
        XCTAssertLessThan(stats.height, 22, "the stats take more than one row")
        XCTAssertGreaterThan(stats.width, 200, "the arrival is not at the row's far end")
        let progress = try XCTUnwrap(pixels.boundingBox(in: whole, where: Self.isMarker), "the progress slot is not drawn")
        XCTAssertGreaterThan(progress.minY, stats.maxY, "the progress slot is not under the stats")
    }
    #endif
}
