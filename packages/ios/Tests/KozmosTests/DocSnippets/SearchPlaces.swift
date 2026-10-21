// Search.mdx's SwiftUI snippet, word for word below this comment: compiled
// here, so a renamed or removed parameter fails in this target rather than
// in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// A field with a magnifying glass and no label, helper text or error. The
// placeholder is the field's title, so it is the name VoiceOver says: React's
// aria-label has no counterpart.
struct SearchPlaces: View {
    @Binding var query: String

    var body: some View {
        KozmosSearch(text: $query, placeholder: "Search places")
    }
}
