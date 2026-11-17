package com.kozmos.components.descriptionlist

import androidx.compose.runtime.Composable
import com.figma.code.connect.Figma
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType

// GAP-221: the DescriptionList set. Its node id is a placeholder until the set
// is built in the live file, so this file stays out of figma.linked.config.json.
// Layout stacks the items or sets them side by side.
@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=TBD")
class KozmosDescriptionListConnect {
    @FigmaProperty(FigmaType.Enum, "Layout")
    val layout: KozmosDescriptionListLayout = Figma.mapping(
        "Stack" to KozmosDescriptionListLayout.Stack,
        "Row" to KozmosDescriptionListLayout.Row
    )

    @Composable
    fun ComponentExample() {
        KozmosDescriptionList(layout = layout) {
            KozmosDescriptionListItem(label = "Name", value = "Gate A12")
            KozmosDescriptionListItem(label = "Featured", checked = true)
        }
    }
}
