// Grid.mdx's Compose snippet ("Virtualized"), word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.foundation.lazy.grid.items
import androidx.compose.runtime.Composable
import com.kozmos.components.grid.KozmosGrid
import com.kozmos.components.text.KozmosText

// KozmosGrid is a LazyVerticalGrid: it scrolls itself and composes only the
// cards in view, for hundreds of sites.
@Composable
fun SiteCards(sites: List<String>) {
    KozmosGrid(cols = 3) {
        items(sites) { site -> KozmosText(text = site) }
    }
}
