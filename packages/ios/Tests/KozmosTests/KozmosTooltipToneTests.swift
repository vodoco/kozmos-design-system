import SwiftUI
import XCTest
@testable import Kozmos

/// Decision 192 (GAP-210): a tooltip takes a tone. The default is the
/// popover surface it always was, background/0 with a background/200 edge
/// under foreground/0; the inverse tone, Pointr Cloud's dark info and
/// guidance tooltips, is Semantics.Inverse: the bubble and its tip the
/// surface, foreground/200, and the words its onSurface, background/0. Its
/// edge takes the surface, so the bubble is the size the default one is.
///
/// Drawn without a window by `DrawnPixels`, on the page, so these run in
/// `swift test` on a Mac as well as on the simulator.
final class KozmosTooltipToneTests: XCTestCase {
    typealias Pixel = (r: UInt8, g: UInt8, b: UInt8, a: UInt8)

    private static func hex(_ p: Pixel) -> String { String(format: "#%02X%02X%02X", p.r, p.g, p.b) }

    private static func near(_ a: Pixel, _ b: Pixel, within tolerance: Int) -> Bool {
        abs(Int(a.r) - Int(b.r)) <= tolerance && abs(Int(a.g) - Int(b.g)) <= tolerance && abs(Int(a.b) - Int(b.b)) <= tolerance
    }

    /// A page of neither tone's colours, so each bubble is told from it.
    private static let page = Color(.sRGB, red: 0.5, green: 0.5, blue: 0.5, opacity: 1)

    @MainActor private func draw(_ bubble: KozmosTooltipBubble, _ scheme: ColorScheme) throws -> DrawnPixels {
        try DrawnPixels.draw(
            bubble.fixedSize().padding(16).background(Self.page).environment(\.colorScheme, scheme),
            scale: 3
        )
    }

    /// The point in `region` farthest from `colour`: where a word covers a
    /// pixel whole.
    private static func farthest(in drawn: DrawnPixels, region: CGRect, from colour: Pixel) -> Pixel {
        var best = colour, distance = -1
        let step = 1 / drawn.scale
        var y = region.minY + step / 2
        while y < region.maxY {
            var x = region.minX + step / 2
            while x < region.maxX {
                let p = drawn.pixel(at: CGPoint(x: x, y: y))
                let d = max(abs(Int(p.r) - Int(colour.r)), abs(Int(p.g) - Int(colour.g)), abs(Int(p.b) - Int(colour.b)))
                if p.a > 240, d > distance { distance = d; best = p }
                x += step
            }
            y += step
        }
        return best
    }

    /// What is wrong with a bubble drawn in `tone`, read against its surface,
    /// its words and its edge.
    @MainActor private func problems(_ tone: KozmosTooltipTone, surface: Color, words: Color, edge: Color,
                                     _ scheme: ColorScheme) throws -> [String] {
        let name = "\(tone) tooltip, \(scheme)"
        let drawn = try draw(KozmosTooltipBubble(text: "Hours", side: .top, tone: tone), scheme)
        let surfaceColour = try DrawnPixels.resolved(surface, in: scheme)
        let wordsColour = try DrawnPixels.resolved(words, in: scheme)
        let edgeColour = try DrawnPixels.resolved(edge, in: scheme)
        var found: [String] = []
        // The bubble, without its tip: 16 in from the page's edges, 4 of tip under it.
        let bubble = CGRect(x: 16, y: 16, width: drawn.size.width - 32, height: drawn.size.height - 32 - 4)
        // In the bubble's 12 of padding before its words, clear of its edge.
        let patch = CGRect(x: bubble.minX + 4, y: bubble.midY - 2, width: 4, height: 4)
        let area = Int(patch.width * drawn.scale) * Int(patch.height * drawn.scale)
        let matching = drawn.count(in: patch, where: DrawnPixels.matches(surfaceColour, tolerance: 2))
        if matching != area {
            found.append("\(name): the bubble is \(Self.hex(drawn.pixel(at: CGPoint(x: patch.midX, y: patch.midY)))), not \(Self.hex(surfaceColour))")
        }
        // The tip: the middle of its base, just under the bubble.
        let tip = drawn.pixel(at: CGPoint(x: bubble.midX, y: bubble.maxY + 1))
        if !Self.near(tip, surfaceColour, within: 3) {
            found.append("\(name): the tip is \(Self.hex(tip)), not \(Self.hex(surfaceColour))")
        }
        let ink = Self.farthest(in: drawn, region: bubble.insetBy(dx: 10, dy: 3), from: surfaceColour)
        if !Self.near(ink, wordsColour, within: 4) {
            found.append("\(name): the words are \(Self.hex(ink)), not \(Self.hex(wordsColour))")
        }
        // The edge, 1 wide on the bubble's leading side: the pixel just inside
        // it is covered whole by the edge's inner half.
        let edgePixel = drawn.pixel(at: CGPoint(x: bubble.minX + 1.0 / 6, y: bubble.midY))
        if !Self.near(edgePixel, edgeColour, within: 6) {
            found.append("\(name): the edge is \(Self.hex(edgePixel)), not \(Self.hex(edgeColour))")
        }
        return found
    }

    /// Inverse, in light and dark: the bubble and its tip are the inverse
    /// surface, its edge too, and its words the inverse onSurface.
    @MainActor func testAnInverseTooltipIsTheInverseSurfaceUnderItsOnSurfaceInLightAndDark() throws {
        var found: [String] = []
        for scheme in [ColorScheme.light, .dark] {
            found += try problems(.inverse, surface: KozmosColors.semanticsInverseSurface, words: KozmosColors.semanticsInverseOnsurface,
                                  edge: KozmosColors.semanticsInverseSurface, scheme)
        }
        XCTAssertTrue(found.isEmpty, found.joined(separator: "\n"))
    }

    /// The default draws as it always has: background/0 under foreground/0,
    /// with a background/200 edge; and unset, the tone is the default.
    @MainActor func testTheDefaultTooltipIsUnchangedInLightAndDark() throws {
        var found: [String] = []
        for scheme in [ColorScheme.light, .dark] {
            found += try problems(.default, surface: KozmosColors.primitivesColorsBackground0, words: KozmosColors.primitivesColorsForeground0,
                                  edge: KozmosColors.primitivesColorsBackground200, scheme)
            let unset = try draw(KozmosTooltipBubble(text: "Hours", side: .top), scheme)
            let named = try draw(KozmosTooltipBubble(text: "Hours", side: .top, tone: .default), scheme)
            XCTAssertLessThanOrEqual(try XCTUnwrap(unset.largestDifference(from: named)), 2, "\(scheme): unset is not the default tone")
        }
        XCTAssertEqual(KozmosTooltip(text: "Hours").tone, .default)
        XCTAssertTrue(found.isEmpty, found.joined(separator: "\n"))
    }

    /// The inverse bubble is the default's size, on every side.
    @MainActor func testAnInverseTooltipIsTheDefaultsSizeOnEverySide() throws {
        for side in [KozmosTooltipSide.top, .bottom, .left, .right] {
            let plain = try draw(KozmosTooltipBubble(text: "Keep holding Shift", side: side), .light)
            let inverse = try draw(KozmosTooltipBubble(text: "Keep holding Shift", side: side, tone: .inverse), .light)
            XCTAssertEqual(plain.size, inverse.size, "\(side): the inverse bubble is \(inverse.size), the default \(plain.size)")
        }
    }
}
