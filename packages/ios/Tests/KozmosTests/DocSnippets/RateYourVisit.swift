// Rating.mdx's SwiftUI snippet, word for word below this comment:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// 0 is unrated, and choosing the chosen star clears it. label is the
// group's name for VoiceOver, as aria-label is on the web.
struct RateYourVisit: View {
    @State private var rating = 0

    var body: some View {
        KozmosRating(value: $rating, label: "Rate your visit")
    }
}
