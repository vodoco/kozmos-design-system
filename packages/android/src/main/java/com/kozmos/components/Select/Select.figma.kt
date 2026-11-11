package com.kozmos.components.select

import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.runtime.Composable
import com.figma.code.connect.Figma
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=80-432")
class KozmosSelectConnect {
    @FigmaProperty(FigmaType.Text, "Placeholder Text")
    val placeholder: String = "Select option"

    @FigmaProperty(FigmaType.Enum, "State")
    val state: String = Figma.mapping(
        "Default" to "default",
        "Focus" to "focus",
        "Disabled" to "disabled"
    )

    @FigmaProperty(FigmaType.Enum, "Status")
    val error: Boolean = Figma.mapping(
        "Default" to false,
        "Error" to true
    )

    // GAP-164: the open list, each option with its count.
    @FigmaProperty(FigmaType.Enum, "Content")
    val expanded: Boolean = Figma.mapping(
        "Closed" to false,
        "Open" to true
    )

    @FigmaProperty(FigmaType.Text, "Option 1 Text")
    val option1Text: String = "Cafés"

    @FigmaProperty(FigmaType.Text, "Option 2 Text")
    val option2Text: String = "Restrooms"

    @FigmaProperty(FigmaType.Text, "Option 3 Text")
    val option3Text: String = "Shops"

    // Figma's counts are text; the snippet shows them as the Ints the item
    // takes, one per option, shown or not with Show Counts.
    @FigmaProperty(FigmaType.Boolean, "Show Counts")
    val option1Count: Int? = Figma.mapping(true to 128, false to null)

    @FigmaProperty(FigmaType.Boolean, "Show Counts")
    val option2Count: Int? = Figma.mapping(true to 96, false to null)

    @FigmaProperty(FigmaType.Boolean, "Show Counts")
    val option3Count: Int? = Figma.mapping(true to 32, false to null)

    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    fun ComponentExample() {
        KozmosSelect(
            expanded = expanded,
            onExpandedChange = {},
            trigger = {
                KozmosSelectTrigger(
                    value = null,
                    placeholder = placeholder,
                    enabled = state != "disabled",
                    error = error
                )
            }
        ) {
            KozmosSelectItem(
                value = "option1",
                label = option1Text,
                onValueChange = {},
                onDismissRequest = {},
                count = option1Count
            )
            KozmosSelectItem(
                value = "option2",
                label = option2Text,
                onValueChange = {},
                onDismissRequest = {},
                count = option2Count
            )
            KozmosSelectItem(
                value = "option3",
                label = option3Text,
                onValueChange = {},
                onDismissRequest = {},
                count = option3Count
            )
        }
    }
}
