// SplitButton.mdx's SwiftUI snippet, word for word below this comment:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// The label is a String, and each menu item a title and what it does; the
// menu half is the system's Menu. There is no disabled state.
struct PublishOrSaveDraft: View {
    let publish: () -> Void
    let saveDraft: () -> Void

    var body: some View {
        KozmosSplitButton(
            label: "Publish",
            mainAction: publish,
            menuItems: [("Save draft", saveDraft)]
        )
    }
}
