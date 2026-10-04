import XCTest

/// Public XCUI queries and real input. These test the accessibility tree and
/// callbacks, not a claim that a person has reviewed VoiceOver speech/order.
@MainActor
final class InteractionTests: XCTestCase {
    private var app: XCUIApplication!

    override func setUpWithError() throws { continueAfterFailure = false }
    override func tearDownWithError() throws { app?.terminate() }

    func testSavedLocationActionsKeepSeparateCallbacksAndTelemetry() {
        launch("save-location-unsaved")
        let save = app.buttons["Save Location"]
        XCTAssertGreaterThanOrEqual(save.frame.height, 44)
        XCTAssertFalse(app.buttons["Guide Me"].exists)
        XCTAssertFalse(app.buttons["Edit location note"].exists)
        save.tap()
        received("save_toggled true|toggle")
        app.terminate()
        for scenario in ["save-location-saved", "save-location-large-rtl"] {
            launch(scenario)
            let remove = app.buttons["Remove Location"]
            let guide = app.buttons["Guide Me"]
            for button in [remove, guide] {
                XCTAssertGreaterThanOrEqual(button.frame.height, 44)
                XCTAssertGreaterThanOrEqual(button.frame.minX, 0)
                XCTAssertLessThanOrEqual(button.frame.maxX, app.frame.maxX)
                XCTAssertTrue(button.isHittable)
            }
            guide.tap()
            received("route_requested|route")
            remove.tap()
            received("route_requested|route|save_toggled false|toggle")
            app.buttons["Edit location note"].tap()
            received("route_requested|route|save_toggled false|toggle|edit")
            app.terminate()
        }
    }

    func testLegacyRouteSummaryKeepsEndAndStartAsSeparateCoreActions() {
        launch("legacy-route-active")
        let end = app.buttons["End route"]
        XCTAssertGreaterThanOrEqual(end.frame.width, 44)
        XCTAssertGreaterThanOrEqual(end.frame.height, 44)
        XCTAssertFalse(app.buttons["Start Navigation"].exists)
        end.tap()
        received("end")
        app.terminate()
        launch("legacy-route-preview")
        XCTAssertFalse(app.buttons["End route"].exists)
        app.buttons["Start Navigation"].tap()
        received("start")
    }

    func testComposedJourneyRequiresConfirmedArrivalAndRetainsDestination() {
        launch("navigation-journey")
        app.buttons["Continue"].tap()
        app.buttons["Deliver no route"].tap()
        XCTAssertTrue(app.staticTexts["Route unavailable"].exists)
        app.buttons["Back to route setup"].tap()
        XCTAssertTrue(app.staticTexts["Lobby"].exists)
        app.buttons["Continue"].tap()
        app.buttons["Deliver calculated route"].tap()
        app.buttons["Start navigation"].tap()
        app.buttons["Report 100 percent"].tap()
        XCTAssertFalse(app.staticTexts["You've arrived"].exists)
        app.buttons["Confirm arrival"].tap()
        XCTAssertTrue(app.staticTexts["You've arrived"].exists)
        XCTAssertFalse(app.staticTexts["Journey time"].exists)
        app.buttons["Done"].tap()
        XCTAssertTrue(app.staticTexts["Selected destination: Gallery"].exists)
        XCTAssertTrue(app.staticTexts["Done handled: 1"].exists)
    }

    func testRouteSetupBlocksUnresolvedAndPendingButAllowsCancellation() {
        for scenario in ["route-setup-pending", "route-setup-unresolved"] {
            launch(scenario)
            XCTAssertFalse(app.buttons["Weiter"].isEnabled)
            app.buttons["Schließen"].tap()
            received("close")
            app.terminate()
        }
    }

    func testRouteSetupValidContinuationIsExplicitAndFullWidth() {
        launch("route-setup-ready")
        XCTAssertTrue(app.staticTexts["Lobby → Gallery"].exists)
        let button = app.buttons["Weiter"]
        XCTAssertGreaterThan(button.frame.width, 300)
        XCTAssertGreaterThanOrEqual(button.frame.height, 44)
        button.tap()
        received("continue")
    }

    func testPopulatedComboboxKeepsItsFieldName() {
        launch("combobox-location")
        XCTAssertEqual(app.textFields["From"].value as? String, "Lobby")
        for name in ["Close options", "Clear selection"] {
            XCTAssertGreaterThanOrEqual(app.buttons[name].frame.width, 44)
            XCTAssertGreaterThanOrEqual(app.buttons[name].frame.height, 44)
        }
    }

