// Box.mdx's SwiftUI snippet, word for word below this comment:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// SwiftUI's Box is named Box, with no Kozmos prefix. It adds nothing, not
// even a stack: what it holds lays out as its parent lays it out.
struct OverviewBox: View {
    var body: some View {
        Box {
            KozmosText("Venue overview")
        }
    }
}
