package com.kozmos.components.mapattribution

import androidx.compose.runtime.Composable
import com.figma.code.connect.Figma
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType

// GAP-206: Appearance is appearance; Credit Text and Credit Text 2 are the
// credits' labels, in order; Show Brand is showBrand. The brand is the
// product's mark.
@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2606-17387")
class KozmosMapAttributionConnect {
    @FigmaProperty(FigmaType.Text, "Credit Text")
    val credit1: String = "© Example venue"

    @FigmaProperty(FigmaType.Text, "Credit Text 2")
    val credit2: String = "© OpenStreetMap"

    @FigmaProperty(FigmaType.Boolean, "Show Brand")
    val showBrand: Boolean = true

    @FigmaProperty(FigmaType.Enum, "Appearance")
    val appearance: KozmosMapAttributionAppearance = Figma.mapping(
        "Map" to KozmosMapAttributionAppearance.Map,
        "Surface" to KozmosMapAttributionAppearance.Surface
    )

    @Composable
    fun ComponentExample() {
        KozmosMapAttribution(
            credits = listOf(
                KozmosMapAttributionCredit(id = "venue", label = credit1),
                KozmosMapAttributionCredit(id = "basemap", label = credit2)
            ),
            showBrand = showBrand,
            appearance = appearance
        )
    }
}
