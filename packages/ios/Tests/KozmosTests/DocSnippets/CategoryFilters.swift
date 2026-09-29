// Chip.mdx's SwiftUI snippet ("iOS SwiftUI"), word for word below this
// comment: compiled here, so a renamed or removed parameter fails in this
// target rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// Filters that combine: each chip is its own toggle, and VoiceOver hears
// whether it is selected. "Open now" can only be taken away.
struct CategoryFilters: View {
    @Binding var category: String
    @Binding var openNow: Bool

    var body: some View {
        KozmosChipGroup {
            KozmosChip(text: "All", selected: category == "all", action: { category = "all" })
            KozmosChip(text: "Coffee", selected: category == "coffee") {
                Image(systemName: "cup.and.saucer.fill")
            } action: {
                category = "coffee"
            }
            if openNow {
                KozmosChip(text: "Open now", onRemove: { openNow = false })
            }
        }
    }
}
