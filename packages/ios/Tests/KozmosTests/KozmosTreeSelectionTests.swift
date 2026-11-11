import SwiftUI
import XCTest
@testable import Kozmos

/// GAP-151: a set of selected ids, with Shift ranges and Command toggles;
/// section headings whose items sit at the section's depth; only the rows in
/// view made. The rules are read apart from the drawing, so they run on a Mac
/// as well; the drawing's tests below run on the simulator.
final class KozmosTreeSelectionTests: XCTestCase {
    /// A level of Map Content: its POI section (one item disabled) and its
    /// Structural section, the level open.
    private static let level = [
        Node(id: "level", value: "Level 1", children: [
            .section("POI", id: "poi", count: "3", children: [
                Node(id: "cafe", value: "Bean & Leaf Café"),
                Node(id: "gate", value: "Gate A12", isDisabled: true),
                Node(id: "desk", value: "Help desk"),
            ]),
            .section("Structural", id: "structural", count: "2", children: [
                Node(id: "wall", value: "Wall"),
                Node(id: "door", value: "Door"),
            ]),
        ]),
    ]
    private static var rows: [KozmosTree.Row] { KozmosTree.visibleRows(level, expanded: [[0]]) }

    /// A section's items sit at the section's own depth, under its heading,
    /// and are drawn whether or not anything opened them; the heading is no
    /// parent, so it neither opens nor closes.
    func testASectionsItemsSitAtItsDepthAndAlwaysShow() {
        let rows = Self.rows
        XCTAssertEqual(rows.map(\.node.id), ["level", "poi", "cafe", "gate", "desk", "structural", "wall", "door"])
        XCTAssertEqual(rows.map(\.depth), [0, 1, 1, 1, 1, 1, 1, 1])
        XCTAssertFalse(rows[1].isParent, "a section opens and closes")
        XCTAssertFalse(rows[1].isSelectable, "a section can be selected")
        let root = KozmosTree.visibleRows([.section("POI", children: [Node(value: "Café")])], expanded: [])
        XCTAssertEqual(root.map(\.depth), [0, 0], "a section's items are indented")
        XCTAssertEqual(KozmosTree.visibleRows(Self.level, expanded: []).count, 1, "a closed level shows its sections")
    }

    /// In a multiple tree a tap adds the row, a second tap takes it away: on
    /// touch there is no Command key to hold.
    func testATapAddsOrRemovesARowInAMultipleTree() {
        var result = KozmosTreeSelection.pick("cafe", rows: Self.rows, mode: .multiple, modifiers: [], selection: [], anchor: nil)
        result = KozmosTreeSelection.pick("wall", rows: Self.rows, mode: .multiple, modifiers: [],
                                          selection: result.selection, anchor: result.anchor)
        XCTAssertEqual(result.selection, ["cafe", "wall"])
        result = KozmosTreeSelection.pick("cafe", rows: Self.rows, mode: .multiple, modifiers: .command,
                                          selection: result.selection, anchor: result.anchor)
        XCTAssertEqual(result.selection, ["wall"])
        XCTAssertEqual(result.anchor, "cafe")
    }

    /// A single tree holds one row, whatever is held.
    func testASingleTreeHoldsOneRow() {
        let result = KozmosTreeSelection.pick("door", rows: Self.rows, mode: .single, modifiers: .shift,
                                              selection: ["cafe"], anchor: "cafe")
        XCTAssertEqual(result.selection, ["door"])
    }

    /// Shift selects from the anchor to the row, skipping section headings
    /// and disabled rows, in place of what was selected; Command with Shift
    /// adds the range to it.
    func testShiftSelectsTheRangeSkippingSectionsAndDisabledRows() {
        let shift = KozmosTreeSelection.pick("wall", rows: Self.rows, mode: .multiple, modifiers: .shift,
                                             selection: ["level", "cafe"], anchor: "cafe")
        XCTAssertEqual(shift.selection, ["cafe", "desk", "wall"])
        XCTAssertEqual(shift.anchor, "cafe", "a range moved the anchor")
        let upwards = KozmosTreeSelection.pick("cafe", rows: Self.rows, mode: .multiple, modifiers: .shift,
                                               selection: [], anchor: "door")
        XCTAssertEqual(upwards.selection, ["cafe", "desk", "wall", "door"])
        let added = KozmosTreeSelection.pick("desk", rows: Self.rows, mode: .multiple, modifiers: [.shift, .command],
                                             selection: ["level", "door"], anchor: "cafe")
        XCTAssertEqual(added.selection, ["level", "door", "cafe", "desk"])
    }

