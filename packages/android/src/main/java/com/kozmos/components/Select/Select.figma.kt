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

    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    fun ComponentExample() {
        KozmosSelect(
            expanded = false,
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
                value = "option",
                label = "Option",
                onValueChange = {},
                onDismissRequest = {}
            )
        }
    }
}
