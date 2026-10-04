import XCTest
import SwiftUI
@testable import Kozmos

/// Property assertions on the Button's API — not snapshots, despite what this
/// file used to be called. It was `KozmosButtonSnapshotTests` and contained no
/// snapshot at all, which is a large part of why nobody noticed that iOS had no
/// visual regression coverage while `swift-snapshot-testing` sat in
/// Package.swift as a dependency nothing imported.
///
/// Rendering lives in `KozmosButtonImageSnapshotTests`.
final class KozmosButtonAPITests: XCTestCase {
    func testOptionalLeadingIconPreservesExistingCalls() {
        let plain = KozmosButton("Go", action: {})
        XCTAssertNil(plain.leadingIconName)
        let decorated = KozmosButton("Go", leadingIconName: "navigation-pointer-01", action: {})
        XCTAssertEqual(decorated.leadingIconName, "navigation-pointer-01")
        XCTAssertEqual(decorated.label, plain.label)
    }

    func testButtonDefaultVariant() {
        let view = KozmosButton("Label Binding", action: {})
        
        XCTAssertEqual(view.label, "Label Binding")
        XCTAssertEqual(view.variant, .default)
        XCTAssertEqual(view.size, .default)
        XCTAssertFalse(view.isDisabled)
        XCTAssertFalse(view.isLoading)
    }

    func testButtonDestructiveVariant() {
        let view = KozmosButton("Delete Item", variant: .destructive, action: {})
        XCTAssertEqual(view.label, "Delete Item")
        XCTAssertEqual(view.variant, .destructive)
    }

    func testButtonDisabledState() {
        let view = KozmosButton("Cannot Execute", isDisabled: true, action: {})
        XCTAssertTrue(view.isDisabled)
        XCTAssertFalse(view.isLoading)
    }

    func testButtonLoadingState() {
        let view = KozmosButton("Processing...", isLoading: true, action: {})
        XCTAssertFalse(view.isDisabled)
        XCTAssertTrue(view.isLoading)
    }
}
