// ContextMenu.mdx's Compose snippet, word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import com.kozmos.components.contextmenu.KozmosContextMenuArea
import com.kozmos.components.menu.KozmosMenuContent
import com.kozmos.components.menu.KozmosMenuItem
import com.kozmos.components.text.KozmosText
import com.kozmos.tokens.KozmosDimensions

// The area opens KozmosMenu's items where it is pressed: a long press, a
// right click, or the Menu key (Shift+F10) at its start. TalkBack offers it
// as the area's "Show menu" action. Picking an item hands it to you and
// closes the menu.
@Composable
fun GateContextMenu() {
    var picked by remember { mutableStateOf("Nothing yet") }
    Column(verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing100)) {
        KozmosContextMenuArea(
            menu = KozmosMenuContent(
                items = listOf(KozmosMenuItem(text = "Copy gate"), KozmosMenuItem(text = "Share"))
            ),
            onItemClick = { picked = it.text }
        ) {
            KozmosText(text = "Gate A12")
        }
        KozmosText(text = "Picked: $picked")
    }
}
