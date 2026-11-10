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

    // GAP-035, CLOUD-UI-001: the line follows the title's size, and the
    // subtle strip's own 28 line, as React's CSS does.

    /// A card whose header holds a title of `size`, in `tone`, with a 44
    /// action or none.
    private func titled(_ size: KozmosCardTitleSize?, tone: KozmosCardHeaderTone = .default, actions: Bool = true,
                        description: Bool = false) -> some View {
        KozmosCard {
            if actions {
                KozmosCardHeader(tone: tone) {
                    KozmosCardTitle("Site", size: size)
                    if description { KozmosCardDescription("Edit the site's details") }
                } actions: {
                    Color(red: 1, green: 0, blue: 0).frame(width: 44, height: 44)
                }
            } else {
                KozmosCardHeader(tone: tone) {
                    KozmosCardTitle("Site", size: size)
                    if description { KozmosCardDescription("Edit the site's details") }
                }
            }
            KozmosCardContent { Color.clear.frame(height: 40) }
        }
        .frame(width: 360)
    }

    @MainActor func testTheActionsAreCentredOnTheLineOfTheTitlesSize() throws {
        // Each size's text style's line at the default text size: .title3
        // 24, .headline 20, .subheadline 18, below the card's 24 padding.
        for (size, line) in [(KozmosCardTitleSize?.none, CGFloat(24)), (.lg, 24), (.md, 20), (.sm, 18)] {
            let drawn = try DrawnPixels.draw(titled(size), scale: 1)
            let action = try XCTUnwrap(drawn.boundingBox(where: isRed), "\(String(describing: size)): no action drawn")
            XCTAssertEqual(action.midY, 24 + line / 2, accuracy: 0.5, "\(String(describing: size)): centred on its \(line) line")
            XCTAssertEqual(drawn.size.height, try DrawnPixels.draw(titled(size, actions: false), scale: 1).size.height,
                           accuracy: 0.5, "\(String(describing: size)): the action made the header taller")
        }
    }

    @MainActor func testTheSubtleStripCentresItsActionsOnItsTwentyEightLine() throws {
        // The strip is 12 + 28 + 12: a 44 action spills into the 12 above
        // and below, centred in the strip, which stays 52, as a lone title's.
        // With a description the strip grows, and the action stays centred
        // in it with the words, as React's strip centres both.
        for description in [false, true] {
            for size in [KozmosCardTitleSize?.none, .lg, .md, .sm] {
                let name = "\(String(describing: size))\(description ? " with a description" : "")"
                let drawn = try DrawnPixels.draw(titled(size, tone: .subtle, description: description), scale: 1)
                let action = try XCTUnwrap(drawn.boundingBox(where: isRed), "\(name): no action drawn")
                let alone = try DrawnPixels.draw(titled(size, tone: .subtle, actions: false, description: description), scale: 1)
                XCTAssertEqual(drawn.size.height, alone.size.height, accuracy: 0.5, "\(name): the action made the strip taller")
                // Below the strip: its own 24, the content's 40 and its 24.
                let strip = drawn.size.height - 24 - 40 - 24
                if !description && (size == nil || size == .sm) {
                    XCTAssertEqual(strip, 52, accuracy: 0.5, "\(name): the strip is 52")
                }
                if description {
                    XCTAssertGreaterThan(strip, 52, "\(name): the strip grows with its words")
                }
                XCTAssertEqual(action.midY, strip / 2, accuracy: 0.5, "\(name): centred in the strip")
                XCTAssertEqual(action.maxX, 360 - 24, accuracy: 0.5, "\(name): at the strip's end")
            }
        }
    }
}
