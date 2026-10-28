// Progress.mdx's SwiftUI snippet ("Circular"), word for word below this
// comment: compiled here, so a renamed or removed parameter fails in this
// target rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// A count out of a total: 11 of 15 levels. The label's words name the ring
// for VoiceOver; it says the value as a percentage unless you give your own.
struct LevelsAdded: View {
    var body: some View {
        KozmosProgress(value: 11, total: 15, shape: .circular, size: .lg) {
            VStack(spacing: 0) {
                Text("11").font(.title).fontWeight(.semibold)
                Text("Levels Added in total").font(.caption)
            }
        }
        .accessibilityValue("11 of 15")
    }
}
