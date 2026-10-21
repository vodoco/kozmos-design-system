// Textarea.mdx's SwiftUI snippet, word for word below this comment:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// A multiline editor with its placeholder drawn behind it. It takes no
// label, name, error or character count: React's aria-label has no
// counterpart here.
struct VisitFeedback: View {
    @Binding var feedback: String

    var body: some View {
        KozmosTextarea(text: $feedback, placeholder: "Tell us about your visit")
    }
}
