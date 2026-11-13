// Container.mdx's SwiftUI snippet ("Top and bottom space"), word for word
// below this comment: compiled here, so a renamed or removed parameter fails
// in this target rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// A page column's own space: 16 above and below it, and 16 a side.
struct MapContentColumn: View {
    var body: some View {
        KozmosContainer(inset: .panel, block: .sm) {
            KozmosText("Map content")
        }
    }
}
