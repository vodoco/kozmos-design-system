import SwiftUI
import XCTest
@testable import Kozmos

/// GAP-169, decision 134: CardHeader's `actions`, as React's. What acts on the
/// card sits at the header's trailing end, 16 after the title and description,
/// which keep the room before it; the actions are centred on the title's line,
/// 24 at the default text size, so a 44 icon button makes the header no
/// taller. Right to left they are at the left. Read as drawn in a 360 card, in
/// points.
final class KozmosCardHeaderActionsTests: XCTestCase {
    private func isRed(_ r: UInt8, _ g: UInt8, _ b: UInt8, _ a: UInt8) -> Bool { r > 200 && g < 60 && b < 60 && a > 200 }
    private func isBlue(_ r: UInt8, _ g: UInt8, _ b: UInt8, _ a: UInt8) -> Bool { b > 200 && r < 60 && g < 60 && a > 200 }

    /// A card whose header holds a block that takes all the room it is given,
    /// with a 44 action, or none.
    private func card(actions: Bool, padding: KozmosCardPadding = .default, direction: LayoutDirection = .leftToRight) -> some View {
        let text = { Color(red: 0, green: 0, blue: 1).frame(maxWidth: .infinity, minHeight: 24, maxHeight: 24) }
        return KozmosCard(padding: padding) {
            if actions {
                KozmosCardHeader(content: text) {
                    Color(red: 1, green: 0, blue: 0).frame(width: 44, height: 44)
                }
            } else {
                KozmosCardHeader(content: text)
            }
            KozmosCardContent { Color.clear.frame(height: 40) }
        }
        .frame(width: 360)
        .environment(\.layoutDirection, direction)
    }

    @MainActor func testTheActionsSitAtTheEndCentredOnTheTitlesLine() throws {
        for (padding, inset) in [(KozmosCardPadding.default, CGFloat(24)), (.compact, 16)] {
            let drawn = try DrawnPixels.draw(card(actions: true, padding: padding), scale: 1)
            let action = try XCTUnwrap(drawn.boundingBox(where: isRed), "\(padding): no action drawn")
            let text = try XCTUnwrap(drawn.boundingBox(where: isBlue), "\(padding): no title drawn")
            XCTAssertEqual(action.maxX, 360 - inset, accuracy: 0.5, "\(padding): at the header's end")
            XCTAssertEqual(action.midY, inset + 12, accuracy: 0.5, "\(padding): centred on the title's 24 line")
            XCTAssertEqual(text.maxX, action.minX - 16, accuracy: 0.5, "\(padding): the title keeps the room before it")
            XCTAssertEqual(text.minX, inset, accuracy: 0.5, "\(padding): the title starts where it did")
        }
    }

    @MainActor func testAnIconButtonMakesTheHeaderNoTaller() throws {
        let with = try DrawnPixels.draw(card(actions: true), scale: 1)
        let without = try DrawnPixels.draw(card(actions: false), scale: 1)
        XCTAssertEqual(with.size.height, without.size.height, accuracy: 0.5)
        XCTAssertEqual(try XCTUnwrap(with.boundingBox(where: isBlue)).minY,
                       try XCTUnwrap(without.boundingBox(where: isBlue)).minY, accuracy: 0.5, "the title moved")
    }

    @MainActor func testRightToLeftTheActionsAreAtTheLeft() throws {
        let drawn = try DrawnPixels.draw(card(actions: true, direction: .rightToLeft), scale: 1)
        let action = try XCTUnwrap(drawn.boundingBox(where: isRed), "no action drawn")
        let text = try XCTUnwrap(drawn.boundingBox(where: isBlue), "no title drawn")
        XCTAssertEqual(action.minX, 24, accuracy: 0.5)
        XCTAssertEqual(text.minX, action.maxX + 16, accuracy: 0.5)
    }
}
