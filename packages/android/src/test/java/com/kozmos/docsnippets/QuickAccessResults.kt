// POIResultList.mdx's Compose snippet ("Numbered results: quick access"), word
// for word below the package line: compiled here, so a renamed or removed
// parameter fails in this target rather than in a reader's project. Change
// the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import com.kozmos.components.poiresultlist.KozmosPOIResultList
import com.kozmos.components.poiresultlist.KozmosPOIResultListItem

// The places of the category chosen in the browse grid, numbered by the
// product: SDK cards retain the number alongside Featured or badge labels.
@Composable
fun QuickAccessResults(
    results: List<KozmosPOIResultListItem>,
    // "6 places", in the visitor's language.
    countLabel: String,
    selectedPoiId: String?,
    onSelect: (String) -> Unit
) {
    KozmosPOIResultList(
        items = results,
        resultCountLabel = countLabel,
        onSelect = onSelect,
        selectedPoiId = selectedPoiId,
        numbered = true
    )
}
