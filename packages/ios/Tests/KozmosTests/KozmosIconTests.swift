import XCTest
import SwiftUI
@testable import Kozmos

/// The names `KozmosIcon` draws. Most are SF Symbols; a name SF Symbols has
/// no glyph for is drawn from Pointr's own outline or its wayfinding artwork,
/// the one React draws from `@kozmos-ds/icons`, and never a stand-in.
///
/// Drawn without a window by `DrawnPixels`, so these run in `swift test` on a
/// Mac as well as on a simulator.
final class KozmosIconTests: XCTestCase {
    @MainActor func testNavigationPointerUsesTheUnfilledNortheastPointrOutline() throws {
        XCTAssertNotNil(KozmosPointrGlyph.named("navigation-pointer-01"))
        let size = KozmosIconSize.xl.pointSize
        let drawn = try DrawnPixels.draw(KozmosIcon("navigation-pointer-01", size: .xl), scale: 3)
        XCTAssertTrue(drawn.isDrawn(at: onTheGrid(20.5, 3.5, size: size)))
        XCTAssertFalse(drawn.isDrawn(at: onTheGrid(16, 8, size: size)), "Pointer interior must remain unfilled")
        let rtl = try DrawnPixels.draw(KozmosIcon("navigation-pointer-01", size: .xl).environment(\.layoutDirection, .rightToLeft), scale: 3)
        XCTAssertEqual(drawn.largestDifference(from: rtl), 0, "Go is a location pointer, not a logical forward arrow")
    }
    /// A point on Pointr's 24 grid, at an icon's size.
    private func onTheGrid(_ x: CGFloat, _ y: CGFloat, size: CGFloat) -> CGPoint {
        CGPoint(x: x * size / 24, y: y * size / 24)
    }

    /// SF Symbols has no Bluetooth glyph: neither `bluetooth` nor
    /// `bluetooth.slash` exists. So bluetooth-off, which the map status
    /// pill's No Bluetooth draws, is Pointr's outline: its strike runs corner
    /// to corner and its B stands on the middle line, where the question mark
    /// an unknown name falls back to draws neither.
    @MainActor func testBluetoothOffIsPointrsOutlineWhereSFSymbolsHasNone() throws {
        let size = KozmosIconSize.xl.pointSize
        let drawn = try DrawnPixels.draw(KozmosIcon("bluetooth-off", size: .xl, color: .destructive), scale: 3)
        let standIn = try DrawnPixels.draw(KozmosIcon("no-such-kozmos-name", size: .xl, color: .destructive), scale: 3)
        XCTAssertNotEqual(drawn.largestDifference(from: standIn), 0, "bluetooth-off draws the stand-in an unknown name gets")

        let danger = try DrawnPixels.resolved(KozmosColors.primitivesColorsEmotionalDanger600, in: .light)
        let isInk = DrawnPixels.matches(danger, tolerance: 12)
        // M21 21L3 3, the strike; and the B's spine, M12 7V2 and 12 12V22.
        for (x, y) in [(5.0, 5.0), (19.0, 19.0), (12.0, 4.0), (12.0, 20.0)] {
            let point = onTheGrid(x, y, size: size)
            let pixel = drawn.pixel(at: point)
            XCTAssertTrue(isInk(pixel.r, pixel.g, pixel.b, pixel.a),
                          "(\(x), \(y)) on the grid is not inked in the destructive colour: \(pixel)")
        }
        // Clear of every line by more than its half-width.
        for (x, y) in [(20.0, 4.0), (4.0, 20.0)] {
            XCTAssertFalse(drawn.isDrawn(at: onTheGrid(x, y, size: size)), "(\(x), \(y)) on the grid is drawn on")
        }
    }

    /// Pointr's outlines are stroked at 2 on the 24 grid, so a line is
    /// 2 × size / 24 across at any size, as React draws it: 2.67 at 32.
    @MainActor func testBluetoothOffIsStrokedAtTwoOnTheGridAtAnySize() throws {
        let size = KozmosIconSize.xl.pointSize
        let drawn = try DrawnPixels.draw(KozmosIcon("bluetooth-off", size: .xl, color: .destructive), scale: 3)
        // Across the spine, x = 12, at y = 19 on the grid, from 10.5 to 13.5:
        // clear of the strike (at 19) and of the B's lower arm (at 15.6).
        let row = CGRect(x: onTheGrid(10.5, 19, size: size).x, y: onTheGrid(0, 19, size: size).y,
                         width: 3 * size / 24, height: 1 / drawn.scale)
        let spine = try XCTUnwrap(drawn.boundingBox(in: row, where: { _, _, _, a in a > 128 }), "no spine was drawn")
        XCTAssertEqual(spine.width, 2 * size / 24, accuracy: 0.5, "the spine is \(spine.width) across at \(size)")
    }

