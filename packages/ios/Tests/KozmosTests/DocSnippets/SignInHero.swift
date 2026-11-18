// Heading.mdx's SwiftUI snippet ("Display size"), word for word below this comment:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// The sign-in page's headline at the display size, 48pt bold, still a
// level 1 heading to VoiceOver.
struct SignInHero: View {
    var body: some View {
        KozmosHeading("Digitize your building like never before.", level: .h1, size: .display)
    }
}
