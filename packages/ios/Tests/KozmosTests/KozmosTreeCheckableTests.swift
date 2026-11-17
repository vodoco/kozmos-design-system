import SwiftUI
import XCTest
@testable import Kozmos

/// GAP-277 (MAP-32 row 4): Add New Access picks several clients, or some of a
/// client's sites, with a checkbox on each row; checking a client clears its
/// sites, and checking a site clears its client; the chevron at the row's
/// end. The rules are read apart from the drawing, so they run on a Mac as
/// well; the drawing's tests below run on the simulator.
final class KozmosTreeCheckableTests: XCTestCase {
    private static let clients = [
        Node(id: "acme", value: "Acme", children: [
            Node(id: "acme-hq", value: "Acme HQ"),
            Node(id: "acme-lab", value: "Acme Lab"),
        ]),
        Node(id: "globex", value: "Globex", children: [
            .section("Places", id: "globex-places", children: [
                Node(id: "globex-east", value: "Globex East"),
            ]),
        ]),
        Node(id: "initech", value: "Initech"),
    ]

    /// Checking a client clears its sites, open or not; checking a site
    /// clears its client, past a section between them; the rest stay.
    func testCheckingAClientOrASiteClearsTheOther() {
        var checked = KozmosTreeChecks.toggle("acme", in: Self.clients, checked: ["acme-hq", "acme-lab", "globex-east"],
                                              rule: .exclusive)
        XCTAssertEqual(checked, ["acme", "globex-east"])
        checked = KozmosTreeChecks.toggle("acme-lab", in: Self.clients, checked: checked, rule: .exclusive)
        XCTAssertEqual(checked, ["acme-lab", "globex-east"])
        checked = KozmosTreeChecks.toggle("globex", in: Self.clients, checked: checked, rule: .exclusive)
        XCTAssertEqual(checked, ["acme-lab", "globex"])
    }

    /// A second check clears the row, and only the row.
    func testCheckingAgainClearsTheRow() {
        let checked = KozmosTreeChecks.toggle("acme", in: Self.clients, checked: ["acme", "initech"], rule: .exclusive)
        XCTAssertEqual(checked, ["initech"])
    }

    /// `.independent` leaves every other row as it is: a site, or a client
    /// that is not mixed (a mixed client checks its sites, decision 211,
    /// KozmosTreeMixedTests).
    func testIndependentChecksLeaveTheOthers() {
        var checked = KozmosTreeChecks.toggle("acme-lab", in: Self.clients, checked: ["acme-hq"], rule: .independent)
        XCTAssertEqual(checked, ["acme-hq", "acme-lab"])
        checked = KozmosTreeChecks.toggle("globex", in: Self.clients, checked: ["acme-hq"], rule: .independent)
        XCTAssertEqual(checked, ["acme-hq", "globex"])
    }

    /// A tap on a checkable row writes its check to the selection once, by
    /// the rule; a disabled row never checks.
    func testATapChecksTheRowAndWritesOnce() throws {
        var checked: Set<String> = ["acme-hq"]
        var writes: [Set<String>] = []
        let binding = Binding(get: { checked }, set: { checked = $0; writes.append($0) })
        let nodes = Self.clients + [Node(id: "old", value: "Old", isDisabled: true)]
        let tree = KozmosTree(nodes: nodes, divided: false, selection: binding, checkable: true, expanded: [[0]])
        let rows = KozmosTree.visibleRows(nodes, expanded: [[0]])
        tree.activate(try XCTUnwrap(rows.first { $0.node.id == "acme" }), rows: rows, modifiers: [])
        XCTAssertEqual(writes, [["acme"]], "the checks were not the selection's, by the rule, in one write")
        tree.activate(try XCTUnwrap(rows.first { $0.node.id == "old" }), rows: rows, modifiers: [])
        XCTAssertEqual(writes.count, 1, "a disabled row was checked")
    }

    /// VoiceOver's value: the check, then whether a parent is open.
    /// Closing a parent keeps its checked rows, as a multiple tree would not.
    func testClosingAParentKeepsItsChecks() throws {
        var checked: Set<String> = ["acme-hq"]
        var writes: [Set<String>] = []
        let binding = Binding(get: { checked }, set: { checked = $0; writes.append($0) })
        let tree = KozmosTree(nodes: Self.clients, divided: false, selectionMode: .multiple, selection: binding,
                              checkable: true, expanded: [[0]])
        let rows = KozmosTree.visibleRows(Self.clients, expanded: [[0]])
        tree.toggleOpen(try XCTUnwrap(rows.first { $0.node.id == "acme" }))
        XCTAssertTrue(writes.isEmpty, "closing the client changed the checks: \(writes)")
    }

    func testARowSaysItsCheckThenWhetherItIsOpen() {
        XCTAssertEqual(KozmosTreeChecks.spokenValue(checked: .checked, isParent: true, open: false), "Checked, Collapsed")
        XCTAssertEqual(KozmosTreeChecks.spokenValue(checked: .unchecked, isParent: false, open: false), "Unchecked")
        XCTAssertEqual(KozmosTreeChecks.spokenValue(checked: nil, isParent: true, open: true), "Expanded")
        XCTAssertEqual(KozmosTreeChecks.spokenValue(checked: nil, isParent: false, open: false), "")
    }
}

