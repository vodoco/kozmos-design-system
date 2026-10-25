import XCTest
import SwiftUI
@testable import Kozmos

/// What Kozmos draws right to left, part by part, as React draws it.
///
/// Two things SwiftUI does right to left that a drawing has to allow for:
///
/// - **It mirrors a shape or a path itself, but only in an app that deploys
///   to iOS 17 or later** (macOS 14). Unset, `Shape.layoutDirectionBehavior`
///   is `.mirrors(in: .rightToLeft)` there and `.fixed` in an app that
///   deploys to iOS 16. So a part whose drawing turns with the reading
///   direction places it itself and says `.fixed`, or it draws differently
///   in different apps: the tooltip's side tip and the split button's
///   halves were right only in the first. (The tooltip's sides are drawn as
///   named now; `KozmosTooltipSideTests` holds them.) `swift test`'s host deploys to
///   macOS 14 and Xcode 27's simulator host to iOS 17, where SwiftUI
///   mirrors; Xcode 26's simulator host deploys lower, where it does not. So
///   each such part is checked twice: by its drawing, which an iOS 16 host
///   catches, and by the behaviour it declares, which the others do.
/// - **It turns a rotation the other way, in any app.** A compass bearing is
///   the same in every language, so a part that turns by one draws in a
///   left-to-right environment: the heading cone, the compass and the
///   spinner turned the wrong way.
///
/// Drawn without a window, so these run in `swift test` on a Mac too.
final class KozmosRightToLeftDrawingTests: XCTestCase {
    private static let directions: [LayoutDirection] = [.leftToRight, .rightToLeft]

    private static func name(_ direction: LayoutDirection) -> String { direction == .leftToRight ? "LTR" : "RTL" }

    @MainActor private func draw<V: View>(_ view: V, _ direction: LayoutDirection) throws -> DrawnPixels {
        try DrawnPixels.draw(view.environment(\.layoutDirection, direction).environment(\.colorScheme, .light), scale: 3)
    }

    // MARK: Shapes that turn with the reading direction

    /// The tip points as drawn, so SwiftUI must not mirror it, in any app.
    /// `KozmosTooltipSideTests` draws it, and the bubble, on every side.
    func testATooltipsTipIsNeverMirroredBySwiftUI() throws {
        guard #available(iOS 17.0, macOS 14.0, *) else { throw XCTSkip("layoutDirectionBehavior is iOS 17 and macOS 14") }
        for edge in [KozmosTooltipEdge.top, .right, .bottom, .left] {
            XCTAssertEqual(KozmosTooltipTipShape(edge: edge).layoutDirectionBehavior, .fixed, ".\(edge)")
        }
    }

    #if os(iOS)
    /// React's split button is rounded at its start and its end, `rounded-e-none`
    /// and `rounded-s-none` on its halves, so right to left the action half
    /// is rounded on the right. In an app that deploys to iOS 16 it was
    /// rounded where the halves meet and square at the ends. iOS only: on a
    /// Mac a `Menu` is an AppKit control, which ImageRenderer leaves out.
    @MainActor func testASplitButtonIsRoundedAtItsEndsInBothDirections() throws {
        var wrong: [String] = []
        for direction in Self.directions {
            let drawn = try draw(KozmosSplitButton(label: "Save", mainAction: {}, menuItems: [("Draft", {})]).fixedSize(), direction)
            let w = drawn.size.width, h = drawn.size.height
            for (corner, point) in [("top left", CGPoint(x: 2, y: 2)), ("top right", CGPoint(x: w - 2, y: 2)),
                                    ("bottom left", CGPoint(x: 2, y: h - 2)), ("bottom right", CGPoint(x: w - 2, y: h - 2))]
            where drawn.isDrawn(at: point) {
                wrong.append("\(Self.name(direction)): its \(corner) corner is square")
            }
        }
        XCTAssertEqual(wrong, [])
    }
    #endif

    /// The halves place their own corners, so SwiftUI must not mirror them.
    func testASplitButtonsHalvesAreNeverMirroredBySwiftUI() throws {
        guard #available(iOS 17.0, macOS 14.0, *) else { throw XCTSkip("layoutDirectionBehavior is iOS 17 and macOS 14") }
        for roundsLeft in [true, false] {
            XCTAssertEqual(KozmosEndRoundedRectangle(radius: 16, roundsLeft: roundsLeft).layoutDirectionBehavior, .fixed)
        }
    }

    // MARK: Drawings that are the same in every language

