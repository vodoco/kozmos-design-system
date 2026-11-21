package com.kozmos.components.poiresultgroup

import androidx.compose.runtime.Composable
import com.figma.code.connect.Figma
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType

// GAP-206: State is defaultExpanded; Hide Text is hideLabel. Show More Text
// is drawn from showMoreLabel(hidden), a function of the count, so it keeps
// its default. Each member is a POIResultCard row from items.
@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2606-17557")
class KozmosPOIResultGroupConnect {
    @FigmaProperty(FigmaType.Enum, "State")
    val defaultExpanded: Boolean = Figma.mapping(
        "Collapsed" to false,
        "Expanded" to true
    )

    @FigmaProperty(FigmaType.Text, "Hide Text")
    val hideLabel: String = "Hide"

    @Composable
    fun ComponentExample() {
        KozmosPOIResultGroup(
            items = emptyList(),
            onSelect = {},
            label = "Starbucks",
            defaultExpanded = defaultExpanded,
            hideLabel = hideLabel
        )
    }
}
