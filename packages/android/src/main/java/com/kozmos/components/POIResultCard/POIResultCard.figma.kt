package com.kozmos.components.poiresultcard

import androidx.compose.runtime.Composable
import com.figma.code.connect.Figma
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType
import com.kozmos.contracts.KozmosPOIPresentation
import com.kozmos.contracts.KozmosPOIResultPresentation

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=1351-8150")
class KozmosPOIResultCardConnect {
    @FigmaProperty(FigmaType.Text, "Title Text")
    val title: String = "Kozmos Cafe"

    @FigmaProperty(FigmaType.Enum, "State")
    val selected: Boolean = Figma.mapping(
        "Default" to false, "Selected" to true, "Featured" to false, "Unavailable" to false
    )

    @FigmaProperty(FigmaType.Enum, "State")
    val featured: Boolean = Figma.mapping(
        "Default" to false, "Selected" to false, "Featured" to true, "Unavailable" to false
    )

    @FigmaProperty(FigmaType.Enum, "State")
    val available: Boolean = Figma.mapping(
        "Default" to true, "Selected" to true, "Featured" to true, "Unavailable" to false
    )

    @Composable
    fun ComponentExample() {
        KozmosPOIResultCard(
            poi = KozmosPOIPresentation(
                id = "cafe", name = title, floorId = "l2", floorLabel = "Level 2", actions = emptyList()
            ),
            result = KozmosPOIResultPresentation(
                poiId = "cafe", resultIndex = 1, selected = selected,
                featured = featured, floorId = "l2", available = available
            ),
            onSelect = {}
        )
    }
}
