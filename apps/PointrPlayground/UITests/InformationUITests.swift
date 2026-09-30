import XCTest
import UIKit

/// Live Design-QA integration; intentionally outside the offline unit scheme.
final class InformationUITests: XCTestCase {
    func testInformationCoversMapAndPreservesSelectedPlace() throws {
        continueAfterFailure = false
        let originalOrientation = XCUIDevice.shared.orientation
        if UIDevice.current.userInterfaceIdiom == .pad { XCUIDevice.shared.orientation = .landscapeLeft }
        defer { XCUIDevice.shared.orientation = originalOrientation }
        let app = XCUIApplication()
        app.launch()
        let wide = app.frame.width >= 1104
        let info = app.buttons["Map information"]
        XCTAssertTrue(info.waitForExistence(timeout: 120), "No Kozmos Info control on the live map")
        let field = app.textFields.firstMatch
        XCTAssertTrue(field.waitForExistence(timeout: 30))
        if wide {
            let browse = app.descendants(matching: .any).matching(identifier: "search-sheet").firstMatch
            XCTAssertTrue(browse.waitForExistence(timeout: 10))
            XCTAssertLessThan(browse.frame.height, app.frame.height - 120, "Initial wide browse panel must fit its categories")
            XCTAssertEqual(field.frame.minY - browse.frame.minY, field.frame.minX - browse.frame.minX,
                           accuracy: 2, "Search top padding must match its side padding")
        }
        field.tap()
        field.typeText("a")
        let results = app.descendants(matching: .any).matching(identifier: "Points of interest").firstMatch
        XCTAssertTrue(results.waitForExistence(timeout: 30))
        let row = results.buttons.firstMatch
        XCTAssertTrue(row.waitForExistence(timeout: 30), "No live POI result")
        row.tap()
        let details = app.buttons["Close details"]
        XCTAssertTrue(details.waitForExistence(timeout: 10))
        let before = app.staticTexts.allElementsBoundByIndex.map(\.label)
        // The SDK's UIView boundary is the resize contract. Its map accessibility
        // child can report a zero frame while the SDK updates visible map features.
        let sdkMap = app.otherElements["map-widget-map-view"]
        XCTAssertTrue(sdkMap.waitForExistence(timeout: 10))
        // Selecting a cross-floor POI animates the SDK view. Existence can
        // precede a usable accessibility frame; wait for geometry, not time.
        let sized = expectation(for: NSPredicate { _, _ in sdkMap.frame.width > 0 }, evaluatedWith: sdkMap)
        wait(for: [sized], timeout: 10)
        let mapWidth = sdkMap.frame.width
        info.tap()
        let close = app.buttons["Close information"]
        XCTAssertTrue(close.waitForExistence(timeout: 5))
        if wide {
            XCTAssertTrue(details.isHittable, "Wide Info must leave the POI card usable")
            XCTAssertGreaterThan(app.staticTexts["About this QA map"].frame.minX, app.frame.width - 384)
            let resized = expectation(for: NSPredicate { _, _ in
                abs(sdkMap.frame.width - (mapWidth - 384)) <= 2
            }, evaluatedWith: sdkMap)
            wait(for: [resized], timeout: 10)
        } else {
            XCTAssertFalse(details.isHittable, "Info must isolate the underlying POI card")
        }
        XCTAssertLessThanOrEqual(close.frame.maxX, app.frame.maxX)
        XCTAssertGreaterThanOrEqual(close.frame.minY, app.frame.minY)
        XCTAssertTrue(app.staticTexts["About this QA map"].exists)
        let faq = app.buttons["Will closing information reset the map?"]
        XCTAssertTrue(faq.exists)
        faq.tap()
        XCTAssertTrue(app.staticTexts["No. Your selected place, search, floor and route remain in this session."].waitForExistence(timeout: 3))
        let image = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        image.name = wide ? "Live SDK — side information" : "Live SDK — full-screen information"
        image.lifetime = .keepAlways
        add(image)
        close.tap()
        XCTAssertTrue(details.waitForExistence(timeout: 5), "Info dismissal discarded the POI")
        XCTAssertTrue(details.isHittable)
        XCTAssertTrue(Set(before).isSubset(of: Set(app.staticTexts.allElementsBoundByIndex.map(\.label))), "POI content changed after Info")
        details.tap()
        XCTAssertTrue(field.waitForExistence(timeout: 5))
        XCTAssertEqual(field.value as? String, "a", "Info reset the search query")
    }
}
