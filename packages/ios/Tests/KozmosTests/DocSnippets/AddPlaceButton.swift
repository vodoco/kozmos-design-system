// FloatingActionButton.mdx's SwiftUI snippet, word for word below this
// comment: compiled here, so a renamed or removed parameter fails in this
// target rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// A plus by default: iconName is an SF Symbol's name. The button takes no
// label: VoiceOver says the one you give it, as aria-label is on the web, or
// else the symbol's own name. It sits where you put it: there is no fixed
// placement.
struct AddPlaceButton: View {
    let addPlace: () -> Void

    var body: some View {
        KozmosFloatingActionButton(action: addPlace)
            .accessibilityLabel("Add place")
    }
}
