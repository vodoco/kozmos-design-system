import SwiftUI
import XCTest
@testable import Kozmos

/// GAP-235: UIKit has no read-only trait, so a read-only field was said as
/// an editable one; GAP-236: a field's error was a text of its own after it,
/// heard only by moving past the field. Each field says "Read only", then its
/// error message, on the field itself, as its hint.
final class KozmosFieldStateTests: XCTestCase {
    func testTheHintSaysReadOnlyThenTheError() {
        XCTAssertEqual(KozmosFieldState.hint(readOnly: true, readOnlyLabel: "Read only", inError: true, errorMessage: "Enter a value."),
                       "Read only. Enter a value.")
        XCTAssertEqual(KozmosFieldState.hint(readOnly: false, readOnlyLabel: "Read only", inError: false, errorMessage: "Enter a value."), "")
        XCTAssertEqual(KozmosFieldState.hint(readOnly: true, readOnlyLabel: "Schreibgeschützt", inError: false, errorMessage: nil), "Schreibgeschützt")
    }

    func testOTPInputSaysItsDigitCountThenReadOnlyThenItsError() {
        let otp = KozmosOTPInput(value: .constant("12"), readOnly: true, error: true, errorMessage: "Wrong code.")
        XCTAssertEqual(otp.accessibilityHint, "6 digits. Read only. Wrong code.")
        XCTAssertEqual(KozmosOTPInput(value: .constant("")).accessibilityHint, "6 digits")
    }
}

// No hosted test reads the hint off a SwiftUI text field: the accessibility
// tree the hosted tests walk (KozmosMixedPickerTests' `elements(in:)`)
// reaches no TextField or SecureField element, and the UIKit text field
// under it carries no SwiftUI hint (tried 18 Nov on the pinned simulator:
// an empty tree, and a nil hint, for all five fields). VoiceOver's reading
// is to be heard on a device.
