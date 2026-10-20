// IconButton.mdx's SwiftUI snippet, word for word below this comment:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// An action with no words of its own. iconName is an SF Symbol's name, not
// a Kozmos icon's (KozmosIcon draws "home-line" as "house"), and the label
// is what VoiceOver says, as aria-label is on the web.
struct HomeButton: View {
    let goHome: () -> Void

    var body: some View {
        KozmosIconButton(iconName: "house", action: goHome)
            .accessibilityLabel("Home")
    }
}
