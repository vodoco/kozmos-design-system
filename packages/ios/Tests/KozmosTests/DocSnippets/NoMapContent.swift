// EmptyState.mdx's SwiftUI snippet ("A list in its body"), word for word
// below this comment: compiled here, so a renamed or removed parameter fails
// in this target rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

struct NoMapContent: View {
    var body: some View {
        KozmosEmptyState(
            title: "No Map Content Found",
            description: "Nothing on this level matches your search.",
            list: ["Check the building and level", "Clear the type filters", "Search by another name or an ID"],
            listLabel: "What to try"
        )
    }
}
