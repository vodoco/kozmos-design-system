// ManoeuvreCard.mdx's Compose snippet ("The whole instruction"), word for
// word below the package line: compiled here, so a renamed or removed
// parameter fails in this target rather than in a reader's project. Change
// the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import com.kozmos.components.directionstep.DirectionType
import com.kozmos.components.itinerary.KozmosItinerary
import com.kozmos.components.itinerary.KozmosItineraryStep
import com.kozmos.components.manoeuvrecard.KozmosManoeuvreCard

// A product that keeps the instruction to two lines, as Kozmos 0.5 drew it.
@Composable
fun ShortManoeuvre(steps: List<KozmosItineraryStep>) {
    var expanded by remember { mutableStateOf(false) }
    KozmosManoeuvreCard(
        type = DirectionType.EscalatorUp,
        instruction = "Take the escalator near Fountain Court up to Level 1",
        expanded = expanded,
        onToggle = { expanded = !expanded },
        detail = "40 m · Ground Floor",
        instructionLines = 2
    ) {
        KozmosItinerary(origin = "Main Entrance", steps = steps, destination = "Airport Shuttles")
    }
}
