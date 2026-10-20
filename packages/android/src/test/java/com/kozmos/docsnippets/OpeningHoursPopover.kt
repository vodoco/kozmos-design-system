// Popover.mdx's Compose snippet, word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.foundation.layout.Box
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import com.kozmos.components.button.KozmosButton
import com.kozmos.components.popover.KozmosPopover
import com.kozmos.components.text.KozmosText

// Compose's popover opens over its parent's top-start corner, so it shares a
// Box with the button that opens it.
@Composable
fun OpeningHoursPopover() {
    var isExpanded by remember { mutableStateOf(false) }
    Box {
        KozmosButton(onClick = { isExpanded = true }) { Text("Opening hours") }
        KozmosPopover(
            isExpanded = isExpanded,
            onDismissRequest = { isExpanded = false }
        ) {
            KozmosText(text = "Monday–Friday, 09:00–18:00")
        }
    }
}
