import SwiftUI
import XCTest

@testable import Kozmos

#if os(iOS)
  import UIKit
#endif

final class KozmosStaffLanguageTests: XCTestCase {
  func testListForwardsLocalizedDisclosureAcrossSelection() {
    let item = KozmosPOIResultListItem(
      poi: KozmosPOIPresentation(id: "p", name: "Pharmacy"),
      result: KozmosPOIResultPresentation(poiId: "p", resultIndex: 1, languageNotListed: true))
    let list = KozmosPOIResultList(
      items: [item], resultCountLabel: "1 result",
      selectedPoiId: "p", onSelect: { _ in }, languageNotListedLabel: "Türkçe listelenmemiş")
    XCTAssertEqual(list.card(for: item).languageDisclosure, "Türkçe listelenmemiş")
    XCTAssertTrue(list.card(for: item).accessibilityDescription.contains("Türkçe listelenmemiş"))
  }

  #if os(iOS)
    @MainActor func testLocalizedDisclosureRendersInBothDirectionsAndThemes() async throws {
      for dark in [false, true] {
        for rtl in [false, true] {
          for disclosed in [false, true] {
            let card = KozmosPOIResultCard(
              poi: KozmosPOIPresentation(id: "p", name: "Pharmacy"),
              result: KozmosPOIResultPresentation(
                poiId: "p", resultIndex: 1, languageNotListed: disclosed),
              onSelect: { _ in },
              languageNotListedLabel: "Requested staff language is not listed for this place"
            )
            .padding(16).frame(width: 320, height: 280, alignment: .top)
            .background(KozmosColors.primitivesColorsBackground0)
            .environment(\.colorScheme, dark ? .dark : .light)
            .environment(\.layoutDirection, rtl ? .rightToLeft : .leftToRight)
            .environment(\.dynamicTypeSize, .xxxLarge)
            // This fixture contains only SwiftUI text/shapes (no logo,
            // ScrollView or UIKit-backed content). Render its display list
            // directly, avoiding partial offscreen UIKit layer captures.
            let renderer = ImageRenderer(content: card)
            renderer.scale = 3
            renderer.proposedSize = ProposedViewSize(width: 320, height: 280)
            let image = try XCTUnwrap(renderer.uiImage)
            let pixels = try RenderedPixels(image, pointWidth: 320)
            let attachment = XCTAttachment(image: pixels.image)
            attachment.name = "staff-language-\(dark)-\(rtl)-\(disclosed)"
            attachment.lifetime = .keepAlways
            add(attachment)
            let notePixels = pixels.count(in: CGRect(x: 32, y: 80, width: 256, height: 90)) {
              r, g, b in r > 50 && r < 180 && g > 50 && g < 180 && b > 50 && b < 180
            }
            if disclosed {
              XCTAssertGreaterThan(
                notePixels, 100,
                "The wrapping disclosure must actually be drawn, not an empty capture")
            } else {
              XCTAssertEqual(notePixels, 0, "No disclosure when the host does not request it")
            }
          }
        }
      }
    }
  #endif

  func testSelectionPreservesLanguageEvidenceAndSummary() {
    let result = KozmosPOIResultPresentation(
      poiId: "p", resultIndex: 1,
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
      let card = KozmosPOIResultCard(
        poi: poi, result: result,
        selectionLabel: "Choose", onSelect: { _ in })
      XCTAssertEqual(
        card.accessibilityDescription,
        flag == true ? "Choose, Language not listed" : "Choose")
    }
  }
}
