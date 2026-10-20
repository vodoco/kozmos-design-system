// Breadcrumb.mdx's SwiftUI snippet, word for word below this comment:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// The trail is its titles, in order, and the last is the current page,
// which cannot be pressed. A press hands back the item's index: where it
// goes is yours, as the trail has no links.
struct VenueTrail: View {
    let showVenues: () -> Void

    var body: some View {
        KozmosBreadcrumb(items: ["Venues", "Central venue"], onSelect: { index in
            if index == 0 { showVenues() }
        })
    }
}
