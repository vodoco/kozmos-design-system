// Badge.mdx's SwiftUI snippet, word for word below this comment:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// A badge's count shows only with showCounter, and it is a String.
// KozmosCounter is the same pill on its own.
struct BadgeAndCounter: View {
    var body: some View {
        HStack {
            KozmosBadge("Badge", variant: .outline)
            KozmosBadge("New", variant: .secondary, counter: "2", showCounter: true)
            KozmosCounter("2")
        }
    }
}
