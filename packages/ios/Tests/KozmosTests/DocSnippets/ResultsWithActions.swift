// POIResultList.mdx's SwiftUI snippet ("Actions on the selected result"), word
// for word below this comment: compiled here, so a renamed or removed
// parameter fails in this target rather than in a reader's project. Change
// the two together.
import SwiftUI
import Kozmos

struct ResultsWithActions: View {
    let items: [KozmosPOIResultListItem]
    let selectedPoiId: String?
    let onSelect: (String) -> Void
    // Told which action was pressed, and the POI's own ID.
    let onAction: (KozmosPOIResultAction, String) -> Void

    var body: some View {
        KozmosPOIResultList(
            items: items,
            resultCountLabel: "\(items.count) results",
            selectedPoiId: selectedPoiId,
            // The selected result's action row, named in the visitor's words.
            actionsLabel: "Actions for this result",
            onSelect: onSelect,
            // Without it the actions are drawn disabled.
            onAction: onAction
        )
    }
}
