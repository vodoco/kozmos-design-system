// POICard.mdx's Compose snippet, word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import com.kozmos.components.poicard.KozmosPOICard
import com.kozmos.components.text.KozmosText

// The line under the title is category, where React's is subtitle, and the
// description is content of your own. The card is 300dp wide, with no badges
// or selection, and its title is not a heading. Compose's KozmosText takes no
// tone, so the description is not muted as React's is.
@Composable
fun CafeCard() {
    KozmosPOICard(
        title = "Atrium Café",
        category = "Ground floor",
        description = { KozmosText(text = "Coffee and refreshments by the main entrance.") }
    )
}
