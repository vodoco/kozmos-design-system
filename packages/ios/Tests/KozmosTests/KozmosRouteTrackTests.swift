import XCTest
import SwiftUI
@testable import Kozmos

final class KozmosRouteTrackTests: XCTestCase {
    func testMotionPolicyHonoursReducedMotionPauseAndUnavailableSection() {
        XCTAssertTrue(KozmosProgressMotion.directional.isEnabled(reduceMotion: false, isActive: true, hasRange: true))
        XCTAssertFalse(KozmosProgressMotion.directional.isEnabled(reduceMotion: true, isActive: true, hasRange: true))
        XCTAssertFalse(KozmosProgressMotion.directional.isEnabled(reduceMotion: false, isActive: false, hasRange: true))
        XCTAssertFalse(KozmosProgressMotion.directional.isEnabled(reduceMotion: false, isActive: true, hasRange: false))
        XCTAssertFalse(KozmosProgressMotion.none.isEnabled(reduceMotion: false, isActive: true, hasRange: true))
    }
    func testStaticSectionAndCumulativeLiveFillHaveDifferentMeaning() {
        let range = KozmosProgressRange(start: 0.4, end: 1)
        XCTAssertEqual(range.fill(0.6, mode: .live), KozmosProgressRange(start: 0, end: 0.6))
        XCTAssertEqual(range.fill(nil, mode: .static), range)
        XCTAssertNil(range.fill(nil, mode: .live))
        XCTAssertNil(range.fill(0.2, mode: .live))
        XCTAssertEqual(range.flow(0.6, mode: .live), KozmosProgressRange(start: 0.6, end: 1))
        XCTAssertEqual(range.flow(nil, mode: .static), range)
        XCTAssertNil(range.flow(1, mode: .live))
    }
    func testActiveRangeIsIndependentOfProgressAndRejectsInvalidSnapshots() {
        let range = KozmosProgressRange(start: 0, end: 0.4)
        XCTAssertTrue(range.isValid)
        XCTAssertEqual(range.position(0), 0)
        XCTAssertEqual(range.position(0.4), 0.4)
        for value in [Double.nan, Double.infinity, -0.1, 0.8] { XCTAssertNil(range.position(value)) }
        XCTAssertNil(range.position(nil))
        XCTAssertFalse(KozmosProgressRange(start: 0.6, end: 0.2).isValid)
        XCTAssertFalse(KozmosProgressRange(start: 0.4, end: 0.4).isValid)
    }
    func testNextTransitionHasCollisionPriorityAndDoesNotDependOnUserPosition() {
        let points = [KozmosRouteProgressWaypoint(id: "other", position: 0.39, type: .right, label: "Right"),
                      KozmosRouteProgressWaypoint(id: "lift", position: 0.4, type: .liftUp, label: "Elevator")]
        XCTAssertEqual(KozmosRouteProgressRail.visibleRouteWaypoints(points, width: 320, activeEnd: 0.4).map(\.id), ["lift"])
        XCTAssertTrue(KozmosRouteProgressRail.visibleRouteWaypoints(points, width: 20, activeEnd: 0.4).isEmpty)
        let coincident = [KozmosRouteProgressWaypoint(id: "turn", position: 0.4, type: .right, label: "Right"), points[1]]
        XCTAssertEqual(KozmosRouteProgressRail.visibleRouteWaypoints(coincident, width: 320, activeEnd: 0.4, activeWaypointId: "lift").map(\.id), ["lift"])
    }
    #if os(iOS)
    /// The dot, the waypoint and the fill share one axis in both reading
    /// directions. SwiftUI mirrors `.position` itself in right-to-left, so a
    /// position flipped by hand as well landed back at its left-to-right place,
    /// away from the fill the track draws. iOS only: on macOS, ImageRenderer
    /// mirrors drawn paths as well (measured), which iOS does not.
    @MainActor func testDotAndWaypointFollowTheFillInBothDirections() throws {
        let blue = try DrawnPixels.resolved(KozmosColors.semanticsDataBlue, in: .light)
        let ring = try DrawnPixels.resolved(KozmosColors.primitivesColorsBackground400, in: .light)
        let fill = try DrawnPixels.resolved(KozmosColors.primitivesColorsTheme600, in: .light)
        for direction in [LayoutDirection.leftToRight, .rightToLeft] {
            let view = KozmosRouteProgressRail(progress: 0.2, type: .walking, label: "Journey",
                waypoints: [KozmosRouteProgressWaypoint(id: "lift", position: 0.4, type: .liftUp, label: "Elevator")],
                activeLeg: KozmosProgressRange(start: 0, end: 0.4))
                .frame(width: 300, height: 48)
                .background(Color.white)
                .environment(\.layoutDirection, direction)
                .environment(\.colorScheme, .light)
            let pixels = try DrawnPixels.draw(view)
            // The rail's axis runs from 12 to 288; 0.2 and 0.4 along it.
            let along: (Double) -> CGFloat = { 12 + 276 * (direction == .rightToLeft ? 1 - $0 : $0) }
            let dot = try XCTUnwrap(pixels.boundingBox(in: CGRect(x: 0, y: 28, width: 300, height: 20),
                where: DrawnPixels.matches(blue)), "no dot drawn \(direction)")
            XCTAssertEqual(dot.midX, along(0.2), accuracy: 1.5, "dot \(direction)")
            let disc = try XCTUnwrap(pixels.boundingBox(in: CGRect(x: 0, y: 0, width: 300, height: 24),
                where: DrawnPixels.matches(ring, tolerance: 10)), "no waypoint drawn \(direction)")
            XCTAssertEqual(disc.midX, along(0.4), accuracy: 1.5, "waypoint \(direction)")
            XCTAssertEqual(disc.width, 24, accuracy: 1.5, "waypoint \(direction)")
            // The fill runs from the start to the dot, on the dot's side.
            let start = CGRect(x: along(0.05) - 4, y: 35, width: 8, height: 6)
            let ahead = CGRect(x: along(0.8) - 4, y: 35, width: 8, height: 6)
            XCTAssertGreaterThan(pixels.count(in: start, where: DrawnPixels.matches(fill)), 20, "fill \(direction)")
            XCTAssertEqual(pixels.count(in: ahead, where: DrawnPixels.matches(fill)), 0, "fill \(direction)")
        }
    }
    @MainActor func testBackgroundKeepsDirectionalCueStationary() async throws {
        for phase in [ScenePhase.inactive, .background] {
            let view = KozmosProgressTrack(activeRange: .init(start: 0, end: 0.8), value: 0.2,
                appearance: .gradient, motion: .directional)
                .environment(\.scenePhase, phase)
                .background(Color.white)
            let first = try await RenderedPixels.render(view, size: CGSize(width: 300, height: 10))
            try await Task.sleep(nanoseconds: 150_000_000)
            let second = try await RenderedPixels.render(view, size: CGSize(width: 300, height: 10))
            XCTAssertEqual(first.image.pngData(), second.image.pngData(), "Background flow must not run a clock")
            let plain = try await RenderedPixels.render(KozmosProgressTrack(activeRange: .init(start: 0, end: 0.8), value: 0.2,
                appearance: .gradient).background(Color.white), size: CGSize(width: 300, height: 10))
            XCTAssertNotEqual(first.image.pngData(), plain.image.pngData(), "A stationary directional cue remains, without changing distance")
        }
    }
    @MainActor func testLiveFillEndsAtDotAndDoesNotResetAfterTransition() async throws {
        for direction in [LayoutDirection.leftToRight, .rightToLeft] {
            let view = KozmosProgressTrack(activeRange: .init(start: 0.4, end: 1), value: 0.6, appearance: .gradient)
                .environment(\.layoutDirection, direction).background(Color.white)
            let pixels = try await RenderedPixels.render(view, size: CGSize(width: 300, height: 10))
            let themeRegion = CGRect(x: direction == .leftToRight ? 8 : 270, y: 2, width: 20, height: 6)
            let futureRegion = CGRect(x: direction == .leftToRight ? 220 : 20, y: 2, width: 30, height: 6)
            XCTAssertGreaterThan(pixels.count(in: themeRegion, where: RenderedPixels.isTheme), 30)
            XCTAssertEqual(pixels.count(in: futureRegion, where: RenderedPixels.isTheme), 0)
        }
    }
    @MainActor func testStaticSectionDrawsAheadWithoutLocation() async throws {
        let view = KozmosRouteProgressRail(progress: 0, type: .walking, label: "Journey",
            waypoints: [KozmosRouteProgressWaypoint(id: "lift", position: 0.4, type: .liftUp, label: "Elevator")],
            activeLeg: KozmosProgressRange(start: 0, end: 0.4), appearance: .gradient, positionMode: .static)
            .environment(\.colorScheme, .light).background(Color.white)
        let pixels = try await RenderedPixels.render(view, size: CGSize(width: 300, height: 48))
        XCTAssertGreaterThan(pixels.count(in: CGRect(x: 30, y: 35, width: 30, height: 6), where: RenderedPixels.isTheme), 30)
        XCTAssertGreaterThan(pixels.count(in: CGRect(x: 110, y: 0, width: 24, height: 24), where: RenderedPixels.isDarkText), 10)
    }
    #endif
}
