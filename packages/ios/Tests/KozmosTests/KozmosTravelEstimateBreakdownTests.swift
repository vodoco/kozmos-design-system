import XCTest
@testable import Kozmos

/// GAP-047 (decision 209): a travel time says what it includes, "Includes
/// security (about 8 min)" on an after-security board, from the estimate's
/// breakdown. The result card draws it under the time and says it after the
/// time; the details card draws it under its strip and says it with Go. With
/// no breakdown both draw and say what they did before. The same cases as
/// the web's travel-estimate-breakdown.test.ts and Compose's test.
final class KozmosTravelEstimateBreakdownTests: XCTestCase {
    private let security = KozmosTravelEstimatePartPresentation(
        kind: .securityQueue, durationSeconds: 480, label: "Includes security (about 8 min)")

    private func estimate(_ breakdown: [KozmosTravelEstimatePartPresentation]?) -> KozmosTravelEstimatePresentation {
        KozmosTravelEstimatePresentation(
            durationSeconds: 720, durationLabel: "12 min", distanceLabel: "400 m", breakdown: breakdown)
    }

    // MARK: The contract's rule

    func testTheBreakdownLabelJoinsThePartsInOrderLeavingOutEmptyOnes() {
        XCTAssertNil(estimate(nil).breakdownLabel)
        XCTAssertNil(estimate([]).breakdownLabel)
        XCTAssertNil(estimate([.init(kind: .other, durationSeconds: 60, label: "")]).breakdownLabel)
        XCTAssertEqual(
            estimate([
                .init(kind: .walking, durationSeconds: 240, label: "4 min walk"),
                .init(kind: .liftWait, durationSeconds: 60, label: ""),
                security
            ]).breakdownLabel,
            "4 min walk · Includes security (about 8 min)"
        )
    }

    func testTheKindsAreTheWebsWireValues() {
        XCTAssertEqual(
            KozmosTravelEstimatePartKind.allCases.map(\.rawValue),
            ["walking", "securityQueue", "liftWait", "other"]
        )
    }

    func testABreakdownDecodesFromTheWebsJSONAndAnEstimateWithoutOneStillDoes() throws {
        let json = #"""
        {"durationSeconds":720,"durationLabel":"12 min","breakdown":[
          {"kind":"securityQueue","durationSeconds":480,"label":"Includes security (about 8 min)"}]}
        """#
        let decoded = try JSONDecoder().decode(KozmosTravelEstimatePresentation.self, from: Data(json.utf8))
        XCTAssertEqual(decoded.breakdown, [security])
        let bare = try JSONDecoder().decode(
            KozmosTravelEstimatePresentation.self,
            from: Data(#"{"durationSeconds":60,"durationLabel":"1 min"}"#.utf8))
        XCTAssertNil(bare.breakdown)
    }

    // MARK: The result card

    private func card(_ breakdown: [KozmosTravelEstimatePartPresentation]?) -> KozmosPOIResultCard {
        KozmosPOIResultCard(
            poi: KozmosPOIPresentation(id: "pret", name: "Pret", floorLabel: "Level 1"),
            result: KozmosPOIResultPresentation(
                poiId: "pret", resultIndex: 0, selected: false, travelEstimate: estimate(breakdown)),
            onSelect: { _ in })
    }

    func testTheResultCardSaysTheBreakdownAfterTheTime() {
        let row = card([security])
        XCTAssertEqual(row.breakdownText, "Includes security (about 8 min)")
        XCTAssertEqual(
            Array(row.accessibilityPhrases.map(\.text).suffix(2)),
            ["12 min", "Includes security (about 8 min)"]
        )
    }

    func testWithoutABreakdownTheResultCardSaysWhatItDidBefore() {
        XCTAssertNil(card(nil).breakdownText)
        XCTAssertNil(card([]).breakdownText)
        XCTAssertEqual(card(nil).accessibilityPhrases.map(\.text).last, "12 min")
    }

    // MARK: The details card

    private func panel(
        _ breakdown: [KozmosTravelEstimatePartPresentation]?,
        actions: [KozmosPOIAction] = [.navigate, .share]
    ) -> KozmosPOIDetailPanel {
        KozmosPOIDetailPanel(
            poi: KozmosPOIPresentation(id: "pret", name: "Pret", actions: actions),
            actionLabels: [.navigate: "Go", .share: "Share"],
            onAction: { _, _ in },
            details: KozmosPOIDetailsPresentation(travelEstimate: estimate(breakdown)))
    }

    func testTheDetailsCardDrawsTheBreakdownOnlyWhenGoCarriesTheEstimate() {
        XCTAssertEqual(panel([security]).estimateBreakdown, "Includes security (about 8 min)")
        XCTAssertNil(panel([security], actions: [.share]).estimateBreakdown)
        XCTAssertNil(panel(nil).estimateBreakdown)
        XCTAssertNil(panel([]).estimateBreakdown)
    }

    func testGoSaysTheBreakdownAfterItsTimeAndWithoutOneAsBefore() {
        XCTAssertEqual(
            POIDetailActionButton(label: "Go", systemImage: nil, estimate: "12 min · 400 m",
                                  estimateDetail: "Includes security (about 8 min)", action: {}).spokenEstimate,
            "12 min · 400 m, Includes security (about 8 min)"
        )
        XCTAssertEqual(
            POIDetailActionButton(label: "Go", systemImage: nil, estimate: "12 min · 400 m", action: {}).spokenEstimate,
            "12 min · 400 m"
        )
        XCTAssertEqual(POIDetailActionButton(label: "Share", systemImage: nil, action: {}).spokenEstimate, "")
    }
}
