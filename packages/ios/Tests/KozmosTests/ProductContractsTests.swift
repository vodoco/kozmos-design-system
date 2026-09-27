import XCTest
@testable import Kozmos

/// These derivations are duplicated across React, SwiftUI, and Compose. They are
/// the pieces most likely to drift silently, so they are asserted directly
/// rather than only exercised through a view.
final class ProductContractsTests: XCTestCase {
    private func makePOI(
        name: String = "Gate 42",
        floorLabel: String = "Level 2",
        buildingLabel: String? = "Terminal B"
    ) -> KozmosPOIPresentation {
        KozmosPOIPresentation(
            id: "poi-1",
            name: name,
            floorId: "floor-2",
            floorLabel: floorLabel,
            buildingLabel: buildingLabel
        )
    }

    // MARK: - locationLabel

    func testLocationLabelJoinsFloorAndBuilding() {
        XCTAssertEqual(makePOI().locationLabel, "Level 2 · Terminal B")
    }

    func testLocationLabelOmitsMissingBuilding() {
        XCTAssertEqual(makePOI(buildingLabel: nil).locationLabel, "Level 2")
    }

    func testLocationLabelOmitsEmptyBuilding() {
        XCTAssertEqual(makePOI(buildingLabel: "").locationLabel, "Level 2")
    }

    // MARK: - a venue without levels (MAP-474 Story 15 edge case)

    func testLocationLabelDropsTheFloorAVenueDoesNotHave() {
        // Required until 2026-09-25, so a single-storey venue had to invent a
        // floor and every result read "Ground Floor" on iOS long after the web
        // had stopped. The label is now the building alone.
        let poi = KozmosPOIPresentation(id: "p", name: "Boots", buildingLabel: "Terminal B")
        XCTAssertNil(poi.floorId)
        XCTAssertNil(poi.floorLabel)
        XCTAssertEqual(poi.locationLabel, "Terminal B")
    }

    func testAResultNeedsNoFloorEither() {
        let result = KozmosPOIResultPresentation(poiId: "p", resultIndex: 0)
        XCTAssertNil(result.floorId)
    }

    // MARK: - why a result is in the list

    func testTheMatchEnumerationCarriesTheWireValues() {
        // Compared against the web's POIResultMatch by
        // `pnpm contracts:parity:check`; asserted here so the cases cannot be
        // renamed on this platform alone.
        XCTAssertEqual(
            KozmosPOIResultMatch.allCases.map(\.rawValue),
            ["exact", "alternative", "unconfirmed"]
        )
    }

    func testTheAvailabilityEnumerationCarriesTheWireValues() {
        XCTAssertEqual(
            KozmosPOIAvailability.allCases.map(\.rawValue),
            ["open", "openingSoon", "closingSoon", "closed", "unknown"]
        )
    }

    func testTheEmptyKindEnumerationCarriesTheWireValues() {
        XCTAssertEqual(
            KozmosSearchEmptyKind.allCases.map(\.rawValue),
            ["noMatch", "filteredOut", "unavailable"]
        )
    }

    // MARK: - selecting() carries every stored property

    func testSelectingKeepsTheFieldsAddedSinceItWasWritten() {
        // `selecting` rebuilds the struct by hand, so a new field that is not
        // listed is dropped on every selection change - which badge and actions
        // did until a test asked, and which match, unitLabel and nameLanguage
        // would have done next.
        let result = KozmosPOIResultPresentation(
            poiId: "p",
            resultIndex: 0,
            floorId: "f",
            badge: KozmosPOIResultBadgePresentation(label: "Nearby"),
            match: .alternative,
            unitLabel: "Unit 214",
            nameLanguage: "ja",
            actions: [KozmosPOIResultActionPresentation(action: .details, label: "Details")]
        )
        let selected = result.selecting("p")
        XCTAssertTrue(selected.selected)
        XCTAssertEqual(selected.match, .alternative)
        XCTAssertEqual(selected.unitLabel, "Unit 214")
        XCTAssertEqual(selected.nameLanguage, "ja")
        XCTAssertEqual(selected.badge?.label, "Nearby")
        XCTAssertEqual(selected.actions.count, 1)
    }

    // MARK: - what an empty search means

    func testASearchResponseSaysWhyItIsEmpty() {
        let response = KozmosSearchResponsePresentation(
            emptyKind: .filteredOut,
            emptiedBy: "Gluten-free",
            languageFallback: "en"
        )
        XCTAssertTrue(response.results.isEmpty)
        XCTAssertEqual(response.emptyKind, .filteredOut)
        XCTAssertEqual(response.emptiedBy, "Gluten-free")
        XCTAssertEqual(response.languageFallback, "en")
    }

