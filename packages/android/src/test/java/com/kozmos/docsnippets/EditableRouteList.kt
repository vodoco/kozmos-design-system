// Itinerary.mdx's Compose snippet ("Changing an endpoint"), word for word
// below the package line: compiled here, so a renamed or removed parameter
// fails in this target rather than in a reader's project. Change the two
// together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import com.kozmos.components.itinerary.KozmosItinerary
import com.kozmos.components.itinerary.KozmosItineraryStep

// The route card's list, with Change on From and To. The host opens the
// endpoint for editing and moves focus to it.
@Composable
fun EditableRouteList(steps: List<KozmosItineraryStep>, editOrigin: () -> Unit, editDestination: () -> Unit) {
    KozmosItinerary(
        origin = "Dunkin'",
        steps = steps,
        destination = "Airport Shuttles",
        onEditOrigin = editOrigin,
        onEditDestination = editDestination
    )
}
