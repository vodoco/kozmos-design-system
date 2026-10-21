// WayfindingCard.mdx's SwiftUI snippet, word for word below this comment:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// The card draws its title and, given an onClose, a close button named by
// closeLabel; your content goes under them. KozmosWayfindingInputRow is the
// origin and destination row it often holds.
struct RouteCard: View {
    var body: some View {
        KozmosWayfindingCard(title: "Route") {
            KozmosText("Select a destination to begin.")
        }
    }
}
