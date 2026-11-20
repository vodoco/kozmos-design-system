// POIResultCard.mdx's Compose snippet ("What a travel time includes"), word
// for word below the package line: compiled here, so a renamed or removed
// parameter fails in this target rather than in a reader's project. Change
// the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import com.kozmos.components.poiresultcard.KozmosPOIResultCard
import com.kozmos.contracts.KozmosPOIPresentation
import com.kozmos.contracts.KozmosPOIResultPresentation
import com.kozmos.contracts.KozmosTravelEstimatePartKind
import com.kozmos.contracts.KozmosTravelEstimatePartPresentation
import com.kozmos.contracts.KozmosTravelEstimatePresentation

// The whole time, the queue included, and the queue's part of it, each in
// the visitor's words: "12 min", "Includes security (about 8 min)".
@Composable
fun AfterSecurityResult(
    poi: KozmosPOIPresentation,
    // The result's number, counted from 1: the one its map marker shows.
    number: Int,
    totalSeconds: Double,
    totalLabel: String,
    securitySeconds: Double,
    securityLabel: String,
    onSelect: (String) -> Unit
) {
    KozmosPOIResultCard(
        poi = poi,
        result = KozmosPOIResultPresentation(
            poiId = poi.id,
            resultIndex = number,
            travelEstimate = KozmosTravelEstimatePresentation(
                durationSeconds = totalSeconds,
                durationLabel = totalLabel,
                // Drawn under the time and said after it.
                breakdown = listOf(
                    KozmosTravelEstimatePartPresentation(
                        kind = KozmosTravelEstimatePartKind.SecurityQueue,
                        durationSeconds = securitySeconds,
                        label = securityLabel
                    )
                )
            )
        ),
        onSelect = onSelect
    )
}