    func testComboboxSelectionCallsTheBindingOnce() {
        launch("combobox-location")
        app.buttons["Lobby, North Terminal · Ground floor"].tap()
        received("select lobby")
        XCTAssertFalse(app.buttons["Close options"].exists)
    }

    func testPickerCommandClosesBeforeCallbackWithoutWritingQueryOrSelection() {
        launch("combobox-action")
        app.buttons["Map"].tap()
        received("open false|map false")
        XCTAssertFalse(app.buttons["Map"].exists)
        XCTAssertEqual(app.textFields["From"].value as? String, "unmatched")
    }

    func testPickerCommandDoesNotReopenWhenHostUpdatesItsQuery() {
        launch("combobox-action-updates-query")
        app.buttons["Map"].tap()
        received("open false|map false")
        XCTAssertEqual(app.textFields["From"].value as? String, "Host draft")
        XCTAssertFalse(app.buttons["Map"].exists)
    }

    func testPickerActionUsesButtonNotSelectedOptionAndHonoursDisabled() {
        launch("picker-action-disabled")
        let command = app.buttons["Map"]
        XCTAssertTrue(command.exists)
        XCTAssertFalse(command.isEnabled)
        XCTAssertFalse(command.isSelected)
        XCTAssertTrue(app.staticTexts["No matches"].exists)
        XCTAssertLessThan(app.scrollViews.firstMatch.frame.height, 256, "Short content must not fill the height cap")
        XCTAssertLessThan(app.scrollViews.firstMatch.frame.maxY - command.frame.maxY, 16, "No unused popup area after the command")
        received("none")
    }

    func testLongPickerScrollsToCommandsAndShrinksWhenResultsAreReplaced() {
        launch("picker-long")
        let popup = app.scrollViews.firstMatch
        XCTAssertTrue(popup.exists)
        XCTAssertLessThanOrEqual(popup.frame.height, 256)
        let command = app.buttons["Map"]
        for _ in 0..<12 {
            if command.isHittable { break }
            popup.swipeUp()
        }
        XCTAssertTrue(command.isHittable)
        command.tap()
        received("map")
        XCTAssertLessThan(popup.frame.height, 256)
        XCTAssertTrue(command.isHittable)
        XCTAssertTrue(app.staticTexts["No matches"].exists)
    }

    func testReadOnlyAndDisabledPickerCannotExposeActionsEvenWhenForcedOpen() {
        for scenario in ["combobox-locked-readonly", "combobox-locked-disabled"] {
            launch(scenario)
            XCTAssertTrue(app.textFields["From"].exists)
            XCTAssertFalse(app.textFields["From"].isEnabled)
            XCTAssertTrue(app.buttons["Open options"].exists)
            XCTAssertFalse(app.buttons["Open options"].isEnabled)
            XCTAssertFalse(app.buttons["Map"].exists)
            XCTAssertFalse(app.buttons["Lobby"].exists)
            received("none")
            app.terminate()
        }
    }

    func testCurrentPositionRequiresUsableHostIdentityAndSurvivesSuggestionError() {
        for scenario in ["route-current", "route-current-large-rtl", "route-current-missing", "route-current-disabled", "route-current-blank"] {
            launch(scenario)
            XCTAssertFalse(app.buttons["Current position"].exists)
            app.buttons["Open options"].tap()
            XCTAssertEqual(app.staticTexts.matching(identifier: "Locations are unavailable").count, 1)
            if scenario == "route-current-large-rtl" {
                XCTAssertGreaterThan(app.staticTexts["Locations are unavailable"].frame.height,
                    app.textFields["From"].frame.height, "The long large-type status must wrap, not truncate to one line")
            }
            if scenario == "route-current" || scenario == "route-current-large-rtl" {
                let action = app.buttons["Current position"]
                assertEndpointAccessibilityHeight(action)
                XCTAssertGreaterThanOrEqual(action.frame.minX, 0)
                XCTAssertLessThanOrEqual(action.frame.maxX, app.frame.width)
                let preview = XCTAttachment(screenshot: app.screenshot())
                preview.name = "native-route-picker-\(scenario)"
                preview.lifetime = .keepAlways
                add(preview)
                action.tap()
                received("select blue-dot")
                XCTAssertTrue(app.staticTexts["Host position"].exists)
            } else {
                XCTAssertFalse(app.buttons["Current position"].exists)
                received("none")
            }
            app.terminate()
        }
    }