    // MARK: - a category's own artwork

    func testACategoryCarriesTheTaxonomysArtworkUrl() {
        let category = KozmosCategoryPresentation(
            id: "dining",
            label: "Dining",
            iconUrl: "https://example.test/dining.svg"
        )
        XCTAssertEqual(category.iconUrl, "https://example.test/dining.svg")
    }

    // MARK: - logoFallbackInitial

    func testLogoFallbackInitialIsUppercasedFirstCharacter() {
        XCTAssertEqual(makePOI(name: "boots").logoFallbackInitial, "B")
    }

    func testLogoFallbackInitialHandlesEmptyName() {
        XCTAssertEqual(makePOI(name: "").logoFallbackInitial, "")
    }

    func testLogoFallbackInitialHandlesNonLatinName() {
        XCTAssertEqual(makePOI(name: "İstanbul").logoFallbackInitial, "İ")
    }

    // MARK: - isAvailable

    private func makeResult(available: Bool?) -> KozmosPOIResultPresentation {
        KozmosPOIResultPresentation(
            poiId: "poi-1",
            resultIndex: 1,
            floorId: "floor-2",
            available: available
        )
    }

    func testOnlyExplicitFalseMarksResultUnavailable() {
        XCTAssertTrue(makeResult(available: nil).isAvailable)
        XCTAssertTrue(makeResult(available: true).isAvailable)
        XCTAssertFalse(makeResult(available: false).isAvailable)
    }

    // MARK: - selecting

    func testSelectingDerivesSelectionFromCanonicalId() {
        let result = KozmosPOIResultPresentation(
            poiId: "poi-1",
            resultIndex: 1,
            selected: false,
            floorId: "floor-2"
        )

        XCTAssertTrue(result.selecting("poi-1").selected)
        XCTAssertFalse(result.selecting("poi-2").selected)
    }

    func testSelectingWithNilPreservesExistingFlag() {
        let selected = KozmosPOIResultPresentation(
            poiId: "poi-1",
            resultIndex: 1,
            selected: true,
            floorId: "floor-2"
        )

        XCTAssertTrue(selected.selecting(nil).selected)
    }

    func testSelectingPreservesEveryOtherField() {
        let estimate = KozmosTravelEstimatePresentation(
            durationSeconds: 120,
            durationLabel: "2 min"
        )
        let result = KozmosPOIResultPresentation(
            poiId: "poi-1",
            resultIndex: 3,
            selected: false,
            featured: true,
            floorId: "floor-2",
            travelEstimate: estimate,
            available: false,
            unavailableReason: "Closed for maintenance"
        )

        let reselected = result.selecting("poi-1")

        XCTAssertEqual(reselected.resultIndex, 3)
        XCTAssertTrue(reselected.featured)
        XCTAssertEqual(reselected.floorId, "floor-2")
        XCTAssertEqual(reselected.travelEstimate, estimate)
        XCTAssertEqual(reselected.available, false)
        XCTAssertEqual(reselected.unavailableReason, "Closed for maintenance")
    }

    // MARK: - Identifier parity with the web

    func testResultIdentifierMatchesEncodeURIComponent() {
        XCTAssertEqual(kozmosPOIResultIdentifier("poi-1"), "poi-result-poi-1")
        XCTAssertEqual(kozmosPOIResultIdentifier("a b"), "poi-result-a%20b")
        XCTAssertEqual(kozmosPOIResultIdentifier("a/b"), "poi-result-a%2Fb")
        XCTAssertEqual(kozmosPOIResultIdentifier("café"), "poi-result-caf%C3%A9")
    }

    func testResultIdentifierLeavesUnreservedCharactersIntact() {
        XCTAssertEqual(
            kozmosPOIResultIdentifier("-_.!~*'()"),
            "poi-result--_.!~*'()"
        )
    }

    // MARK: - Raw values shared with the other platforms

    func testHyphenatedEnumRawValuesMatchTheSharedContract() {
        XCTAssertEqual(KozmosRoutePreference.stepFree.rawValue, "step-free")
        XCTAssertEqual(KozmosRouteReadiness.noRoute.rawValue, "no-route")
        XCTAssertEqual(KozmosUserLocationState.permissionDenied.rawValue, "permission-denied")
    }
}
