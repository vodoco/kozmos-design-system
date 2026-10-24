// Stack.mdx's SwiftUI snippet, word for word below this comment:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// A column with Kozmos's spacing between its children, 8pt by default.
// Unlike React's column it never stretches them: .start lines them up on the
// leading edge. There is no wrap or justify.
struct ReceptionStack: View {
    var body: some View {
        Stack(alignment: .start) {
            KozmosText("Reception")
            KozmosText("Ground floor")
        }
    }
}
