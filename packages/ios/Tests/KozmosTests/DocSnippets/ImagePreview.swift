// Dialog.mdx's SwiftUI snippet ("Full size"), word for word below this comment:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// The window less 16 on each side: the words keep their height and the
// image takes the rest, as large as it fits.
struct ImagePreview: View {
    @Binding var isPresented: Bool
    let image: Image

    var body: some View {
        KozmosDialog(isPresented: $isPresented, size: .full) {
            VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing100) {
                KozmosText("Image 1", style: .title3, weight: .semibold)
                KozmosText("Main entrance", style: .subheadline, tone: .muted)
                image
                    .resizable()
                    .scaledToFit()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .accessibilityLabel("Main entrance")
            }
        }
    }
}
