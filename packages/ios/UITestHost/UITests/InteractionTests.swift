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
            // The pencil is a target at least 44pt square, all of it hittable, as
            // React's icon Button (44px) and Compose's IconButton (48dp) are. The tap
            // lands 18pt left of and above its centre, inside the target. At the
            // default text size that is well off the 13.7pt glyph, so a pencil with no
            // content shape misses it (seen to fail). At accessibility3 the glyph grows
            // to about 31pt and the tap can land on it, so there the size check is
            // what proves the target.
            let edit = app.buttons["Edit location note"]
            assertTouchTarget(edit)
            XCTAssertGreaterThanOrEqual(edit.frame.minX, 0)
            XCTAssertLessThanOrEqual(edit.frame.maxX, app.frame.maxX)
            edit.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).withOffset(CGVector(dx: -18, dy: -18)).tap()
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

    func testComboboxCaptionIsHeardOnceAsTheFieldsName() {
        launch("combobox-caption")
        XCTAssertEqual(app.textFields["From"].value as? String, "Lobby")
        app.buttons["Inspect field accessibility"].tap()
        // VoiceOver said "From", then "From, text field": the caption is the field's name, not an element.
        XCTAssertEqual(app.staticTexts["field-accessibility-report"].label, "Lobby")
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

    func testPickerCommandOpenedFromTheChevronLeavesTheKeyboardDown() {
        launch("combobox-action-closed")
        let field = app.textFields["From"]
        XCTAssertFalse(hasKeyboardFocus(field))
        app.buttons["Open options"].tap()
        app.buttons["Map"].tap()
        received("map")
        XCTAssertFalse(app.buttons["Map"].exists)
        XCTAssertFalse(hasKeyboardFocus(field), "A command must not focus a field the visitor had not focused")
        XCTAssertFalse(app.keyboards.firstMatch.waitForExistence(timeout: 1), "No keyboard over the map the host shows next")
        XCTAssertEqual(app.keyboards.count, 0)
    }

    func testPickerCommandHandsFocusBackToAFieldThatHadIt() {
        launch("combobox-action-closed")
        let field = app.textFields["From"]
        field.tap()
        field.typeText("x")
        XCTAssertTrue(hasKeyboardFocus(field))
        app.buttons["Map"].tap()
        received("map")
        XCTAssertFalse(app.buttons["Map"].exists)
        XCTAssertTrue(hasKeyboardFocus(field), "The visitor was typing: the field keeps its focus")
    }

    /// XCUI's own snapshot attribute; XCUIElement has no public accessor for it.
    private func hasKeyboardFocus(_ element: XCUIElement) -> Bool {
        (element.value(forKey: "hasKeyboardFocus") as? Bool) ?? false
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
        // Replacing a long list updates the measured ScrollView height on a
        // later layout pass. Wait for the command's actual hit area to settle,
        // independently of the synchronous callback report above.
        XCTAssertTrue(command.wait(for: \.isHittable, toEqual: true, timeout: 3))
        XCTAssertLessThan(popup.frame.height, 256)
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

    /// At least 44 × 44pt, within one physical pixel, as `assertEndpointAccessibilityHeight`
    /// allows for AX's rounding of a frame's edges: the card's pencil sits on third-point
    /// positions and reads 43.99999 tall. Unfixed, it read 13.7 wide.
    private func assertTouchTarget(_ element: XCUIElement, file: StaticString = #filePath, line: UInt = #line) {
        let screenshot = app.screenshot().image
        let pixel = app.frame.width / (screenshot.size.width * screenshot.scale)
        XCTAssertGreaterThanOrEqual(element.frame.width + pixel, 44, "width", file: file, line: line)
        XCTAssertGreaterThanOrEqual(element.frame.height + pixel, 44, "height", file: file, line: line)
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

    /// What a press draws, read off the screen while the finger is down: a
    /// filled part draws its own emotion's pressed token (decision 59), not
    /// SwiftUI's highlight over the idle fill, which lightened a danger
    /// button's #B01736 to #EFD1D7. The light theme's values: since decision
    /// 60 each emotion presses two steps along its own ramp, away from the
    /// page (danger 900, informative 900, the neutral's background 400).
    /// The parts are drawn with "received-events", which `launch` waited for,
    /// so each is looked up once rather than polled.
    func testAPressDrawsEachFillsOwnPressedToken() {
        launch("press-feedback")
        let pressed = [
            "themed": "#0D44C2", "danger": "#670E20", "success": "#0F4C2D", "neutral": "#9095A2",
            "informative": "#154761", "alert": "#472F02", "icon": "#0D44C2", "icon-danger": "#670E20",
            "fab": "#0D44C2", "map-filled-on": "#0D44C2",
        ]
        for id in pressed.keys.sorted() {
            let part = app.buttons["part-\(id)"]
            XCTAssertTrue(part.exists, id)
            part.press(forDuration: 1)
        }
        for (id, want) in pressed.sorted(by: { $0.key < $1.key }) {
            let sample = Self.sample(app, id)
            XCTAssertTrue(Self.near(sample.press, want), "\(id): a press drew \(sample.press), not \(want) (at rest \(sample.rest))")
        }
    }

    /// A filled map control that is off is drawn on the page's surface, and
    /// a press dims it as the plain style does, the style every map control
    /// had until the filled one drew its own press: the same colour on its
    /// mark as the tinted control's, under the same press.
    func testAFilledMapControlThatIsOffDimsUnderAPressAsAPlainOneDoes() {
        launch("press-feedback")
        for id in ["map-tinted-off", "map-filled-off"] {
            let part = app.buttons["part-\(id)"]
            XCTAssertTrue(part.exists, id)
            part.press(forDuration: 1)
        }
        let plain = Self.sample(app, "map-tinted-off")
        let filled = Self.sample(app, "map-filled-off")
        XCTAssertFalse(Self.near(plain.press, plain.rest), "the plain control did not dim: \(plain)")
        XCTAssertTrue(Self.near(filled.rest, plain.rest), "the two marks differ at rest: \(filled.rest), \(plain.rest)")
        XCTAssertTrue(Self.near(filled.press, plain.press), "pressed, the filled control's mark is \(filled.press), the plain one's \(plain.press)")
    }

    /// The fixture's report for one part: its colour at rest, and the one
    /// furthest from it seen so far.
    private static func sample(_ app: XCUIApplication, _ id: String) -> (rest: String, press: String) {
        let label = app.staticTexts["sample-\(id)"].label
        func value(_ key: String) -> String {
            label.components(separatedBy: " ").first { $0.hasPrefix(key + "=") }.map { String($0.dropFirst(key.count + 1)) } ?? "missing"
        }
        return (value("rest"), value("press"))
    }

    /// Two #RRGGBB colours within 3 levels a channel.
    private static func near(_ a: String, _ b: String) -> Bool {
        func channels(_ hex: String) -> [Int]? {
            guard hex.count == 7, let value = Int(hex.dropFirst(), radix: 16) else { return nil }
            return [(value >> 16) & 0xFF, (value >> 8) & 0xFF, value & 0xFF]
        }
        guard let x = channels(a), let y = channels(b) else { return false }
        return zip(x, y).allSatisfy { abs($0 - $1) <= 3 }
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
        // These fixture callbacks are synchronous; XCUI actions synchronize with
        // the app before the next accessibility query. Compare one snapshot,
        // including callback order and duplicates, rather than placing a second
        // three-second polling deadline around a potentially slow AX read.
        // Asynchronous fixture work needs its own completion signal, not retries
        // here that could accept an initially incorrect callback report.
        let actual = app.staticTexts["received-events"].label
        XCTAssertEqual(actual, value, "callbacks", file: file, line: line)
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

    /// A Tag's remove mark is drawn small, but its target is 24 by 24 round
    /// it (WCAG 2.2's 2.5.8), and it is a button named "Remove", as React's
    /// is. It was the glyph's own size, read by its symbol's name.
    func testTagRemoveIsNamedRemoveWithA24PointTarget() {
        launch("tag-remove")
        let remove = app.buttons["Remove"]
        XCTAssertTrue(remove.waitForExistence(timeout: 3), "the remove button is not named Remove")
        var taps: [String] = []
        // Just inside each edge and corner of a 24pt square centred on the
        // mark: SwiftUI's own hit testing gives the 12pt glyph that target,
        // so the Tag draws no larger for it.
        for offset in [CGVector(dx: -11, dy: 0), CGVector(dx: 11, dy: 0),
                       CGVector(dx: 0, dy: -11), CGVector(dx: 0, dy: 11),
                       CGVector(dx: -11, dy: -11), CGVector(dx: 11, dy: -11),
                       CGVector(dx: -11, dy: 11), CGVector(dx: 11, dy: 11)] {
            remove.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).withOffset(offset).tap()
            taps.append("remove")
            received(taps.joined(separator: "|"))
        }
    }

    func testTagRemoveLabelCanBeLocalized() {
        launch("tag-remove-localized")
        XCTAssertTrue(app.buttons["Vegan entfernen"].waitForExistence(timeout: 3))
        XCTAssertFalse(app.buttons["Remove"].exists)
        app.buttons["Vegan entfernen"].tap()
        received("remove")
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

    /// The grab bar's 44-point target reaches up from the card's bottom
    /// edge over the bottom of the content (decision 74): a tap 40 above
    /// the edge, at the card's middle, toggles the card, closed (where the
    /// instruction row under it opens the card too) and open (where the
    /// itinerary's last line is under it).
    func testATapFortyAboveTheCardsBottomEdgeTogglesIt() {
        launch("manoeuvre-closed")
        let card = app.otherElements["Navigation en cours"]
        XCTAssertTrue(card.waitForExistence(timeout: 3))
        let fortyAboveTheEdge = { card.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 1)).withOffset(CGVector(dx: 0, dy: -40)) }
        fortyAboveTheEdge().tap()
        received("toggle")
        XCTAssertTrue(card.staticTexts["Continue to the gate"].waitForExistence(timeout: 3), "the card did not open")
        fortyAboveTheEdge().tap()
        received("toggle|toggle")
        XCTAssertFalse(card.staticTexts["Continue to the gate"].exists, "the card did not close")
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
            // The label is the whole name (Olcay, 15 Oct 2026): no number is added.
            let name = label
            let pin = app.descendants(matching: .any).matching(NSPredicate(format: "label == %@", name)).firstMatch
            XCTAssertTrue(pin.exists, name)
            XCTAssertEqual(pin.isSelected, selected, name)
            if pressable { XCTAssertTrue(app.buttons[name].exists) }
        }
    }

    /// Decision 71 (GAP-120), with a real finger: a double tap on a pin
    /// selects it once, at the first tap, and opens the place's details once,
    /// at the second, which is not a second selection; a tap after a pause
    /// selects again. The first tap selects the pin, which redraws it, and
    /// the second still pairs with it.
    func testADoubleTapOnAPinSelectsItOnceAndOpensItOnce() {
        launch("pin-open")
        let pin = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Gate 12")).firstMatch
        XCTAssertTrue(pin.waitForExistence(timeout: 3))
        pin.doubleTap()
        received("select|open")
        // Past the double-tap time: a new tap, and a selection.
        Thread.sleep(forTimeInterval: 0.6)
        pin.tap()
        received("select|open|select")
    }

    /// A disabled pin with an action is a dimmed button, as React's
    /// aria-disabled button and Compose's disabled Role.Button are: XCUI finds
    /// it as a button that is not enabled, and a tap or a double tap on it
    /// runs nothing.
    func testADisabledPinIsADimmedButtonThatRunsNothing() {
        launch("pin-disabled")
        let pin = app.buttons["Gate 12"]
        XCTAssertTrue(pin.waitForExistence(timeout: 3), "the disabled pin is not a button")
        XCTAssertFalse(pin.isEnabled, "the disabled pin is not heard as dimmed")
        pin.tap()
        pin.doubleTap()
        received("none")
    }

    /// The pin's target is 44 tall, centred on its 38 body: a tap 2 inside
    /// its top edge, above the drawn pill, still reaches it.
    func testAPinTakesATapAboveItsPillInsideIts44PointTarget() {
        launch("pin-open")
        let pin = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Gate 12")).firstMatch
        XCTAssertTrue(pin.waitForExistence(timeout: 3))
        XCTAssertGreaterThanOrEqual(pin.frame.width, 44, "\(pin.frame)")
        XCTAssertGreaterThanOrEqual(pin.frame.height, 44, "\(pin.frame)")
        pin.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0)).withOffset(CGVector(dx: 0, dy: 2)).tap()
        received("select")
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

    /// Decision 72 (GAP-143), with a real finger: a double tap on a result
    /// selects it once, at the first tap, and opens it once, at the second;
    /// a tap after a pause selects again. In a list, and on a group's branch.
    func testADoubleTapOnAResultSelectsItOnceAndOpensItOnce() {
        for scenario in ["list-open", "group-open"] {
            launch(scenario)
            let row = app.buttons["poi-result-gate%2F12"]
            XCTAssertTrue(row.waitForExistence(timeout: 3), scenario)
            row.doubleTap()
            received("select gate/12|open gate/12")
            // Past the double-tap time: a new tap, and a selection.
            Thread.sleep(forTimeInterval: 0.6)
            row.tap()
            received("select gate/12|open gate/12|select gate/12")
            app.terminate()
        }
    }

    /// Without onOpen a double tap is two selections, as before.
    func testWithoutOnOpenADoubleTapSelectsTwice() {
        launch("list-short")
        app.buttons["poi-result-gate%2F12"].doubleTap()
        received("select gate/12|select gate/12")
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

    // A plain button takes a tap only where its label draws something: a
    // frame or padding over a clear background adds nothing to its target,
    // or to the frame VoiceOver outlines, without a content shape. Each test
    // below checks the target's size, and taps inside the control where it
    // draws nothing, at the default text size well clear of its words and
    // marks: SwiftUI's own touch tolerance reaches a few points round them,
    // and a tap 7pt from an outlined part's edge and glyph still lands. At
    // accessibility3 the words and marks grow and a tap can land on them, so
    // there the size check is what proves the target. Each failed on the
    // unfixed parts, which measured as the comments say.

    /// The clear and the chevron are 44pt targets, as Combobox's are, and
    /// the chevron's runs to the field's end, as Combobox's does: the field
    /// is the fixture's 320pt, centred. Unfixed: the chevron 13.3 by 8pt,
    /// the clear 12.3pt square.
    func testAMultiSelectsClearAndChevronAre44PointTargets() {
        for scenario in ["multiselect", "multiselect-large-rtl"] {
            launch(scenario)
            let open = app.buttons["Open options"]
            assertTouchTarget(open)
            let fieldEnd = scenario == "multiselect-large-rtl" ? app.frame.midX - 160 : app.frame.midX + 160
            let targetEnd = scenario == "multiselect-large-rtl" ? open.frame.minX : open.frame.maxX
            XCTAssertEqual(targetEnd, fieldEnd, accuracy: 1, "\(scenario): the chevron's target stops short of the field's end")
            // Inward, clear of the field's rounded corner.
            tap(open, dx: -18 * outward(open), dy: -18)
            XCTAssertTrue(app.buttons["Close options"].waitForExistence(timeout: 3), "\(scenario): the chevron missed")
            let clear = app.buttons["Clear selected options"]
            assertTouchTarget(clear)
            tap(clear, dx: 18 * outward(clear), dy: -18)
            received("values none")
            app.terminate()
        }
    }

    /// A page link is 44pt square, as React's touch link is, and Previous
    /// and Next are as tall as the links. Unfixed: the link "1" 7 by 18pt,
    /// its tap reached Previous; Previous and Next 36pt tall.
    func testPaginationLinksAre44PointTargets() {
        launch("pagination")
        for page in ["1", "3"] {
            let link = app.buttons[page]
            assertTouchTarget(link)
            tap(link, dx: -18, dy: 0)
        }
        received("page 1|page 3")
        for name in ["Previous", "Next"] {
            let end = app.buttons.matching(NSPredicate(format: "label CONTAINS %@", name)).firstMatch
            XCTAssertTrue(end.exists, name)
            assertTouchTarget(end)
        }
        app.terminate()
        launch("pagination-large-rtl")
        for page in ["1", "3"] {
            let link = app.buttons[page]
            assertTouchTarget(link)
            XCTAssertGreaterThanOrEqual(link.frame.minX, 0)
            XCTAssertLessThanOrEqual(link.frame.maxX, app.frame.maxX)
            tap(link, dx: -18, dy: 0)
        }
        received("page 1|page 3")
    }

    /// Code Connect's Ellipsis composition (Previous, 1, 2, 3, the ellipsis,
    /// 10, Next) is 385pt with 44pt links, wider than the 370pt column of a
    /// 402pt phone. It wraps, as React's flex-wrap row does, rather than
    /// squeeze Previous and Next: each keeps the size it has on its own, so
    /// its word stays on one line, and every part stays inside the column.
    /// Next goes on a second row, no two parts overlap, the rows stay inside
    /// the size the row reports (16pt above the next part of the host), and
    /// the parts keep their reading order. At accessibility3 right to left too.
    func testPaginationWrapsRatherThanSqueezingPreviousAndNext() {
        for scenario in ["pagination-ellipsis", "pagination-ellipsis-large-rtl"] {
            launch(scenario)
            let rtl = scenario == "pagination-ellipsis-large-rtl"
            let column = (minX: app.frame.midX - 185, maxX: app.frame.midX + 185)
            for end in ["previous", "next"] {
                let inRow = app.buttons["row-\(end)"]
                let alone = app.buttons["alone-\(end)"]
                XCTAssertTrue(inRow.exists && alone.exists, "\(scenario): \(end)")
                XCTAssertEqual(inRow.frame.width, alone.frame.width, accuracy: 0.5, "\(scenario): \(end) was squeezed")
                XCTAssertEqual(inRow.frame.height, alone.frame.height, accuracy: 0.5, "\(scenario): \(end)'s word wrapped")
            }
            let names = ["row-previous", "1", "2", "3", "10", "row-next"]
            let frames = names.map { app.buttons[$0].frame }
            for (name, frame) in zip(names, frames) {
                XCTAssertGreaterThanOrEqual(frame.minX, column.minX - 0.5, "\(scenario): \(name) \(frame)")
                XCTAssertLessThanOrEqual(frame.maxX, column.maxX + 0.5, "\(scenario): \(name) \(frame)")
            }
            for i in frames.indices {
                for j in frames.indices where j > i {
                    XCTAssertFalse(frames[i].insetBy(dx: 0.5, dy: 0.5).intersects(frames[j].insetBy(dx: 0.5, dy: 0.5)),
                                   "\(scenario): \(names[i]) \(frames[i]) overlaps \(names[j]) \(frames[j])")
                }
            }
            let previous = app.buttons["row-previous"].frame, next = app.buttons["row-next"].frame
            XCTAssertGreaterThan(next.minY, previous.maxY, "\(scenario): Next is not on a second row")
            XCTAssertLessThanOrEqual(next.maxY, app.buttons["alone-previous"].frame.minY - 16 + 0.5,
                                     "\(scenario): the rows pass the size the row reports")
            let one = app.buttons["1"].frame
            if rtl {
                XCTAssertGreaterThan(previous.minX, one.maxX, "\(scenario): Previous is not first, right to left")
            } else {
                XCTAssertLessThan(previous.maxX, one.minX, "\(scenario): Previous is not first, left to right")
            }
            app.terminate()
        }
    }

    /// An unselected segment takes a tap anywhere across it, not just on its
    /// word. Unfixed: "Ramp" 38 by 17pt in its 117 by 44pt segment.
    func testAnUnselectedSegmentTakesATapAcrossItsWidth() {
        for scenario in ["segmented", "segmented-large-rtl"] {
            launch(scenario)
            let ramp = app.buttons["Ramp"]
            assertTouchTarget(ramp)
            tap(ramp, dx: 40 * outward(ramp), dy: 0)
            received("segment 2")
            XCTAssertTrue(ramp.isSelected, scenario)
            app.terminate()
        }
    }

    /// A row is 44pt tall at least, as React's list rows are (decision 115),
    /// and takes a tap across its width, 20pt in from its trailing end.
    /// Unfixed: "Lobby" 43.3 by 18pt in a 312 by 34pt row.
    func testAListboxRowTakesATapAcrossItsWidth() {
        for scenario in ["listbox", "listbox-large-rtl"] {
            launch(scenario)
            let list = app.scrollViews.firstMatch
            let trailingEnd = scenario == "listbox-large-rtl" ? list.frame.minX + 20 : list.frame.maxX - 20
            for name in ["Lobby", "Gate 12, Level 1"] {
                let row = app.buttons[name]
                assertTouchTarget(row)
                tap(atX: trailingEnd, y: row.frame.midY)
            }
            received("choose lobby|choose gate")
            app.terminate()
        }
    }

    /// An idle item takes a tap across its shape: a side item 16pt in from
    /// its trailing end (the fixture is 320pt wide, centred), a rail item
    /// 36pt from its middle. Unfixed: the side item 85.7 by 18pt of 320 by
    /// 44pt, the rail item 28.7 by 39.7pt of 96 by 75.3pt.
    func testAnIdleNavigationItemTakesATapAcrossItsShape() {
        for scenario in ["navigation-items", "navigation-items-large-rtl"] {
            launch(scenario)
            let rtl = scenario == "navigation-items-large-rtl"
            let side = app.buttons["Settings"]
            assertTouchTarget(side)
            tap(atX: rtl ? app.frame.midX - 144 : app.frame.midX + 144, y: side.frame.midY)
            assertTouchTarget(app.buttons["Home"])
            let rail = app.buttons["Maps"]
            assertTouchTarget(rail)
            tap(rail, dx: rtl ? -36 : 36, dy: 0)
            received("side|rail")
            app.terminate()
        }
    }

    /// An unselected tile takes a tap across its 64pt square, 24pt above and
    /// before its middle. Unfixed: 38.3 by 37.7pt; at accessibility3 its
    /// words alone are taller than 44pt.
    func testAnUnselectedBottomNavigationTileTakesATapAcrossItsShape() {
        for scenario in ["bottom-navigation", "bottom-navigation-large-rtl"] {
            launch(scenario)
            let search = app.buttons["Search"]
            assertTouchTarget(search)
            tap(search, dx: -24, dy: -24)
            received("tab 1")
            XCTAssertTrue(search.isSelected, scenario)
            app.terminate()
        }
    }

    /// A radio, a checkbox and a switch are 44pt targets, with a label or
    /// without one. Without one, a radio's and a checkbox's target reaches
    /// past the 20pt mark: a tap 36pt in from the leading edge chooses it.
    /// Unfixed: 21pt tall with a label, 21pt square without; a switch 26pt.
    func testSelectionControlsAre44PointTargets() {
        for scenario in ["selection-controls", "selection-controls-large-rtl"] {
            launch(scenario)
            let rtl = scenario == "selection-controls-large-rtl"
            for name in ["Ramp", "Stairs", "Step-free", "Bare checkbox", "Announce turns", "Bare switch"] {
                assertTouchTarget(app.buttons[name])
            }
            for name in ["Stairs", "Bare checkbox"] {
                app.buttons[name].coordinate(withNormalizedOffset: CGVector(dx: rtl ? 1 : 0, dy: 0.5))
                    .withOffset(CGVector(dx: rtl ? -36 : 36, dy: 0)).tap()
            }
            received("radio stairs|bare checkbox true")
            app.terminate()
        }
    }

    /// The trigger takes a tap across its row, between its title and its
    /// chevron. Unfixed: 318 by 18pt, the title and the chevron, in a 50pt row.
    func testAnAccordionTriggerTakesATapAcrossItsRow() {
        for scenario in ["accordion", "accordion-large-rtl"] {
            launch(scenario)
            let trigger = app.buttons["Hours"]
            assertTouchTarget(trigger)
            tap(atX: app.frame.midX, y: trigger.frame.midY)
            received("open hours")
            XCTAssertTrue(app.staticTexts["Open 06:00 to 22:00"].waitForExistence(timeout: 3), scenario)
            app.terminate()
        }
    }

    /// A thumb is a 44pt target round its 40pt circle, as React's is.
    /// Unfixed: the 40pt circle.
    func testARatingsThumbsAre44PointTargets() {
        launch("rating-thumbs")
        for name in ["Poor", "Good"] { assertTouchTarget(app.buttons[name]) }
        app.buttons["Good"].tap()
        received("rating 2")
    }

    /// The colour format box opens its menu from anywhere in it, as React's
    /// select does: 30pt before its middle, 6pt in from its end. Unfixed:
    /// 56 by 18pt, the word, in a 72 by 36pt box.
    func testTheColourFormatBoxTakesATapAcrossItsWidth() {
        launch("color-format")
        // Named as React's select is, its format its value.
        let format = app.buttons["Color format"]
        XCTAssertTrue(format.waitForExistence(timeout: 3))
        XCTAssertEqual(format.value as? String, "HEX")
        // React's box is h-9, 36px, a compact control in the panel: within a pixel.
        XCTAssertGreaterThanOrEqual(format.frame.height + 0.5, 36, "\(format.frame)")
        XCTAssertGreaterThanOrEqual(format.frame.width + 0.5, 72, "\(format.frame)")
        tap(format, dx: -30, dy: 0)
        XCTAssertTrue(app.buttons["RGB"].waitForExistence(timeout: 3), "the format menu did not open")
        app.buttons["RGB"].tap()
        XCTAssertEqual(format.value as? String, "RGB")
    }

    /// A disabled or read-only picker opened by default shows its panel, but
    /// its format box is disabled and opens no menu, as React's select is
    /// disabled with the picker.
    func testADisabledOrReadOnlyColourPickersFormatBoxOpensNoMenu() {
        for scenario in ["color-format-disabled", "color-format-readonly"] {
            launch(scenario)
            let format = app.buttons["Color format"]
            XCTAssertTrue(format.waitForExistence(timeout: 3), scenario)
            XCTAssertFalse(format.isEnabled, "\(scenario): the format box is enabled")
            format.tap()
            XCTAssertFalse(app.buttons["RGB"].waitForExistence(timeout: 2), "\(scenario): the format menu opened")
            app.terminate()
        }
    }

    /// A read-only or disabled MultiSelect opened by default shows its chip
    /// and a closed chevron it cannot open, and no list, as React's closes;
    /// a tap where the list's second row, Ramp, was drawn changes nothing.
    func testAReadOnlyOrDisabledMultiSelectOpenedByDefaultShowsNoList() {
        for scenario in ["multiselect-readonly", "multiselect-disabled"] {
            launch(scenario)
            let chevron = app.buttons.matching(NSPredicate(format: "label IN %@", ["Open options", "Close options"])).firstMatch
            XCTAssertTrue(chevron.waitForExistence(timeout: 3), "\(scenario): no chevron")
            XCTAssertEqual(chevron.label, "Open options", "\(scenario): the list is open")
            XCTAssertFalse(chevron.isEnabled, "\(scenario): the chevron can be used")
            XCTAssertTrue(app.staticTexts["Lift"].exists, "\(scenario): the chosen option's chip")
            XCTAssertFalse(app.buttons["Ramp"].exists, "\(scenario): the list is shown")
            tap(atX: app.frame.midX, y: chevron.frame.maxY + 80)
            received("none")
            XCTAssertTrue(app.staticTexts["Lift"].exists, scenario)
            app.terminate()
        }
    }

    /// A list closed by read-only stays closed when the field can be used
    /// again, as React's does: it opens again only when the visitor opens it.
    func testAMultiSelectClosedByReadOnlyStaysClosedAfterwards() {
        launch("multiselect-lock")
        XCTAssertTrue(app.buttons["Ramp"].waitForExistence(timeout: 3), "the list was not open to begin with")
        let toggle = app.buttons["Toggle read-only"]
        toggle.tap()
        XCTAssertFalse(app.buttons["Ramp"].exists, "a read-only MultiSelect shows its list")
        toggle.tap()
        XCTAssertTrue(app.buttons["Open options"].waitForExistence(timeout: 3), "the list opened again by itself")
        XCTAssertFalse(app.buttons["Ramp"].exists, "the list opened again by itself")
        app.buttons["Open options"].tap()
        XCTAssertTrue(app.buttons["Ramp"].waitForExistence(timeout: 3), "the chevron does not open it")
    }

    /// A tap `dx`, `dy` from `element`'s centre.
    private func tap(_ element: XCUIElement, dx: CGFloat, dy: CGFloat) {
        element.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).withOffset(CGVector(dx: dx, dy: dy)).tap()
    }

    /// A tap at a point in the window.
    private func tap(atX x: CGFloat, y: CGFloat) {
        app.coordinate(withNormalizedOffset: .zero).withOffset(CGVector(dx: x, dy: y)).tap()
    }

    /// 1 where `element` is right of the window's middle, -1 where it is left
    /// of it: the way out of a row of parts, whichever way the row reads.
    private func outward(_ element: XCUIElement) -> CGFloat {
        element.frame.midX > app.frame.midX ? 1 : -1
    }
}
