// BottomSheet.mdx's SwiftUI snippet, word for word below this comment:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// The system's sheet, with its drag indicator, at the medium and large
// detents; a swipe down closes it. It draws no title, description, close
// button or padding of its own: the content pads itself.
struct LocationDetailsSheet: View {
    @State private var isPresented = false

    var body: some View {
        KozmosButton("Show details") { isPresented = true }
            .kozmosBottomSheet(isPresented: $isPresented) {
                VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing100) {
                    KozmosText("Location details", style: .headline)
                    KozmosText("Reception is on the ground floor.", tone: .muted)
                }
                .padding(KozmosDimensions.primitivesLayoutSpacing300)
            }
    }
}
