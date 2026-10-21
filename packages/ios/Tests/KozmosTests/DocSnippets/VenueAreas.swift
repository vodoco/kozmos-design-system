// Grid.mdx's SwiftUI snippet, word for word below this comment: compiled
// here, so a renamed or removed parameter fails in this target rather than
// in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// Equal columns, two unless cols says otherwise, 16pt apart both ways; what
// it holds fills them in order. There are no row, flow or alignment options.
// Kozmos's Grid shares SwiftUI's name, and with Kozmos imported, Grid is
// Kozmos's.
struct VenueAreas: View {
    var body: some View {
        Grid(cols: 2) {
            KozmosText("Reception")
            KozmosText("Meeting rooms")
        }
    }
}
