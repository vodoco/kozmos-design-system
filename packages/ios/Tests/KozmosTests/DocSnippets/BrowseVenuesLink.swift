// Link.mdx's SwiftUI snippet, word for word below this comment: compiled
// here, so a renamed or removed parameter fails in this target rather than
// in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// SwiftUI's Link, in the theme colour: a press opens the URL through the
// environment's openURL, as an href does, and VoiceOver hears a link. There
// is no subtle variant. A link that leaves the app is external: it draws
// the new-tab icon at its end, and VoiceOver hints "Opens in your browser".
struct BrowseVenuesLink: View {
    let venues: URL
    let privacyPolicy: URL

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            KozmosLink("Browse venues", destination: venues)
            KozmosLink("Privacy Policy", destination: privacyPolicy, external: true)
        }
    }
}
