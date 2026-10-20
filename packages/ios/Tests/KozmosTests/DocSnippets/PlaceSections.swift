// Separator.mdx's SwiftUI snippet, word for word below this comment:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// A line between two sections. Between the items of a row it is
// KozmosSeparator(orientation: .vertical).
struct PlaceSections: View {
    var body: some View {
        VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing150) {
            KozmosText("Opening hours", style: .headline)
            KozmosSeparator()
            KozmosText("Monday–Friday, 09:00–18:00")
        }
    }
}
