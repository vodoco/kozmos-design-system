import XCTest
import SwiftUI
@testable import Kozmos

/// GAP-159: the bar with no value moves, stands still under Reduce Motion,
/// is said once, and can be the screen's 4 tall loading bar at the top, as
/// React's `Progress` with no value and `placement="top"`.
final class KozmosProgressIndeterminateTests: XCTestCase {
    typealias Sweep = KozmosProgressSweep

    // MARK: The sweep

    /// A quarter of the track, from wholly before the start to wholly past
    /// the end every 2 s, linear: Pointr Cloud's loading bar.
    func testTheSegmentSweepsAQuarterOfTheTrackEveryTwoSeconds() {
        XCTAssertEqual(Sweep.width, 0.25)
        XCTAssertEqual(Sweep.period, 2)
        XCTAssertEqual(Sweep.start(at: 0, reduceMotion: false), -0.25, accuracy: 1e-9)
        XCTAssertEqual(Sweep.start(at: 0.5, reduceMotion: false), 0.0625, accuracy: 1e-9)
        XCTAssertEqual(Sweep.start(at: 1, reduceMotion: false), 0.375, accuracy: 1e-9)
        XCTAssertEqual(Sweep.start(at: 1.999_999, reduceMotion: false), 1, accuracy: 1e-5)
        // Forever: the next period starts again before the track.
        XCTAssertEqual(Sweep.start(at: 2, reduceMotion: false), -0.25, accuracy: 1e-9)
        XCTAssertEqual(Sweep.start(at: 803.0, reduceMotion: false), Sweep.start(at: 1, reduceMotion: false), accuracy: 1e-9)
    }

    /// Under Reduce Motion it stands in the middle of the track, whatever
    /// the time, where it reads as a wait and not as a value.
    func testUnderReduceMotionTheSegmentStandsStillInTheMiddle() {
        for time in [0.0, 0.3, 1.7, 1_000.25] {
            XCTAssertEqual(Sweep.start(at: time, reduceMotion: true), 0.375, accuracy: 1e-9)
        }
        let x = Sweep.x(start: Sweep.still, trackWidth: 320, direction: .leftToRight)
        XCTAssertEqual(x, 120, accuracy: 1e-9)
        XCTAssertEqual(x + 320 * CGFloat(Sweep.width) / 2, 160, accuracy: 1e-9)
        XCTAssertEqual(Sweep.x(start: Sweep.still, trackWidth: 320, direction: .rightToLeft), 120, accuracy: 1e-9)
    }

    /// Right to left the inline start is the right edge: the segment enters
    /// past the right and leaves past the left.
    func testRightToLeftItSweepsFromTheRight() {
        XCTAssertEqual(Sweep.x(start: -0.25, trackWidth: 400, direction: .leftToRight), -100, accuracy: 1e-9)
        XCTAssertEqual(Sweep.x(start: 1, trackWidth: 400, direction: .leftToRight), 400, accuracy: 1e-9)
        XCTAssertEqual(Sweep.x(start: -0.25, trackWidth: 400, direction: .rightToLeft), 400, accuracy: 1e-9)
        XCTAssertEqual(Sweep.x(start: 1, trackWidth: 400, direction: .rightToLeft), -100, accuracy: 1e-9)
        XCTAssertEqual(Sweep.x(start: 0.1, trackWidth: 400, direction: .rightToLeft), 260, accuracy: 1e-9)
    }

    // MARK: Placement

    func testTheBarIsEightInTheFlowAndFourAtTheTop() {
        XCTAssertEqual(KozmosProgressPlacement.inline.height, KozmosDimensions.primitivesLayoutSpacing100)
        XCTAssertEqual(KozmosProgressPlacement.top.height, KozmosDimensions.primitivesLayoutSpacing50)
        XCTAssertEqual(KozmosProgressPlacement.top.height, 4)
    }

    func testARingIsAlwaysInTheFlow() {
        XCTAssertEqual(KozmosProgress(value: 0.5, placement: .top).resolvedPlacement, .top)
        XCTAssertEqual(KozmosProgress(placement: .top).resolvedPlacement, .top)
        XCTAssertEqual(KozmosProgress(value: 0.5, shape: .circular, placement: .top).resolvedPlacement, .inline)
    }

