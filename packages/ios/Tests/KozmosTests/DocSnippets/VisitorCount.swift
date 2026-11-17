// Text.mdx's SwiftUI snippet ("Display size"), word for word below this comment:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// A figure at the display size, 48pt bold, over its label.
struct VisitorCount: View {
    var body: some View {
        VStack(alignment: .leading) {
            KozmosText("1,284", style: .display)
            KozmosText("Visitors today", style: .subheadline, tone: .muted)
        }
    }
}
