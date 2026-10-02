// POIResultList.mdx's SwiftUI snippet ("Numbered results: quick access"),
// word for word below this comment: compiled here, so a renamed or removed
// parameter fails in this target rather than in a reader's project. Change
// the two together.
import SwiftUI
import Kozmos

// The places of the category chosen in the browse grid, numbered by the
// product: SDK cards retain the number alongside Featured or badge labels.
struct QuickAccessResults: View {
    let results: [KozmosPOIResultListItem]
    // "6 places", in the visitor's language.
    let countLabel: String
    let selectedPoiId: String?
    let onSelect: (String) -> Void

    var body: some View {
        KozmosPOIResultList(
            items: results,
            resultCountLabel: countLabel,
            selectedPoiId: selectedPoiId,
            numbered: true,
            onSelect: onSelect
        )
    }
}
