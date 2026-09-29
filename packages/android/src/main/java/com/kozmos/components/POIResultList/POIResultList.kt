package com.kozmos.components.poiresultlist

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.kozmos.components.poiresultcard.KozmosPOIResultCard
import com.kozmos.contracts.KozmosPOIPresentation
import com.kozmos.contracts.KozmosPOIResultPresentation
import com.kozmos.contracts.KozmosTravelTimeBand
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.components.surface.kozmosDashedEdge

/** One row of a POI result list, pairing a POI with its result metadata. */
data class KozmosPOIResultListItem(
    val poi: KozmosPOIPresentation,
    val result: KozmosPOIResultPresentation
)

/**
 * A list of POI search results.
 *
 * Mirrors the React `POIResultList`. When [selectedPoiId] is supplied it wins
 * over each result's own `selected` flag, so marker and list selection stay
 * derived from a single canonical ID.
 *
 * This is a plain [Column] rather than a `LazyColumn` so it can be nested
 * inside an already-scrolling detail panel. Callers rendering very long result
 * sets should place it in a scroll container of their own.
 */
@Composable
fun KozmosPOIResultList(
    items: List<KozmosPOIResultListItem>,
    resultCountLabel: String,
    onSelect: (String) -> Unit,
    modifier: Modifier = Modifier,
    label: String = "Points of interest",
    selectedPoiId: String? = null,
    featuredLabel: String = "Featured",
    emptyState: (@Composable () -> Unit)? = null,
    /** The floor the map shows: a result on it carries a dot before its floor. */
    currentFloorId: String? = null,
    /** Each result's words for a walk shown as a band: the card's. */
    travelTimeBandLabels: Map<KozmosTravelTimeBand, String> = emptyMap(),
    /**
     * Number every result with its `resultIndex`, the number its pin shows:
     * the card's `numbered`, given to every card. Off unless the product turns
     * it on, for a list whose pins are numbered, as quick access's are. The
     * list never renumbers: a featured result shows Featured and no number,
     * since its pin shows its logo, so number the others in pin order.
     */
    numbered: Boolean = false
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .semantics { contentDescription = label },
        verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing150)
    ) {
        // Announced by TalkBack without occupying layout space, matching the
        // web implementation's visually hidden live region.
        Box(
            modifier = Modifier
                .size(1.dp)
                .semantics {
                    contentDescription = resultCountLabel
                    liveRegion = LiveRegionMode.Polite
                }
        )

        if (items.isEmpty()) {
            // Dashed, in the container edge's role, themed, as React's
            // (border-dashed border-border) and SwiftUI's are; it was a solid
            // foreground/300 edge until 2026-09-22.
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .kozmosDashedEdge(KozmosThemeTokens.semanticsBorderSubtle, KozmosDimensions.semanticsRadiusPanel),
                shape = RoundedCornerShape(KozmosDimensions.semanticsRadiusPanel),
                color = KozmosThemeTokens.primitivesColorsBackground100.copy(alpha = 0.4f)
            ) {
                Box(
                    modifier = Modifier.padding(KozmosDimensions.primitivesLayoutSpacing300),
                    contentAlignment = Alignment.Center
                ) {
                    emptyState?.invoke()
                }
            }
        } else {
            items.forEach { item ->
                KozmosPOIResultCard(
                    currentFloorId = currentFloorId,
                    poi = item.poi,
                    result = item.result.selecting(selectedPoiId),
                    onSelect = onSelect,
                    featuredLabel = featuredLabel,
                    travelTimeBandLabels = travelTimeBandLabels,
                    numbered = numbered
                )
            }
        }
    }
}
