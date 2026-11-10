import SwiftUI
import XCTest
@testable import Kozmos

/// GAP-196, decision 134: `navigationAlign` places the navigation in the room
/// between the leading slots and the trailing ones, as React's does. In a 700
/// bar with a 24 logo and a 40 account, that room runs from 56 (16 of padding,
/// the logo, 16) to 628 (16 before the account, which ends 16 from the edge),
/// and a 100 navigation sits at its start, its middle or its end. Read as
/// drawn, in points.
final class KozmosNavbarNavigationAlignTests: XCTestCase {
    private func isRed(_ r: UInt8, _ g: UInt8, _ b: UInt8, _ a: UInt8) -> Bool { r > 200 && g < 60 && b < 60 && a > 200 }
    private func isBlue(_ r: UInt8, _ g: UInt8, _ b: UInt8, _ a: UInt8) -> Bool { b > 200 && r < 60 && g < 60 && a > 200 }

    private func bar(_ align: KozmosNavbarNavigationAlign?, direction: LayoutDirection = .leftToRight) -> some View {
        let navigation = { Color(red: 0, green: 0, blue: 1).frame(width: 100, height: 24) }
        let logo = { Color(red: 1, green: 0, blue: 0).frame(width: 24, height: 24) }
        let account = { Color(red: 0, green: 1, blue: 0).frame(width: 40, height: 24) }
        return Group {
            if let align {
                KozmosNavbar(
                    navigationAlign: align,
                    logo: logo, context: { EmptyView() }, navigation: navigation,
                    primaryAction: { EmptyView() }, actions: { EmptyView() },
                    utilities: { EmptyView() }, account: account
                )
            } else {
                // The call every product makes today, with no alignment.
                KozmosNavbar(
                    logo: logo, context: { EmptyView() }, navigation: navigation,
                    primaryAction: { EmptyView() }, actions: { EmptyView() },
                    utilities: { EmptyView() }, account: account
                )
            }
        }
        .frame(width: 700)
        .environment(\.layoutDirection, direction)
    }

    @MainActor private func navigation(_ align: KozmosNavbarNavigationAlign?, direction: LayoutDirection = .leftToRight) throws -> CGRect {
        try XCTUnwrap(try DrawnPixels.draw(bar(align, direction: direction), scale: 1).boundingBox(where: isBlue), "no navigation drawn")
    }

    @MainActor func testStartSetsTheNavigationRightAfterTheLeadingSlots() throws {
        let drawn = try navigation(.start)
        XCTAssertEqual(drawn.minX, 56, accuracy: 0.5, "16 after the logo")
    }

    @MainActor func testCenterCentresItInTheRoomAndIsTheDefault() throws {
        XCTAssertEqual(try navigation(.center).midX, 342, accuracy: 0.5, "the middle of 56 to 628")
        XCTAssertEqual(try navigation(nil).midX, 342, accuracy: 0.5, "with no alignment given")
    }

    @MainActor func testEndSetsItBesideTheTrailingSlots() throws {
        XCTAssertEqual(try navigation(.end).maxX, 628, accuracy: 0.5, "16 before the account")
    }

    @MainActor func testRightToLeftStartAndEndMirror() throws {
        XCTAssertEqual(700 - (try navigation(.start, direction: .rightToLeft)).maxX, 56, accuracy: 0.5,
                       "start, from the bar's right")
        XCTAssertEqual(700 - (try navigation(.end, direction: .rightToLeft)).minX, 628, accuracy: 0.5,
                       "end, from the bar's right")
        let logo = try XCTUnwrap(try DrawnPixels.draw(bar(.end, direction: .rightToLeft), scale: 1).boundingBox(where: isRed))
        XCTAssertEqual(700 - logo.maxX, 16, accuracy: 0.5, "the logo stays at the leading edge")
    }
}
