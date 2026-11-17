import SwiftUI
import XCTest
@testable import Kozmos

/// GAP-279, decision 211 (owner, 17 Nov): under `.independent`, a parent
/// whose enabled rows below it are some but not all checked shows
/// Checkbox's mixed mark and is heard as mixed. Checking a mixed parent
/// checks all of them; unchecking a checked parent unchecks them; an
/// unchecked parent that is not mixed checks itself alone, as before.
/// `.exclusive`, the default, never shows mixed. The rules are read apart
/// from the drawing, so they run on a Mac as well.
final class KozmosTreeMixedTests: XCTestCase {
    private static let clients = [
        Node(id: "acme", value: "Acme", children: [
            Node(id: "acme-hq", value: "Acme HQ"),
            Node(id: "acme-lab", value: "Acme Lab"),
            Node(id: "acme-old", value: "Acme Old", isDisabled: true),
        ]),
        Node(id: "globex", value: "Globex", children: [
            .section("Places", id: "globex-places", children: [
                Node(id: "globex-east", value: "Globex East"),
                Node(id: "globex-west", value: "Globex West"),
            ]),
        ]),
        Node(id: "initech", value: "Initech"),
    ]

    private func state(_ id: String, _ checked: Set<String>, _ rule: KozmosTreeCheckRule = .independent) -> KozmosCheckboxState {
        KozmosTreeChecks.state(of: id, in: Self.clients, checked: checked, rule: rule)
    }

    /// Some but not all of a parent's enabled rows checked, past a section:
    /// mixed, whatever its own check. None or all: its own check.
    func testAParentWithSomeRowsCheckedIsMixed() {
        XCTAssertEqual(state("acme", ["acme-hq"]), .indeterminate)
        XCTAssertEqual(state("acme", ["acme", "acme-hq"]), .indeterminate)
        XCTAssertEqual(state("globex", ["globex-west"]), .indeterminate, "a section between them hid the rows")
        XCTAssertEqual(state("acme", ["acme-hq", "acme-lab"]), .unchecked, "the disabled row was counted")
        XCTAssertEqual(state("acme", ["acme", "acme-hq", "acme-lab"]), .checked)
        XCTAssertEqual(state("acme", ["acme"]), .checked)
        XCTAssertEqual(state("acme", []), .unchecked)
        XCTAssertEqual(state("acme-hq", ["acme-hq"]), .checked)
        XCTAssertEqual(state("initech", []), .unchecked)
    }

    /// `.exclusive` never shows mixed.
    func testExclusiveIsNeverMixed() {
        XCTAssertEqual(state("acme", ["acme-hq"], .exclusive), .unchecked)
        XCTAssertEqual(state("acme", ["acme"], .exclusive), .checked)
    }

    /// Checking a mixed parent checks it and every enabled row below it.
    func testCheckingAMixedParentChecksAllItsRows() {
        let checked = KozmosTreeChecks.toggle("globex", in: Self.clients, checked: ["globex-east", "initech"], rule: .independent)
        XCTAssertEqual(checked, ["globex", "globex-east", "globex-west", "initech"])
        let acme = KozmosTreeChecks.toggle("acme", in: Self.clients, checked: ["acme-lab"], rule: .independent)
        XCTAssertEqual(acme, ["acme", "acme-hq", "acme-lab"], "a disabled row was checked")
    }

    /// Unchecking a checked parent unchecks every row below it.
    func testUncheckingACheckedParentUnchecksItsRows() {
        let checked = KozmosTreeChecks.toggle("acme", in: Self.clients, checked: ["acme", "acme-hq", "acme-lab", "initech"],
                                              rule: .independent)
        XCTAssertEqual(checked, ["initech"])
    }

    /// An unchecked parent that is not mixed checks itself alone, as before.
    func testCheckingAnUncheckedParentChecksItAlone() {
        let checked = KozmosTreeChecks.toggle("acme", in: Self.clients, checked: [], rule: .independent)
        XCTAssertEqual(checked, ["acme"])
    }

    /// VoiceOver hears a mixed row as "Mixed", Checkbox's word.
    func testAMixedRowIsHeardAsMixed() {
        XCTAssertEqual(KozmosTreeChecks.spokenValue(checked: .indeterminate, isParent: true, open: true), "Mixed, Expanded")
        XCTAssertEqual(KozmosTreeChecks.spokenValue(checked: .checked, isParent: true, open: false), "Checked, Collapsed")
        XCTAssertEqual(KozmosTreeChecks.spokenValue(checked: .unchecked, isParent: false, open: false), "Unchecked")
    }
}
