// EmptyState.mdx's SwiftUI snippet ("A tone"), word for word below this
// comment: compiled here, so a renamed or removed parameter fails in this
// target rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

struct MapContentEmpty: View {
    var body: some View {
        KozmosEmptyState(
            title: "No Map Content Found",
            description: "Nothing on this level matches your search.",
            list: ["Check the building and level", "Clear the type filters"],
            listLabel: "What to try",
            tone: .alert
        )
    }
}
