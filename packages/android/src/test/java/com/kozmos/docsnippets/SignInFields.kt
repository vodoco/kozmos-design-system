// Input.mdx's Compose snippet, word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import com.kozmos.components.input.KozmosInput
import com.kozmos.components.passwordinput.KozmosPasswordInput
import com.kozmos.tokens.KozmosDimensions

// KozmosInput has no type: it is a plain text field. A password is
// KozmosPasswordInput, which hides what is typed and can show it.
@Composable
fun SignInFields(
    email: String,
    onEmailChange: (String) -> Unit,
    password: String,
    onPasswordChange: (String) -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing200)) {
        KozmosInput(
            value = email,
            onValueChange = onEmailChange,
            label = "Email",
            placeholder = "Enter your email"
        )
        KozmosPasswordInput(
            value = password,
            onValueChange = onPasswordChange,
            label = "Password",
            placeholder = "Password"
        )
    }
}
