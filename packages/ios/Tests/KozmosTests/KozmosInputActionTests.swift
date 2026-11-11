#if os(iOS)
import SwiftUI
import UIKit
import XCTest
@testable import Kozmos

/// GAP-154, decision 137: Input's `action`, a button inside the field's end,
/// as React's has been since 0.15.0 (#434). A copy copies the field's value,
/// from a read-only field too; a toggle is a button with its own name that is
/// selected while pressed, and pressed draws the theme fill in decision 164's
/// shape: 4 in from the 44 button's edges, 36 across (decision 165).
final class KozmosInputActionTests: XCTestCase {
    private struct Featured: View {
        @State var pressed: Bool
        var body: some View {
            KozmosInput(text: .constant("Lobby"), label: "Name",
                        action: .toggle(label: "Featured", icon: Image(systemName: "star"), isPressed: $pressed))
                .padding(16)
        }
    }

    /// A read-only field's copy is a button named Copy, and activating it
    /// copies the value and tells the product. The pasteboard is not read
    /// back: reading it in a test raises the system's paste prompt, which
    /// nothing answers.
    @MainActor func testCopyCopiesAReadOnlyFieldsValue() async throws {
        var copied: String?
        let view = KozmosInput(text: .constant("FID-0042"), label: "Feature ID", readOnly: true,
                               action: .copy(onCopy: { copied = $0 }))
            .padding(16)
        try await inspectAccessibility(view) { window in
            let copy = try accessibilityElement(named: "Copy", in: window)
            XCTAssertTrue(copy.accessibilityTraits.contains(.button))
            XCTAssertFalse(copy.accessibilityTraits.contains(.notEnabled), "a read-only field's copy is disabled")
            XCTAssertTrue(copy.accessibilityActivate())
            try await Task.sleep(nanoseconds: 300_000_000)
            XCTAssertEqual(copied, "FID-0042")
        }
    }

    /// Its name is the product's.
    @MainActor func testCopyTakesItsName() async throws {
        let view = KozmosInput(text: .constant("x"), action: .copy(label: "Kopieren")).padding(16)
        try await inspectAccessibility(view) { window in
            XCTAssertNoThrow(try accessibilityElement(named: "Kopieren", in: window))
        }
    }

    /// A disabled field's action is disabled.
    @MainActor func testADisabledFieldsActionIsDisabled() async throws {
        let view = KozmosInput(text: .constant("x"), disabled: true, action: .copy()).padding(16)
        try await inspectAccessibility(view) { window in
            XCTAssertTrue(try accessibilityElement(named: "Copy", in: window).accessibilityTraits.contains(.notEnabled))
        }
    }

    /// The toggle is named, selected only while pressed, and VoiceOver's
    /// double tap presses it.
    @MainActor func testTheToggleIsSelectedWhilePressed() async throws {
        try await inspectAccessibility(Featured(pressed: false)) { window in
            let toggle = try accessibilityElement(named: "Featured", in: window)
            XCTAssertTrue(toggle.accessibilityTraits.contains(.button))
            XCTAssertFalse(toggle.accessibilityTraits.contains(.selected), "an unpressed toggle is selected")
            XCTAssertTrue(toggle.accessibilityActivate())
            try await Task.sleep(nanoseconds: 300_000_000)
            XCTAssertTrue(try accessibilityElement(named: "Featured", in: window).accessibilityTraits.contains(.selected),
                          "the toggle did not press")
        }
    }

    /// Pressed, the theme fill is 36 across, 4 in from the button's edges,
    /// at the field's end; unpressed there is none.
    @MainActor func testPressedDrawsTheThemeFillInsideTheButton() async throws {
        let size = CGSize(width: 390, height: 140)
        let pressed = try await RenderedPixels.render(Featured(pressed: true).environment(\.colorScheme, .light), size: size)
        let attachment = XCTAttachment(image: pressed.image)
        attachment.name = "gap-154-toggle-pressed"
        attachment.lifetime = .keepAlways
        add(attachment)
        let fill = try XCTUnwrap(pressed.boundingBox(in: CGRect(origin: .zero, size: size), where: RenderedPixels.isTheme),
                                 "no theme fill drawn")
        XCTAssertEqual(fill.width, 36, accuracy: 1.5, "the fill is not 36 across: \(fill)")
        XCTAssertEqual(fill.height, 36, accuracy: 1.5, "the fill is not 36 tall: \(fill)")
        // The field ends 16 from the right; the button is its last 44.
        XCTAssertEqual(size.width - 16 - fill.maxX, 4, accuracy: 1.5, "the fill is not 4 in from the button's end: \(fill)")
        let rest = try await RenderedPixels.render(Featured(pressed: false).environment(\.colorScheme, .light), size: size)
        XCTAssertNil(rest.boundingBox(in: CGRect(origin: .zero, size: size), where: RenderedPixels.isTheme),
                     "an unpressed toggle draws a fill")
    }
}
#endif
