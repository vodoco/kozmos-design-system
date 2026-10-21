// Link.mdx's SwiftUI snippet, word for word below this comment: compiled
// here, so a renamed or removed parameter fails in this target rather than
// in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// SwiftUI's Link, in the theme colour: a press opens the URL through the
// environment's openURL, as an href does, and VoiceOver hears a link. There
// is no subtle variant.
struct BrowseVenuesLink: View {
    let venues: URL

    var body: some View {
        KozmosLink("Browse venues", destination: venues)
    }
}
