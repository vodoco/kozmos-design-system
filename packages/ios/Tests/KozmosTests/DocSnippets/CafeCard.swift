// POICard.mdx's SwiftUI snippet, word for word below this comment: compiled
// here, so a renamed or removed parameter fails in this target rather than
// in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// The line under the title is category, where React's is subtitle, and the
// description is content of your own. The card is 300pt wide, with no badges
// or selection, and its title is not a heading.
struct CafeCard: View {
    var body: some View {
        KozmosPOICard(
            title: "Atrium Café",
            category: "Ground floor",
            descriptionContent: {
                KozmosText("Coffee and refreshments by the main entrance.", tone: .muted)
            }
        )
    }
}
