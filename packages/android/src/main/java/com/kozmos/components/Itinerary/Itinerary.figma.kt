package com.kozmos.components.itinerary

import androidx.compose.runtime.Composable
import com.figma.code.connect.Figma
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType
import com.kozmos.components.directionstep.DirectionType

/** The route's steps come from the product's routing, not from Figma; the example shows one. */
@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2201-9608")
class KozmosItineraryConnect {
    @FigmaProperty(FigmaType.Text, "Origin Text")
    val origin: String = "Dunkin'"

    @FigmaProperty(FigmaType.Text, "Destination Text")
    val destination: String = "Airport Shuttles"

    @FigmaProperty(FigmaType.Text, "Origin Label")
    val originLabel: String = "From"

    @FigmaProperty(FigmaType.Text, "Destination Label")
    val destinationLabel: String = "To"

    @Composable
    fun ComponentExample() {
        KozmosItinerary(
            origin = origin,
            steps = listOf(
                KozmosItineraryStep(id = "1", instruction = "Take Elevator down to First Floor", type = DirectionType.LiftDown, isCurrent = true),
            ),
            destination = destination,
            originLabel = originLabel,
            destinationLabel = destinationLabel,
        )
    }
}
