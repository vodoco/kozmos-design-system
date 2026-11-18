import SwiftUI
import XCTest
@testable import Kozmos

/// GAP-217, decision 196: a tree's selected fill is an inset pill (the
/// default, as React's `rowFill="inset"`) or a band (`.band`): no corners,
/// across the row and its bleed on both sides, over an open row's surface.
/// The shape is read apart from the drawing, so it runs on a Mac as well.
final class KozmosTreeRowFillTests: XCTestCase {
    func testTheDefaultIsTheInsetPill() {
        let tree = KozmosTree(nodes: [Node(value: "Level 1")])
        XCTAssertEqual(tree.rowFill, .inset)
    }

    func testInsetIsAPillOnTheControlRadiusInsideTheBleed() {
        let shape = KozmosTreeRowFill.inset.selectedFill(bleed: 16)
        XCTAssertEqual(shape.cornerRadius, KozmosDimensions.semanticsRadiusControl)
        XCTAssertEqual(shape.cornerRadius, 16)
        XCTAssertFalse(shape.reachesBleed)
        XCTAssertEqual(shape.outset, 0)
    }

    func testBandHasNoCornersAndRunsAcrossTheBleed() {
        let shape = KozmosTreeRowFill.band.selectedFill(bleed: 16)
        XCTAssertEqual(shape.cornerRadius, 0)
        XCTAssertTrue(shape.reachesBleed)
        XCTAssertEqual(shape.outset, 16)
        // No bleed, the band is the tree's own width, still square.
        XCTAssertEqual(KozmosTreeRowFill.band.selectedFill(bleed: 0).outset, 0)
        XCTAssertEqual(KozmosTreeRowFill.band.selectedFill(bleed: 0).cornerRadius, 0)
    }

    func testTheFocusRingFollowsTheFillsCorners() {
        XCTAssertEqual(KozmosTreeRowFill.inset.focusRingRadius, KozmosDimensions.semanticsRadiusControl)
        XCTAssertEqual(KozmosTreeRowFill.band.focusRingRadius, 0)
    }

    func testTheBandIsOverTheOpenRowsSurface() {
        // Selected, the band is the hover fill on the outer box; not
        // selected, a divided open row keeps its surface there.
        XCTAssertEqual(
            KozmosTreeRowFill.band.outerFillRole(selected: true, divided: true, open: true), .hoverFill)
        XCTAssertEqual(
            KozmosTreeRowFill.band.outerFillRole(selected: false, divided: true, open: true), .openSurface)
        XCTAssertEqual(
            KozmosTreeRowFill.inset.outerFillRole(selected: true, divided: true, open: true), .openSurface)
        XCTAssertEqual(
            KozmosTreeRowFill.band.outerFillRole(selected: true, divided: false, open: false), .hoverFill)
        XCTAssertEqual(
            KozmosTreeRowFill.inset.outerFillRole(selected: false, divided: false, open: false), .none)
    }
}
