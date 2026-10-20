// Breadcrumb.mdx's Compose snippet, word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import com.kozmos.components.breadcrumb.KozmosBreadcrumb

// The trail is its titles, in order, and the last is the current page,
// which cannot be pressed. A press hands back the item's index: where it
// goes is yours, as the trail has no links.
@Composable
fun VenueTrail(showVenues: () -> Unit) {
    KozmosBreadcrumb(
        items = listOf("Venues", "Central venue"),
        onItemClick = { index -> if (index == 0) showVenues() }
    )
}
