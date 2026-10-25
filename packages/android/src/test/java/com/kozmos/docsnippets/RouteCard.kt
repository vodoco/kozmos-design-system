// WayfindingCard.mdx's Compose snippet, word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import com.kozmos.components.text.KozmosText
import com.kozmos.components.wayfindingcard.KozmosWayfindingCard

// The card draws its title and, given an onClose, a close button named by
// closeLabel, "Close navigation" unless you pass your own; your content goes
// under them. KozmosWayfindingInputRow is the origin and destination row it
// often holds.
@Composable
fun RouteCard() {
    KozmosWayfindingCard(title = "Route") {
        KozmosText(text = "Select a destination to begin.")
    }
}
