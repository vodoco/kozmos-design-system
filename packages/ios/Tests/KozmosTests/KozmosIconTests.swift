import XCTest
import SwiftUI
@testable import Kozmos

/// The names `KozmosIcon` draws. Most are SF Symbols; a name SF Symbols has
/// no glyph for is drawn from Pointr's own outline, the one React draws from
/// `@kozmos-ds/icons`, and never a stand-in.
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

    /// The direction marks' Pointr icons are names a product can draw too,
    /// each Pointr's own outline rather than the stand-in.
    @MainActor func testTheDirectionMarksArePointrIconsByName() throws {
        let standIn = try DrawnPixels.draw(KozmosIcon("no-such-kozmos-name", size: .xl), scale: 3)
        for name in ["log-in-01", "log-out-01", "arrow-up-right", "arrow-down-right"] {
            XCTAssertNotNil(KozmosPointrGlyph.named(name), "\(name) is not drawn from Pointr's outline")
            let drawn = try DrawnPixels.draw(KozmosIcon(name, size: .xl), scale: 3)
            XCTAssertNotEqual(drawn.largestDifference(from: standIn), 0, "\(name) draws the stand-in")
        }
    }

    /// The original navigation artwork awaits design approval (D5): no
    /// direction draws it, and a product opts in by the names
    /// `@kozmos-ds/icons` exports it under.
    @MainActor func testTheOriginalNavigationArtworkIsOptInByName() throws {
        let names = [
            "elevator-up": "lift-up", "elevator-down": "lift-down", "stairs-up": "stairs-up", "stairs-down": "stairs-down",
            "escalator-up": "escalator-up", "escalator-down": "escalator-down", "ramp-up": "ramp-up", "ramp-down": "ramp-down",
            "route-enter": "enter", "route-exit": "exit",
        ]
        let size = KozmosIconSize.xl.pointSize
        for (name, kind) in names {
            let artwork = try XCTUnwrap(KozmosNavigationGlyphPaths.path(kind), "no artwork for \(kind)")
            // The artwork as the icon draws an outline: stroked 2 on the grid, in the default colour.
            let expected = try DrawnPixels.draw(
                KozmosPointrGlyph(runs: [], canonicalPath: artwork).stroke(style: KozmosPointrGlyph.style(size: size))
                    .foregroundColor(KozmosColors.primitivesColorsForeground100).frame(width: size, height: size), scale: 3)
            let drawn = try DrawnPixels.draw(KozmosIcon(name, size: .xl), scale: 3)
            XCTAssertEqual(drawn.largestDifference(from: expected), 0, "\(name) is not the \(kind) artwork")
            let rtl = try DrawnPixels.draw(KozmosIcon(name, size: .xl).environment(\.layoutDirection, .rightToLeft), scale: 3)
            XCTAssertEqual(drawn.largestDifference(from: rtl), 0, "\(name) mirrors right to left")
        }
    }
}
