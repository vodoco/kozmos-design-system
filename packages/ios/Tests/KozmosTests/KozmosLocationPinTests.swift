#if os(iOS)
import SwiftUI
import XCTest
@testable import Kozmos

/// Decision 55 (Olcay, 2026-09-29): a numbered pin pairs with its result
/// card's number tab. At rest it is quiet — the surface, a ring and the
/// number in its colour, as the SDK's map draws its unselected results — and
/// only the selected one is filled. Off the floor the outlined marker's ring
/// is dashed, so a quiet pin is never taken for one on another floor.
/// Measured on what is drawn, not reasoned about.
final class KozmosLocationPinTests: XCTestCase {
    private let size = CGSize(width: 76, height: 76)

    private func draw(_ pin: KozmosLocationPin, scheme: ColorScheme = .light) async throws -> RenderedPixels {
        let backdrop: Color = scheme == .dark ? .black : .white
        return try await RenderedPixels.render(
            pin.frame(width: size.width, height: size.height).background(backdrop).environment(\.colorScheme, scheme),
            size: size
        )
    }

    private static func isWhite(_ c: (r: UInt8, g: UInt8, b: UInt8)) -> Bool { c.r > 240 && c.g > 240 && c.b > 240 }
    private static func isBlack(_ c: (r: UInt8, g: UInt8, b: UInt8)) -> Bool { c.r < 16 && c.g < 16 && c.b < 16 }
    private static func near(_ c: (r: UInt8, g: UInt8, b: UInt8), _ r: Int, _ g: Int, _ b: Int, by tolerance: Int = 14) -> Bool {
        abs(Int(c.r) - r) <= tolerance && abs(Int(c.g) - g) <= tolerance && abs(Int(c.b) - b) <= tolerance
    }

    @MainActor func testANumberedPinAtRestIsQuietAndFillsOnlyWhenSelected() async throws {
        let rest = try await draw(KozmosLocationPin(size: .lg, number: 2))
        let ring = try XCTUnwrap(rest.boundingBox(in: CGRect(origin: .zero, size: size), where: RenderedPixels.isTheme), "no primary at rest")
        XCTAssertEqual(ring.width, 40, accuracy: 2, "the pin at rest is not the 40 large pin: \(ring)")
        // Inside the ring, clear of the number: the surface, not the fill.
        let inside = CGPoint(x: ring.midX - 12, y: ring.midY)
        XCTAssertTrue(Self.isWhite(rest.color(at: inside)), "a numbered pin at rest is still filled: \(rest.color(at: inside)) inside the ring")
        // The number is in the primary colour: the only primary inside the ring.
        let glyph = ring.insetBy(dx: 11, dy: 11)
        XCTAssertGreaterThan(rest.count(in: glyph, where: RenderedPixels.isTheme), 20, "the number at rest is not in the primary colour")
        XCTAssertEqual(rest.count(in: glyph, where: { r, g, b in r > 240 && g > 240 && b > 240 }) > 0, true, "no surface around the number")

        let selected = try await draw(KozmosLocationPin(size: .lg, number: 2, selected: true))
        let filled = try XCTUnwrap(selected.boundingBox(in: CGRect(origin: .zero, size: size), where: RenderedPixels.isTheme), "no primary when selected")
        // Selected still grows it (+8), inside its 2 white ring.
        XCTAssertEqual(filled.width, 44, accuracy: 2, "the selected pin did not grow: \(filled)")
        let insideSelected = selected.color(at: CGPoint(x: filled.midX - 12, y: filled.midY))
        XCTAssertTrue(RenderedPixels.isTheme(insideSelected.r, insideSelected.g, insideSelected.b), "the selected pin is not filled: \(insideSelected)")
        XCTAssertGreaterThan(selected.count(in: filled.insetBy(dx: 12, dy: 12), where: { r, g, b in r > 240 && g > 240 && b > 240 }), 20, "the selected pin's number is not white")
    }

    /// The separate pieces of the ring: primary shapes that reach its band,
    /// leaving out a number in the primary colour at the middle.
    private func ringPieces(_ pixels: RenderedPixels) throws -> (pieces: [CGRect], ring: CGRect) {
        let region = CGRect(origin: .zero, size: size)
        let ring = try XCTUnwrap(pixels.boundingBox(in: region, where: RenderedPixels.isTheme), "no primary")
        let middle = ring.insetBy(dx: 8, dy: 8)
        return (pixels.shapes(in: region, where: RenderedPixels.isTheme).filter { !middle.contains($0) }, ring)
    }

