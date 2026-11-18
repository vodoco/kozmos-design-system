// Avatar.mdx's SwiftUI snippet ("Sizes"), word for word below this comment:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// 24, for a row that keeps its own height (decision 221).
struct ClientMark: View {
    var body: some View {
        KozmosAvatar(imageURL: nil, fallbackText: "AA", size: .sm)
    }
}
