// SearchBar.mdx's Compose snippet, word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import com.kozmos.components.searchbar.KozmosSearchBar

// The placeholder is also the field's spoken name. The clear button shows
// only with an onClear, and it is onClear that empties the query.
@Composable
fun PlaceSearch(query: String, onQueryChange: (String) -> Unit) {
    KozmosSearchBar(
        value = query,
        onValueChange = onQueryChange,
        onClear = { onQueryChange("") },
        placeholder = "Search places"
    )
}
