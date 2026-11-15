// List.mdx's SwiftUI snippet ("Rows with slots"), word for word below this
// comment: compiled here, so a renamed or removed parameter fails in this
// target rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// A checklist row: its status mark, read before the title; a role tag; a
// description and a meta line; one action at the end. selected: true tints
// a ticked row.
struct TourChecklist: View {
    var body: some View {
        KozmosList {
            KozmosListItem("Explore the map", description: "Pan, zoom and change levels.", meta: "2 min")
                .leading { KozmosListItemStatus(.done) }
                .titleAddon { KozmosTag("Viewer", variant: .secondary) }
                .trailing { KozmosButton("Replay", variant: .outline, size: .sm) {} }
        }
    }
}