    /// Shift with the arrows, Home and End selects from the anchor to the
    /// row the keyboard lands on; the arrows alone move without selecting;
    /// Space adds or removes the row; Command-A takes every enabled row.
    func testTheKeyboardMovesAndSelectsRanges() {
        let rows = Self.rows
        let down = KozmosTreeSelection.key(.down, rows: rows, mode: .multiple, modifiers: [], focused: "cafe",
                                           selection: ["cafe"], anchor: "cafe")
        XCTAssertEqual(down.focused, "desk", "the arrow did not skip the disabled row")
        XCTAssertEqual(down.selection, ["cafe"], "an arrow alone selected")
        let shiftDown = KozmosTreeSelection.key(.down, rows: rows, mode: .multiple, modifiers: .shift, focused: "desk",
                                                selection: ["cafe"], anchor: "cafe")
        XCTAssertEqual(shiftDown.focused, "wall", "the arrow did not skip the section heading")
        XCTAssertEqual(shiftDown.selection, ["cafe", "desk", "wall"])
        let shiftEnd = KozmosTreeSelection.key(.end, rows: rows, mode: .multiple, modifiers: .shift, focused: "wall",
                                               selection: shiftDown.selection, anchor: shiftDown.anchor)
        XCTAssertEqual(shiftEnd.selection, ["cafe", "desk", "wall", "door"])
        let shiftHome = KozmosTreeSelection.key(.home, rows: rows, mode: .multiple, modifiers: .shift, focused: "door",
                                                selection: shiftEnd.selection, anchor: shiftEnd.anchor)
        XCTAssertEqual(shiftHome.selection, ["level", "cafe"])
        let space = KozmosTreeSelection.key(.space, rows: rows, mode: .multiple, modifiers: [], focused: "door",
                                            selection: ["cafe"], anchor: "cafe")
        XCTAssertEqual(space.selection, ["cafe", "door"])
        let all = KozmosTreeSelection.key(.selectAll, rows: rows, mode: .multiple, modifiers: .command, focused: "door",
                                          selection: [], anchor: nil)
        XCTAssertEqual(all.selection, ["level", "cafe", "desk", "wall", "door"])
    }

    /// Typing moves to the next row whose name starts with what was typed.
    func testTypingMovesToTheNextMatchingRow() {
        XCTAssertEqual(KozmosTreeSelection.typeAhead("h", rows: Self.rows, after: "cafe"), "desk")
        XCTAssertEqual(KozmosTreeSelection.typeAhead("d", rows: Self.rows, after: "desk"), "door")
        XCTAssertEqual(KozmosTreeSelection.typeAhead("l", rows: Self.rows, after: "door"), "level", "it did not wrap")
        XCTAssertEqual(KozmosTreeSelection.typeAhead("be", rows: Self.rows, after: "cafe"), "cafe", "a longer prefix moved on")
        XCTAssertNil(KozmosTreeSelection.typeAhead("gate", rows: Self.rows, after: nil), "type-ahead landed on a disabled row")
    }
}

#if os(iOS)
import UIKit

/// The drawing: only a screenful of Map Content's 13,031 items made; a
/// selected row and a section heading said to VoiceOver; meta below the name
/// keeping the name whole (GAP-107).
final class KozmosTreeDrawingTests: XCTestCase {
    /// Records each row as the tree makes it.
    private final class Made { var ids: [String] = [] }

    /// Pointr Cloud's Map Content list: 13,031 items in one tree, under a
    /// level, in its POI, Interior asset, Structural and Virtual sections.
    /// The tree is 800 high in a window: a screenful is some 20 rows. A
    /// stack that made every row would make 13,036.
    @MainActor func testOnlyAScreenfulOf13031RowsIsMade() async throws {
        let counts = [("POI", 8_120), ("Interior asset", 3_402), ("Structural", 1_309), ("Virtual", 200)]
        XCTAssertEqual(counts.map(\.1).reduce(0, +), 13_031)
        let nodes = [Node(id: "level", value: "Level 1", children: counts.map { name, count in
            .section(name, id: name, count: "\(count)", children: (0..<count).map { Node(id: "\(name)-\($0)", value: "\(name) \($0)") })
        })]
        XCTAssertEqual(KozmosTree.visibleRows(nodes, expanded: [[0]]).count, 13_036)

        let made = Made()
        let tree = KozmosTree(nodes: nodes, divided: true, selectionMode: .multiple, expanded: [[0]])
            .environment(\.kozmosTreeRowRealised) { made.ids.append($0.id) }
        let size = CGSize(width: 400, height: 800)
        let window = UIWindow(frame: CGRect(origin: .zero, size: size))
        window.rootViewController = UIHostingController(rootView: tree.frame(width: size.width, height: size.height))
        window.makeKeyAndVisible()
        defer { window.isHidden = true }
        try await Task.sleep(nanoseconds: 500_000_000)

        let distinct = Set(made.ids)
        XCTAssertTrue(distinct.contains("level") && distinct.contains("POI-0"), "the first rows were not made: \(made.ids.prefix(5))")
        XCTAssertGreaterThan(distinct.count, 12, "fewer rows made than fill the screen")
        XCTAssertLessThan(distinct.count, 60, "\(distinct.count) of 13,036 rows made for a screenful")
        XCTAssertFalse(distinct.contains("Virtual-199"), "the last row was made")
    }

