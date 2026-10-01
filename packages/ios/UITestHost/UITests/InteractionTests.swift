import XCTest

/// Public XCUI queries and real input. These test the accessibility tree and
/// callbacks, not a claim that a person has reviewed VoiceOver speech/order.
@MainActor
final class InteractionTests: XCTestCase {
    private var app: XCUIApplication!

    override func setUpWithError() throws { continueAfterFailure = false }
    override func tearDownWithError() throws { app?.terminate() }

    private func launch(_ scenario: String) {
        app = XCUIApplication()
        app.launchArguments = [scenario]
        app.launch()
        XCTAssertTrue(app.staticTexts["received-events"].waitForExistence(timeout: 5))
    }

    private func received(_ value: String, file: StaticString = #filePath, line: UInt = #line) {
        let predicate = NSPredicate(format: "label == %@", value)
        let result = XCTWaiter.wait(for: [XCTNSPredicateExpectation(predicate: predicate,
                                                                   object: app.staticTexts["received-events"])], timeout: 3)
        XCTAssertEqual(result, .completed, "callbacks: \(app.staticTexts["received-events"].label)", file: file, line: line)
    }

    func testResultActionsHaveAtLeast44PointTargets() {
        launch("result-action-targets")
        for name in ["Go", "Details", "Order ahead"] {
            let target = app.buttons[name]
            XCTAssertGreaterThanOrEqual(target.frame.height, 44, name)
            XCTAssertGreaterThanOrEqual(target.frame.width, 44, name)
        }
        XCTAssertFalse(app.buttons["Order ahead"].isEnabled)
        // Tap inside the padded top edge, not just the text at its centre.
        app.buttons["Go"].coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.05)).tap()
        received("navigate cafe")
        app.buttons["Details"].tap()
        received("navigate cafe|details cafe")
    }

    func testResultActionTargetsGrowForDynamicType() {
        launch("result-action-targets-large")
        for name in ["Go", "Details", "Order ahead"] {
            XCTAssertGreaterThan(app.buttons[name].frame.height, 44, name)
        }
    }

    func testAnInteractiveChipIsAButtonThatSaysWhetherItIsSelected() {
        launch("traits")
        XCTAssertTrue(app.buttons["Vegan"].isSelected)
        XCTAssertTrue(app.buttons["Halal"].exists)
        XCTAssertFalse(app.buttons["Halal"].isSelected)
        XCTAssertTrue(app.staticTexts["Step-free"].exists)
        XCTAssertFalse(app.buttons["Step-free"].exists)
        received("none")
    }

    func testTheSelectionFollowsTheParentsState() {
        launch("toggle")
        XCTAssertFalse(app.buttons["Vegan"].isSelected)
        app.buttons["Vegan"].tap()
        received("Vegan")
        XCTAssertTrue(app.buttons["Vegan"].isSelected)
        app.buttons["Vegan"].tap()
        received("Vegan|Vegan")
        XCTAssertFalse(app.buttons["Vegan"].isSelected)
    }

    func testASelectedPinSaysSoWhetherOrNotItCanBePressed() {
        launch("pin-traits")
        for (label, selected, pressable) in [
            ("Selected static", true, false), ("Selected disabled", true, false),
            ("Selected action", true, true), ("Rest action", false, true), ("Rest static", false, false)
        ] {
            let name = "\(label), 2"
            let pin = app.descendants(matching: .any).matching(NSPredicate(format: "label == %@", name)).firstMatch
            XCTAssertTrue(pin.exists, name)
            XCTAssertEqual(pin.isSelected, selected, name)
            if pressable { XCTAssertTrue(app.buttons[name].exists) }
        }
    }

    func testRemoveIsItsOwnButtonAndTheChipsDoubleTapIsTheChips() {
        launch("remove")
        XCTAssertTrue(app.buttons["Coffee"].isSelected)
        app.buttons["Coffee"].tap()
        received("Coffee")
        XCTAssertFalse(app.buttons["Remove Coffee"].isSelected)
        app.buttons["Remove Coffee"].tap()
        received("Coffee|remove Coffee")
        XCTAssertFalse(app.buttons["Open now"].exists)
        XCTAssertTrue(app.staticTexts["Open now"].exists)
        app.buttons["Remove Open now"].tap()
        received("Coffee|remove Coffee|remove Open now")
    }

    func testTheDocsExampleSaysWhichCategoryIsSelected() {
        launch("chip-docs")
        XCTAssertTrue(app.buttons["All"].isSelected)
        app.buttons["Coffee"].tap()
        XCTAssertTrue(app.buttons["Coffee"].isSelected)
        XCTAssertFalse(app.buttons["All"].isSelected)
        XCTAssertFalse(app.buttons["Open now"].exists)
        app.buttons["Remove Open now"].tap()
        XCTAssertFalse(app.staticTexts["Open now"].exists)
    }

    func testTheRemoveLabelCanBeLocalizedInBothInitializers() {
        launch("localized-remove")
        app.buttons["Kaffee"].tap()
        received("Kaffee")
        app.buttons["Kaffee entfernen"].tap()
        app.buttons["Tee entfernen"].tap()
        received("Kaffee|remove Kaffee|remove Tee")
        XCTAssertFalse(app.buttons["Remove Kaffee"].exists)
        XCTAssertFalse(app.buttons["Remove Tee"].exists)
        XCTAssertFalse(app.buttons["Milch entfernen"].isEnabled)
        app.buttons["Milch entfernen"].tap()
        received("Kaffee|remove Kaffee|remove Tee")
    }

    func testADisabledChipIsHeardAsDimmedAndRunsNothing() {
        launch("disabled-chip")
        XCTAssertTrue(app.buttons["Vegan"].isSelected)
        for label in ["Vegan", "Remove Vegan", "Halal"] {
            XCTAssertFalse(app.buttons[label].isEnabled)
            app.buttons[label].tap()
        }
        XCTAssertFalse(app.buttons["Halal"].isSelected)
        received("none")
    }

    func testAnActionPressedInTheListReachesTheApp() {
        launch("list-full")
        app.buttons["Go"].tap()
        received("navigate gate/12")
        app.buttons["Details"].tap()
        received("navigate gate/12|details gate/12")
    }

    func testTheDocsExampleReachesTheApp() {
        launch("list-docs")
        app.buttons["Go"].tap()
        received("navigate gate/12")
    }

    func testTheShortInitialiserHandsActionsOnToo() {
        launch("list-short")
        app.buttons["Go"].tap()
        received("navigate cafe")
    }

    func testTheActionsKeepTheProductsWords() {
        launch("list-localized")
        let group = app.otherElements["Aktionen für dieses Ergebnis"]
        XCTAssertTrue(group.exists)
        XCTAssertTrue(group.buttons["Los"].exists)
        group.buttons["Einzelheiten"].tap()
        received("details gate/12")
    }

    func testADisabledActionAndAnUnavailableResultStayInert() {
        launch("list-disabled")
        app.buttons["Go"].tap()
        XCTAssertFalse(app.buttons["Share"].isEnabled)
        app.buttons["Share"].tap()
        received("navigate cafe")
        app.terminate()
        launch("list-unavailable")
        XCTAssertFalse(app.buttons["Go"].exists)
        let row = app.buttons["poi-result-gate%2F12"]
        XCTAssertTrue(row.exists)
        XCTAssertFalse(row.isEnabled)
        row.tap()
        received("none")
    }

    func testWithoutAHandlerTheActionsAreDrawnDisabled() {
        launch("no-handler")
        for label in ["Go", "Details"] {
            XCTAssertTrue(app.buttons[label].exists)
            XCTAssertFalse(app.buttons[label].isEnabled)
            app.buttons[label].tap()
        }
        received("none")
    }

    func testOpeningOnTheLastPhotoReportsNoChange() {
        launch("gallery-last")
        XCTAssertTrue(app.staticTexts["Image 3 of 3"].waitForExistence(timeout: 5))
        XCTAssertFalse(app.buttons["Next image"].isEnabled)
        received("none")
    }

    func testAControlledGalleryReportsOnlyTheChangeTheVisitorAskedFor() {
        launch("gallery-controlled")
        XCTAssertTrue(app.staticTexts["Image 2 of 3"].waitForExistence(timeout: 5))
        received("none")
        app.buttons["Next image"].tap()
        XCTAssertTrue(app.staticTexts["Image 3 of 3"].waitForExistence(timeout: 5))
        received("index 2")
    }

    func testReplacingThePhotosReportsNoChange() {
        launch("gallery-replace")
        XCTAssertTrue(app.staticTexts["Image 3 of 3"].waitForExistence(timeout: 5))
        app.buttons["Replace the photos"].tap()
        XCTAssertTrue(app.staticTexts["Image 2 of 2"].waitForExistence(timeout: 5))
        received("none")
    }

    func testAParentIndexChangeReportsNothingAndTheNextButtonStillWorks() {
        launch("gallery-controlled")
        XCTAssertTrue(app.staticTexts["Image 2 of 3"].waitForExistence(timeout: 5))
        app.buttons["Choose first photo"].tap()
        XCTAssertTrue(app.staticTexts["Image 1 of 3"].waitForExistence(timeout: 5))
        received("none")
        app.buttons["Next image"].tap()
        received("index 1")
        XCTAssertTrue(app.staticTexts["Image 2 of 3"].exists)
    }

    func testAUserScrollAfterInitialAlignmentStillReportsAChange() {
        launch("gallery-last")
        XCTAssertTrue(app.staticTexts["Image 3 of 3"].waitForExistence(timeout: 5))
        app.scrollViews.firstMatch.swipeRight()
        let changed = NSPredicate(format: "label != %@", "none")
        XCTAssertEqual(XCTWaiter.wait(for: [XCTNSPredicateExpectation(predicate: changed,
                             object: app.staticTexts["received-events"])], timeout: 5), .completed)
        XCTAssertFalse(app.staticTexts["Image 3 of 3"].exists)
    }

    func testAControlledParentMayRefuseARequestedIndex() {
        launch("gallery-refused")
        app.buttons["Next image"].tap()
        received("index 1")
        XCTAssertTrue(app.staticTexts["Image 1 of 3"].exists)
        XCTAssertFalse(app.buttons["Previous image"].isEnabled)
    }
}
