import SwiftUI
import XCTest
@testable import Kozmos

/// GAP-171 (decision 209): a selectable table, React's `selectable` Table.
/// The select-all box is unchecked with no row selected, mixed with some
/// and checked with all; it adds or takes out this table's rows and keeps
/// any other ids; a selected row is on the hover fill with no divider under
/// it (decision 207); and VoiceOver hears the count.
final class KozmosTableSelectionTests: XCTestCase {
    func testTheSelectAllBoxIsUncheckedMixedOrChecked() {
        XCTAssertEqual(KozmosTableSelection.headerState(selected: 0, total: 3), .unchecked)
        XCTAssertEqual(KozmosTableSelection.headerState(selected: 1, total: 3), .indeterminate)
        XCTAssertEqual(KozmosTableSelection.headerState(selected: 3, total: 3), .checked)
        XCTAssertEqual(KozmosTableSelection.headerState(selected: 0, total: 0), .unchecked)
        // A tap on a mixed box checks it, which selects every row.
        XCTAssertEqual(KozmosCheckboxState.indeterminate.toggled, .checked)
    }

    func testSelectingAllAddsOrTakesOutTheRowsAndKeepsOtherIds() {
        let rows = ["ada", "grace", "katherine"]
        XCTAssertEqual(KozmosTableSelection.selectingAll(true, rows: rows, in: ["ada", "elsewhere"]),
                       ["ada", "grace", "katherine", "elsewhere"])
        XCTAssertEqual(KozmosTableSelection.selectingAll(false, rows: rows, in: ["ada", "grace", "elsewhere"]),
                       ["elsewhere"])
    }

    func testTheCountIsSaidInWords() {
        XCTAssertEqual(KozmosTableSelection.announcement(count: 0, total: 3), "No rows selected")
        XCTAssertEqual(KozmosTableSelection.announcement(count: 1, total: 3), "1 row selected")
        XCTAssertEqual(KozmosTableSelection.announcement(count: 3, total: 3), "3 rows selected")
    }

    func testASelectedRowIsOnTheHoverFillWithNoDividerUnderIt() {
        kozmosSameColour(KozmosTableSelection.fill(selected: true), KozmosColors.semanticsHoverFill)
        kozmosSameColour(KozmosTableSelection.fill(selected: false), Color.clear)
        XCTAssertEqual(KozmosTableSelection.dividerOpacity(selected: true), 0)
        XCTAssertEqual(KozmosTableSelection.dividerOpacity(selected: false), 1)
    }

    #if os(iOS)
    private struct Person: Identifiable {
        let name: String
        var id: String { name }
    }

    private struct Users: View {
        @State var selection: Set<String> = ["Ada Lovelace"]
        let people = [Person(name: "Ada Lovelace"), Person(name: "Grace Hopper")]
        var body: some View {
            KozmosTable(people, selection: $selection,
                        selectAllLabel: "Alle auswählen",
                        rowSelectLabel: { "Select \($0.name)" },
                        selectionAnnouncement: { count, total in "\(count) von \(total) ausgewählt" }) { person in
                KozmosTableRow { KozmosTableCell(person.name) }
            }
        }
    }

    /// What VoiceOver is given: the select-all box in the product's words
    /// with the count as its value, and each row's box named for its row.
    @MainActor func testVoiceOverHearsTheBoxesAndTheCount() async throws {
        try await inspectAccessibility(Users()) { window in
            let all = try accessibilityElement(named: "Alle auswählen", in: window)
            XCTAssertEqual(all.accessibilityValue, "1 von 2 ausgewählt")
            let ada = try accessibilityElement(named: "Select Ada Lovelace", in: window)
            XCTAssertEqual(ada.accessibilityValue, "Checked")
            let grace = try accessibilityElement(named: "Select Grace Hopper", in: window)
            XCTAssertEqual(grace.accessibilityValue, "Unchecked")
            // Activating a row's box selects it, and the count follows.
            XCTAssertTrue(grace.accessibilityActivate())
            try await Task.sleep(nanoseconds: 300_000_000)
            let after = try accessibilityElement(named: "Alle auswählen", in: window)
            XCTAssertEqual(after.accessibilityValue, "2 von 2 ausgewählt")
        }
    }
    #endif
}
