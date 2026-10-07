// POIDetailPanel.mdx's Compose snippet ("Details in Compose"), word for word
// below the package line: compiled here, so a renamed or removed parameter
// fails in this target rather than in a reader's project. Change the two
// together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import com.kozmos.components.poidetailpanel.KozmosPOIDetailPanel
import com.kozmos.components.poidetailpanel.KozmosPOIDetailPanelPresentation
import com.kozmos.contracts.KozmosPOIAction
import com.kozmos.contracts.KozmosPOIDetailDescription
import com.kozmos.contracts.KozmosPOIDetailSummary
import com.kozmos.contracts.KozmosPOIDetailSummaryKind
import com.kozmos.contracts.KozmosPOIDetailsPresentation
import com.kozmos.contracts.KozmosPOIPresentation
import com.kozmos.contracts.KozmosPOISupplementaryAction
import com.kozmos.contracts.KozmosPOISupplementaryActionPresentation
import com.kozmos.contracts.KozmosTravelEstimatePresentation

// The product's adapter has already put the venue's facts into its own words.
@Composable
fun PlaceDetails(
    poi: KozmosPOIPresentation,
    actionLabels: Map<KozmosPOIAction, String>,
    walk: KozmosTravelEstimatePresentation,
    onAction: (KozmosPOIAction, String) -> Unit,
    onBook: (String) -> Unit
) {
    KozmosPOIDetailPanel(
        poi = poi,
        actionLabels = actionLabels,
        onAction = onAction,
        presentation = KozmosPOIDetailPanelPresentation.Sheet,
        details = KozmosPOIDetailsPresentation(
            // Drawn on Go, under its label: "2 min · 120 m".
            travelEstimate = walk,
            summary = listOf(
                KozmosPOIDetailSummary(
                    id = "rating",
                    kind = KozmosPOIDetailSummaryKind.Rating,
                    label = "Rating",
                    value = "4.7 / 5",
                    detail = "32 reviews"
                )
            ),
            description = KozmosPOIDetailDescription(
                preview = "Family-run since 1998.",
                full = "Family-run since 1998. The terrace overlooks the atrium."
            ),
            supplementaryActions = listOf(
                KozmosPOISupplementaryActionPresentation(KozmosPOISupplementaryAction.Book, "Book")
            )
        ),
        // Without a callback, Book is drawn disabled.
        onSupplementaryAction = { action, poiId ->
            if (action == KozmosPOISupplementaryAction.Book) onBook(poiId)
        }
    )
}
