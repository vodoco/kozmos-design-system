// Toast.mdx's SwiftUI snippet, word for word below this comment:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// The toast draws itself at the bottom of the space it is given, so it goes
// over the screen's content. It closes after 3 seconds (autoDismissAfter) or
// at its close button, named by closeLabel, "Dismiss notification" unless you
// pass your own.
struct LocationSavedToast: View {
    @State private var isPresented = false

    var body: some View {
        ZStack {
            KozmosButton("Show toast") { isPresented = true }
            KozmosToast(
                isPresented: $isPresented,
                title: "Location saved",
                description: "Find it in your saved places."
            )
        }
    }
}
