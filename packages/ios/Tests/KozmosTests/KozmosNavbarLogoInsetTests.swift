import SwiftUI
import XCTest
@testable import Kozmos

/// GAP-208, decisions 147 and 150: `logoInset` sets the logo in a column as wide
/// as KozmosSidebar's rail, from the bar's edge. Over a rail at the leading edge,
/// the logo sits over the rail's items, and a 424 block after it ends where a 440
/// panel beside the rail does: at 536. Read as drawn in a 700 bar, in points.
final class KozmosNavbarLogoInsetTests: XCTestCase {
    private func isRed(_ r: UInt8, _ g: UInt8, _ b: UInt8, _ a: UInt8) -> Bool { r > 200 && g < 60 && b < 60 && a > 200 }
    private func isBlue(_ r: UInt8, _ g: UInt8, _ b: UInt8, _ a: UInt8) -> Bool { b > 200 && r < 60 && g < 60 && a > 200 }

    private func bar(logoInset: Bool, direction: LayoutDirection = .leftToRight) -> some View {
        KozmosNavbar(
            logoInset: logoInset,
            logo: { Color(red: 1, green: 0, blue: 0).frame(width: 24, height: 24) },
            context: { Color(red: 0, green: 0, blue: 1).frame(width: 424, height: 24) },
            navigation: { EmptyView() },
            primaryAction: { EmptyView() },
            actions: { EmptyView() },
            utilities: { EmptyView() },
            account: { EmptyView() }
        )
        .frame(width: 700)
        .environment(\.layoutDirection, direction)
    }

    @MainActor func testTheLogoIsCentredInAColumnFromTheBarsEdgeAndTheBlockEndsWhereThePanelDoes() throws {
        let drawn = try DrawnPixels.draw(bar(logoInset: true), scale: 1)
        let logo = try XCTUnwrap(drawn.boundingBox(where: isRed), "no logo drawn")
        let site = try XCTUnwrap(drawn.boundingBox(where: isBlue), "no block drawn")
        XCTAssertEqual(logo.midX, 48, accuracy: 0.5, "the logo's centre")
        XCTAssertEqual(site.minX, 112, accuracy: 0.5, "what follows starts 16 past the column")
        XCTAssertEqual(site.maxX, 536, accuracy: 0.5, "a 424 block ends with a 96 rail and a 440 panel")
    }

    @MainActor func testTheColumnIsTheRail() throws {
        let rail = KozmosSidebar(variant: .rail) { EmptyView() }.frame(width: 700, height: 200)
        let drawnRail = try XCTUnwrap(try DrawnPixels.draw(rail, scale: 1).boundingBox { _, _, _, a in a > 200 }, "no rail drawn")
        let site = try XCTUnwrap(try DrawnPixels.draw(bar(logoInset: true), scale: 1).boundingBox(where: isBlue), "no block drawn")
        XCTAssertEqual(site.minX - 16, drawnRail.width, accuracy: 0.5, "the column, from the block's start less its 16 gap")
    }

    @MainActor func testRightToLeftTheColumnMirrors() throws {
        let drawn = try DrawnPixels.draw(bar(logoInset: true, direction: .rightToLeft), scale: 1)
        let logo = try XCTUnwrap(drawn.boundingBox(where: isRed), "no logo drawn")
        let site = try XCTUnwrap(drawn.boundingBox(where: isBlue), "no block drawn")
        XCTAssertEqual(700 - logo.midX, 48, accuracy: 0.5, "the logo's centre, from the bar's right")
        XCTAssertEqual(700 - site.minX, 536, accuracy: 0.5, "the block's end, from the bar's right")
    }

    @MainActor func testWithoutItTheLogoSitsAtTheBarsPadding() throws {
        let drawn = try DrawnPixels.draw(bar(logoInset: false), scale: 1)
        let logo = try XCTUnwrap(drawn.boundingBox(where: isRed), "no logo drawn")
        let site = try XCTUnwrap(drawn.boundingBox(where: isBlue), "no block drawn")
        XCTAssertEqual(logo.minX, 16, accuracy: 0.5, "the logo's start")
        XCTAssertEqual(site.minX, 56, accuracy: 0.5, "what follows, 16 after the logo")
    }
}
