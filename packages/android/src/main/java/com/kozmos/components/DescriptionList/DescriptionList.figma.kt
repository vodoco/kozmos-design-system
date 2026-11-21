package com.kozmos.components.descriptionlist

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.runtime.Composable
import com.figma.code.connect.Figma
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType
import com.kozmos.components.iconbutton.KozmosIconButton

// GAP-221, decision 199: Layout is layout. Each Label N Text and Value N
// Text is an item's label and value; Action is the third item's copy
// button, its trailing action.
@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2572-68523")
class KozmosDescriptionListConnect {
    @FigmaProperty(FigmaType.Enum, "Layout")
    val layout: KozmosDescriptionListLayout = Figma.mapping(
        "Stack" to KozmosDescriptionListLayout.Stack,
        "Row" to KozmosDescriptionListLayout.Row
    )

    @FigmaProperty(FigmaType.Text, "Label 1 Text")
    val label1: String = "Name"

    @FigmaProperty(FigmaType.Text, "Value 1 Text")
    val value1: String = "Gate A12"

    @FigmaProperty(FigmaType.Text, "Label 2 Text")
    val label2: String = "Featured"

    @FigmaProperty(FigmaType.Text, "Value 2 Text")
    val value2: String = "Yes"

    @FigmaProperty(FigmaType.Text, "Label 3 Text")
    val label3: String = "FID"

    @FigmaProperty(FigmaType.Text, "Value 3 Text")
    val value3: String = "f-1209"

    @FigmaProperty(FigmaType.Boolean, "Action")
    val showAction: Boolean = true

    @Composable
    fun ComponentExample() {
        KozmosDescriptionList(layout = layout) {
            KozmosDescriptionListItem(label = label1, value = value1)
            KozmosDescriptionListItem(label = label2, value = value2)
            KozmosDescriptionListItem(
                label = label3,
                value = value3,
                action = if (showAction) {
                    { KozmosIconButton(icon = Icons.Filled.ContentCopy, onClick = {}, contentDescription = "Copy") }
                } else {
                    null
                }
            )
        }
    }
}
