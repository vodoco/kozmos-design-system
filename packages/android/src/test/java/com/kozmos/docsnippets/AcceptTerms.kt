// Checkbox.mdx's Compose snippet, word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import com.kozmos.components.checkbox.KozmosCheckbox

// The checkbox draws its label beside it, and the whole row toggles. It has
// two states, checked and not: no indeterminate one.
@Composable
fun AcceptTerms(accepted: Boolean, onAcceptedChange: (Boolean) -> Unit) {
    KozmosCheckbox(
        checked = accepted,
        onCheckedChange = onAcceptedChange,
        label = "Accept terms and conditions"
    )
}
