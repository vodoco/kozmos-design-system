import SwiftUI
import XCTest
@testable import Kozmos

/// PR #524: a count given as a number is drawn grouped as the app's language
/// writes it, on a row's pill and a section heading's: 13031 is "13,031" in
/// en_US and "13.031" in de_DE. A count given as text is drawn as given.
final class KozmosTreeCountFormatTests: XCTestCase {
    private static let english = Locale(identifier: "en_US")
    private static let german = Locale(identifier: "de_DE")

    func testANumericCountIsGroupedAsTheLocaleWritesIt() {
        let row = Node(value: "Level 1", count: 13_031)
        let section = Node.section("POI", count: 13_031, children: [])
        for node in [row, section] {
            XCTAssertEqual(node.displayedCount(Self.english), "13,031")
            XCTAssertEqual(node.displayedCount(Self.german), "13.031")
        }
    }

    func testATextCountIsShownAsGiven() {
        for text in ["13031", "1.2k", "12+"] {
            XCTAssertEqual(Node(value: "Level 1", count: text).displayedCount(Self.german), text)
            XCTAssertEqual(Node.section("POI", count: text, children: []).displayedCount(Self.english), text)
        }
        XCTAssertNil(Node(value: "Level 1").displayedCount(Self.english))
    }

    #if os(iOS)
    /// What the pill draws, read back from the drawn rows: a row's pill
    /// (its words joined into the row's) and a section heading's pill, in
    /// en_US and de_DE; a text count in German as given.
    @MainActor func testTheDrawnPillAndHeadingShowTheGroupedCount() async throws {
        for (locale, shown) in [(Self.english, "13,031"), (Self.german, "13.031")] {
            let rows = VStack(spacing: 0) {
                KozmosTreeDividedRow(node: Node(value: "Level 1", children: [], count: 13_031), depth: 0, isParent: true,
                                     open: false, density: .default, bleed: 0, divided: false) {}
                KozmosTreeSectionRow(node: .section("POI", count: 13_031, children: []), depth: 0, density: .default, bleed: 0)
                KozmosTreeCount(node: Node(value: "Pill", count: 13_031))
                KozmosTreeDividedRow(node: Node(value: "Structural", count: "1.2k"), depth: 0, isParent: false,
                                     open: false, density: .default, bleed: 0, divided: false) {}
            }
            .environment(\.locale, locale)
            try await inspectAccessibility(rows, size: CGSize(width: 400, height: 300)) { window in
                let labels = accessibilityElements(window).compactMap(\.accessibilityLabel)
                XCTAssertTrue(labels.contains { $0.contains("Level 1") && $0.contains(shown) },
                              "\(locale.identifier): the row's pill is not \(shown): \(labels)")
                XCTAssertTrue(labels.contains("POI, \(shown)"), "\(locale.identifier): the heading is not \(shown): \(labels)")
                XCTAssertTrue(labels.contains(shown), "\(locale.identifier): the pill is not \(shown): \(labels)")
                XCTAssertTrue(labels.contains { $0.contains("Structural") && $0.contains("1.2k") },
                              "\(locale.identifier): a text count was not shown as given: \(labels)")
            }
        }
    }
    #endif
}
