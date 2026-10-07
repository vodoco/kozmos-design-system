import SwiftUI
import XCTest

@testable import Kozmos

/// GAP-125. On the web and in Compose, a right-to-left language's name or
/// summary in a left-to-right card took the card's direction: its full stop
/// fell at the words' right and a clamped summary's ellipsis on the wrong
/// side. Those cards now give each text its own words' direction while its
/// lines start at the card's start. This proves SwiftUI's Text already does
/// both, with no layout-direction override.
///
/// The proof draws the card three ways. Unicode's isolates set a run's
/// direction whatever the paragraph's is: inside a right-to-left isolate
/// the words are drawn right to left, and the paragraph around it keeps the
/// card's direction, so the lines start at the card's start. A card drawn
/// with the plain words must match the isolate whose direction the words
/// have, and not the other one: the second check shows the comparison can
/// tell the two apart.
final class KozmosPOIResultDirectionTests: XCTestCase {
  private let leftToRightIsolate = "\u{2066}"
  private let rightToLeftIsolate = "\u{2067}"
  private let popIsolate = "\u{2069}"

  @MainActor private func pixels(
    name: String, summary: String, category: String, direction: LayoutDirection
  ) throws -> Data {
    let card = KozmosPOIResultCard(
      poi: KozmosPOIPresentation(
        id: "p", name: name, categoryLabel: category, floorLabel: "2"),
      result: KozmosPOIResultPresentation(poiId: "p", resultIndex: 1, summary: summary),
      onSelect: { _ in })
    let renderer = ImageRenderer(
      content: card.frame(width: 320).environment(\.layoutDirection, direction))
    renderer.scale = 2
    let image = try XCTUnwrap(renderer.cgImage, "the card was not drawn")
    return try XCTUnwrap(image.dataProvider?.data) as Data
  }

  /// The card drawn with [name] and [summary] as given, then each wrapped in
  /// an isolate of each direction.
  @MainActor private func drawn(
    name: String, summary: String, category: String, direction: LayoutDirection
  ) throws -> (plain: Data, leftToRight: Data, rightToLeft: Data) {
    func wrapped(_ isolate: String) throws -> Data {
      try pixels(
        name: isolate + name + popIsolate, summary: isolate + summary + popIsolate,
        category: category, direction: direction)
    }
    return (
      try pixels(name: name, summary: summary, category: category, direction: direction),
      try wrapped(leftToRightIsolate), try wrapped(rightToLeftIsolate)
    )
  }

  @MainActor func testArabicAndHebrewWordsInALeftToRightCardRunRightToLeftFromItsStart() throws {
    // Two lines of summary at 320, so the second line's start shows the
    // alignment as well as the direction.
    let card = try drawn(
      name: "صيدلية المطار.",
      summary: "הכי שקטה מבין שלוש הטרקלינים, ליד שער ב׳, לפני הבידוק הביטחוני.",
      category: "Pharmacy", direction: .leftToRight)
    XCTAssertEqual(card.plain, card.rightToLeft, "drawn right to left, from the card's start")
    XCTAssertNotEqual(card.plain, card.leftToRight, "the comparison cannot tell the two apart")
  }

  @MainActor func testLatinWordsInARightToLeftCardRunLeftToRightFromItsStart() throws {
    let card = try drawn(
      name: "Costa Coffee (B)",
      summary: "The quietest of the three lounges, beside gate B, before security (level 2).",
      category: "مقهى", direction: .rightToLeft)
    XCTAssertEqual(card.plain, card.leftToRight, "drawn left to right, from the card's start")
    XCTAssertNotEqual(card.plain, card.rightToLeft, "the comparison cannot tell the two apart")
  }
}
