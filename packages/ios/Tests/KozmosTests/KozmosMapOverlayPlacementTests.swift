import XCTest
import SwiftUI
@testable import Kozmos

final class KozmosMapOverlayPlacementTests: XCTestCase {
    func testLogicalPositionsMirrorWithTheInterface() {
        for direction in [LayoutDirection.leftToRight, .rightToLeft] {
            XCTAssertEqual(KozmosOverlayPosition.bottomStart.alignment(in: direction), .bottomLeading)
            XCTAssertEqual(KozmosOverlayPosition.bottomEnd.alignment(in: direction), .bottomTrailing)
            XCTAssertEqual(KozmosOverlayPosition.topStart.alignment(in: direction), .topLeading)
            XCTAssertEqual(KozmosOverlayPosition.topEnd.alignment(in: direction), .topTrailing)
        }
    }
    func testPhysicalPositionsKeepTheirNamedEdge() {
        XCTAssertEqual(KozmosOverlayPosition.bottomLeft.alignment(in: .leftToRight), .bottomLeading)
        XCTAssertEqual(KozmosOverlayPosition.bottomLeft.alignment(in: .rightToLeft), .bottomTrailing)
        XCTAssertEqual(KozmosOverlayPosition.topRight.alignment(in: .rightToLeft), .topLeading)
    }
}
