// SearchBar.mdx's SwiftUI snippet, word for word below this comment:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// The placeholder is also the field's spoken name. The clear button empties
// the query, then calls onClear if there is one.
struct PlaceSearch: View {
    @Binding var query: String

    var body: some View {
        KozmosSearchBar(text: $query, placeholder: "Search places")
    }
}
