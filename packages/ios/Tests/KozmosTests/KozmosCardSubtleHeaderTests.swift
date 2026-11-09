import SwiftUI
import XCTest
@testable import Kozmos

/// CardHeader's subtle tone (CLOUD-UI-001; decisions 135 and 139) and
/// CardTitle's size (GAP-035, decision 132), as React draws them: the strip is
/// theme 0, full-bleed to the card's edges and inside its corners, at least 52
/// tall, with the content under it a card's padding below the tint; a title
/// in it is the strip's size unless it says otherwise; and the three sizes
/// step down.
///
/// Drawn without a window by `DrawnPixels`, so these run in `swift test` on a
/// Mac as well as on the simulator.
final class KozmosCardSubtleHeaderTests: XCTestCase {
    typealias Pixel = (r: UInt8, g: UInt8, b: UInt8, a: UInt8)

    private static let width: CGFloat = 300

    @MainActor private func draw(_ view: some View, in scheme: ColorScheme) throws -> DrawnPixels {
        try DrawnPixels.draw(view.frame(width: Self.width).environment(\.colorScheme, scheme), scale: 2)
    }

    @MainActor func testTheStripIsThemeZeroFullBleedAndFiftyTwoTall() throws {
        for scheme in [ColorScheme.light, .dark] {
            for padding in KozmosCardPadding.allCases {
                let card = KozmosCard(padding: padding) {
                    KozmosCardHeader(tone: .subtle) {
                        KozmosCardTitle("Add beacon")
                    }
                    KozmosCardContent {
                        Text("Name")
                    }
                }
                let drawn = try draw(card, in: scheme)
                let tint = try DrawnPixels.resolved(KozmosColors.primitivesColorsTheme0, in: scheme)
                let box = try XCTUnwrap(drawn.boundingBox(where: DrawnPixels.matches(tint, tolerance: 3)),
                                        "\(scheme), \(padding): no theme 0 strip")
                // Full-bleed: from the card's edge to its edge, under the
                // card's 1 edge, and from its top.
                XCTAssertLessThanOrEqual(box.minX, 1.5, "\(scheme), \(padding): the strip starts \(box.minX) in")
                XCTAssertGreaterThanOrEqual(box.maxX, Self.width - 1.5, "\(scheme), \(padding): the strip ends at \(box.maxX)")
                XCTAssertLessThanOrEqual(box.minY, 1.5, "\(scheme), \(padding): the strip starts \(box.minY) down")
                // A lone title's strip is the strip's least height, 52.
                XCTAssertEqual(box.height, 52, accuracy: 1.5, "\(scheme), \(padding): the strip is \(box.height) tall")
                // Inside the card's corner: the corner's own pixel is not the tint.
                let corner = drawn.pixel(at: CGPoint(x: 1, y: 1))
                XCTAssertFalse(DrawnPixels.matches(tint, tolerance: 3)(corner.r, corner.g, corner.b, corner.a),
                               "\(scheme), \(padding): the tint covers the card's corner")
                // Under the tint, the card's own surface for the card's padding.
                let below = drawn.pixel(at: CGPoint(x: Self.width / 2, y: box.maxY + padding.length / 2))
                let surface = try DrawnPixels.resolved(KozmosColors.primitivesColorsBackground0, in: scheme)
                XCTAssertTrue(DrawnPixels.matches(surface, tolerance: 3)(below.r, below.g, below.b, below.a),
                              "\(scheme), \(padding): under the strip is not the card's surface")
            }
        }
    }

    @MainActor func testTheDefaultHeaderHasNoTint() throws {
        let card = KozmosCard {
            KozmosCardHeader {
                KozmosCardTitle("Add beacon")
            }
        }
        let drawn = try draw(card, in: .light)
        let tint = try DrawnPixels.resolved(KozmosColors.primitivesColorsTheme0, in: .light)
        XCTAssertNil(drawn.boundingBox(where: DrawnPixels.matches(tint, tolerance: 3)), "a default header is tinted")
    }

    @MainActor private func titleHeight(_ view: some View) throws -> CGFloat {
        try DrawnPixels.draw(view.fixedSize().environment(\.colorScheme, .light), scale: 2).size.height
    }

    @MainActor func testTheTitleSizesStepDownAndTheStripsTitleIsTheSmallest() throws {
        let large = try titleHeight(KozmosCardTitle("Lunch nearby"))
        let explicitDefault = try titleHeight(KozmosCardTitle("Lunch nearby", size: .lg))
        let small = try titleHeight(KozmosCardTitle("Lunch nearby", size: .md))
        let smallest = try titleHeight(KozmosCardTitle("Lunch nearby", size: .sm))
        XCTAssertEqual(large, explicitDefault, "unset is not lg")
        XCTAssertGreaterThan(large, small, "md is not smaller than lg (\(large), \(small))")
        XCTAssertGreaterThan(small, smallest, "sm is not smaller than md (\(small), \(smallest))")

        // In the strip an unset title is sm, and a size given wins.
        let inStrip = try titleHeight(
            KozmosCardTitle("Lunch nearby").environment(\.kozmosCardHeaderTone, .subtle))
        let chosenInStrip = try titleHeight(
            KozmosCardTitle("Lunch nearby", size: .md).environment(\.kozmosCardHeaderTone, .subtle))
        XCTAssertEqual(inStrip, smallest, "the strip's title is not sm")
        XCTAssertEqual(chosenInStrip, small, "a size given in the strip does not win")
    }
}
