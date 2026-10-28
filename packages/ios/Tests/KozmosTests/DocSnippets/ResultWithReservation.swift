// POIResultCard.mdx's SwiftUI snippet ("The product's own actions"), word for
// word below this comment: compiled here, so a renamed or removed parameter
// fails in this target rather than in a reader's project.
// KozmosPOIHostActionsTests presses it. Change the two together.
import SwiftUI
import Kozmos

// A restaurant's result offers the product's own action after the card's:
// its words, in the visitor's language, and its icon.
struct ResultWithReservation: View {
    let poi: KozmosPOIPresentation
    // The result's number, counted from 1: the one its map marker shows.
    let number: Int
    // "Reserve a table", in the visitor's language.
    let reserveLabel: String
    let onSelect: (String) -> Void
    let onReserve: (String) -> Void

    var body: some View {
        KozmosPOIResultCard(
            poi: poi,
            result: KozmosPOIResultPresentation(
                poiId: poi.id,
                resultIndex: number,
                selected: true,
                hostActions: [
                    KozmosPOIHostActionPresentation(id: "reserve", label: reserveLabel, iconName: "calendar")
                ]
            ),
            onSelect: onSelect,
            // Told which of the product's actions was pressed, and the POI's ID.
            onHostAction: { actionId, poiId in
                if actionId == "reserve" { onReserve(poiId) }
            }
        )
    }
}
