import XCTest
import SwiftUI
@testable import Kozmos

#if os(iOS)
/// Review finding N1: an action pressed on a result in the list reaches the
/// product, as React's list hands its `onAction` to every card. The list built
/// its cards without their handler, so Go and Details drew on the selected
/// result and did nothing when pressed. Pressed here as VoiceOver presses
/// them, through the list a product uses rather than a card on its own.
final class KozmosPOIResultListActionTests: HostedAccessibilityTestCase {
    private let cafe = KozmosPOIPresentation(id: "cafe", name: "Harbour Coffee", floorLabel: "Level 2")
    /// An ID a DOM identifier would escape: what reaches the product is the
    /// POI's own ID, not the identifier its row is found by.
    private let gate = KozmosPOIPresentation(id: "gate/12", name: "Gate 12", floorLabel: "Level 1")
    private let go = KozmosPOIResultActionPresentation(action: .navigate, label: "Go", primary: true)
    private let details = KozmosPOIResultActionPresentation(action: .details, label: "Details")

    /// Two results; the product's actions ride on both, and the list shows
    /// them on the selected one only.
    private func items(
        _ actions: [KozmosPOIResultActionPresentation],
        gateAvailable: Bool? = nil
    ) -> [KozmosPOIResultListItem] {
        [
            KozmosPOIResultListItem(poi: cafe, result: .init(poiId: "cafe", resultIndex: 0, actions: actions)),
            KozmosPOIResultListItem(
                poi: gate,
                result: .init(
                    poiId: "gate/12", resultIndex: 1,
                    available: gateAvailable,
                    unavailableReason: gateAvailable == false ? "Closed until 06:00" : nil,
                    actions: actions
                )
            )
        ]
    }

    /// What reached the product, in order.
    private final class Received {
        var actions: [String] = []
        var selections: [String] = []

        func action(_ action: KozmosPOIResultAction, _ poiId: String) { actions.append("\(action.rawValue) \(poiId)") }
        func select(_ poiId: String) { selections.append(poiId) }
    }

    @MainActor func testAnActionPressedInTheListReachesTheApp() async throws {
        let received = Received()
        let window = await host(
            KozmosPOIResultList(
                items: items([go, details]),
                resultCountLabel: "2 results",
                selectedPoiId: "gate/12",
                onSelect: received.select,
                onAction: received.action
            ) {
                Text("No places match.")
            }
        )
        defer { window.isHidden = true }

        XCTAssertTrue(try element(named: "Go", in: window).accessibilityActivate(), "Go did nothing")
        XCTAssertEqual(received.actions, ["navigate gate/12"], "Go did not reach the app once, with the POI's own ID")

        XCTAssertTrue(try element(named: "Details", in: window).accessibilityActivate(), "Details did nothing")
        XCTAssertEqual(received.actions, ["navigate gate/12", "details gate/12"])
        XCTAssertEqual(received.selections, [], "pressing an action selected its result")
    }

    /// The docs' example, as POIResultList.mdx writes it (DocSnippets): Go
    /// reaches the app.
    @MainActor func testTheDocsExampleReachesTheApp() async throws {
        let received = Received()
        let window = await host(ResultsWithActions(
            items: items([go]), selectedPoiId: "gate/12", onSelect: received.select, onAction: received.action
        ))
        defer { window.isHidden = true }

        XCTAssertTrue(try element(named: "Go", in: window).accessibilityActivate())
        XCTAssertEqual(received.actions, ["navigate gate/12"])
        XCTAssertEqual(received.selections, [])
    }

    /// The initialiser without an empty state hands actions on too.
    @MainActor func testTheShortInitialiserHandsActionsOnToo() async throws {
        let received = Received()
        let window = await host(
            KozmosPOIResultList(
                items: items([go]),
                resultCountLabel: "2 results",
                selectedPoiId: "cafe",
                onSelect: received.select,
                onAction: received.action
            )
        )
        defer { window.isHidden = true }

        XCTAssertTrue(try element(named: "Go", in: window).accessibilityActivate())
        XCTAssertEqual(received.actions, ["navigate cafe"])
        XCTAssertEqual(received.selections, [])
    }