    func testRouteLocationResolvesAndClearsIdentitySeparatelyFromQuery() {
        launch("route-location")
        let field = app.textFields["From"]
        XCTAssertEqual(field.value as? String, "Lobby")
        received("none")
        field.tap()
        field.typeText(" ")
        received("none")
        app.buttons["Lobby, North Terminal · Ground floor"].tap()
        received("select lobby")
        XCTAssertFalse(field.exists)
        XCTAssertTrue(app.staticTexts["North Terminal · Ground floor"].exists)
        let clear = app.buttons["Clear origin"]
        XCTAssertGreaterThanOrEqual(clear.frame.width, 44)
        assertEndpointAccessibilityHeight(clear)
        XCTAssertEqual(clear.frame.midY,
            (app.staticTexts["From"].frame.minY + app.staticTexts["North Terminal · Ground floor"].frame.maxY) / 2,
            accuracy: 1, "The endpoint action is centered across label and location, not the label row")
        clear.tap()
        received("select lobby|clear")
        XCTAssertTrue(field.exists)
        XCTAssertFalse(app.buttons["Choose on map"].exists)
        app.buttons["Open options"].tap()
        app.buttons["Choose on map"].tap()
        received("select lobby|clear|map")
    }

    func testRouteLocationLoadingDoesNotOfferStaleSuggestions() {
        launch("route-location-loading")
        app.buttons["Open options"].tap()
        XCTAssertFalse(app.buttons["Lobby"].exists)
        XCTAssertTrue(app.textFields["From"].isEnabled)
        app.buttons["Choose on map"].tap()
        received("map")
    }

    func testRouteLocationChangeAndCancelPreserveIdentityWithoutClear() {
        for scenario in ["route-location-edit", "route-location-edit-rtl", "route-location-edit-large"] {
            launch(scenario)
            let change = app.buttons["Ändern From"]
            assertEndpointAccessibilityHeight(change)
            XCTAssertGreaterThanOrEqual(change.frame.minX, 0)
            XCTAssertLessThanOrEqual(change.frame.maxX, app.frame.width)
            XCTAssertEqual(change.frame.midY,
                (app.staticTexts["From"].frame.minY + app.staticTexts["North Terminal · Ground floor"].frame.maxY) / 2,
                accuracy: 1)
            change.tap()
            received("edit")
            XCTAssertTrue(app.textFields["From"].exists)
            app.buttons["Abbrechen"].tap()
            received("edit|cancel")
            XCTAssertTrue(app.staticTexts["North Terminal · Ground floor"].exists)
            app.terminate()
        }
        launch("route-location-edit-disabled")
        XCTAssertFalse(app.buttons["Ändern From"].isEnabled)
        received("none")
    }

    private func assertEndpointAccessibilityHeight(_ button: XCUIElement) {
        // AX rounds a centered frame's edges to physical pixels (e.g. 43 2/3pt
        // for a 44pt allocated button on the pinned 3x simulator). The separate
        // KozmosButtonContentTests layout probe requires >=44pt with NO tolerance.
        let screenshot = app.screenshot().image
        let pixelsPerPoint = screenshot.size.width * screenshot.scale / app.frame.width
        XCTAssertGreaterThanOrEqual(button.frame.height + 1 / pixelsPerPoint, 44)
    }

    func testHostFilteredRouteLocationSelectsSynonymButLoadingAndLocalDoNot() {
        for scenario in ["route-synonym-local", "route-synonym-loading", "route-synonym-host"] {
            launch(scenario)
            app.buttons["Open options"].tap()
            let result = app.buttons["Elevator, Ground floor"]
            if scenario == "route-synonym-host" {
                XCTAssertTrue(result.exists)
                result.tap()
                received("select e1")
                XCTAssertFalse(app.textFields["From"].exists)
            } else {
                XCTAssertFalse(result.exists)
                XCTAssertTrue(app.textFields["From"].isEnabled)
            }
            app.terminate()
        }
    }

