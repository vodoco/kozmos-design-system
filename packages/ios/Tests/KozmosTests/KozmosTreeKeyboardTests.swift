import SwiftUI
import XCTest
@testable import Kozmos

/// PR #524's review: the tree's keys and its closing as React's and
/// Compose's are. The left arrow goes past a section to the parent; closing
/// a parent takes its hidden rows out of the selection, in one write; `*`
/// opens every parent beside the row; Page Up and Page Down move a page of
/// enabled rows; type-ahead never takes `+`, `-`, `*` or a key with Command,
/// Control or Option held, and the same letter again goes on to the next
/// match. Rules apart from the drawing, so they run on a Mac as well.
final class KozmosTreeKeyboardTests: XCTestCase {
    /// A level with its POI section (a parent among its items) and its
    /// Structural section, a second level with a child, and a leaf.
    private static let nodes = [
        Node(id: "level", value: "Level 1", children: [
            .section("POI", id: "poi", children: [
                Node(id: "cafe", value: "Café", children: [Node(id: "counter", value: "Counter")]),
                Node(id: "gate", value: "Gate"),
            ]),
            .section("Structural", id: "structural", children: [
                Node(id: "stairs", value: "Stairs", children: [Node(id: "landing", value: "Landing")]),
                Node(id: "wall", value: "Wall"),
            ]),
        ]),
        Node(id: "level-2", value: "Level 2", children: [Node(id: "lobby", value: "Lobby")]),
        Node(id: "car-park", value: "Car park"),
    ]

    private static func row(_ id: String, _ rows: [KozmosTree.Row]) throws -> KozmosTree.Row {
        try XCTUnwrap(rows.first { $0.node.id == id }, "no row \(id)")
    }

    /// The left arrow on a section's item goes to the row the section is
    /// under, not to the section heading, which no focus lands on.
    func testTheLeftArrowGoesPastASectionToTheParent() throws {
        let rows = KozmosTree.visibleRows(Self.nodes, expanded: [[0], [0, 0, 0]])
        XCTAssertEqual(KozmosTree.parentRow(of: try Self.row("cafe", rows), in: rows)?.node.id, "level")
        XCTAssertEqual(KozmosTree.parentRow(of: try Self.row("wall", rows), in: rows)?.node.id, "level")
        XCTAssertEqual(KozmosTree.parentRow(of: try Self.row("counter", rows), in: rows)?.node.id, "cafe")
        XCTAssertNil(KozmosTree.parentRow(of: try Self.row("level", rows), in: rows))
    }

    /// Closing a parent takes the rows it hides out of the selection, and
    /// leaves the rest.
    func testClosingAParentDeselectsTheRowsItHides() {
        let level = Self.nodes[0]
        let kept = KozmosTreeSelection.hiding(level, from: ["level", "cafe", "counter", "wall", "lobby", "elsewhere"])
        XCTAssertEqual(kept, ["level", "lobby", "elsewhere"])
    }

    /// A tap that closes a parent writes the selection once, already
    /// without the rows it hid; in a multiple tree the parent itself is
    /// added by the same tap.
    func testATapThatClosesAParentWritesTheSelectionOnce() throws {
        var selection: Set<String> = ["cafe", "wall", "lobby"]
        var writes: [Set<String>] = []
        let binding = Binding(get: { selection }, set: { selection = $0; writes.append($0) })
        let tree = KozmosTree(nodes: Self.nodes, divided: false, selectionMode: .multiple, selection: binding,
                              expanded: [[0]])
        let rows = KozmosTree.visibleRows(Self.nodes, expanded: [[0]])
        tree.activate(try Self.row("level", rows), rows: rows, modifiers: [])
        XCTAssertEqual(writes, [["level", "lobby"]], "the selection was written \(writes.count) times: \(writes)")
    }

    /// `*` opens every parent beside the row: past the sections, the
    /// parents in all of a level's sections; at the root, the other levels.
    func testStarOpensEveryParentBesideTheRow() throws {
        let rows = KozmosTree.visibleRows(Self.nodes, expanded: [[0]])
        XCTAssertEqual(KozmosTree.siblingParents(of: try Self.row("gate", rows), in: Self.nodes), [[0, 0, 0], [0, 1, 0]])
        XCTAssertEqual(KozmosTree.siblingParents(of: try Self.row("car-park", rows), in: Self.nodes), [[0], [1]])
    }

    /// Page Down and Page Up move a page of enabled rows, stopping at the
    /// ends; with Shift in a multiple tree, the range goes with them.
    func testPageKeysMoveAPageOfEnabledRows() {
        let nodes = (0..<30).map { Node(id: "row-\($0)", value: "Row \($0)", isDisabled: $0 == 3) }
        let rows = KozmosTree.visibleRows(nodes, expanded: [])
        let down = KozmosTreeSelection.key(.pageDown, rows: rows, mode: .multiple, modifiers: [], focused: "row-0",
                                           selection: [], anchor: nil, page: 10)
        XCTAssertEqual(down.focused, "row-11", "a page skipped no disabled row")
        XCTAssertEqual(down.selection, [])
        let end = KozmosTreeSelection.key(.pageDown, rows: rows, mode: .multiple, modifiers: [], focused: "row-25",
                                          selection: [], anchor: nil, page: 10)
        XCTAssertEqual(end.focused, "row-29")
        let up = KozmosTreeSelection.key(.pageUp, rows: rows, mode: .multiple, modifiers: .shift, focused: "row-15",
                                         selection: [], anchor: "row-15", page: 10)
        XCTAssertEqual(up.focused, "row-5")
        XCTAssertEqual(up.selection, Set((5...15).map { "row-\($0)" }))
    }

    /// Type-ahead never takes `+`, `-` or `*`, nor a key with Command,
    /// Control or Option held; Shift is a capital.
    func testTypeAheadTakesNoOperatorAndNoModifiedKey() {
        for key in ["+", "-", "*"] {
            XCTAssertFalse(KozmosTreeSelection.types(key, modifiers: []), "\(key) typed")
        }
        for modifier: EventModifiers in [.command, .control, .option] {
            XCTAssertFalse(KozmosTreeSelection.types("p", modifiers: modifier), "p typed with \(modifier)")
        }
        XCTAssertTrue(KozmosTreeSelection.types("p", modifiers: []))
        XCTAssertTrue(KozmosTreeSelection.types("P", modifiers: .shift))
    }

    /// The same letter again goes on to the next row starting with it, and
    /// wraps; a different longer string keeps to the row while it matches.
    func testTheSameLetterAgainCyclesThroughTheMatches() {
        let nodes = ["Gate", "Parking", "Pharmacy", "Post office"].map { Node(id: $0, value: $0) }
        let rows = KozmosTree.visibleRows(nodes, expanded: [])
        XCTAssertEqual(KozmosTreeSelection.typeAhead("p", rows: rows, from: "Gate"), "Parking")
        XCTAssertEqual(KozmosTreeSelection.typeAhead("pp", rows: rows, from: "Parking"), "Pharmacy")
        XCTAssertEqual(KozmosTreeSelection.typeAhead("ppp", rows: rows, from: "Pharmacy"), "Post office")
        XCTAssertEqual(KozmosTreeSelection.typeAhead("pppp", rows: rows, from: "Post office"), "Parking", "it did not wrap")
        XCTAssertEqual(KozmosTreeSelection.typeAhead("ph", rows: rows, from: "Pharmacy"), "Pharmacy", "a matching row was left")
        XCTAssertEqual(KozmosTreeSelection.typeAhead("po", rows: rows, from: "Pharmacy"), "Post office")
    }
}
