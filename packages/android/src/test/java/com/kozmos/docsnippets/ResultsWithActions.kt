// POIResultList.mdx's Compose snippet ("Actions on the selected result"), word
// for word below the package line: compiled here, so a renamed or removed
// parameter fails in this target rather than in a reader's project. Change
// the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import com.kozmos.components.poiresultlist.KozmosPOIResultList
import com.kozmos.components.poiresultlist.KozmosPOIResultListItem
import com.kozmos.contracts.KozmosPOIResultAction

@Composable
fun ResultsWithActions(
    items: List<KozmosPOIResultListItem>,
    selectedPoiId: String?,
    onSelect: (String) -> Unit,
    // Told which action was pressed, and the POI's own ID.
    onAction: (KozmosPOIResultAction, String) -> Unit
) {
    KozmosPOIResultList(
        items = items,
        resultCountLabel = "${items.size} results",
        onSelect = onSelect,
        selectedPoiId = selectedPoiId,
        // The selected result's action row, named in the visitor's words.
        actionsLabel = "Actions for this result",
        // Without it the actions are drawn disabled.
        onAction = onAction
    )
}
