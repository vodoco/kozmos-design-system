// POIResultCard.mdx's Compose snippet ("A walk shown as a band"), word for
// word below the package line: compiled here, so a renamed or removed
// parameter fails in this target rather than in a reader's project. Change
// the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import com.kozmos.components.poiresultcard.KozmosPOIResultCard
import com.kozmos.contracts.KozmosPOIPresentation
import com.kozmos.contracts.KozmosPOIResultPresentation
import com.kozmos.contracts.KozmosTravelEstimatePresentation
import com.kozmos.contracts.KozmosTravelTimeBand

// The walk the product already has, and its exact time in the visitor's words.
@Composable
fun WalkingResult(
    poi: KozmosPOIPresentation,
    walkSeconds: Double,
    walkLabel: String,
    bandLabels: Map<KozmosTravelTimeBand, String>,
    onSelect: (String) -> Unit
) {
    KozmosPOIResultCard(
        poi = poi,
        result = KozmosPOIResultPresentation(
            poiId = poi.id,
            resultIndex = 0,
            // The list shows the band; the details card keeps durationLabel.
            travelEstimate = KozmosTravelEstimatePresentation(
                durationSeconds = walkSeconds,
                durationLabel = walkLabel,
                band = KozmosTravelTimeBand.forDuration(walkSeconds)
            )
        ),
        onSelect = onSelect,
        // English until the product passes its own words.
        travelTimeBandLabels = bandLabels
    )
}