#if os(iOS)
extension KozmosTreeCheckableTests {
    private static let size = CGSize(width: 300, height: 60)

    @MainActor private func render(_ row: KozmosTreeDividedRow, _ name: String) async throws -> RenderedPixels {
        let pixels = try await RenderedPixels.render(
            row.background(Color.white).environment(\.colorScheme, .light), size: Self.size)
        let attachment = XCTAttachment(image: pixels.image)
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
        return pixels
    }

    /// The theme fill, #135BEC in light.
    private static func isThemeFill(_ r: UInt8, _ g: UInt8, _ b: UInt8) -> Bool {
        abs(Int(r) - 0x13) < 24 && abs(Int(g) - 0x5B) < 24 && abs(Int(b) - 0xEC) < 24
    }

    /// Anything drawn: not the white the row sits on.
    private static func isInk(_ r: UInt8, _ g: UInt8, _ b: UInt8) -> Bool { r < 230 || g < 230 || b < 230 }

    /// A checked row draws Checkbox's 20 box in the theme fill, after the
    /// disclosure's 16 and before the icon; an unchecked one no fill.
    @MainActor func testACheckedRowDrawsTheBoxInTheThemeFill() async throws {
        let leaf = Node(value: "Acme HQ")
        let checked = try await render(
            KozmosTreeDividedRow(node: leaf, depth: 0, isParent: false, open: false, density: .default, bleed: 0,
                                 divided: false, checked: .checked) {}, "gap-277-checked")
        let box = try XCTUnwrap(checked.boundingBox(in: CGRect(origin: .zero, size: Self.size), where: Self.isThemeFill),
                                "no theme fill drawn")
        XCTAssertEqual(box.width, 20, accuracy: 2, "\(box)")
        XCTAssertEqual(box.height, 20, accuracy: 2, "\(box)")
        XCTAssertEqual(box.minX, 32, accuracy: 2, "the box is not after the disclosure's room: \(box)")
        let unchecked = try await render(
            KozmosTreeDividedRow(node: leaf, depth: 0, isParent: false, open: false, density: .default, bleed: 0,
                                 divided: false, checked: .unchecked) {}, "gap-277-unchecked")
        XCTAssertNil(unchecked.boundingBox(in: CGRect(origin: .zero, size: Self.size), where: Self.isThemeFill))
    }

    /// The disclosure at the end draws the chevron in the row's last 32;
    /// at the start nothing is drawn there.
    @MainActor func testTheDisclosureAtTheEndIsDrawnAtTheRowsEnd() async throws {
        let parent = Node(value: "Acme", children: [Node(value: "Acme HQ")])
        let end = CGRect(x: Self.size.width - 32, y: 0, width: 32, height: Self.size.height)
        let atEnd = try await render(
            KozmosTreeDividedRow(node: parent, depth: 0, isParent: true, open: false, density: .default, bleed: 0,
                                 divided: false, disclosurePosition: .end) {}, "gap-277-disclosure-end")
        XCTAssertNotNil(atEnd.boundingBox(in: end, where: Self.isInk), "no chevron at the row's end")
        let atStart = try await render(
            KozmosTreeDividedRow(node: parent, depth: 0, isParent: true, open: false, density: .default, bleed: 0,
                                 divided: false) {}, "gap-277-disclosure-start")
        XCTAssertNil(atStart.boundingBox(in: end, where: Self.isInk), "something drawn at the row's end")
    }

    /// A checkable row is a toggle, its value its check and whether it is
    /// open; it is never selected; a parent opens by an Expand action.
    @MainActor func testACheckableRowIsAToggleThatSaysItsCheck() async throws {
        let rows = VStack(spacing: 0) {
            KozmosTreeDividedRow(node: Node(value: "Acme", children: [Node(value: "Acme HQ")]), depth: 0,
                                 isParent: true, open: false, density: .default, bleed: 0, divided: false,
                                 checked: .checked, onDisclosure: {}) {}
            KozmosTreeDividedRow(node: Node(value: "Initech"), depth: 0, isParent: false, open: false,
                                 density: .default, bleed: 0, divided: false, checked: .unchecked) {}
        }
        try await inspectAccessibility(rows, size: CGSize(width: 400, height: 200)) { window in
            let elements = accessibilityElements(window)
            @MainActor func row(_ words: String) throws -> NSObject {
                try XCTUnwrap(elements.first { $0.accessibilityLabel?.contains(words) == true },
                              "no row for \(words):\n\(describeAccessibility(window))")
            }
            XCTAssertEqual(try row("Acme").accessibilityValue, "Checked, Collapsed")
            XCTAssertEqual(try row("Initech").accessibilityValue, "Unchecked")
            XCTAssertFalse(try row("Acme").accessibilityTraits.contains(.selected))
            // Its activation checks it, so it opens by an action of its own.
            XCTAssertTrue(try row("Acme").accessibilityCustomActions?.contains { $0.name == "Expand" } == true,
                          "a checkable parent has no Expand action")
            if #available(iOS 17, *) {
                XCTAssertTrue(try row("Initech").accessibilityTraits.contains(.toggleButton),
                              "a checkable row is no toggle")
            }
        }
    }
}
#endif
