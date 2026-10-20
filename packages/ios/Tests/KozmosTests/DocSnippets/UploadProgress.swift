// Progress.mdx's SwiftUI snippet, word for word below this comment:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// value is measured against total (1 by default), as React's is against max.
// The bar has no name of its own: VoiceOver says the label it is given.
struct UploadProgress: View {
    var body: some View {
        KozmosProgress(value: 25, total: 50)
            .accessibilityLabel("Upload progress")
    }
}