    /// The product's words reach the card: each action's own label, and the
    /// name of the row VoiceOver announces on the way in.
    @MainActor func testTheActionsKeepTheProductsWords() async throws {
        let received = Received()
        let window = await host(
            KozmosPOIResultList(
                items: items([
                    .init(action: .navigate, label: "Los", primary: true),
                    .init(action: .details, label: "Einzelheiten")
                ]),
                resultCountLabel: "2 Ergebnisse",
                selectedPoiId: "gate/12",
                actionsLabel: "Aktionen für dieses Ergebnis",
                onSelect: received.select,
                onAction: received.action
            )
        )
        defer { window.isHidden = true }

        let row = groups(in: window).filter { $0.label == "Aktionen für dieses Ergebnis" }
        XCTAssertEqual(row.map(\.members), [["Los", "Einzelheiten"]],
                       "the action row is not named in the product's words: \(groups(in: window))")
        XCTAssertTrue(try element(named: "Einzelheiten", in: window).accessibilityActivate())
        XCTAssertEqual(received.actions, ["details gate/12"])
    }

    /// With a handler given, only what can run runs: beside Go, a disabled
    /// action is dimmed and runs nothing, and an unavailable result shows no
    /// actions and cannot be selected.
    @MainActor func testADisabledActionAndAnUnavailableResultStayInert() async throws {
        let received = Received()
        let share = KozmosPOIResultActionPresentation(action: .share, label: "Share", disabled: true)
        let open = await host(
            KozmosPOIResultList(
                items: items([go, share]),
                resultCountLabel: "2 results",
                selectedPoiId: "cafe",
                onSelect: received.select,
                onAction: received.action
            )
        )
        defer { open.isHidden = true }
        XCTAssertTrue(try element(named: "Go", in: open).accessibilityActivate())
        let dimmed = try element(named: "Share", in: open)
        XCTAssertTrue(dimmed.accessibilityTraits.contains(.notEnabled), "a disabled action is not heard as dimmed")
        _ = dimmed.accessibilityActivate()
        await settle()
        XCTAssertEqual(received.actions, ["navigate cafe"], "Go did not run once, or a disabled action ran")

        let closed = await host(
            KozmosPOIResultList(
                items: items([go, share], gateAvailable: false),
                resultCountLabel: "2 results",
                selectedPoiId: "gate/12",
                onSelect: received.select,
                onAction: received.action
            )
        )
        defer { closed.isHidden = true }
        XCTAssertFalse(labels(in: closed).contains("Go"), "an unavailable result offers actions: \(labels(in: closed))")
        let gateRow = try XCTUnwrap(elements(in: closed).first { $0.accessibilityLabel?.hasPrefix("Gate 12") == true },
                                    "no row for the unavailable result: \(labels(in: closed))")
        // A dimmed button, as the web's disabled one is: readable, not actionable.
        XCTAssertTrue(gateRow.accessibilityTraits.contains(.notEnabled), "an unavailable result is not heard as dimmed")
        _ = gateRow.accessibilityActivate()
        await settle()
        XCTAssertEqual(received.actions, ["navigate cafe"])
        XCTAssertEqual(received.selections, [], "an unavailable result was selected")
    }

    /// No handler, nothing to press. An action the product offers but gives
    /// the list no way to run is drawn disabled — the rule POIDetailPanel's
    /// supplementary actions follow on every platform — never an enabled
    /// button that does nothing. The card on its own keeps the same rule.
    @MainActor func testWithoutAHandlerTheActionsAreDrawnDisabled() async throws {
        var selected: [String] = []
        let window = await host(VStack(spacing: 16) {
            KozmosPOIResultList(
                items: items([go]),
                resultCountLabel: "2 results",
                selectedPoiId: "gate/12",
                onSelect: { selected.append($0) }
            )
            KozmosPOIResultCard(
                poi: cafe,
                result: .init(poiId: "cafe", resultIndex: 0, selected: true, actions: [details]),
                onSelect: { selected.append($0) }
            )
        })
        defer { window.isHidden = true }

        for label in ["Go", "Details"] {
            let action = try element(named: label, in: window)
            XCTAssertTrue(action.accessibilityTraits.contains(.button), "\(label) is not a button")
            XCTAssertTrue(action.accessibilityTraits.contains(.notEnabled),
                          "\(label) has no handler and is still an enabled button")
            _ = action.accessibilityActivate()
        }
        await settle()
        XCTAssertEqual(selected, [], "pressing an action selected its result")
    }
}
#endif
