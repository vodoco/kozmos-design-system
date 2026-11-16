// List.mdx's Compose snippet ("Rows with slots"), word for word below the
// package line: compiled here, so a renamed or removed parameter fails in
// this target rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import com.kozmos.components.button.KozmosButton
import com.kozmos.components.button.KozmosButtonSize
import com.kozmos.components.button.KozmosButtonVariant
import com.kozmos.components.list.KozmosList
import com.kozmos.components.list.KozmosListItem
import com.kozmos.components.list.KozmosListItemStatus
import com.kozmos.components.list.KozmosListItemStatusValue
import com.kozmos.components.tag.KozmosTag
import com.kozmos.components.tag.KozmosTagVariant

// A checklist row: its status mark, read before the title; a role tag; a
// description and a meta line; one action at the end. selected = true tints
// a ticked row.
@Composable
fun TourChecklist() {
    KozmosList {
        KozmosListItem(
            text = "Explore the map",
            description = "Pan, zoom and change levels.",
            meta = "2 min",
            showDivider = false,
            leading = { KozmosListItemStatus(status = KozmosListItemStatusValue.Done) },
            titleAddon = { KozmosTag(text = "Viewer", variant = KozmosTagVariant.Secondary) },
            trailing = {
                KozmosButton(onClick = {}, variant = KozmosButtonVariant.Outline, size = KozmosButtonSize.Sm) {
                    Text("Replay")
                }
            }
        )
    }
}
