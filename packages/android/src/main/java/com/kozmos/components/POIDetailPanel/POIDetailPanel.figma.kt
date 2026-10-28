package com.kozmos.components.poidetailpanel

import androidx.compose.runtime.Composable
import com.figma.code.connect.Figma
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType
import com.kozmos.contracts.KozmosPOIPresentation

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=1351-8103")
class KozmosPOIDetailPanelConnect {
    @FigmaProperty(FigmaType.Text, "Title Text")
    val title: String = "Kozmos Cafe"

    @FigmaProperty(FigmaType.Enum, "Presentation")
    val presentation: KozmosPOIDetailPanelPresentation = Figma.mapping(
        "Inline" to KozmosPOIDetailPanelPresentation.Inline,
        "Sheet" to KozmosPOIDetailPanelPresentation.Sheet,
        "Panel" to KozmosPOIDetailPanelPresentation.Panel
    )

    // Host Action is one of `details.hostActions` (GAP-130), which
    // `onHostAction` runs.
    @Composable
    fun ComponentExample() {
        KozmosPOIDetailPanel(
            poi = KozmosPOIPresentation(
                id = "cafe", name = title, floorId = "l2",
                floorLabel = "Level 2", actions = emptyList()
            ),
            actionLabels = emptyMap(),
            onAction = { _, _ -> },
            onClose = {},
            presentation = presentation,
            onHostAction = { _, _ -> }
        )
    }
}
