// POIDetailPanel.mdx's SwiftUI snippet ("The product's own actions"), word for
// word below this comment: compiled here, so a renamed or removed parameter
// fails in this target rather than in a reader's project.
// KozmosPOIHostActionsTests presses it. Change the two together.
import SwiftUI
import Kozmos

// The details card hands the visitor to the product's app from its own
// action strip, after the place's actions.
struct DetailsWithHandOff: View {
    let poi: KozmosPOIPresentation
    let actionLabels: [KozmosPOIAction: String]
    // "Get live directions in Pointr Express", in the visitor's language.
    let handOffLabel: String
    let onAction: (KozmosPOIAction, String) -> Void
    let onHandOff: (String) -> Void

    var body: some View {
        KozmosPOIDetailPanel(
            poi: poi,
            actionLabels: actionLabels,
            onAction: onAction,
            // The product's own action, last in the card's strip.
            details: KozmosPOIDetailsPresentation(hostActions: [
                KozmosPOIHostActionPresentation(id: "open-in-app", label: handOffLabel, iconName: "map-01")
            ]),
            // Told which of the product's actions was pressed, and the POI's ID.
            onHostAction: { actionId, poiId in
                if actionId == "open-in-app" { onHandOff(poiId) }
            }
        )
    }
}
