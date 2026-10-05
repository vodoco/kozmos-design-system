package com.kozmos.components.manoeuvrecard

import androidx.compose.runtime.Composable
import com.figma.code.connect.Figma
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType
import com.kozmos.components.directionstep.DirectionType
import com.kozmos.components.itinerary.KozmosItinerary
import com.kozmos.components.itinerary.KozmosItineraryStep

/** The itinerary the card opens into and whether it is open are the product's; the example shows one step. */
@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2210-38624")
class KozmosManoeuvreCardConnect {
    @FigmaProperty(FigmaType.Text, "Instruction Text")
    val instruction: String = "Take Elevator down to First Floor"

    @FigmaProperty(FigmaType.Text, "Detail Text")
    val detail: String = "58 m · Second Floor"

    @FigmaProperty(FigmaType.Enum, "State")
    val expanded: Boolean = Figma.mapping(
        "Closed" to false,
        "Open" to true,
    )

    @FigmaProperty(FigmaType.Enum, "Appearance")
    val appearance: KozmosManoeuvreAppearance = Figma.mapping(
        "Theme" to KozmosManoeuvreAppearance.Theme,
        "Background" to KozmosManoeuvreAppearance.Background,
    )

    @Composable
    fun ComponentExample() {
        KozmosManoeuvreCard(
            type = DirectionType.LiftDown,
            instruction = instruction,
            expanded = expanded,
            onToggle = {},
            appearance = appearance,
            detail = detail,
        ) {
            KozmosItinerary(
                origin = "Dunkin'",
                steps = listOf(
                    KozmosItineraryStep(id = "1", instruction = "Take Elevator down to First Floor", type = DirectionType.LiftDown, isCurrent = true),
                ),
                destination = "Airport Shuttles",
            )
        }
    }
}
