// Search.mdx's SwiftUI snippet ("A clear button"), word for word below this comment:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// The clear shows while the field holds text. It empties the binding, calls
// onClear and puts the focus back in the field; its name is the product's.
struct ClearableSearch: View {
    @Binding var query: String

    var body: some View {
        KozmosSearch(
            text: $query,
            placeholder: "Find a place",
            clearable: true,
            clearLabel: "Clear search"
        )
    }
}
