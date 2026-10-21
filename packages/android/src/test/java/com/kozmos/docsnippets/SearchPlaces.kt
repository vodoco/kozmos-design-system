// Search.mdx's Compose snippet, word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import com.kozmos.components.search.KozmosSearch

// A field with a search icon and no label, helper text or error. The
// placeholder, shown while the field is empty, is its only words: React's
// aria-label has no counterpart.
@Composable
fun SearchPlaces(query: String, onQueryChange: (String) -> Unit) {
    KozmosSearch(
        value = query,
        onValueChange = onQueryChange,
        placeholder = "Search places"
    )
}
