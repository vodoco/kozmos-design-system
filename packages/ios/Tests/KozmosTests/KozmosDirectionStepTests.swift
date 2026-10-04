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


    // MARK: The direction marks (Express wayfinding artwork, 2026-10-04)

    /// The marks main drew in SF Symbols, unchanged: straight on, a level
    /// change by any means, transition and walking.
    private static let approvedSymbols: [(DirectionType, String)] = [
        (.straight, "arrow.up"),
        (.levelUp, "arrow.up.to.line"), (.levelDown, "arrow.down.to.line"),
        (.transition, "arrow.forward.to.line"),
        (.walking, "figure.walk"),
    ]

    /// Lifts, escalators, stairs, ramps, entry, exit, the turns, turning back
    /// and the destination draw Pointr's wayfinding artwork from Pointr Maps -
    /// Express, as React draws them: each its kind in the generated paths.
    static let expressKinds: [(DirectionType, String)] = [
        (.liftUp, "lift-up"), (.liftDown, "lift-down"),
        (.escalatorUp, "escalator-up"), (.escalatorDown, "escalator-down"),
        (.stairsUp, "stairs-up"), (.stairsDown, "stairs-down"),
        (.rampUp, "ramp-up"), (.rampDown, "ramp-down"),
        (.enter, "enter"), (.exit, "exit"),
        (.left, "wf-hard-left"), (.right, "wf-hard-right"),
        (.turnBack, "wf-turn-back"), (.destination, "wf-arriving"),
    ]

    /// Every direction draws the mark it is given here, pixel for pixel: an
    /// SF Symbol, or the Express artwork filled with the nonzero rule, as
    /// React fills its paths.
    @MainActor func testEveryDefaultIsAnApprovedMark() throws {
        XCTAssertEqual(Set(Self.approvedSymbols.map(\.0) + Self.expressKinds.map(\.0)), Set(DirectionType.allCases),
                       "a direction has no approved mark")
        XCTAssertEqual(Self.approvedSymbols.count + Self.expressKinds.count, DirectionType.allCases.count,
                       "a direction has two marks")
        for (type, symbol) in Self.approvedSymbols {
            let drawn = try DrawnPixels.draw(KozmosDirectionGlyph(type: type, size: 24), scale: 3)
            let approved = try DrawnPixels.draw(Image(systemName: symbol).font(.system(size: 24, weight: .semibold)), scale: 3)
            XCTAssertEqual(drawn.largestDifference(from: approved), 0, "\(type) does not draw \(symbol)")
        }
        for (type, kind) in Self.expressKinds {
            XCTAssertTrue(KozmosNavigationGlyphPaths.filled.contains(kind), "\(kind) is not solid artwork")
            let artwork = try XCTUnwrap(KozmosNavigationGlyphPaths.path(kind), "no artwork for \(kind)")
            let drawn = try DrawnPixels.draw(KozmosDirectionGlyph(type: type, size: 24), scale: 3)
            let approved = try DrawnPixels.draw(ExpressArtwork(path: artwork).fill().frame(width: 24, height: 24), scale: 3)
            XCTAssertEqual(drawn.largestDifference(from: approved), 0, "\(type) does not draw the Express \(kind) artwork, filled")
        }
    }

    /// The artwork read off on the 24 grid, apart from the code that draws
    /// it: a point deep in a solid part, more than two units from every edge,
    /// which a fill inks and an outline stroked 2 on the grid never reaches.
    private static let solidPoints: [(DirectionType, CGFloat, CGFloat)] = [
        (.liftUp, 3.25, 10.25), (.liftDown, 3.25, 3.25),            // the car's body, beside the first figure
        (.escalatorUp, 6.45, 19.05), (.escalatorDown, 6.25, 8.25),  // the handrail's foot
        (.stairsUp, 10.85, 3.45), (.stairsDown, 20.45, 10.85),
        (.rampUp, 19.05, 17.45), (.rampDown, 4.85, 17.45),          // the wedge's tall end
        (.enter, 11.25, 12.05), (.exit, 5.25, 11.85),               // the arrowhead
        (.left, 3.65, 11.25), (.right, 20.25, 11.25),               // the arrowhead's tip
        (.turnBack, 16.05, 17.25),                                  // the arrowhead
        (.destination, 4.65, 17.45),                                // the ground under the pin
    ]

    /// The Express marks are solid shapes, filled in the tint at the rail's,
    /// the card's and a large size, not outlines of them: deep inside each
    /// one is ink, and the lift's figures and the pin's eye are cut out.
    @MainActor func testTheExpressMarksAreFilledNotOutlined() throws {
        XCTAssertEqual(Set(Self.solidPoints.map(\.0)), Set(Self.expressKinds.map(\.0)))
        let theme = try DrawnPixels.resolved(KozmosColors.primitivesColorsTheme500, in: .light)
        let isTint = DrawnPixels.matches(theme, tolerance: 12)
        for size: CGFloat in [14, 22, 48] {
            let grid = { (x: CGFloat, y: CGFloat) in CGPoint(x: x * size / 24, y: y * size / 24) }
            for (type, x, y) in Self.solidPoints {
                let kind = try XCTUnwrap(Self.expressKinds.first { $0.0 == type }?.1)
                let artwork = try XCTUnwrap(KozmosNavigationGlyphPaths.path(kind))
                // The control: an outline of the same artwork leaves the point clear.
                let outline = try DrawnPixels.draw(
                    ExpressArtwork(path: artwork).stroke(lineWidth: 2 * size / 24).frame(width: size, height: size), scale: 3)
                XCTAssertFalse(outline.isDrawn(at: grid(x, y)), "\(kind): (\(x), \(y)) does not tell a fill from an outline")

                let drawn = try DrawnPixels.draw(
                    KozmosDirectionGlyph(type: type, size: size).foregroundColor(KozmosColors.primitivesColorsTheme500), scale: 3)
                let pixel = drawn.pixel(at: grid(x, y))
                XCTAssertTrue(isTint(pixel.r, pixel.g, pixel.b, pixel.a),
                              "\(type) at \(size): (\(x), \(y)) inside the artwork is not solid tint, \(pixel)")
            }
            // A figure in the car, and the destination pin's eye, are cut-outs:
            // the fill rule keeps them clear.
            let cutOuts: [(DirectionType, CGFloat, CGFloat)] = [(.liftUp, 6.45, 15.85), (.liftDown, 6.45, 8.85), (.destination, 12.05, 7.85)]
            for (type, x, y) in cutOuts {
                let drawn = try DrawnPixels.draw(KozmosDirectionGlyph(type: type, size: size), scale: 3)
                XCTAssertFalse(drawn.isDrawn(at: grid(x, y)), "\(type) at \(size): the cut-out at (\(x), \(y)) is filled in")
            }
        }
    }

    /// Exit departs from the Express file on purpose: its door is Entrance's,
    /// on the right, and its arrow leaves it, pointing left. So everything
    /// right of the arrows is the same drawing in both, and only the arrow's
    /// head moves.
    @MainActor func testExitKeepsEntrysDoorOnTheRight() throws {
        let size: CGFloat = 48
        let grid = { (x: CGFloat, y: CGFloat) in CGPoint(x: x * size / 24, y: y * size / 24) }
        let enter = try DrawnPixels.draw(KozmosDirectionGlyph(type: .enter, size: size), scale: 3)
        let exit = try DrawnPixels.draw(KozmosDirectionGlyph(type: .exit, size: size), scale: 3)
        for drawn in [("enter", enter), ("exit", exit)] {
            // The door: its far side, its top and its foot, and the room inside it.
            for (x, y) in [(21.1, 12.0), (16.0, 2.9), (16.0, 21.1)] as [(CGFloat, CGFloat)] {
                XCTAssertTrue(drawn.1.isDrawn(at: grid(x, y)), "\(drawn.0): the door at (\(x), \(y)) is not inked")
            }
            XCTAssertFalse(drawn.1.isDrawn(at: grid(17.5, 12)), "\(drawn.0): the doorway is drawn on")
        }
        // Right of the arrows, x ≥ 15.5 on the grid, the two are one drawing.
        var differing = 0
        for y in 0..<Int(size * enter.scale) {
            for x in Int(15.5 * size / 24 * enter.scale)..<Int(size * enter.scale) {
                let point = CGPoint(x: (CGFloat(x) + 0.5) / enter.scale, y: (CGFloat(y) + 0.5) / enter.scale)
                if enter.pixel(at: point) != exit.pixel(at: point) { differing += 1 }
            }
        }
        XCTAssertEqual(differing, 0, "exit's door is not entry's: \(differing) pixels differ")
        // Entry's head points into the door; exit's points away from it.
        XCTAssertTrue(enter.isDrawn(at: grid(10.5, 9)), "entry's arrowhead is not by the door")
        XCTAssertFalse(exit.isDrawn(at: grid(10.5, 9)), "exit's arrow points into the door")
        XCTAssertTrue(exit.isDrawn(at: grid(6, 9)), "exit's arrowhead is not at the far end")
        XCTAssertFalse(enter.isDrawn(at: grid(6, 9)), "entry's arrow has a head at the far end")
    }

    /// Physical directions never mirror: a left turn is a left turn, and a
    /// ramp rises to the right, in Arabic as in English. The control: every
    /// mark that is not its own mirror image would be caught if it flipped
    /// (the lift's car, the destination's pin and the vertical arrows are).
    @MainActor func testNoDirectionMirrorsRightToLeft() throws {
        let ownMirrorImages: Set<DirectionType> = [.straight, .destination, .liftUp, .liftDown, .levelUp, .levelDown]
        for type in DirectionType.allCases {
            let ltr = try DrawnPixels.draw(KozmosDirectionGlyph(type: type, size: 24), scale: 3)
            let rtl = try DrawnPixels.draw(KozmosDirectionGlyph(type: type, size: 24).environment(\.layoutDirection, .rightToLeft), scale: 3)
            XCTAssertEqual(ltr.largestDifference(from: rtl), 0, "\(type) mirrors right to left")
            if !ownMirrorImages.contains(type) {
                let mirrored = try DrawnPixels.draw(KozmosDirectionGlyph(type: type, size: 24).scaleEffect(x: -1, y: 1), scale: 3)
                XCTAssertGreaterThan(mirrored.largestDifference(from: ltr) ?? .max, 128, "a mirrored \(type) would pass unseen")
            }
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

/// Express artwork as React draws it, apart from the code under test: the
/// path on the 24 grid, scaled to the frame. Filled, it is what a direction
/// or an icon should draw; stroked, the outline it should not.
struct ExpressArtwork: Shape {
    let path: Path

    func path(in rect: CGRect) -> Path {
        let scale = min(rect.width, rect.height) / 24
        return path.applying(CGAffineTransform(a: scale, b: 0, c: 0, d: scale, tx: rect.minX, ty: rect.minY))
    }
}
