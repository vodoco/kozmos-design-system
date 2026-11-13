// Checkbox.mdx's Compose snippet ("A description"), word for word below the
// package line: compiled here, so a renamed or removed parameter fails in this
// target rather than in a reader's project, and read by
// ControlDescriptionDocSnippetsTest. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import com.kozmos.components.checkbox.KozmosCheckbox

// The description is drawn under the label and read after it: the row is
// one checkbox, the label its name.
@Composable
fun DeskBookingTerms(accepted: Boolean, onAcceptedChange: (Boolean) -> Unit) {
    KozmosCheckbox(
        checked = accepted,
        onCheckedChange = onAcceptedChange,
        label = "Share my desk booking",
        description = "Colleagues on your floor see where you sit"
    )
}
