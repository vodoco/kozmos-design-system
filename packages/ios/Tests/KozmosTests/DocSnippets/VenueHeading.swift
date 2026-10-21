// Heading.mdx's SwiftUI snippet, word for word below this comment: compiled
// here, so a renamed or removed parameter fails in this target rather than
// in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// A level-1 heading unless level says otherwise: the level sets its size and
// the heading level VoiceOver's rotor reads. Its text is a String, and there
// is no `as`: the level is both.
struct VenueHeading: View {
    var body: some View {
        KozmosHeading("Venue overview")
    }
}
