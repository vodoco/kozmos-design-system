package com.kozmos.components.routesetuppanel

import androidx.compose.runtime.Composable
import com.figma.code.connect.Figma
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType
import com.kozmos.components.routelocationfield.KozmosRouteLocationField
import com.kozmos.components.routesummary.KozmosRoutePresentation

// GAP-206: State is ready and pending (Incomplete not ready, Ready ready,
// Pending ready while the route is worked out); Presentation is
// presentation. Title Text is title, Description Text description (Show
// Description). The two fields are RouteLocationField instances.
@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2606-17873")
class KozmosRouteSetupPanelConnect {
    @FigmaProperty(FigmaType.Enum, "State")
    val ready: Boolean = Figma.mapping(
        "Incomplete" to false,
        "Ready" to true,
        "Pending" to true
    )

    @FigmaProperty(FigmaType.Enum, "State")
    val pending: Boolean = Figma.mapping(
        "Incomplete" to false,
        "Ready" to false,
        "Pending" to true
    )

    @FigmaProperty(FigmaType.Enum, "Presentation")
    val presentation: KozmosRoutePresentation = Figma.mapping(
        "Hosted" to KozmosRoutePresentation.Hosted,
        "Standalone" to KozmosRoutePresentation.Standalone
    )

    @FigmaProperty(FigmaType.Text, "Title Text")
    val title: String = "Set up a route"

    @FigmaProperty(FigmaType.Text, "Description Text")
    val description: String = "Choose where your route starts and ends."

    @FigmaProperty(FigmaType.Boolean, "Show Description")
    val showDescription: Boolean = true

    @Composable
    fun ComponentExample() {
        KozmosRouteSetupPanel(
            ready = ready,
            onContinue = {},
            onClose = {},
            pending = pending,
            title = title,
            description = if (showDescription) description else null,
            presentation = presentation
        ) {
            KozmosRouteLocationField(label = "From", location = null, query = "", options = emptyList(), onQueryChange = {}, onSelect = {}, onClear = {})
            KozmosRouteLocationField(label = "To", location = null, query = "", options = emptyList(), onQueryChange = {}, onSelect = {}, onClear = {})
        }
    }
}
