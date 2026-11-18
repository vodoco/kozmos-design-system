// Grid.mdx's SwiftUI snippet ("Virtualized"), word for word below
// this comment: compiled here, so a renamed or removed parameter fails in
// this target rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// Kozmos's Grid is a LazyVGrid: in a ScrollView it draws only the cards in
// view, in reading order, for hundreds of sites.
struct SiteCards: View {
    let sites: [String]

    var body: some View {
        ScrollView {
            Grid(cols: 3) {
                ForEach(sites, id: \.self) { site in
                    KozmosText(site)
                }
            }
        }
    }
}
