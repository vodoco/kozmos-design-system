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
  /// as its hint. Typing, paste and analytics are in the interaction suite
  /// (`InteractionTests`), because in this process SwiftUI takes no synthetic
  /// input.
  final class KozmosOTPInputFieldTests: XCTestCase {
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
  }
#endif
