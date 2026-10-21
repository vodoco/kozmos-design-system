// OTPInput.mdx's Compose snippet, word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import com.kozmos.components.otpinput.KozmosOTPInput

// Six cells unless length says otherwise, digits only, and the code is yours
// to hold: one hidden text field takes the typing, and the cells draw it. The
// label is drawn above them but does not name the field, where React names
// each cell "Digit 1 of 6".
@Composable
fun VerificationCode(code: String, onCodeChange: (String) -> Unit) {
    KozmosOTPInput(
        value = code,
        onValueChange = onCodeChange,
        label = "Verification code"
    )
}
