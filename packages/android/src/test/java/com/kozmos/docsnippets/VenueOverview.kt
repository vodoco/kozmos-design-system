// Container.mdx's Compose snippet, word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import com.kozmos.components.container.KozmosContainer
import com.kozmos.components.container.KozmosContainerInset

// In a map shell's sheet or side panel: 16 a side, whatever the window.
@Composable
fun VenueOverview() {
    KozmosContainer(KozmosContainerInset.Panel) {
        Text("Venue overview")
    }
}
