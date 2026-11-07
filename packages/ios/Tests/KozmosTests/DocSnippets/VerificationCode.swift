// OTPInput.mdx's SwiftUI snippet, word for word below this comment: compiled
// here, so a renamed or removed parameter fails in this target rather than
// in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// Six cells unless length says otherwise, digits only, and the code is yours
// to hold: one text field takes the typing, a paste or the keyboard's
// one-time code, and the cells draw it. The label names that field, where
// React names each cell "Digit 1 of 6".
struct VerificationCode: View {
    @Binding var code: String

    var body: some View {
        KozmosOTPInput(value: $code, label: "Verification code")
    }
}
