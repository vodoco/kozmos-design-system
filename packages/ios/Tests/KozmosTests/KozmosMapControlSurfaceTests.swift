import XCTest
import SwiftUI
@testable import Kozmos

/// Decision 40 (Olcay, 2026-09-28), drawn: the map controls wear the SDK's
/// Tracking Indicator (Figma ce7phRJR1sCkH6zT8EMH8I, 434:31572) — a 48 square,
/// the page's surface with no edge, the map controls' three shadows, and its
/// words two equal lines in the toggle's tone.
///
/// Drawn without a window by `DrawnPixels`, so these run in `swift test` on a
/// Mac as well as on a simulator. Each control sits on the map's grey
/// (background/100), with room around it for its shadow.
final class KozmosMapControlSurfaceTests: XCTestCase {
    typealias Pixel = (r: UInt8, g: UInt8, b: UInt8, a: UInt8)

    @MainActor
    private func onTheMap<V: View>(_ control: V) throws -> DrawnPixels {
        try DrawnPixels.draw(
            control
                .padding(60)
                .background(KozmosColors.primitivesColorsBackground100)
                .environment(\.colorScheme, .light)
        )
    }

    /// The surface's box: where the drawing is at its whitest. The map's grey
    /// is 227 at most, and a shadow only darkens it.
    private func surfaceBox(_ drawn: DrawnPixels) throws -> CGRect {
        try XCTUnwrap(drawn.boundingBox(where: { r, g, b, a in a > 240 && r > 240 && g > 240 && b > 240 }),
                      "no surface was drawn")
    }

    /// The darkest pixel in a region, in points: where a glyph or a word is
    /// drawn at its full colour.
    private func darkest(_ drawn: DrawnPixels, in region: CGRect) -> Pixel {
        var best: Pixel = (255, 255, 255, 255)
        var y = region.minY
        while y < region.maxY {
            var x = region.minX
            while x < region.maxX {
                let p = drawn.pixel(at: CGPoint(x: x, y: y))
                if Int(p.r) + Int(p.g) + Int(p.b) < Int(best.r) + Int(best.g) + Int(best.b) { best = p }
                x += 0.5
            }
            y += 0.5
        }
        return best
    }

    private func close(_ a: Pixel, _ b: Pixel, within tolerance: Int) -> Bool {
        abs(Int(a.r) - Int(b.r)) <= tolerance && abs(Int(a.g) - Int(b.g)) <= tolerance
            && abs(Int(a.b) - Int(b.b)) <= tolerance
    }

    /// A 48 square of the page's own surface, opaque, and no edge: just inside
    /// its left side the surface is the surface, not a stroke. It was a 44
    /// square at 90% of the surface, ringed in grey.
    @MainActor func testTheSurfaceIsTheSDKs48SquareWithNoEdge() throws {
        let drawn = try onTheMap(KozmosMapControlButton(label: "Zoom in", systemImage: "plus", action: {}))
        let box = try surfaceBox(drawn)
        XCTAssertEqual(box.width, 48, accuracy: 1, "the control is \(box.width) wide")
        XCTAssertEqual(box.height, 48, accuracy: 1, "the control is \(box.height) tall")

        let surface = try DrawnPixels.resolved(KozmosColors.primitivesColorsBackground0, in: .light)
        let inside = drawn.pixel(at: CGPoint(x: box.minX + 6, y: box.minY + 24))
        XCTAssertTrue(close(inside, surface, within: 1), "the surface is not the page's own, opaque: \(inside)")
        let edge = drawn.pixel(at: CGPoint(x: box.minX + 0.25, y: box.midY))
        XCTAssertTrue(close(edge, surface, within: 2), "an edge is drawn around the surface: \(edge)")
    }

    /// The map controls' three shadows reach where the floating role's never
    /// did: 16 beside the control (the 0 0 32 layer) and 30 below it (the
    /// 0 24 24 layer) the map is still darker than the bare map.
    @MainActor func testItCastsTheMapControlsThreeShadows() throws {
        let drawn = try onTheMap(KozmosMapControlButton(label: "Zoom in", systemImage: "plus", action: {}))
        let box = try surfaceBox(drawn)
        let bare = drawn.pixel(at: CGPoint(x: 2, y: 2))
        let beside = drawn.pixel(at: CGPoint(x: box.minX - 16, y: box.midY))
        let below = drawn.pixel(at: CGPoint(x: box.midX, y: box.maxY + 30))
        XCTAssertGreaterThanOrEqual(Int(bare.g) - Int(beside.g), 2, "no shadow 16 beside the control: \(beside) on \(bare)")
        XCTAssertGreaterThanOrEqual(Int(bare.g) - Int(below.g), 2, "no shadow 30 below the control: \(below) on \(bare)")
    }

    /// The SDK's "Focus⏎Off" and "Focus On": a 48 control, its words after a
    /// 12 inset, a 24 mark and an 8 gap, grey while off and navy while on, and
    /// its mark grey while off and the theme's blue while on.
    @MainActor func testTheWordsAndTheMarkAreTheTogglesTone() throws {
        let grey = try DrawnPixels.resolved(KozmosColors.primitivesColorsForeground400, in: .light)
        let navy = try DrawnPixels.resolved(KozmosColors.primitivesColorsTheme1000, in: .light)
        let blue = try DrawnPixels.resolved(KozmosColors.primitivesColorsTheme600, in: .light)
        for (pressed, words, mark) in [(false, grey, grey), (true, navy, blue)] {
            let control = KozmosMapControlButton(
                label: "Focus",
                stateLabel: pressed ? "On" : "Off",
                presentation: .labelled,
                labelPlacement: .stacked,
                pressed: pressed,
                action: {}
            ) {
                Image(systemName: pressed ? "location.fill" : "location")
                    .frame(width: 24, height: 24)
            }
            let drawn = try onTheMap(control)
            let box = try surfaceBox(drawn)
            XCTAssertEqual(box.height, 48, accuracy: 1, "pressed \(pressed): the labelled control is \(box.height) tall")

            let inWords = darkest(drawn, in: CGRect(x: box.minX + 44, y: box.minY + 6, width: box.width - 50, height: 36))
            XCTAssertTrue(close(inWords, words, within: 18), "pressed \(pressed): the words are \(inWords), not \(words)")
            let inMark = darkest(drawn, in: CGRect(x: box.minX + 12, y: box.minY + 12, width: 24, height: 24))
            XCTAssertTrue(close(inMark, mark, within: 18), "pressed \(pressed): the mark is \(inMark), not \(mark)")
        }
    }

    /// The zoom pair is one surface: 48 wide and two 48 controls tall with a
    /// hairline between, no edge round it. It was 44 wide.
    @MainActor func testTheZoomPairIsOneSurface() throws {
        let drawn = try onTheMap(KozmosMapControlsGroup(onZoomIn: {}, onZoomOut: {}))
        let box = try surfaceBox(drawn)
        XCTAssertEqual(box.width, 48, accuracy: 1, "the zoom pair is \(box.width) wide")
        XCTAssertEqual(box.height, 97, accuracy: 1.5, "the zoom pair is \(box.height) tall")

        let surface = try DrawnPixels.resolved(KozmosColors.primitivesColorsBackground0, in: .light)
        let edge = drawn.pixel(at: CGPoint(x: box.minX + 0.25, y: box.minY + 24))
        XCTAssertTrue(close(edge, surface, within: 2), "an edge is drawn round the zoom pair: \(edge)")
    }
}
