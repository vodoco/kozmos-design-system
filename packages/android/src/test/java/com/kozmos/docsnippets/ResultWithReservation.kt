// POIResultCard.mdx's Compose snippet ("The product's own actions"), word for
// word below the package line: compiled here, so a renamed or removed
// parameter fails in this target rather than in a reader's project.
// KozmosPOIHostActionsTest presses it. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import com.kozmos.components.poiresultcard.KozmosPOIResultCard
import com.kozmos.components.poiresultcard.KozmosPOIResultPresentationStyle
import com.kozmos.contracts.KozmosPOIHostActionPresentation
import com.kozmos.contracts.KozmosPOIPresentation
import com.kozmos.contracts.KozmosPOIResultPresentation

// A restaurant's result offers the product's own action after the card's:
// its words, in the visitor's language, and its icon.
@Composable
fun ResultWithReservation(
    poi: KozmosPOIPresentation,
    // The result's number, counted from 1: the one its map marker shows.
    number: Int,
    // "Reserve a table", in the visitor's language.
    reserveLabel: String,
    onSelect: (String) -> Unit,
    onReserve: (String) -> Unit
) {
    KozmosPOIResultCard(
        poi = poi,
        result = KozmosPOIResultPresentation(
            poiId = poi.id,
            resultIndex = number,
            selected = true,
            hostActions = listOf(
                KozmosPOIHostActionPresentation(id = "reserve", label = reserveLabel, iconName = "calendar")
            )
        ),
        onSelect = onSelect,
        presentationStyle = KozmosPOIResultPresentationStyle.Sdk,
        // Told which of the product's actions was pressed, and the POI's ID.
        onHostAction = { actionId, poiId ->
            if (actionId == "reserve") onReserve(poiId)
        }
    )
}
