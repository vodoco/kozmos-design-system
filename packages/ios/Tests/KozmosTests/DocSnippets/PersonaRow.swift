// PersonaMark.mdx's SwiftUI snippet, word for word below this comment:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// Beside the persona's name the mark is decoration: VoiceOver reads this row
// "Customer". KozmosPersonaMark(color:name:) standing alone is an image named
// by the persona; KozmosPersonaMarkGroup draws a row's personas, read
// "Assigned personas: Customer, Visitor".
struct PersonaRow: View {
    var body: some View {
        HStack(spacing: KozmosDimensions.primitivesLayoutSpacing100) {
            KozmosPersonaMark(color: .orange)
            KozmosText("Customer")
        }
    }
}