    @MainActor func testAnOffFloorPinsRingIsDashedAndAQuietPinsIsSolid() async throws {
        let quiet = try ringPieces(try await draw(KozmosLocationPin(size: .lg, number: 4)))
        XCTAssertEqual(quiet.pieces.count, 1, "a quiet pin's ring is not one solid ring: \(quiet.pieces)")

        let offFloorPixels = try await draw(KozmosLocationPin(size: .lg, number: 4, offFloor: true))
        let offFloor = try ringPieces(offFloorPixels)
        XCTAssertEqual(offFloor.pieces.count, 8, "an off-floor pin's ring is not eight dashes: \(offFloor.pieces.count) pieces")
        XCTAssertEqual(offFloor.ring.width, 40, accuracy: 2, "the dashed ring is not the 40 large pin: \(offFloor.ring)")
        XCTAssertNotNil(offFloorPixels.boundingBox(in: offFloor.ring.insetBy(dx: 11, dy: 11), where: RenderedPixels.isDarkText), "the off-floor number is not in the foreground")

        // Selected off the floor: larger, still dashed, never filled.
        let selectedPixels = try await draw(KozmosLocationPin(size: .lg, number: 4, selected: true, offFloor: true))
        let selected = try ringPieces(selectedPixels)
        XCTAssertEqual(selected.pieces.count, 8, "a selected off-floor pin is not dashed: \(selected.pieces.count) pieces")
        let grown = selected.ring
        XCTAssertEqual(grown.width, 48, accuracy: 2, "the selected off-floor pin did not grow: \(grown)")
        XCTAssertTrue(Self.isWhite(selectedPixels.color(at: CGPoint(x: grown.midX - 14, y: grown.midY))), "a selected off-floor pin is filled")
    }

    /// Theme/500 is one blue in both themes, 3.74:1 on the dark surface: a
    /// quiet pin's ring and number take the theme's text role, #5887F3 in the
    /// dark (6.18:1 on it).
    @MainActor func testAQuietPinReadsOnTheDarkSurface() async throws {
        let dark = try await draw(KozmosLocationPin(size: .lg, number: 2), scheme: .dark)
        let ring = try XCTUnwrap(dark.boundingBox(in: CGRect(origin: .zero, size: size), where: RenderedPixels.isTheme), "no primary in the dark")
        XCTAssertTrue(Self.isBlack(dark.color(at: CGPoint(x: ring.midX - 12, y: ring.midY))), "the dark pin at rest is not the dark surface inside: \(dark.color(at: CGPoint(x: ring.midX - 12, y: ring.midY)))")
        // The ring's middle, 1.5 in from its outer edge.
        let onRing = dark.color(at: CGPoint(x: ring.minX + 1.5, y: ring.midY))
        XCTAssertTrue(Self.near(onRing, 0x58, 0x87, 0xF3), "the dark ring is not the theme's text colour #5887F3: \(onRing)")
    }

    /// A tint rings the quiet marker in its fill; its number takes the
    /// foreground, since the fill fails 4.5:1 as text for six of the eight
    /// (yellow reads 1.92:1 on white).
    @MainActor func testATintedPinAtRestIsRingedInItsFillWithTheNumberInTheForeground() async throws {
        let yellow = KozmosCategoryTint(accent: KozmosColors.semanticsCategoryAccentYellow, fill: KozmosInkedFill(fill: KozmosColors.semanticsCategoryFillYellow, ink: KozmosColors.semanticsCategoryOnfillYellow))
        let pixels = try await draw(KozmosLocationPin(size: .lg, number: 3, tint: yellow))
        let isYellow: (UInt8, UInt8, UInt8) -> Bool = { r, g, b in r > 220 && g > 140 && g < 200 && b < 80 }
        let ring = try XCTUnwrap(pixels.boundingBox(in: CGRect(origin: .zero, size: size), where: isYellow), "no ring in the tint")
        XCTAssertEqual(ring.width, 40, accuracy: 2, "the tinted ring is not the 40 large pin: \(ring)")
        XCTAssertTrue(Self.isWhite(pixels.color(at: CGPoint(x: ring.midX - 12, y: ring.midY))), "a tinted pin at rest is still filled")
        let glyph = ring.insetBy(dx: 11, dy: 11)
        XCTAssertNotNil(pixels.boundingBox(in: glyph, where: RenderedPixels.isDarkText), "the tinted number is not in the foreground")
        XCTAssertNil(pixels.boundingBox(in: glyph, where: isYellow), "the tinted number is in the fill")
    }
}
#endif
