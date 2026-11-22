package com.kozmos.components.arrivalpanel

import androidx.compose.runtime.Composable
import com.figma.code.connect.Figma
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType
import com.kozmos.components.routesummary.KozmosRoutePresentation

// GAP-206: State is pending; Presentation is presentation. Title,
// Destination, Location and Message Text are title, destination,
// locationText and message, each optional one shown by its Show property;
// Show Metrics shows the journey as travelled, with its labels. Show Image
// is the destination's picture, the product's to give.
@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2606-17956")
class KozmosArrivalPanelConnect {
    @FigmaProperty(FigmaType.Enum, "State")
    val pending: Boolean = Figma.mapping(
        "Default" to false,
        "Pending" to true
    )

    @FigmaProperty(FigmaType.Enum, "Presentation")
    val presentation: KozmosRoutePresentation = Figma.mapping(
        "Hosted" to KozmosRoutePresentation.Hosted,
        "Standalone" to KozmosRoutePresentation.Standalone
    )

    @FigmaProperty(FigmaType.Text, "Title Text")
    val title: String = "You've arrived"

    @FigmaProperty(FigmaType.Text, "Destination Text")
    val destination: String = "Gate B12"

    @FigmaProperty(FigmaType.Text, "Location Text")
    val locationText: String = "Terminal 2, Level 1"

    @FigmaProperty(FigmaType.Boolean, "Show Location")
    val showLocation: Boolean = true

    @FigmaProperty(FigmaType.Text, "Message Text")
    val message: String = "Your gate opens 40 minutes before departure."

    @FigmaProperty(FigmaType.Boolean, "Show Message")
    val showMessage: Boolean = false

    @FigmaProperty(FigmaType.Text, "Duration Text")
    val durationText: String = "6 min"

    @FigmaProperty(FigmaType.Text, "Distance Text")
    val distanceText: String = "202 m"

    @FigmaProperty(FigmaType.Text, "Duration Label Text")
    val durationLabel: String = "Journey time"

    @FigmaProperty(FigmaType.Text, "Distance Label Text")
    val distanceLabel: String = "Distance travelled"

    @FigmaProperty(FigmaType.Boolean, "Show Metrics")
    val showMetrics: Boolean = true

    @FigmaProperty(FigmaType.Boolean, "Show Image")
    val showImage: Boolean = true

    @Composable
    fun ComponentExample() {
        KozmosArrivalPanel(
            destination = destination,
            onDone = {},
            destinationImage = if (showImage) "https://example.com/gate-b12.jpg" else null,
            locationText = if (showLocation) locationText else null,
            title = title,
            message = if (showMessage) message else null,
            actualDurationText = if (showMetrics) durationText else null,
            actualDistanceText = if (showMetrics) distanceText else null,
            durationLabel = durationLabel,
            distanceLabel = distanceLabel,
            pending = pending,
            presentation = presentation
        )
    }
}
