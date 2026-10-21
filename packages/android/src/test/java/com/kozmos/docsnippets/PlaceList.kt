// List.mdx's Compose snippet, word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import com.kozmos.components.list.KozmosList
import com.kozmos.components.list.KozmosListItem

// A Column of rows, each its text with a divider under it, which the last
// row turns off here. There is no border or compact density, and TalkBack is
// not told it is a list.
@Composable
fun PlaceList() {
    KozmosList {
        KozmosListItem(text = "Reception")
        KozmosListItem(text = "Atrium Café", showDivider = false)
    }
}
