// Menu.mdx's SwiftUI snippet, word for word below this comment: compiled
// here, so a renamed or removed parameter fails in this target rather than
// in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// SwiftUI's Menu: its trigger is the title, drawn as the system draws a
// menu's label, not as a Kozmos button. Picking an item hands you its title
// and closes the menu.
struct SortPlaces: View {
    @State private var sort = "Nearby"

    var body: some View {
        VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing100) {
            KozmosMenu(title: "Sort places", items: ["Nearby", "Name"], onSelect: { sort = $0 })
            KozmosText("Sort: \(sort)")
        }
    }
}