    func testResultGroupExpansionPreservesSelectionAndSeparateActions() {
        launch("result-group")
        XCTAssertFalse(app.buttons["1, Gate 12, Level 1"].exists)
        app.buttons["Show 1 more"].tap()
        let row = app.buttons["1, Gate 12, Level 1"]
        XCTAssertTrue(row.waitForExistence(timeout: 3))
        row.tap()
        app.buttons["Go"].tap()
        received("expanded true|select gate/12|navigate gate/12")
        app.buttons["Hide"].tap()
        XCTAssertFalse(row.exists)
        app.buttons["Show 1 more"].tap()
        XCTAssertTrue(row.isSelected)
        XCTAssertTrue(app.buttons["Details"].exists)
        received("expanded true|select gate/12|navigate gate/12|expanded false|expanded true")
    }

    private func launch(_ scenario: String) {
        app = XCUIApplication()
        app.launchArguments = [scenario]
        app.launch()
        XCTAssertTrue(app.staticTexts["received-events"].waitForExistence(timeout: 5))
    }

    func testResultCornerTagIsInsideTheSelectionHitArea() {
        launch("result-group")
        let group = app.descendants(matching: .any).matching(identifier: "result-group-container").firstMatch
        XCTAssertTrue(group.waitForExistence(timeout: 3))
        group.coordinate(withNormalizedOffset: .zero).withOffset(CGVector(dx: 20, dy: 10)).tap()
        received("select cafe")
    }

    private func received(_ value: String, file: StaticString = #filePath, line: UInt = #line) {
        let predicate = NSPredicate(format: "label == %@", value)
        let result = XCTWaiter.wait(for: [XCTNSPredicateExpectation(predicate: predicate,
                                                                   object: app.staticTexts["received-events"])], timeout: 3)
        XCTAssertEqual(result, .completed, "callbacks: \(app.staticTexts["received-events"].label)", file: file, line: line)
    }

    func testMapControlRegionsHaveNamesAndKeepChildActions() {
        launch("map-control-regions")
        for name in ["Map controls", "Map corner controls"] {
            XCTAssertTrue(app.otherElements[name].exists, name)
        }
        app.buttons["Locate"].tap()
        app.buttons["Language"].tap()
        app.buttons["Zoom"].tap()
        received("locate|language|zoom")
        func inspect(_ expected: String) {
            app.buttons["Inspect control accessibility"].tap()
            XCTAssertEqual(app.staticTexts["control-accessibility-report"].label, expected)
        }
        let visible = "Language|Locate|Map controls|Map corner controls|Zoom"
        inspect(visible)
        app.buttons["Toggle map size"].tap()
        inspect("no controls")
        for name in ["Locate", "Language", "Zoom"] { XCTAssertFalse(app.buttons[name].isHittable, name) }
        app.buttons["Toggle map size"].tap()
        inspect(visible)
        app.buttons["Zoom"].tap()
        received("locate|language|zoom|zoom")
    }

    func testMapControlRegionNamesCanBeLocalized() {
        launch("map-control-regions-localized")
        XCTAssertTrue(app.otherElements["Kartensteuerung"].exists)
        XCTAssertTrue(app.otherElements["Weitere Kartensteuerung"].exists)
        XCTAssertFalse(app.otherElements["Map controls"].exists)
        app.buttons["Zoom"].tap()
        received("zoom")
    }

    func testAbsentMapControlsDoNotCreateEmptyContainers() {
        launch("map-control-regions-empty")
        XCTAssertFalse(app.otherElements["Map controls"].exists)
        XCTAssertFalse(app.otherElements["Map corner controls"].exists)
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

    func testExpandedManoeuvreKeepsItsNameAndChildControls() {
        launch("manoeuvre-custom")
        let card = app.otherElements["Navigation en cours"]
        XCTAssertTrue(card.exists, "the expanded card lost its localized container name")
        XCTAssertTrue(card.staticTexts["Continue to the gate"].exists)
        let close = card.buttons["Masquer le trajet"]
        XCTAssertTrue(close.isHittable)
        close.tap()
        received("toggle")
        XCTAssertTrue(card.exists, "the closed card lost its name")
        XCTAssertFalse(card.staticTexts["Continue to the gate"].exists)
        // XCUI exposes the accessibility-focused instruction as a button
        // containing a button with the same label. Target the card's direct
        // control, not an arbitrary first descendant with that name.
        let instruction = card.children(matching: .button).matching(identifier: "Turn right")
        XCTAssertEqual(instruction.count, 1)
        instruction.element.tap()
        received("toggle|toggle")
        XCTAssertTrue(card.staticTexts["Continue to the gate"].exists)
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
