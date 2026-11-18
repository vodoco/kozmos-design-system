import XCTest
import SwiftUI
@testable import Kozmos

/// GAP-245: `inset` puts 8 between the bar's top line and its items, so a
/// selected tile's fill clears the line, as React's `inset` does. Without
/// it the bar is drawn as it was, its tiles 4 below the line. The selected
/// tile is found by its fill, the muted background/100, and the bar's top
/// by its line.
final class KozmosBottomNavigationInsetTests: XCTestCase {
    @MainActor private func gap(inset: Bool?) throws -> (tile: CGRect, bar: CGRect) {
        let items: [(icon: String, title: String)] = [(icon: "house", title: "Home"), (icon: "map", title: "Maps")]
        let bar: AnyView = inset.map {
            AnyView(KozmosBottomNavigation(selection: .constant(0), items: items, inset: $0))
        } ?? AnyView(KozmosBottomNavigation(selection: .constant(0), items: items))
        let drawn = try DrawnPixels.draw(bar.frame(width: 390).environment(\.colorScheme, .light))
        let fill = try DrawnPixels.resolved(KozmosColors.primitivesColorsBackground100, in: .light)
        let tile = try XCTUnwrap(drawn.boundingBox(where: DrawnPixels.matches(fill, tolerance: 2)), "no selected tile")
        let whole = try XCTUnwrap(drawn.boundingBox(where: { _, _, _, a in a > 200 }), "no bar")
        return (tile, whole)
    }

    @MainActor func testWithoutInsetTheTilesSitFourBelowTheLineAsBefore() throws {
        let drawn = try gap(inset: nil)
        XCTAssertEqual(drawn.tile.minY - drawn.bar.minY, KozmosDimensions.primitivesLayoutSpacing50, accuracy: 0.5,
                       "tile \(drawn.tile) in bar \(drawn.bar)")
        let off = try gap(inset: false)
        XCTAssertEqual(off.bar.height, drawn.bar.height, accuracy: 0.5, "inset false draws the bar as before")
    }

    @MainActor func testInsetPutsEightBetweenTheLineAndTheSelectedTile() throws {
        let plain = try gap(inset: false)
        let inset = try gap(inset: true)
        XCTAssertEqual(inset.tile.minY - inset.bar.minY, KozmosDimensions.primitivesLayoutSpacing100, accuracy: 0.5,
                       "tile \(inset.tile) in bar \(inset.bar)")
        XCTAssertEqual(inset.tile.height, plain.tile.height, accuracy: 0.5, "the tile keeps its size")
        // Only the top grows, from 4 to 8; the bottom keeps its 4.
        XCTAssertEqual(inset.bar.height - plain.bar.height, 4, accuracy: 0.5)
    }
}
