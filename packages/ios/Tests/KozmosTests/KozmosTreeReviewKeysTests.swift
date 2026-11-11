import SwiftUI
import XCTest
@testable import Kozmos

/// PR #524's second review, as React and Compose do it: closing a parent
/// keeps a single tree's one row and drops a multiple tree's hidden rows in
/// one write; a Space in the middle of a type-ahead word is typed, not a
/// selection; a page is the rows that fit, less one.
final class KozmosTreeReviewKeysTests: XCTestCase {
    private static let nodes = [
        Node(id: "level", value: "Level 1", children: [
            Node(id: "cafe", value: "Café"),
            Node(id: "help", value: "Help desk"),
        ]),
        Node(id: "car-park", value: "Car park"),
    ]

    private func close(_ mode: KozmosTreeSelectionMode, selected: Set<String>) throws -> [Set<String>] {
        var selection = selected
        var writes: [Set<String>] = []
        let binding = Binding(get: { selection }, set: { selection = $0; writes.append($0) })
        let tree = KozmosTree(nodes: Self.nodes, divided: false, selectionMode: mode, selection: binding, expanded: [[0]])
        let rows = KozmosTree.visibleRows(Self.nodes, expanded: [[0]])
        tree.toggleOpen(try XCTUnwrap(rows.first { $0.node.id == "level" }))
        return writes
    }

    /// A single tree keeps its one row when its parent closes over it.
    func testClosingAParentKeepsASingleTreesHiddenRow() throws {
        XCTAssertEqual(try close(.single, selected: ["cafe"]), [], "a single tree's hidden row was deselected")
    }

    /// A multiple tree drops the rows the parent hides, in one write.
    func testClosingAParentDropsAMultipleTreesHiddenRowsInOneWrite() throws {
        XCTAssertEqual(try close(.multiple, selected: ["cafe", "help", "car-park"]), [["car-park"]])
    }

    /// Within 500 ms of a letter a Space is typed: "help " goes on to
    /// Help desk. With nothing typed, or later, Space selects.
    func testASpaceInATypeAheadWordIsTyped() {
        XCTAssertTrue(KozmosTreeSelection.spaceTypes(typed: "help", since: 0.2))
        XCTAssertFalse(KozmosTreeSelection.spaceTypes(typed: "help", since: 0.6), "a late Space was typed")
        XCTAssertFalse(KozmosTreeSelection.spaceTypes(typed: "", since: 0), "a Space with nothing typed was typed")
        let rows = KozmosTree.visibleRows(Self.nodes, expanded: [[0]])
        XCTAssertEqual(KozmosTreeSelection.typeAhead("help ", rows: rows, from: "help"), "help")
    }

    /// A page is floor(height / row height) − 1, at least one; a divided
    /// row is a point taller. Rows are 44 at either density.
    func testAPageIsTheRowsThatFitLessOne() {
        XCTAssertEqual(KozmosTree.pageSize(viewHeight: 800, density: .default, divided: false), 17)
        XCTAssertEqual(KozmosTree.pageSize(viewHeight: 800, density: .compact, divided: false), 17)
        XCTAssertEqual(KozmosTree.pageSize(viewHeight: 800, density: .default, divided: true), 16)
        XCTAssertEqual(KozmosTree.pageSize(viewHeight: 800, density: .compact, divided: true), 16)
        XCTAssertEqual(KozmosTree.pageSize(viewHeight: 50, density: .default, divided: false), 1)
        XCTAssertEqual(KozmosTree.pageSize(viewHeight: 0, density: .compact, divided: false), 1)
    }

    #if os(iOS)
    /// The row height the page counts is the row drawn, at each density,
    /// divided a point taller.
    @MainActor func testThePageCountsTheRowAsDrawn() {
        for density in [KozmosTreeDensity.default, .compact] {
            for divided in [false, true] {
                let row = KozmosTreeDividedRow(node: Node(value: "Help desk"), depth: 0, isParent: false, open: false,
                                               density: density, bleed: 0, divided: divided) {}
                let height = UIHostingController(rootView: row).sizeThatFits(in: CGSize(width: 320, height: 1000)).height
                XCTAssertEqual(height, density.rowHeight + (divided ? 1 : 0), accuracy: 0.5, "\(density), divided \(divided)")
            }
        }
    }
    #endif
}
