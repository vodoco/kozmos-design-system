// FieldWrapper.mdx's SwiftUI snippet, word for word below this comment:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// The wrapper draws a label, a required mark and helper text around a
// control that has none of its own, here a KozmosSearch. It ties none of them
// to the control, so the field keeps its own name: its placeholder.
struct VenueField: View {
    @Binding var venue: String

    var body: some View {
        KozmosFieldWrapper(
            label: "Venue",
            required: true,
            helperText: "Search by name or category"
        ) {
            KozmosSearch(text: $venue, placeholder: "Venue")
        }
    }
}