    /// A selected row says it is selected; a row not selected does not. A
    /// section heading is a heading, its count read with its name.
    @MainActor func testASelectedRowAndASectionHeadingSaySo() async throws {
        let rows = VStack(spacing: 0) {
            KozmosTreeSectionRow(node: .section("POI", count: "120", children: []), depth: 0, density: .default, bleed: 0)
            KozmosTreeDividedRow(node: Node(value: "Bean & Leaf Café"), depth: 0, isParent: false, open: false,
                                 density: .default, bleed: 0, divided: false, selected: true) {}
            KozmosTreeDividedRow(node: Node(value: "Help desk"), depth: 0, isParent: false, open: false,
                                 density: .default, bleed: 0, divided: false, selected: false) {}
        }
        try await inspectAccessibility(rows, size: CGSize(width: 400, height: 400)) { window in
            let elements = accessibilityElements(window)
            @MainActor func element(_ words: String) throws -> NSObject {
                try XCTUnwrap(elements.first { $0.accessibilityLabel?.contains(words) == true },
                              "nothing says \(words):\n\(describeAccessibility(window))")
            }
            XCTAssertTrue(try element("Bean & Leaf Café").accessibilityTraits.contains(.selected))
            XCTAssertFalse(try element("Help desk").accessibilityTraits.contains(.selected))
            let heading = try element("POI")
            XCTAssertTrue(heading.accessibilityTraits.contains(.header), "the section is no heading")
            XCTAssertTrue(heading.accessibilityLabel?.contains("120") == true, "the count is not read: \(heading.accessibilityLabel ?? "")")
            XCTAssertFalse(heading.accessibilityTraits.contains(.button), "a section heading is a button")
        }
    }

    /// The name's ink: foreground 100, darker than the meta's and the icon's
    /// foreground 400.
    private func nameWidth(_ placement: KozmosTreeMetaPlacement?, _ name: String) async throws -> CGFloat {
        let size = CGSize(width: 260, height: 80)
        let row = KozmosTreeDividedRow(
            node: Node(value: "Bean & Leaf Café", meta: placement == nil ? nil : "Changes Awaiting Publish"),
            depth: 0, isParent: false, open: false, density: .default, bleed: 0, divided: false,
            metaPlacement: placement ?? .inline
        ) {}
        let pixels = try await RenderedPixels.render(row.background(Color.white).environment(\.colorScheme, .light), size: size)
        let attachment = XCTAttachment(image: pixels.image)
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
        let box = try XCTUnwrap(pixels.boundingBox(in: CGRect(origin: .zero, size: size), where: RenderedPixels.isDarkText),
                                "no name drawn in \(name)")
        return box.width
    }

    /// GAP-107: in a narrow column the meta after the name cuts it short;
    /// below, the name is drawn whole, as it is with no meta.
    @MainActor func testMetaBelowKeepsTheNameWhole() async throws {
        let whole = try await nameWidth(nil, "gap-107-no-meta")
        let inline = try await nameWidth(.inline, "gap-107-inline")
        let below = try await nameWidth(.below, "gap-107-below")
        XCTAssertLessThan(inline, whole - 10, "the inline meta did not cut the name: the column is too wide to show it")
        XCTAssertEqual(below, whole, accuracy: 1, "the name under which the meta sits is not whole")
    }

    /// A selected row sits on the hover fill at full strength, #E3E4E8 in
    /// light (decision 173).
    @MainActor func testASelectedRowSitsOnTheHoverFill() async throws {
        let size = CGSize(width: 260, height: 60)
        let row = KozmosTreeDividedRow(node: Node(value: "Help desk"), depth: 0, isParent: false, open: false,
                                       density: .default, bleed: 0, divided: false, selected: true) {}
        let pixels = try await RenderedPixels.render(row.background(Color.white).environment(\.colorScheme, .light), size: size)
        let fill = pixels.color(at: CGPoint(x: 230, y: 22))
        XCTAssertEqual(Int(fill.r), 0xE3, accuracy: 3, "\(fill)")
        XCTAssertEqual(Int(fill.g), 0xE4, accuracy: 3, "\(fill)")
        XCTAssertEqual(Int(fill.b), 0xE8, accuracy: 3, "\(fill)")
    }
}
#endif
