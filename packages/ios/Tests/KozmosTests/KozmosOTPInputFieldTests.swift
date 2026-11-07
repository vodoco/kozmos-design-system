import SwiftUI
import XCTest

@testable import Kozmos

#if os(iOS)
  import UIKit

  /// SwiftUI's OTPInput is one text field that holds the code, with the cells
  /// drawn from it, as Compose's is. Hosted on the simulator, this reads what
  /// XCUITest cannot: the field is the keyboard's one-time-code field, on the
  /// number pad, and VoiceOver hears it named by the label ("Verification
  /// code" without one), with the code as its value and the number of digits
  /// as its hint, in the product's words when it gives them. Read-only, it is
  /// enabled, takes the focus and refuses every edit; disabled, it is not
  /// enabled. Any decimal digit is kept as its ASCII digit. Edits here go
  /// through the field's own delegate, the path the keyboard takes. A paste
  /// is refused in this process ("Operation not authorized"), and UIKit's
  /// accessibility traits are not loaded here, so paste, the edit menu and
  /// what VoiceOver reads as dimmed are in the interaction suite
  /// (`InteractionTests`), with typing and analytics on the real keyboard.
  final class KozmosOTPInputFieldTests: XCTestCase {
    /// The code the host holds.
    private final class Box { var code: String; init(_ code: String) { self.code = code } }

    /// Types `text` as the keyboard does: the field's delegate is asked to
    /// insert it at the caret. Returns whether the field took the text itself.
    @MainActor private func type(_ text: String, into field: UITextField) -> Bool {
      let end = (field.text ?? "").utf16.count
      return field.delegate?.textField?(field, shouldChangeCharactersIn: NSRange(location: end, length: 0),
                                        replacementString: text) ?? true
    }

    /// The view in a 390 × 844 window at the screen's origin.
    @MainActor private func host<V: View>(_ content: V) async -> UIWindow {
      let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 390, height: 844))
      window.rootViewController = UIHostingController(rootView: content.padding(16))
      window.makeKeyAndVisible()
      for _ in 0..<8 {
        try? await Task.sleep(nanoseconds: 30_000_000)
      }
      return window
    }

    @MainActor private func textFields(in view: UIView) -> [UITextField] {
      if let field = view as? UITextField { return [field] }
      return view.subviews.flatMap { textFields(in: $0) }
    }

    @MainActor func testTheCodeIsOneOneTimeCodeFieldOnTheNumberPad() async throws {
      let window = await host(KozmosOTPInput(value: .constant("123"), label: "Verification code"))
      defer { window.isHidden = true }
      let fields = textFields(in: window)
      XCTAssertEqual(fields.count, 1, "the code is held by \(fields.count) text fields")
      let field = try XCTUnwrap(fields.first)
      XCTAssertEqual(field.textContentType, .oneTimeCode)
      XCTAssertEqual(field.keyboardType, .numberPad)
      XCTAssertEqual(field.text, "123")
    }

    @MainActor func testVoiceOverHearsTheLabelTheCodeAndHowManyDigits() async throws {
      let named = await host(KozmosOTPInput(length: 4, value: .constant("12"), label: "Code from your email"))
      defer { named.isHidden = true }
      let field = try XCTUnwrap(textFields(in: named).first)
      XCTAssertEqual(field.accessibilityLabel, "Code from your email")
      XCTAssertEqual(field.accessibilityValue, "12")
      XCTAssertEqual(field.accessibilityHint, "4 digits")
      XCTAssertTrue(field.isAccessibilityElement)

      let unnamed = await host(KozmosOTPInput(value: .constant("")))
      defer { unnamed.isHidden = true }
      let plain = try XCTUnwrap(textFields(in: unnamed).first)
      XCTAssertEqual(plain.accessibilityLabel, "Verification code")
      XCTAssertEqual(plain.accessibilityHint, "6 digits")
    }

    /// A host's value is drawn as digits only, at most `length` of them.
    @MainActor func testAHostsValueIsKeptToDigitsAndTheLength() async throws {
      let window = await host(KozmosOTPInput(length: 4, value: .constant("1a2-345")))
      defer { window.isHidden = true }
      XCTAssertEqual(try XCTUnwrap(textFields(in: window).first).text, "1234")
    }

    @MainActor func testTheHintIsInTheProductsWords() async throws {
      let window = await host(KozmosOTPInput(length: 4, value: .constant(""), digitCountLabel: { "\($0) Ziffern" }))
      defer { window.isHidden = true }
      XCTAssertEqual(try XCTUnwrap(textFields(in: window).first).accessibilityHint, "4 Ziffern")
    }

    /// The field is named by its drawn `label`, or without one by
    /// `fieldLabel`, "Verification code" unless the product gives its own; a
    /// `label` wins over `fieldLabel`.
    @MainActor func testTheFieldIsNamedByItsLabelOrItsFieldLabel() async throws {
      let unnamed = await host(KozmosOTPInput(value: .constant(""), fieldLabel: "Bestätigungscode"))
      defer { unnamed.isHidden = true }
      XCTAssertEqual(try XCTUnwrap(textFields(in: unnamed).first).accessibilityLabel, "Bestätigungscode")

      let labelled = await host(KozmosOTPInput(value: .constant(""), label: "Code from your email",
                                               fieldLabel: "Bestätigungscode"))
      defer { labelled.isHidden = true }
      XCTAssertEqual(try XCTUnwrap(textFields(in: labelled).first).accessibilityLabel, "Code from your email")
    }

    /// Read-only: enabled, focused, and every edit refused: a typed digit,
    /// and Paste, which is not offered. Disabled: not enabled.
    @MainActor func testAReadOnlyFieldIsEnabledFocusableAndRefusesEveryEdit() async throws {
      let box = Box("123")
      let readOnly = await host(KozmosOTPInput(value: Binding(get: { box.code }, set: { box.code = $0 }), readOnly: true))
      defer { readOnly.isHidden = true }
      let field = try XCTUnwrap(textFields(in: readOnly).first)
      XCTAssertTrue(field.isEnabled, "a read-only field is disabled")
      XCTAssertEqual(field.accessibilityValue, "123")
      XCTAssertTrue(field.becomeFirstResponder(), "a read-only field takes no focus")
      XCTAssertFalse(type("4", into: field), "the field took a typed digit itself")
      XCTAssertFalse(field.canPerformAction(#selector(UIResponderStandardEditActions.paste(_:)), withSender: nil),
                     "a read-only field offers Paste")
      XCTAssertEqual(box.code, "123")
      XCTAssertEqual(field.text, "123")
      field.resignFirstResponder()

      let disabled = await host(KozmosOTPInput(value: .constant("123"), disabled: true))
      defer { disabled.isHidden = true }
      XCTAssertFalse(try XCTUnwrap(textFields(in: disabled).first).isEnabled)
    }

    /// Any decimal digit is the host's as its ASCII digit: Arabic-Indic and
    /// Devanagari, typed through the field's delegate, and a host's own.
    @MainActor func testDigitsInAnyScriptAreKeptAsASCII() async throws {
      XCTAssertEqual(KozmosOTPInput.sanitize("١٢٣-४५६", length: 6), "123456")
      XCTAssertEqual(KozmosOTPInput.sanitize("½Ⅻ7", length: 6), "7", "only decimal digits are digits")
      // A digit joined by a mark or a keycap into one character keeps its
      // value, and the mark is dropped, as React's and Compose's do.
      XCTAssertEqual(KozmosOTPInput.sanitize("1\u{301}\u{662}\u{302}", length: 6), "12")
      XCTAssertEqual(KozmosOTPInput.sanitize("1\u{FE0F}\u{20E3}2", length: 6), "12")
      let box = Box("")
      let window = await host(KozmosOTPInput(value: Binding(get: { box.code }, set: { box.code = $0 })))
      defer { window.isHidden = true }
      let field = try XCTUnwrap(textFields(in: window).first)
      for digit in ["١", "٢", "३"] { _ = type(digit, into: field) }
      XCTAssertEqual(box.code, "123")
      let hosted = await host(KozmosOTPInput(value: .constant("٤٥٦")))
      defer { hosted.isHidden = true }
      XCTAssertEqual(try XCTUnwrap(textFields(in: hosted).first).text, "456")
    }
  }
#endif
