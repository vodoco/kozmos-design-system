#if os(iOS)
import SwiftUI
import UIKit
import XCTest
@testable import Kozmos

/// GAP-212, decision 224: Input's edit action, a pencil at the field's end
/// that calls `onEdit`, as React's `{ kind: "edit" }`. Map Personas shows a
/// persona's ID and Map Style read-only, each with a pencil; what editing
/// means is the product's. Read only does not disable it.
final class KozmosInputEditActionTests: XCTestCase {
    /// A read-only field's edit is an enabled button named Edit, and
    /// activating it calls the product's `onEdit`.
    @MainActor func testEditOnAReadOnlyFieldCallsOnEdit() async throws {
        var edits = 0
        let view = KozmosInput(text: .constant("staff.json"), label: "Map Style", readOnly: true,
                               action: .edit(onEdit: { edits += 1 }))
            .padding(16)
        try await inspectAccessibility(view) { window in
            let edit = try accessibilityElement(named: "Edit", in: window)
            XCTAssertTrue(edit.accessibilityTraits.contains(.button))
            XCTAssertFalse(edit.accessibilityTraits.contains(.notEnabled), "a read-only field's edit is disabled")
            XCTAssertFalse(edit.accessibilityTraits.contains(.selected), "the edit reads as a pressed toggle")
            XCTAssertTrue(edit.accessibilityActivate())
            try await Task.sleep(nanoseconds: 300_000_000)
            XCTAssertEqual(edits, 1)
        }
    }

    /// Its name is the product's (GAP-182).
    @MainActor func testEditTakesItsName() async throws {
        let view = KozmosInput(text: .constant("x"), readOnly: true,
                               action: .edit(label: "Edit Map Style", onEdit: {})).padding(16)
        try await inspectAccessibility(view) { window in
            XCTAssertNoThrow(try accessibilityElement(named: "Edit Map Style", in: window))
        }
    }

    /// A disabled field's edit is disabled.
    @MainActor func testADisabledFieldsEditIsDisabled() async throws {
        let view = KozmosInput(text: .constant("x"), disabled: true, action: .edit(onEdit: {})).padding(16)
        try await inspectAccessibility(view) { window in
            XCTAssertTrue(try accessibilityElement(named: "Edit", in: window).accessibilityTraits.contains(.notEnabled))
        }
    }

    /// The case's name, for the product's own words.
    func testTheEditsLabelIsItsName() {
        XCTAssertEqual(KozmosInputAction.edit(onEdit: {}).label, "Edit")
        XCTAssertEqual(KozmosInputAction.edit(label: "Bearbeiten", onEdit: {}).label, "Bearbeiten")
    }
}
#endif
