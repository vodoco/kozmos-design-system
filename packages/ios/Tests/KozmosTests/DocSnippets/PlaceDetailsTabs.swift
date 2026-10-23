// Tabs.mdx's SwiftUI snippet, word for word below this comment: compiled
// here, so a renamed or removed parameter fails in this target rather than
// in a reader's project, and drawn by KozmosTabsDocSnippetTests. Change the
// two together.
import SwiftUI
import Kozmos

// The list is a background/100 track. The selected tab is a background/0
// segment 4pt inside it, raised by KozmosShadows.semanticsElevationRaised,
// with foreground/0 words; the other tabs' words are foreground/400. No theme
// colour, as on the web and in Compose (decision 65).
struct PlaceDetailsTabs: View {
    @State private var selection = "overview"

    var body: some View {
        KozmosTabs(selection: $selection) {
            KozmosTabsList {
                KozmosTabsTrigger(value: "overview", title: "Overview", selection: $selection)
                KozmosTabsTrigger(value: "access", title: "Access", selection: $selection)
            }
            KozmosTabsContent(value: "overview", selection: $selection) {
                Text("Reception is on the ground floor.")
            }
            KozmosTabsContent(value: "access", selection: $selection) {
                Text("Step-free access through the main entrance.")
            }
        }
    }
}
