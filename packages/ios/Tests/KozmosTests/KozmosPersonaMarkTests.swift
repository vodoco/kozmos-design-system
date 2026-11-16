import XCTest
import SwiftUI
#if os(iOS)
import UIKit
#endif
@testable import Kozmos

/// `KozmosPersonaMark` and `KozmosPersonaMarkGroup` (GAP-106): a persona's
/// colour as a diamond, decoration beside its name, an image standing alone,
/// and a row's personas as one image read by their names.
final class KozmosPersonaMarkTests: XCTestCase {
    private let personas = [
        KozmosPersonaMarkPersona(name: "Customer", color: .orange),
        KozmosPersonaMarkPersona(name: "Visitor", color: .blue),
        KozmosPersonaMarkPersona(name: "Staff", color: .green),
    ]

    func testTheGroupIsReadByItsLabelAndEveryName() {
        XCTAssertEqual(KozmosPersonaMarkGroup(personas).spokenLabel, "Assigned personas: Customer, Visitor, Staff")
        XCTAssertEqual(
            KozmosPersonaMarkGroup(personas, label: "Zugewiesene Personas").spokenLabel,
            "Zugewiesene Personas: Customer, Visitor, Staff"
        )
    }

    /// The diamond's points are on the box's edge midpoints.
    func testTheShapeIsADiamond() {
        let path = KozmosDiamondShape().path(in: CGRect(x: 0, y: 0, width: 12, height: 12))
        XCTAssertTrue(path.contains(CGPoint(x: 6, y: 6)))
        XCTAssertTrue(path.contains(CGPoint(x: 6, y: 0.5)))
        XCTAssertTrue(path.contains(CGPoint(x: 11.5, y: 6)))
        XCTAssertFalse(path.contains(CGPoint(x: 1, y: 1)), "a corner of the box is outside the diamond")
        XCTAssertFalse(path.contains(CGPoint(x: 11, y: 11)))
        XCTAssertEqual(path.boundingRect, CGRect(x: 0, y: 0, width: 12, height: 12))
    }

    #if os(iOS)
    @MainActor func testBesideItsNameTheMarkIsHiddenAndTheNameReadOnce() async throws {
        try await MenusAXTree.inspect(PersonaRow()) { window in
            XCTAssertEqual(
                MenusAXTree.elements(window).map { $0.accessibilityLabel ?? "-" }, ["Customer"],
                "the tree:\n\(MenusAXTree.describe(window))"
            )
        }
    }

    @MainActor func testStandingAloneTheMarkIsAnImageNamedByThePersona() async throws {
        try await MenusAXTree.inspect(KozmosPersonaMark(color: .blue, name: "Visitor")) { window in
            let found = MenusAXTree.elements(window)
            XCTAssertEqual(found.map { $0.accessibilityLabel ?? "-" }, ["Visitor"], "the tree:\n\(MenusAXTree.describe(window))")
            XCTAssertTrue(found.first?.accessibilityTraits.contains(.image) == true)
        }
    }

    @MainActor func testTheGroupIsOneImage() async throws {
        try await MenusAXTree.inspect(KozmosPersonaMarkGroup(personas)) { window in
            let found = MenusAXTree.elements(window)
            XCTAssertEqual(
                found.map { $0.accessibilityLabel ?? "-" }, ["Assigned personas: Customer, Visitor, Staff"],
                "the tree:\n\(MenusAXTree.describe(window))"
            )
            XCTAssertTrue(found.first?.accessibilityTraits.contains(.image) == true)
        }
    }

    /// React's 12 by 12; a group's marks 2 apart: 3 × 12 + 2 × 2.
    @MainActor func testTheMarkIs12SquareAndTheGroupsMarks2Apart() {
        let mark = UIHostingController(rootView: KozmosPersonaMark(color: .orange))
            .sizeThatFits(in: CGSize(width: 400, height: 400))
        XCTAssertEqual(mark.width, 12, accuracy: 0.5)
        XCTAssertEqual(mark.height, 12, accuracy: 0.5)
        let group = UIHostingController(rootView: KozmosPersonaMarkGroup(personas))
            .sizeThatFits(in: CGSize(width: 400, height: 400))
        XCTAssertEqual(group.width, 40, accuracy: 0.5)
        XCTAssertEqual(group.height, 12, accuracy: 0.5)
    }

    @MainActor func testAGroupWithNoPersonaDrawsNothing() {
        let size = UIHostingController(rootView: KozmosPersonaMarkGroup([]))
            .sizeThatFits(in: CGSize(width: 400, height: 400))
        XCTAssertEqual(size, .zero)
    }
    #endif
}
