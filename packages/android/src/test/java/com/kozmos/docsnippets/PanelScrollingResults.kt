// Not a docs tab: no MDX page shows it; its KDoc and CHANGELOG point here.
// A product's own scroller in the shell's panel (GAP-085), as
// kozmosPanelScrollEndPadding's KDoc and the Android CHANGELOG describe it:
// compiled here, and drawn and measured by
// KozmosAdaptiveMapShellProductScrollerTest. Change the three together.
package com.kozmos.docsnippets

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.kozmos.components.adaptivemapshell.kozmosPanelScrollEndPadding
import com.kozmos.components.poiresultlist.KozmosPOIResultList
import com.kozmos.components.poiresultlist.KozmosPOIResultListItem

// The results are the panel's content and scroll in it. The panel's end is
// claimed and padded inside the scroll: the list runs to the panel's edge,
// under the navigation bar in a sheet, and its last result stops 16 above
// the edge (above the bar) only at the end of the scroll.
@Composable
fun PanelScrollingResults(
    items: List<KozmosPOIResultListItem>,
    selectedPoiId: String?,
    onSelect: (String) -> Unit
) {
    Column(
        Modifier
            .fillMaxWidth()
            .verticalScroll(rememberScrollState())
            .padding(bottom = kozmosPanelScrollEndPadding())
    ) {
        KozmosPOIResultList(
            items = items,
            resultCountLabel = "${items.size} results",
            onSelect = onSelect,
            selectedPoiId = selectedPoiId
        )
    }
}
