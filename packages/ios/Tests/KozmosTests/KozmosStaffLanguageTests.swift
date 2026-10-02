import SwiftUI
import XCTest
@testable import Kozmos

final class KozmosStaffLanguageTests: XCTestCase {
    func testListForwardsLocalizedDisclosureAcrossSelection() {
        let item = KozmosPOIResultListItem(poi: KozmosPOIPresentation(id: "p", name: "Pharmacy"),
            result: KozmosPOIResultPresentation(poiId: "p", resultIndex: 1, languageNotListed: true))
        let list = KozmosPOIResultList(items: [item], resultCountLabel: "1 result",
            selectedPoiId: "p", onSelect: { _ in }, languageNotListedLabel: "Türkçe listelenmemiş")
        XCTAssertEqual(list.card(for: item).languageDisclosure, "Türkçe listelenmemiş")
        XCTAssertTrue(list.card(for: item).accessibilityDescription.contains("Türkçe listelenmemiş"))
    }

    #if os(iOS)
    @MainActor func testLocalizedDisclosureRendersInBothDirectionsAndThemes() async throws {
        for dark in [false, true] {
            for rtl in [false, true] {
                let card = KozmosPOIResultCard(
                    poi: KozmosPOIPresentation(id: "p", name: "Pharmacy"),
                    result: KozmosPOIResultPresentation(poiId: "p", resultIndex: 1, languageNotListed: true),
                    onSelect: { _ in }, languageNotListedLabel: "Requested staff language is not listed for this place")
                    .padding(16).frame(width: 320, height: 280, alignment: .top)
                    .background(KozmosColors.primitivesColorsBackground0)
                    .environment(\.colorScheme, dark ? .dark : .light)
                    .environment(\.layoutDirection, rtl ? .rightToLeft : .leftToRight)
                    .environment(\.dynamicTypeSize, .xxxLarge)
                let pixels = try await RenderedPixels.render(card, size: CGSize(width: 320, height: 280))
                let attachment = XCTAttachment(image: pixels.image)
                attachment.name = "staff-language-\(dark)-\(rtl)"
                attachment.lifetime = .keepAlways
                add(attachment)
                XCTAssertGreaterThan(pixels.width, 0)
            }
        }
    }
    #endif

    func testSelectionPreservesLanguageEvidenceAndSummary() {
        let result = KozmosPOIResultPresentation(poiId: "p", resultIndex: 1,
            summary: "A pharmacy", languageNotListed: true)
        let selected = result.selecting("p")
        XCTAssertEqual(selected.languageNotListed, true)
        XCTAssertEqual(selected.summary, "A pharmacy")
        XCTAssertTrue(selected.selected)
        XCTAssertNil(KozmosPOIResultPresentation(poiId: "p", resultIndex: 1).languageNotListed)
    }

    func testDisclosureSurvivesCustomSelectionName() {
        let poi = KozmosPOIPresentation(id: "p", name: "Pharmacy")
        for flag in [true, false, nil] as [Bool?] {
            let result = KozmosPOIResultPresentation(poiId: "p", resultIndex: 1, languageNotListed: flag)
            let card = KozmosPOIResultCard(poi: poi, result: result,
                selectionLabel: "Choose", onSelect: { _ in })
            XCTAssertEqual(card.accessibilityDescription,
                flag == true ? "Choose, Language not listed" : "Choose")
        }
    }
}
