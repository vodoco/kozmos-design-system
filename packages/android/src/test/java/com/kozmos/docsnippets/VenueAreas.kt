// Grid.mdx's Compose snippet, word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import com.kozmos.components.grid.KozmosGrid
import com.kozmos.components.text.KozmosText

// Equal columns, two unless cols says otherwise, 16dp apart both ways. It is
// a LazyVerticalGrid: what it holds is item { } calls, and it scrolls itself,
// so it cannot sit in a parent that scrolls vertically. There are no row,
// flow or alignment options.
@Composable
fun VenueAreas() {
    KozmosGrid(cols = 2) {
        item { KozmosText(text = "Reception") }
        item { KozmosText(text = "Meeting rooms") }
    }
}