    /// Pointr's artwork is physical, as React's is: an arrow up and to the
    /// right, a lift, a hard left are the same in every language, and
    /// `KozmosIcon` draws them in a left-to-right environment. The names
    /// whose artwork is not symmetric, drawn right to left, draw as they do
    /// left to right.
    @MainActor func testPointrArtworkIsNeverMirrored() throws {
        var wrong: [String] = []
        for name in ["navigation-pointer-01", "bluetooth-off", "log-in-01", "log-out-01", "arrow-up-right", "arrow-down-right",
                     "flip-backward", "phone", "share-01", "loading-01", "hard-left", "hard-right", "turn-back", "escalator-up"] {
            let icon = KozmosIcon(name, size: .xl).background(Color.white)
            let ltr = try draw(icon, .leftToRight), rtl = try draw(icon, .rightToLeft)
            if let difference = rtl.largestDifference(from: ltr), difference > 8 { wrong.append("\(name): \(difference)") }
        }
        XCTAssertEqual(wrong, [])
    }

    /// React's cone is `rotate(heading)`: a heading of east points right in
    /// every language. Right to left, SwiftUI turned it the other way.
    @MainActor func testTheHeadingConePointsAlongTheHeadingInBothDirections() throws {
        var wrong: [String] = []
        for heading in [60.0, 90.0, 200.0] {
            for direction in Self.directions {
                let bearing = try coneBearing(heading: heading, direction)
                let off = abs((bearing - heading + 540).truncatingRemainder(dividingBy: 360) - 180)
                if off > 5 { wrong.append("heading \(Int(heading)) \(Self.name(direction)): the cone points to \(Int(bearing.rounded()))°") }
            }
        }
        XCTAssertEqual(wrong, [])
    }

    /// The cone's bearing: the centre of what it adds to the marker, from the
    /// marker's centre, clockwise from up.
    @MainActor private func coneBearing(heading: Double, _ direction: LayoutDirection) throws -> Double {
        let with = try draw(KozmosUserLocationMarker(heading: heading, showHeading: true).background(Color.white), direction)
        let without = try draw(KozmosUserLocationMarker(heading: heading, showHeading: false).background(Color.white), direction)
        var sx = 0.0, sy = 0.0, total = 0.0
        let centre = with.size.width / 2
        for y in stride(from: 0.0, to: with.size.height, by: 1 / 3) {
            for x in stride(from: 0.0, to: with.size.width, by: 1 / 3) {
                let a = with.pixel(at: CGPoint(x: x, y: y)), b = without.pixel(at: CGPoint(x: x, y: y))
                let d = Double(abs(Int(a.r) - Int(b.r)) + abs(Int(a.g) - Int(b.g)) + abs(Int(a.b) - Int(b.b)))
                sx += (x - centre) * d; sy += (y - centre) * d; total += d
            }
        }
        XCTAssertGreaterThan(total, 0, "no cone drawn")
        return (atan2(sx, -sy) * 180 / .pi + 360).truncatingRemainder(dividingBy: 360)
    }

    /// The compass turns by the map's bearing, as Compose's `rotate` does, in
    /// every language: drawn right to left, it is the compass drawn left to
    /// right. SwiftUI turned it the other way.
    @MainActor func testTheCompassTurnsByTheBearingInBothDirections() throws {
        let compass = KozmosMapControlsGroup(compassBearing: 60, onCompassReset: {}).fixedSize().background(Color.white)
        let ltr = try draw(compass, .leftToRight), rtl = try draw(compass, .rightToLeft)
        let difference = try XCTUnwrap(rtl.largestDifference(from: ltr), "the two drawings differ in size")
        XCTAssertLessThanOrEqual(difference, 8, "right to left, the compass at a bearing of 60 is not the one drawn left to right")
    }

    /// React's arc is three quarters of a circle from the top, clockwise, so
    /// its gap is at the top left, in every language. Right to left, SwiftUI
    /// turned it the other way, and the gap sat at the bottom right.
    @MainActor func testTheSpinnersGapIsAtTheTopLeftInBothDirections() throws {
        var wrong: [String] = []
        for direction in Self.directions {
            let drawn = try draw(KozmosSpinner(size: .lg).background(Color.white), direction)
            let centre = drawn.size.width / 2, radius = centre * 0.75
            let missing = (1...12).filter { hour in
                let angle = Double(hour) / 12 * 2 * .pi
                let p = drawn.pixel(at: CGPoint(x: centre + radius * sin(angle), y: centre - radius * cos(angle)))
                return p.r > 200 && p.g > 200 && p.b > 200
            }
            if missing != [10, 11] { wrong.append("\(Self.name(direction)): no ring at hours \(missing)") }
        }
        XCTAssertEqual(wrong, [])
    }
}
