import XCTest
@testable import Kozmos

/// GAP-267, decision 201: the widths SwiftUI gives SegmentedControl's options
/// follow the rule React's flexbox lays them out by, as Compose's do.
final class KozmosSegmentWidthsTests: XCTestCase {
    func testWithRoomEachIsItsMinimumOrItsWords() {
        XCTAssertEqual(kozmosSegmentWidths(words: [50, 60, 130], minimum: 97, available: 400, share: false), [97, 97, 130])
        XCTAssertEqual(kozmosSegmentWidths(words: [50, 60, 130], minimum: 97, available: nil, share: false), [97, 97, 130])
    }

    func testShortOfRoomTheyGiveUpWidthEquallyFromEqualWidthsNeverPastTheirWords() {
        // 27 short: the two at 97 give up 13.5 each; the third is at its words.
        XCTAssertEqual(kozmosSegmentWidths(words: [50, 60, 130], minimum: 97, available: 297, share: false), [83.5, 83.5, 130])
        // 64 short: the second stops at its words, 70, and the first gives up the rest.
        XCTAssertEqual(kozmosSegmentWidths(words: [50, 70, 130], minimum: 97, available: 260, share: false), [60, 70, 130])
    }

    func testPastTheirWordsEachKeepsItsWords() {
        XCTAssertEqual(kozmosSegmentWidths(words: [50, 70, 130], minimum: 97, available: 100, share: false), [50, 70, 130])
    }

    func testFullWidthSharesTheSpaceNoneUnderItsWords() {
        XCTAssertEqual(kozmosSegmentWidths(words: [50, 60, 70], minimum: 0, available: 300, share: true), [100, 100, 100])
        XCTAssertEqual(kozmosSegmentWidths(words: [50, 60, 130], minimum: 0, available: 300, share: true), [85, 85, 130])
        XCTAssertEqual(kozmosSegmentWidths(words: [50, 60, 130], minimum: 0, available: 200, share: true), [50, 60, 130])
    }
}