    func testTheIndeterminateBarIsNamedLoadingUnlessGivenWords() {
        XCTAssertTrue(KozmosProgress().indeterminate)
        XCTAssertEqual(KozmosProgress().spokenLabel, "Loading")
        XCTAssertEqual(KozmosProgress(label: "Loading the map").spokenLabel, "Loading the map")
        XCTAssertFalse(KozmosProgress(value: 0.4).indeterminate)
    }

    // MARK: Said once

    func testItIsSaidOncePerWait() {
        var announcer = KozmosProgressAnnouncer()
        XCTAssertEqual(announcer.next(indeterminate: true, label: "Loading"), "Loading")
        // Redrawn while the wait lasts: nothing more.
        XCTAssertNil(announcer.next(indeterminate: true, label: "Loading"))
        XCTAssertNil(announcer.next(indeterminate: true, label: "Loading"))
        // A value ends the wait; the next wait is said again.
        XCTAssertNil(announcer.next(indeterminate: false, label: "Loading"))
        XCTAssertEqual(announcer.next(indeterminate: true, label: "Loading"), "Loading")
        // No words, nothing said.
        var silent = KozmosProgressAnnouncer()
        XCTAssertNil(silent.next(indeterminate: true, label: ""))
    }

    // MARK: Drawn

    @MainActor
    private func draw<V: View>(_ view: V, width: CGFloat = 200, direction: LayoutDirection = .leftToRight) throws -> DrawnPixels {
        try DrawnPixels.draw(
            view.frame(width: width)
                .environment(\.layoutDirection, direction)
                .environment(\.colorScheme, .light),
            scale: 2
        )
    }

    /// The top bar is 4 tall and square: its corner pixel is drawn.
    @MainActor
    func testTheTopBarIsDrawnFourTallAndSquare() throws {
        let top = try draw(KozmosTopBar(fraction: 0.5))
        XCTAssertEqual(CGFloat(top.height) / top.scale, 4)
        XCTAssertTrue(top.isDrawn(at: CGPoint(x: 0.25, y: 0.25)), "the top bar's corner is not square")
    }

    /// A determinate top bar fills from the inline start: the right, right
    /// to left.
    @MainActor
    func testTheTopBarFillsFromTheInlineStart() throws {
        let theme = try DrawnPixels.resolved(KozmosColors.primitivesColorsTheme600, in: .light)
        let ltr = try XCTUnwrap(draw(KozmosTopBar(fraction: 0.25)).boundingBox(where: DrawnPixels.matches(theme)))
        XCTAssertEqual(ltr.minX, 0, accuracy: 1)
        XCTAssertEqual(ltr.width, 50, accuracy: 1)
        let rtl = try XCTUnwrap(draw(KozmosTopBar(fraction: 0.25), direction: .rightToLeft)
            .boundingBox(where: DrawnPixels.matches(theme)))
        XCTAssertEqual(rtl.maxX, 200, accuracy: 1)
        XCTAssertEqual(rtl.width, 50, accuracy: 1)
    }

    /// The indeterminate bar draws its track and at most a quarter of it in
    /// the theme's colour, never the empty, still track it drew before.
    @MainActor
    func testTheIndeterminateBarDrawsItsTrackAndAQuarterSegment() throws {
        let track = try DrawnPixels.resolved(KozmosColors.primitivesColorsBackground200, in: .light)
        let theme = try DrawnPixels.resolved(KozmosColors.primitivesColorsTheme600, in: .light)
        for placement in KozmosProgressPlacement.allCases {
            let drawn = try draw(KozmosIndeterminateBar(placement: placement))
            XCTAssertEqual(CGFloat(drawn.height) / drawn.scale, placement.height)
            XCTAssertNotNil(drawn.boundingBox(where: DrawnPixels.matches(track, tolerance: 3)))
            if let segment = drawn.boundingBox(where: DrawnPixels.matches(theme)) {
                XCTAssertLessThanOrEqual(segment.width, 50.5)
            }
        }
    }
}
