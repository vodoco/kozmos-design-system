import XCTest
import SwiftUI
@testable import Kozmos

/// What VoiceOver gets from the routing parts: one element per step, the
/// instruction first, the arrow silent; the summary's icon silent too.
final class KozmosDirectionStepTests: XCTestCase {
    func testAStepReadsAsInstructionThenDistanceThenDuration() {
        XCTAssertEqual(
            KozmosDirectionStep.accessibilityDescription(
                instruction: "Take Elevator down to First Floor", distance: "58 m", duration: "Second Floor"),
            "Take Elevator down to First Floor, 58 m, Second Floor")
    }

    func testAbsentAndEmptyPartsAreNotRead() {
        XCTAssertEqual(KozmosDirectionStep.accessibilityDescription(instruction: "Destination", distance: nil, duration: nil),
                       "Destination")
        XCTAssertEqual(KozmosDirectionStep.accessibilityDescription(instruction: "Turn Left", distance: "", duration: "First Floor"),
                       "Turn Left, First Floor")
    }


    // MARK: D5, the approved marks (2026-10-04)

    /// The marks main drew in SF Symbols: a level change by any means shows
    /// the up or down arrow and the words name the lift, escalator or stairs.
    private static let approvedSymbols: [(DirectionType, String)] = [
        (.straight, "arrow.up"), (.left, "arrow.turn.up.left"), (.right, "arrow.turn.up.right"),
        (.destination, "mappin.and.ellipse"),
        (.liftUp, "arrow.up.to.line"), (.escalatorUp, "arrow.up.to.line"),
        (.stairsUp, "arrow.up.to.line"), (.levelUp, "arrow.up.to.line"),
        (.liftDown, "arrow.down.to.line"), (.escalatorDown, "arrow.down.to.line"),
        (.stairsDown, "arrow.down.to.line"), (.levelDown, "arrow.down.to.line"),
        (.transition, "arrow.forward.to.line"), (.turnBack, "arrow.uturn.backward"),
        (.walking, "figure.walk"),
    ]

    /// Entry, exit and the ramps are Pointr's own outlines, as React draws them.
    private static let approvedPointrIcons: [(DirectionType, String)] = [
        (.enter, "log-in-01"), (.exit, "log-out-01"), (.rampUp, "arrow-up-right"), (.rampDown, "arrow-down-right"),
    ]

    /// Design has not approved the original lift, escalator, stairs, ramp and
    /// entry artwork, so no default draws it: each direction draws the mark
    /// it is given here, pixel for pixel.
    @MainActor func testEveryDefaultIsAnApprovedMark() throws {
        XCTAssertEqual(Set(Self.approvedSymbols.map(\.0) + Self.approvedPointrIcons.map(\.0)), Set(DirectionType.allCases),
                       "a direction has no approved mark")
        for (type, symbol) in Self.approvedSymbols {
            let drawn = try DrawnPixels.draw(KozmosDirectionGlyph(type: type, size: 24), scale: 3)
            let approved = try DrawnPixels.draw(Image(systemName: symbol).font(.system(size: 24, weight: .semibold)), scale: 3)
            XCTAssertEqual(drawn.largestDifference(from: approved), 0, "\(type) does not draw \(symbol)")
        }
        for (type, name) in Self.approvedPointrIcons {
            let glyph = try XCTUnwrap(KozmosPointrGlyph.named(name), "\(name) is not in the icon set")
            let drawn = try DrawnPixels.draw(KozmosDirectionGlyph(type: type, size: 24), scale: 3)
            let approved = try DrawnPixels.draw(glyph.stroke(style: KozmosPointrGlyph.style(size: 24)).frame(width: 24, height: 24), scale: 3)
            XCTAssertEqual(drawn.largestDifference(from: approved), 0, "\(type) does not draw Pointr's \(name)")
        }
    }

