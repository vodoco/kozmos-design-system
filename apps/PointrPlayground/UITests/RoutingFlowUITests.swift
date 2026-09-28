import XCTest

/// The routing flow, driven through the accessibility tree — the way VoiceOver
/// and Switch Control reach it — on any simulator, the iPad included, which
/// the desktop tooling cannot drive. Live Design-QA data: like the app, it
/// needs the network and the ignored SDK files, so it is not in CI.
///
/// Named places come from the runner's environment
/// (`TEST_RUNNER_KOZMOS_QA_DESTINATION`, `TEST_RUNNER_KOZMOS_QA_ORIGIN` on the
/// xcodebuild command line); without them the first place of the building the
/// map opened on is the destination and the first starting point is the origin.
final class RoutingFlowUITests: XCTestCase {
    private var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
    }

    // MARK: - Helpers

    private func any(_ identifierOrLabel: String, in root: XCUIElement? = nil) -> XCUIElement {
        (root ?? app).descendants(matching: .any).matching(identifier: identifierOrLabel).firstMatch
    }

    private func row(labelBeginning prefix: String?, in list: XCUIElement) -> XCUIElement {
        guard let prefix, !prefix.isEmpty else { return list.buttons.firstMatch }
        return list.buttons.matching(NSPredicate(format: "label BEGINSWITH[c] %@", prefix)).firstMatch
    }

    private func attach(_ name: String) {
        let shot = XCTAttachment(screenshot: app.screenshot())
        shot.name = name
        shot.lifetime = .keepAlways
        add(shot)
    }

    private func attachTree(_ element: XCUIElement, name: String) {
        let text = element.debugDescription
        let attachment = XCTAttachment(string: text)
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
        let url = FileManager.default.temporaryDirectory.appendingPathComponent("axtree-\(name).txt")
        try? text.write(to: url, atomically: true, encoding: .utf8)
        print("AXTREE-BEGIN \(name)\n\(text)\nAXTREE-END \(name)")
    }

    private func waitUntilEnabled(_ element: XCUIElement, timeout: TimeInterval) {
        let enabled = expectation(for: NSPredicate(format: "isEnabled == true"), evaluatedWith: element)
        wait(for: [enabled], timeout: timeout)
    }

    /// The directions on the Kozmos parts: the manoeuvre card over the map
    /// reads the current step, opens into the itinerary where exactly one
    /// step carries the selected trait, and closes again. (XCUITest's
    /// snapshot still lists what SwiftUI hides or ignores, so absence is
    /// checked by the package's tests, not here.)
    private func assertDirectionsAreReadable(file: StaticString = #filePath, line: UInt = #line) {
        // The current manoeuvre, over the map, is a button that reads the
        // instruction and its detail and opens into the itinerary.
        let card = any("Current manoeuvre")
        XCTAssertTrue(card.waitForExistence(timeout: 10), "no manoeuvre card over the map", file: file, line: line)
        let manoeuvre = card.buttons.firstMatch
        XCTAssertTrue(manoeuvre.waitForExistence(timeout: 5), "the card has no manoeuvre to read", file: file, line: line)
        print("QA-FLOW manoeuvre reads: \(manoeuvre.label)")
        XCTAssertFalse(manoeuvre.label.isEmpty, "the manoeuvre reads as nothing", file: file, line: line)
        manoeuvre.tap()
        // Open, the itinerary lists every step; exactly one reads as current.
        let itinerary = any("Itinerary")
        XCTAssertTrue(itinerary.waitForExistence(timeout: 10), "the card did not open into the itinerary", file: file, line: line)
        let current = itinerary.descendants(matching: .any).matching(NSPredicate(format: "isSelected == true"))
        _ = current.firstMatch.waitForExistence(timeout: 10)
        XCTAssertEqual(current.count, 1, "steps reading as current: \(current.allElementsBoundByIndex.map(\.label))", file: file, line: line)
        for element in current.allElementsBoundByIndex {
            print("QA-FLOW current step reads: \(element.label)")
            XCTAssertFalse(element.label.isEmpty, "the current step reads as nothing", file: file, line: line)
        }
        attachTree(itinerary, name: "5-itinerary-open")
        attach("5-itinerary-open")
        app.buttons["Hide itinerary"].tap()
        XCTAssertTrue(manoeuvre.waitForExistence(timeout: 5), "the itinerary did not close back to the manoeuvre", file: file, line: line)
    }

    // MARK: - The flow

    func testARouteBetweenTwoPlacesReachesTheDirectionsOnTheKozmosParts() throws {
        let environment = ProcessInfo.processInfo.environment
        let destinationName = environment["KOZMOS_QA_DESTINATION"]
        let originName = environment["KOZMOS_QA_ORIGIN"]
        app.launch()

        // 1. Browse: the building's places have loaded. Which building the map
        // opens on varies between launches; a run that needs
        // a particular one names its place count and relaunches until it gets it.
        // The sheet's value carries the count, since the sheet rests on the
        // search row and the tiles, not on a list of every place.
        let sheet = any("search-sheet")
        let loaded = NSPredicate(format: "value CONTAINS 'POIs loaded'")
        XCTAssertTrue(sheet.waitForExistence(timeout: 120), "no search sheet")
        wait(for: [expectation(for: loaded, evaluatedWith: sheet)], timeout: 120)
        let loadedValue = { (sheet.value as? String) ?? "" }
        if let wanted = environment["KOZMOS_QA_BUILDING_POIS"] {
            // The map's first level callback can switch the building a moment
            // after the configured one's places were counted.
            let wantedValue = NSPredicate(format: "value BEGINSWITH %@", "\(wanted) POIs")
            var launches = 1
            while !wantedValue.evaluate(with: sheet), launches < 4 {
                print("QA-FLOW building: \(loadedValue()); wanted \(wanted) POIs, relaunching")
                app.terminate()
                app.launch()
                launches += 1
                XCTAssertTrue(sheet.waitForExistence(timeout: 120), "no search sheet")
                wait(for: [expectation(for: loaded, evaluatedWith: sheet)], timeout: 120)
            }
        }
        print("QA-FLOW building: \(loadedValue())")
        attach("1-browse")

        // The field is the sheet's first row; tapping it opens the sheet and
        // a query lists the places. Without a name, a vowel lists enough of
        // them to take the first.
        let search = app.textFields.firstMatch
        XCTAssertTrue(search.waitForExistence(timeout: 10), "no search field in the sheet")
        search.tap()
        let typed = destinationName ?? "a"
        search.typeText(typed)
        let places = any("Points of interest")
        var destination = row(labelBeginning: destinationName, in: places)
        if let destinationName, !destination.waitForExistence(timeout: 15) {
            // The building the map opened on has no such place: take its first one.
            print("QA-FLOW no place named \(destinationName) in this building; using the first")
            search.typeText(String(repeating: XCUIKeyboardKey.delete.rawValue, count: typed.count) + "a")
            destination = row(labelBeginning: nil, in: places)
        }
        XCTAssertTrue(destination.waitForExistence(timeout: 30), "no place to select")
        print("QA-FLOW destination: \(destination.label)")
        destination.tap()

        // 2. The card, with Go.
        let go = any("poi-action-navigate")
        XCTAssertTrue(go.waitForExistence(timeout: 20), "the card has no Go")
        attach("2-card")
        go.tap()

        // 3. The starting-point picker.
        let originField = app.textFields["Choose a starting point"]
        XCTAssertTrue(originField.waitForExistence(timeout: 10), "no starting-point field")
        attachTree(any("Starting point"), name: "3-route-setup")
        attach("3-route-setup")
        if let originName {
            originField.tap()
            originField.typeText(originName)
        }
        var origin = row(labelBeginning: originName, in: any("Starting points"))
        if let originName, !origin.waitForExistence(timeout: 15) {
            print("QA-FLOW no starting point named \(originName) in this building; using the first")
            originField.typeText(String(repeating: XCUIKeyboardKey.delete.rawValue, count: originName.count))
            origin = row(labelBeginning: nil, in: any("Starting points"))
        }
        XCTAssertTrue(origin.waitForExistence(timeout: 30), "no starting point to choose")
        print("QA-FLOW origin: \(origin.label)")
        origin.tap()

        // 4. The directions open as soon as the route exists; the picker stays
        // with the reason when it does not.
        if environment["KOZMOS_QA_EXPECT_NO_ROUTE"] != nil {
            let noRoute = app.staticTexts.matching(NSPredicate(format: "label BEGINSWITH 'No route was found'")).firstMatch
            XCTAssertTrue(noRoute.waitForExistence(timeout: 30), "a route was found after all")
            XCTAssertTrue(originField.exists, "the picker did not stay for another starting point")
            attachTree(any("Starting point"), name: "4-no-route")
            attach("4-no-route")
            print("QA-FLOW no route, as expected")
            return
        }

        // 5. The directions, stepped to the end.
        let next = app.buttons["Next step"]
        let finish = app.buttons["Finish"]
        XCTAssertTrue(next.waitForExistence(timeout: 20) || finish.waitForExistence(timeout: 5), "no directions")
        attachTree(any("Directions"), name: "5-directions-first-step")
        attach("5-directions-first-step")
        assertDirectionsAreReadable()
        var steps = 1
        while next.exists, steps < 40 {
            next.tap()
            steps += 1
            if steps == 2 {
                attach("5-directions-second-step")
                attachTree(any("Directions"), name: "5-directions-second-step")
            }
        }
        XCTAssertTrue(finish.waitForExistence(timeout: 10), "the last step has no Finish")
        print("QA-FLOW steps: \(steps)")
        attachTree(any("Directions"), name: "5-directions-last-step")
        attach("5-directions-last-step")
        assertDirectionsAreReadable()
        finish.tap()

        // 6. Back on the card.
        XCTAssertTrue(go.waitForExistence(timeout: 20), "Finish did not return to the card")
        attach("6-card-again")
    }
}
