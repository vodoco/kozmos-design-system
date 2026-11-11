#if os(iOS)
import SwiftUI
import UIKit
import XCTest
@testable import Kozmos

/// PR #524's review: a section heading's name is its words and its count as
/// the locale writes a number, "POI, 3,257" in en_US, as React's and
/// Compose's are; with no count, its words alone. A heading still.
final class KozmosTreeSectionNameTests: XCTestCase {
    @MainActor func testASectionReadsItsNameAndItsCountAsTheLocaleWritesIt() async throws {
        let headings = VStack(spacing: 0) {
            KozmosTreeSectionRow(node: .section("POI", count: "3257", children: []), depth: 0, density: .default, bleed: 0)
            KozmosTreeSectionRow(node: .section("Virtual", children: []), depth: 0, density: .default, bleed: 0)
        }
        .environment(\.locale, Locale(identifier: "en_US"))
        try await inspectAccessibility(headings, size: CGSize(width: 400, height: 200)) { window in
            let elements = accessibilityElements(window)
            let labels = elements.compactMap(\.accessibilityLabel)
            let poi = try XCTUnwrap(elements.first { $0.accessibilityLabel?.hasPrefix("POI") == true },
                                    "no POI heading:\n\(describeAccessibility(window))")
            XCTAssertEqual(poi.accessibilityLabel, "POI, 3,257", "labels: \(labels)")
            XCTAssertTrue(poi.accessibilityTraits.contains(.header), "the section is no heading")
            let virtual = try XCTUnwrap(elements.first { $0.accessibilityLabel?.hasPrefix("Virtual") == true },
                                        "no Virtual heading: \(labels)")
            XCTAssertEqual(virtual.accessibilityLabel, "Virtual")
            XCTAssertTrue(virtual.accessibilityTraits.contains(.header))
        }
    }
}
#endif
