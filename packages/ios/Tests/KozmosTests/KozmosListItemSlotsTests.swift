import XCTest
import SwiftUI
#if os(iOS)
import UIKit
#endif
@testable import Kozmos

/// `KozmosListItem`'s slots (GAP-195, decision 135) and `KozmosSettingsRow`
/// (GAP-040): the checklist row is a ListItem filled in, VoiceOver hears a
/// tour's status with its name, and a settings row's control is read by the
/// row's name with its description, its state and why it is disabled.
final class KozmosListItemSlotsTests: XCTestCase {
    func testEachStatusIsReadInEnglishOrTheProductsWords() {
        XCTAssertEqual(KozmosListItemStatus(.todo).spokenLabel, "Not started")
        XCTAssertEqual(KozmosListItemStatus(.inProgress).spokenLabel, "In progress")
        XCTAssertEqual(KozmosListItemStatus(.done).spokenLabel, "Done")
        XCTAssertEqual(KozmosListItemStatus(.done, label: "Terminé").spokenLabel, "Terminé")
    }

    func testARowWithoutSlotsIsItsTextAndAnyFilledSlotDrawsTheSlots() {
        XCTAssertFalse(KozmosListItem("Reception").isSlotted)
        XCTAssertTrue(KozmosListItem("Explore the map", meta: "2 min").isSlotted)
        XCTAssertTrue(KozmosListItem("Visitor", selected: true).isSlotted)
        XCTAssertTrue(KozmosListItem("Visitor").trailing { Text("x") }.isSlotted)
        XCTAssertTrue(KozmosListItem("Visitor").leading { Text("x") }.isSlotted)
    }

    func testTheSettingsRowsStateResetAndReason() {
        let inherited = KozmosSettingsRow("Analytics", description: "Usage events.", state: .inherited, onReset: {}) { EmptyView() }
        XCTAssertEqual(inherited.stateLabel, "Inherited")
        XCTAssertFalse(inherited.showsReset, "an inherited row offers no reset")
        XCTAssertEqual(inherited.controlHint, "Usage events., Inherited")

        let overridden = KozmosSettingsRow("Banner", state: .overridden, overriddenLabel: "Geändert", onReset: {}) { EmptyView() }
        XCTAssertEqual(overridden.stateLabel, "Geändert")
        XCTAssertTrue(overridden.showsReset)

        let disabled = KozmosSettingsRow(
            "Geofencing", state: .overridden, disabled: true,
            disabledReason: "Turn on Positioning first.", onReset: {}
        ) { EmptyView() }
        XCTAssertFalse(disabled.showsReset, "a disabled row offers no reset")
        XCTAssertEqual(disabled.controlHint, "Overridden, Turn on Positioning first.")

        let enabledWithReason = KozmosSettingsRow("Geofencing", disabledReason: "Not shown.") { EmptyView() }
        XCTAssertNil(enabledWithReason.shownReason, "the reason shows only while disabled")
        XCTAssertNil(enabledWithReason.stateLabel)
    }

    #if os(iOS)
    /// VoiceOver walks the checklist row in its order: the status, then the
    /// title, its tag, the description and the meta.
    @MainActor func testTheChecklistRowReadsItsStatusThenItsName() async throws {
        let row = KozmosListItem("Explore the map", description: "Pan, zoom and change levels.", meta: "2 min")
            .leading { KozmosListItemStatus(.done) }
            .titleAddon { KozmosTag("Viewer", variant: .secondary) }
        try await MenusAXTree.inspect(VStack { row }) { window in
            XCTAssertEqual(
                MenusAXTree.elements(window).map { $0.accessibilityLabel ?? "-" },
                ["Done", "Explore the map", "Viewer", "Pan, zoom and change levels.", "2 min"],
                "the tree:\n\(MenusAXTree.describe(window))"
            )
        }
    }

    /// The control is named by the row and hinted with its description and
    /// state; overridden, Reset to default is a button after it.
    @MainActor func testTheSettingsRowsControlIsNamedByTheRow() async throws {
        let row = KozmosSettingsRow("Show the banner", description: "Above the map.", state: .overridden, onReset: {}) {
            KozmosSwitch(checked: .constant(true))
        }
        try await MenusAXTree.inspect(VStack { row }) { window in
            let found = MenusAXTree.elements(window)
            let toggle = found.first { $0.accessibilityLabel == "Show the banner" && $0.accessibilityHint != nil }
            XCTAssertEqual(toggle?.accessibilityHint, "Above the map., Overridden", "the tree:\n\(MenusAXTree.describe(window))")
            XCTAssertTrue(found.contains { $0.accessibilityLabel == "Reset to default" }, "the tree:\n\(MenusAXTree.describe(window))")
        }
    }
    #endif
}
