// POIDetailPanel.mdx's Compose snippet ("The product's own actions"), word for
// word below the package line: compiled here, so a renamed or removed
// parameter fails in this target rather than in a reader's project.
// KozmosPOIHostActionsTest presses it. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import com.kozmos.components.poidetailpanel.KozmosPOIDetailPanel
import com.kozmos.contracts.KozmosPOIAction
import com.kozmos.contracts.KozmosPOIDetailsPresentation
import com.kozmos.contracts.KozmosPOIHostActionPresentation
import com.kozmos.contracts.KozmosPOIPresentation

// The details card hands the visitor to the product's app from its own
// action strip, after the place's actions.
@Composable
fun DetailsWithHandOff(
    poi: KozmosPOIPresentation,
    actionLabels: Map<KozmosPOIAction, String>,
    // "Get live directions in Pointr Express", in the visitor's language.
    handOffLabel: String,
    onAction: (KozmosPOIAction, String) -> Unit,
    onHandOff: (String) -> Unit
) {
    KozmosPOIDetailPanel(
        poi = poi,
        actionLabels = actionLabels,
        onAction = onAction,
        // The product's own action, last in the card's strip.
        details = KozmosPOIDetailsPresentation(
            hostActions = listOf(
                KozmosPOIHostActionPresentation(id = "open-in-app", label = handOffLabel, iconName = "map-01")
            )
        ),
        // Told which of the product's actions was pressed, and the POI's ID.
        onHostAction = { actionId, poiId ->
            if (actionId == "open-in-app") onHandOff(poiId)
        }
    )
}
