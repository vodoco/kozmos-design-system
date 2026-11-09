// Search.mdx's Compose snippet, word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import com.kozmos.components.search.KozmosSearch

// The clear shows while the field holds text. It calls onValueChange with ""
// and onClear, and puts the focus back in the field; its name is the product's.
@Composable
fun ClearableSearch(query: String, onQueryChange: (String) -> Unit) {
    KozmosSearch(
        value = query,
        onValueChange = onQueryChange,
        placeholder = "Find a place",
        clearable = true,
        clearLabel = "Clear search"
    )
}
