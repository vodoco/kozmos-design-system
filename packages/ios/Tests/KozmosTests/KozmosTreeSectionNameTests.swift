#if os(iOS)
import SwiftUI
import UIKit
import XCTest
@testable import Kozmos

/// PR #524's review: a section heading's name is its words and its count as
/// the heading draws it: a number as the locale writes it, "POI, 3,257" in
/// en_US; text as given, "Interior asset, 13031", as React's is; with no
/// count, its words alone. A heading still.
final class KozmosTreeSectionNameTests: XCTestCase {
    @MainActor func testASectionReadsItsNameAndItsCountAsTheLocaleWritesIt() async throws {
        let headings = VStack(spacing: 0) {
            KozmosTreeSectionRow(node: .section("POI", count: 3257, children: []), depth: 0, density: .default, bleed: 0)
            KozmosTreeSectionRow(node: .section("Interior asset", count: "13031", children: []), depth: 0, density: .default,
                                 bleed: 0)
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
            // A count given as text is read as given, as it is drawn.
            let interior = try XCTUnwrap(elements.first { $0.accessibilityLabel?.hasPrefix("Interior asset") == true },
                                         "no Interior asset heading: \(labels)")
            XCTAssertEqual(interior.accessibilityLabel, "Interior asset, 13031")
            XCTAssertTrue(virtual.accessibilityTraits.contains(.header))
        }
    }
}
#endif
