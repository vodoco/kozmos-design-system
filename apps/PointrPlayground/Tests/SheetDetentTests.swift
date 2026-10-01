import XCTest
import Kozmos
@testable import KozmosPointrQA

/// The sheet across places and routes, fed the way the session and the
/// visitor move it: a selection and a phase from the session, a detent from a
/// drag.
final class SheetDetentTests: XCTestCase {
    private func browsing(_ id: String?) -> SDKSheetDetents.Input { .init(selection: id, phase: .browse) }
    private func settingUp(_ id: String) -> SDKSheetDetents.Input { .init(selection: id, phase: .routeSetup) }
    private func navigating(_ id: String) -> SDKSheetDetents.Input { .init(selection: id, phase: .directions) }

    private func sheet(restingAt detent: KozmosMapPanelDetent) -> SDKSheetDetents {
        var sheet = SDKSheetDetents()
        sheet.detent = detent
        return sheet
    }

    func testClosingAPlaceReturnsTheSearchSheetWhereItWas() {
        var sheet = sheet(restingAt: .collapsed)
        sheet.update(browsing("A"))
        XCTAssertEqual(sheet.detent, .medium, "a place opens at half height")
        sheet.update(browsing(nil))
        XCTAssertEqual(sheet.detent, .collapsed)
    }

    /// The review's trace: collapsed, A, B, close.
    func testAPlaceReplacingAnotherKeepsTheSearchSheetsReturn() {
        var sheet = sheet(restingAt: .collapsed)
        sheet.update(browsing("A"))
        sheet.update(browsing("B"))
        XCTAssertEqual(sheet.detent, .medium, "B's card opens at half height")
        sheet.update(browsing(nil))
        XCTAssertEqual(sheet.detent, .collapsed, "closing B returned to A's height, not the search sheet's")
    }

    func testFromALargeSearchSheetAPlaceReplacingAnotherReturnsToLarge() {
        var sheet = sheet(restingAt: .large)
        sheet.update(browsing("A"))
        sheet.update(browsing("B"))
        sheet.update(browsing(nil))
        XCTAssertEqual(sheet.detent, .large)
    }

    /// Dragging the card is the card's own: the search sheet returns where it was.
    func testDraggingTheCardLeavesTheSearchSheetsReturnAlone() {
        var sheet = sheet(restingAt: .collapsed)
        sheet.update(browsing("A"))
        sheet.detent = .large
        sheet.update(browsing(nil))
        XCTAssertEqual(sheet.detent, .collapsed)
    }

    /// A, Go, back: the card returns where it was, not to the search sheet's height.
    func testCancellingRouteSetupReturnsTheCardWhereItWas() {
        var sheet = sheet(restingAt: .collapsed)
        sheet.update(browsing("A"))
        sheet.update(settingUp("A"))
        XCTAssertEqual(sheet.detent, .medium, "the starting-point picker opens at half height")
        sheet.update(browsing("A"))
        XCTAssertEqual(sheet.detent, .medium, "the card came back at the search sheet's height")
        sheet.update(browsing(nil))
        XCTAssertEqual(sheet.detent, .collapsed)
    }

    /// A, read at large, Go, directions, Finish, close.
    func testFinishingARouteReturnsTheCardWhereItWas() {
        var sheet = sheet(restingAt: .collapsed)
        sheet.update(browsing("A"))
        sheet.detent = .large
        sheet.update(settingUp("A"))
        sheet.update(navigating("A"))
        XCTAssertEqual(sheet.detent, .content, "the directions rest fitted to their summary")
        sheet.update(browsing("A"))
        XCTAssertEqual(sheet.detent, .large, "the card did not come back where it was read")
        sheet.update(browsing(nil))
        XCTAssertEqual(sheet.detent, .collapsed)
    }

    /// Another place tapped on the map mid-route ends the route and opens its
    /// card: the selection and the phase change together.
    func testAPlaceTappedMidRouteOpensAtHalfHeightAndKeepsTheSearchSheetsReturn() {
        var sheet = sheet(restingAt: .collapsed)
        sheet.update(browsing("A"))
        sheet.update(settingUp("A"))
        sheet.update(navigating("A"))
        sheet.update(browsing("B"))
        XCTAssertEqual(sheet.detent, .medium)
        sheet.update(browsing(nil))
        XCTAssertEqual(sheet.detent, .collapsed)
    }

    /// Choosing a level mid-route closes the place.
    func testALevelChosenMidRouteReturnsTheSearchSheetWhereItWas() {
        var sheet = sheet(restingAt: .large)
        sheet.update(browsing("A"))
        sheet.update(settingUp("A"))
        sheet.update(navigating("A"))
        sheet.update(browsing(nil))
        XCTAssertEqual(sheet.detent, .large)
    }
}
