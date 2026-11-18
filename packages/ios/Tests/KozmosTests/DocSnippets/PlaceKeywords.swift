// ChipInput.mdx's SwiftUI snippet ("Implementation"), word for word
// below this comment: compiled here, so a renamed or removed parameter fails
// in this target rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// A place's keywords: Return or a comma adds one, Delete in the empty
// field removes the last, and each chip has its own remove.
struct PlaceKeywords: View {
    @State private var keywords = ["coffee", "breakfast"]

    var body: some View {
        KozmosChipInput(
            values: $keywords,
            label: "Keywords",
            placeholder: "Add a keyword",
            helperText: "Press Return or type a comma to add one."
        )
    }
}
