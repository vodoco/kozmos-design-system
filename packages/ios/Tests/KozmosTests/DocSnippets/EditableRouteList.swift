// Itinerary.mdx's SwiftUI snippet ("Changing an endpoint"), word for word
// below this comment: compiled here, so a renamed or removed parameter fails
// in this target rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// The route card's list, with Change on From and To. The host opens the
// endpoint for editing and moves focus to it.
struct EditableRouteList: View {
    let steps: [KozmosItineraryStep]
    let editOrigin: () -> Void
    let editDestination: () -> Void

    var body: some View {
        KozmosItinerary(
            origin: "Dunkin'",
            steps: steps,
            destination: "Airport Shuttles",
            onEditOrigin: editOrigin,
            onEditDestination: editDestination
        )
    }
}
