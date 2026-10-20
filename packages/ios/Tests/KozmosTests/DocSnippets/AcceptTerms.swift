// Checkbox.mdx's SwiftUI snippet, word for word below this comment:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// The checkbox draws its label beside it, and the whole row toggles. It has
// two states, checked and not: no indeterminate one.
struct AcceptTerms: View {
    @Binding var accepted: Bool

    var body: some View {
        KozmosCheckbox(checked: $accepted, label: "Accept terms and conditions")
    }
}
