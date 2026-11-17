// DescriptionList.mdx's Compose snippet ("Implementation"), word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.runtime.Composable
import com.kozmos.components.badge.KozmosBadge
import com.kozmos.components.descriptionlist.KozmosDescriptionList
import com.kozmos.components.descriptionlist.KozmosDescriptionListItem
import com.kozmos.components.descriptionlist.KozmosDescriptionListLayout
import com.kozmos.components.iconbutton.KozmosIconButton

// A unit's values for a read-only user: each under its label, none a field.
@Composable
fun UnitDetails(onCopy: () -> Unit) {
    KozmosDescriptionList(layout = KozmosDescriptionListLayout.Stack) {
        KozmosDescriptionListItem(label = "Name", value = "Gate A12")
        KozmosDescriptionListItem(label = "Category") {
            KozmosBadge(text = "Transport")
        }
        KozmosDescriptionListItem(label = "Featured", checked = true)
        KozmosDescriptionListItem(
            label = "FID",
            value = "0f3c-91a2",
            action = {
                KozmosIconButton(
                    icon = Icons.Filled.ContentCopy,
                    onClick = onCopy,
                    contentDescription = "Copy FID"
                )
            }
        )
    }
}