    /// Pointr's entry, exit and diagonal arrows stay names a product can
    /// draw, each Pointr's own outline rather than the stand-in, though no
    /// direction draws them now.
    @MainActor func testPointrsEntryExitAndDiagonalArrowsStayIconsByName() throws {
        let standIn = try DrawnPixels.draw(KozmosIcon("no-such-kozmos-name", size: .xl), scale: 3)
        for name in ["log-in-01", "log-out-01", "arrow-up-right", "arrow-down-right"] {
            XCTAssertNotNil(KozmosPointrGlyph.named(name), "\(name) is not drawn from Pointr's outline")
            let drawn = try DrawnPixels.draw(KozmosIcon(name, size: .xl), scale: 3)
            XCTAssertNotEqual(drawn.largestDifference(from: standIn), 0, "\(name) draws the stand-in")
        }
    }

    /// One glyph of the wayfinding artwork, as navigation-glyphs.json lists it.
    struct WayfindingGlyph: Decodable {
        let name: String
        let kind: String
        let paint: String
    }

    /// The wayfinding artwork's source, found by walking up from this file to
    /// the repository: `@kozmos-ds/icons` exports each glyph under `name`, and
    /// the Compose suite reads the same file.
    static func wayfindingGlyphs() throws -> [WayfindingGlyph] {
        struct Source: Decodable { let glyphs: [WayfindingGlyph] }
        var directory = URL(fileURLWithPath: #filePath).deletingLastPathComponent()
        var found: URL?
        while directory.path != "/" {
            let candidate = directory.appendingPathComponent("packages/icons/src/owned/navigation-glyphs.json")
            if FileManager.default.fileExists(atPath: candidate.path) {
                found = candidate
                break
            }
            directory.deleteLastPathComponent()
        }
        let source = try XCTUnwrap(found, "no navigation-glyphs.json above \(#filePath)")
        return try JSONDecoder().decode(Source.self, from: Data(contentsOf: source)).glyphs
    }

    /// The name a glyph is drawn by: its export name in kebab case,
    /// ElevatorUpAndDown as elevator-up-and-down.
    static func iconName(_ exportName: String) -> String {
        var name = ""
        for (index, character) in exportName.enumerated() {
            if character.isUppercase && index > 0 { name.append("-") }
            name.append(contentsOf: character.lowercased())
        }
        return name
    }

    /// Pointr's wayfinding artwork from Pointr Maps - Express is drawn by
    /// name, filled in the icon's colour, never mirrored: the fifteen the
    /// directions draw (the lifts, escalators, stairs and ramps, route-enter,
    /// route-exit, hard-left, hard-right, turn-back, follow-the-line and
    /// arriving) and the eight only a name draws. Every glyph in the shared source has its name, so a glyph
    /// added there without one fails here and in the Compose suite alike.
    @MainActor func testTheWayfindingArtworkIsDrawnFilledByName() throws {
        let glyphs = try Self.wayfindingGlyphs()
        XCTAssertEqual(glyphs.count, 23, "the Express wayfinding set is 23 glyphs")
        let size = KozmosIconSize.xl.pointSize
        let standIn = try DrawnPixels.draw(KozmosIcon("no-such-kozmos-name", size: .xl), scale: 3)
        for glyph in glyphs {
            let name = Self.iconName(glyph.name)
            XCTAssertEqual(glyph.paint, "fill", "\(glyph.name) is not solid artwork")
            // The name belongs to no other icon: not an SF Symbol, not a Pointr outline.
            XCTAssertEqual(KozmosIcon.symbolName(for: name), "questionmark.circle", "\(name) is already an SF Symbol's name")
            XCTAssertNil(KozmosPointrGlyph.named(name), "\(name) is already a Pointr outline's name")

            let artwork = try XCTUnwrap(KozmosNavigationGlyphPaths.path(glyph.kind), "no artwork for \(glyph.kind)")
            let expected = try DrawnPixels.draw(
                ExpressArtwork(path: artwork).fill()
                    .foregroundColor(KozmosColors.primitivesColorsForeground100).frame(width: size, height: size), scale: 3)
            let drawn = try DrawnPixels.draw(KozmosIcon(name, size: .xl), scale: 3)
            XCTAssertNotEqual(drawn.largestDifference(from: standIn), 0, "\(name) draws the stand-in")
            XCTAssertEqual(drawn.largestDifference(from: expected), 0, "\(name) is not the \(glyph.kind) artwork, filled")
            let rtl = try DrawnPixels.draw(KozmosIcon(name, size: .xl).environment(\.layoutDirection, .rightToLeft), scale: 3)
            XCTAssertEqual(drawn.largestDifference(from: rtl), 0, "\(name) mirrors right to left")
        }
    }
}
