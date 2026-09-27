import XCTest
@testable import Kozmos

/// The result's actions and badge, asserted on the contract rather than only
/// through a view: these are the pieces that drift silently between React,
/// SwiftUI and Compose, and the web is where they were defined first.
final class KozmosPOIResultActionsTests: XCTestCase {
    private func result(
        selected: Bool = false,
        featured: Bool = false,
        available: Bool? = nil,
        badge: KozmosPOIResultBadgePresentation? = nil,
        actions: [KozmosPOIResultActionPresentation] = []
    ) -> KozmosPOIResultPresentation {
        KozmosPOIResultPresentation(
            poiId: "p",
            resultIndex: 0,
            selected: selected,
            featured: featured,
            floorId: "b:2",
            available: available,
            badge: badge,
            actions: actions
        )
    }

    func testAResultCarriesNoBadgeOrActionsUnlessGivenThem() {
        // Every existing caller omits both, so both must stay optional or the
        // package breaks for anyone who has not changed a line.
        let plain = result()
        XCTAssertNil(plain.badge)
        XCTAssertTrue(plain.actions.isEmpty)
    }

    func testAResultActionCarriesEverythingTheWebContractDoes() {
        let go = KozmosPOIResultActionPresentation(
            action: .navigate,
            label: "Go",
            primary: true
        )
        XCTAssertEqual(go.action.rawValue, "navigate")
        XCTAssertEqual(go.label, "Go")
        XCTAssertTrue(go.primary)
        XCTAssertFalse(go.disabled)
    }

    func testDetailsIsAResultActionAndNotAPOIAction() {
        // A detail panel cannot offer to open itself, which is why the two
        // enumerations are kept apart rather than one widened.
        XCTAssertEqual(KozmosPOIResultAction.details.rawValue, "details")
        XCTAssertFalse(
            KozmosPOIAction.allCases.contains { $0.rawValue == "details" },
            "details must not leak into the POI's own actions"
        )
    }

    func testEveryPOIActionHasAMatchingResultAction() {
        // The result's list is the POI's plus details. If one gains a case and
        // the other does not, a product can offer something the card cannot
        // draw.
        for action in KozmosPOIAction.allCases {
            XCTAssertTrue(
                KozmosPOIResultAction.allCases.contains { $0.rawValue == action.rawValue },
                "KozmosPOIResultAction is missing \(action.rawValue)"
            )
        }
        XCTAssertEqual(
            KozmosPOIResultAction.allCases.count,
            KozmosPOIAction.allCases.count + 1
        )
    }

    func testABadgeIsJustALabel() {
        // Featured stays a boolean because the map marker reads it too; a badge
        // says only why a result is in this list.
        let badge = KozmosPOIResultBadgePresentation(label: "Alternative")
        XCTAssertEqual(badge.label, "Alternative")
        XCTAssertFalse(result(badge: badge).featured)
    }

    func testSelectingStillWorksWithTheNewFields() {
        // `selecting` copies the struct; a new stored property that was not
        // carried through would be silently dropped on every selection change.
        let withExtras = result(
            badge: KozmosPOIResultBadgePresentation(label: "Close by"),
            actions: [KozmosPOIResultActionPresentation(action: .navigate, label: "Go")]
        )
        let selected = withExtras.selecting("p")
        XCTAssertTrue(selected.selected)
        XCTAssertEqual(selected.badge?.label, "Close by")
        XCTAssertEqual(selected.actions.count, 1)
    }
}
