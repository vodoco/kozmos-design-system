// List.mdx's SwiftUI snippet, word for word below this comment: compiled
// here, so a renamed or removed parameter fails in this target rather than
// in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// SwiftUI's List, in its plain style: it scrolls by itself, fills the height
// it is given and draws the system's separators. A row is its text, and
// there is no border or compact density.
struct PlaceList: View {
    var body: some View {
        KozmosList {
            KozmosListItem("Reception")
            KozmosListItem("Atrium Café")
        }
    }
}
