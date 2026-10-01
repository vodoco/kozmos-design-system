// Chip.mdx's Compose snippet ("Android Jetpack Compose"), word for word below
// the package line: compiled here, so a renamed or removed parameter fails in
// this target rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import com.kozmos.components.chip.KozmosChip
import com.kozmos.components.chip.KozmosChipGroup

// Filters that combine: each chip is its own toggle, and TalkBack hears
// whether it is selected. "Open now" can only be taken away.
@Composable
fun CategoryFilters(
    category: String,
    onCategoryChange: (String) -> Unit,
    openNow: Boolean,
    onOpenNowRemove: () -> Unit
) {
    KozmosChipGroup {
        KozmosChip(text = "All", selected = category == "all", onClick = { onCategoryChange("all") })
        KozmosChip(text = "Coffee", selected = category == "coffee", onClick = { onCategoryChange("coffee") })
        if (openNow) {
            KozmosChip(text = "Open now", onRemove = onOpenNowRemove)
        }
    }
}