    /// Pointr's paths, read off on the 24 grid apart from the code that draws
    /// them: points on a line are inked, points more than a line's width
    /// from every line are clear.
    @MainActor func testEntryExitAndRampsArePointrsOutlines() throws {
        let size: CGFloat = 48
        let grid = { (x: CGFloat, y: CGFloat) in CGPoint(x: x * size / 24, y: y * size / 24) }
        let cases: [(DirectionType, inked: [(CGFloat, CGFloat)], clear: [(CGFloat, CGFloat)])] = [
            // LogIn01: an arrow from 3 to 15 at 12 into a bracket open on the left.
            (.enter, [(4, 12), (9, 12), (14, 12), (21, 12), (16, 3), (16, 21), (12.5, 9.5)], [(3, 3), (12, 3), (18, 12), (6, 6)]),
            // LogOut01: a bracket open on the right, an arrow from 9 to 21 at 12.
            (.exit, [(3, 12), (10, 12), (20, 12), (8, 3), (8, 21), (18.5, 9.5)], [(21, 3), (12, 3), (6, 12), (18, 18)]),
            // ArrowUpRight: the diagonal from 7,17 to 17,7 with its head at 17,7.
            (.rampUp, [(12, 12), (17, 12), (12, 7), (8, 16)], [(7, 12), (12, 17), (4, 4), (20, 20)]),
            // ArrowDownRight: the diagonal from 7,7 to 17,17 with its head at 17,17.
            (.rampDown, [(12, 12), (12, 17), (17, 12), (8, 8)], [(12, 7), (7, 12), (4, 20), (20, 4)]),
        ]
        for (type, inked, clear) in cases {
            let drawn = try DrawnPixels.draw(KozmosDirectionGlyph(type: type, size: size), scale: 3)
            for (x, y) in inked {
                XCTAssertTrue(drawn.isDrawn(at: grid(x, y)), "\(type): (\(x), \(y)) on the grid is not inked")
            }
            for (x, y) in clear {
                XCTAssertFalse(drawn.isDrawn(at: grid(x, y)), "\(type): (\(x), \(y)) on the grid is drawn on")
            }
        }
    }

    /// Physical directions never mirror: a left turn is a left turn, and a
    /// ramp rises to the right, in Arabic as in English.
    @MainActor func testNoDirectionMirrorsRightToLeft() throws {
        for type in DirectionType.allCases {
            let ltr = try DrawnPixels.draw(KozmosDirectionGlyph(type: type, size: 24), scale: 3)
            let rtl = try DrawnPixels.draw(KozmosDirectionGlyph(type: type, size: 24).environment(\.layoutDirection, .rightToLeft), scale: 3)
            XCTAssertEqual(ltr.largestDifference(from: rtl), 0, "\(type) mirrors right to left")
        }
    }

    #if os(iOS)
    @MainActor func testDurationOnlyIsDrawnAndAbsentMetricsLeaveNoText() async throws {
        for duration in [String?.none, "0 min"] {
            // An empty instruction isolates the metric pixels from antialiased
            // instruction text; spoken ordering is covered separately above.
            let view = KozmosDirectionStep(type: .left, instruction: "", duration: duration)
                .environment(\.colorScheme, .light)
                .background(Color.white)
            let pixels = try await RenderedPixels.render(view, size: CGSize(width: 240, height: 80))
            // Inside the text column, excluding the border and the blue glyph:
            // only the optional metrics use this medium foreground shade.
            let metrics = pixels.count(in: CGRect(x: 70, y: 12, width: 150, height: 56)) { r, g, b in
                r > 90 && r < 180 && g > 90 && g < 180 && b > 90 && b < 180
                    && abs(Int(r) - Int(g)) < 20 && abs(Int(g) - Int(b)) < 20
            }
            if duration == nil {
                XCTAssertLessThan(metrics, 20)
            } else {
                XCTAssertGreaterThan(metrics, 40, "duration-only metric is not drawn")
            }
        }
    }

    /// Every direction has a glyph the platform can draw: rendered in the
    /// theme colour, each one leaves theme pixels behind.
    @MainActor func testEveryDirectionDrawsAnArrow() async throws {
        for type in DirectionType.allCases {
            let view = KozmosDirectionStep(type: type, instruction: "Go").padding(8).background(Color.white)
            let pixels = try await RenderedPixels.render(view, size: CGSize(width: 240, height: 80))
            XCTAssertNotNil(pixels.boundingBox(in: CGRect(x: 0, y: 0, width: 80, height: 80), where: RenderedPixels.isTheme),
                            "\(type) draws no arrow: no such symbol")
        }
    }
    #endif
}
