// ThemeProvider.mdx's SwiftUI snippet, word for word below this comment:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// The provider follows the system until ThemeManager's selectedTheme, kept in
// the app's user defaults, says "light" or "dark". The scheme it sets is its
// presentation's, the window or sheet it is in, not this subtree's alone.
struct ThemedScreen: View {
    let onContinue: () -> Void

    var body: some View {
        KozmosThemeProvider {
            KozmosButton("Continue", action: onContinue)
        }
    }
}
