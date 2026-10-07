import SwiftUI
import XCTest
@testable import Kozmos

final class KozmosPOIResultGroupTests: XCTestCase {
    private let items = (1...3).map { index in
        KozmosPOIResultListItem(poi: KozmosPOIPresentation(id: "\(index)", name: "Bakery \(index)"),
            result: KozmosPOIResultPresentation(poiId: "\(index)", resultIndex: 1233 + index,
                featured: index == 1, badge: index == 2 ? KozmosPOIResultBadgePresentation(label: "Alternative") : nil))
    }

    func testControlledGroupPreservesOrderNumbersAndRowAppearance() {
        let collapsed = KozmosPOIResultGroup(items: items, expanded: false, numbered: true, onSelect: { _ in })
        XCTAssertEqual(collapsed.shownItems.map(\.id), ["1"])
        XCTAssertEqual(collapsed.hiddenCount, 2)
        let expanded = KozmosPOIResultGroup(items: items, expanded: true, numbered: true, onSelect: { _ in })
        XCTAssertEqual(expanded.shownItems.map(\.id), ["1", "2", "3"])
        for item in items {
            let card = expanded.card(for: item)
            XCTAssertEqual(card.appearance, .row)
            XCTAssertEqual(card.presentationStyle, .sdk)
            XCTAssertEqual(card.numberText, "\(item.result.resultIndex)")
        }
        XCTAssertTrue(expanded.card(for: items[1]).accessibilityDescription.hasPrefix("1235, Alternative, Bakery 2"))
        let single = KozmosPOIResultGroup(items: [items[0]], expanded: false, onSelect: { _ in })
        XCTAssertEqual(single.hiddenCount, 0)
    }

    #if os(iOS)
    @MainActor func testGroupRendersSquareInteriorStartsAndRoundedTabEnds() async throws {
        for direction in [LayoutDirection.leftToRight, .rightToLeft] {
            let group = KozmosPOIResultGroup(items: items, expanded: true, selectedPoiId: "3", numbered: true, onSelect: { _ in })
                .environment(\.layoutDirection, direction)
                .environment(\.colorScheme, .light)
            let drawn = try await RenderedPixels.render(group, size: CGSize(width: 320, height: 450))
            let attachment = XCTAttachment(image: drawn.image)
            attachment.name = "sdk-group-\(direction)"
            attachment.lifetime = .keepAlways
            add(attachment)
            // The selected number tab is the theme fill (decisions 55 and 59).
            let swatch = try await RenderedPixels.render(KozmosColors.componentsPrimaryButtonsThemedButtonBackgroundIdle.environment(\.colorScheme, .light), size: CGSize(width: 10, height: 10)).color(at: CGPoint(x: 5, y: 5))
            func isFill(_ r: UInt8, _ g: UInt8, _ b: UInt8) -> Bool {
                abs(Int(r) - Int(swatch.0)) + abs(Int(g) - Int(swatch.1)) + abs(Int(b) - Int(swatch.2)) < 6
            }
            let tab = try XCTUnwrap(drawn.boundingBox(in: CGRect(x: 0, y: 0, width: 320, height: 450), where: isFill))
            let start = direction == .leftToRight ? tab.minX + 2 : tab.maxX - 2
            let end = direction == .leftToRight ? tab.maxX - 2 : tab.minX + 2
            let topStart = drawn.color(at: CGPoint(x: start, y: tab.minY + 2))
            let bottomEnd = drawn.color(at: CGPoint(x: end, y: tab.maxY - 2))
            XCTAssertTrue(isFill(topStart.0, topStart.1, topStart.2), "Interior tag top-start must be square")
            XCTAssertFalse(isFill(bottomEnd.0, bottomEnd.1, bottomEnd.2), "Interior tag bottom-end must remain rounded")
        }
    }
    #endif
}
