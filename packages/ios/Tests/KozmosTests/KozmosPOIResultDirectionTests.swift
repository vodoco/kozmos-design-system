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
/// The proof draws the card three ways. Each reference starts with the
/// card's own direction mark (LRM or RLM), which fixes the paragraph's
/// direction to the card's, so its lines start at the card's start, and
/// then wraps the words in a Unicode isolate, which fixes the words' own
/// direction inside it. A card drawn with the plain words must match the
/// reference whose isolate has the words' direction, and not the other
/// one: the second check shows the comparison can tell the two apart.
final class KozmosPOIResultDirectionTests: XCTestCase {
  private let leftToRightIsolate = "\u{2066}"
  private let rightToLeftIsolate = "\u{2067}"
  private let popIsolate = "\u{2069}"
  private let leftToRightMark = "\u{200E}"
  private let rightToLeftMark = "\u{200F}"

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

  /// How far two drawings of one card may differ and still be one drawing:
  /// a level in a channel. Two renders in one process are not always bit for
  /// bit alike: on a Mac on 2026-10-07 the plain card and its reference
  /// anti-aliased the corners and a grey line one level apart (54 pixels),
  /// and passed once the same card had been drawn earlier in the process;
  /// words drawn in the other direction differ by 232.
  private static let renderNoise = 2

  /// The largest difference, in any channel of any pixel, between two
  /// drawings; the most there is when their sizes differ.
  private func largestDifference(_ a: Data, _ b: Data) -> Int {
    guard a.count == b.count else { return 255 }
    return zip(a, b).reduce(0) { max($0, abs(Int($1.0) - Int($1.1))) }
  }

  /// The card drawn with [name] and [summary] as given, then each in a
  /// paragraph of the card's direction, wrapped in an isolate of each
  /// direction.
  @MainActor private func drawn(
    name: String, summary: String, category: String, direction: LayoutDirection
  ) throws -> (plain: Data, leftToRight: Data, rightToLeft: Data) {
    let mark = direction == .rightToLeft ? rightToLeftMark : leftToRightMark
    func wrapped(_ isolate: String) throws -> Data {
      try pixels(
        name: mark + isolate + name + popIsolate, summary: mark + isolate + summary + popIsolate,
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
    XCTAssertLessThanOrEqual(largestDifference(card.plain, card.rightToLeft), Self.renderNoise,
                             "drawn right to left, from the card's start")
    XCTAssertGreaterThan(largestDifference(card.plain, card.leftToRight), Self.renderNoise,
                         "the comparison cannot tell the two apart")
  }

  @MainActor func testLatinWordsInARightToLeftCardRunLeftToRightFromItsStart() throws {
    let card = try drawn(
      name: "Costa Coffee (B)",
      summary: "The quietest of the three lounges, beside gate B, before security (level 2).",
      category: "مقهى", direction: .rightToLeft)
    XCTAssertLessThanOrEqual(largestDifference(card.plain, card.leftToRight), Self.renderNoise,
                             "drawn left to right, from the card's start")
    XCTAssertGreaterThan(largestDifference(card.plain, card.rightToLeft), Self.renderNoise,
                         "the comparison cannot tell the two apart")
  }
}
