// ToggleButton.mdx's Compose snippet, word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import com.kozmos.components.togglebutton.KozmosToggleButton

// The label is what TalkBack says: there is no separate name. The state is
// yours to hold. An icon is an ImageVector, and an icon-only button has no
// name at all, as the icon is drawn without a description.
@Composable
fun ShowLabelsToggle(showLabels: Boolean, onShowLabelsChange: (Boolean) -> Unit) {
    KozmosToggleButton(
        checked = showLabels,
        onCheckedChange = onShowLabelsChange,
        label = "Labels"
    )
}
