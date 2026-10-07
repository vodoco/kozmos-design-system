// Container.mdx's SwiftUI snippet, word for word below this comment:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// In a map shell's sheet or side panel: 16 a side, whatever the window.
struct VenueOverview: View {
    var body: some View {
        KozmosContainer(inset: .panel) {
            Text("Venue overview")
        }
    }
}
