// Chip.mdx's SwiftUI snippet ("Emotions"), word for word below this comment:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

struct FieldStatusChips: View {
    @State private var showNew = true

    var body: some View {
        KozmosChipGroup {
            KozmosChip(text: "New", emotion: .informative, selected: showNew, action: { showNew.toggle() })
            KozmosChip(text: "Marked for Deletion", emotion: .danger, onRemove: {})
        }
    }
}
