package com.kozmos.components.checkbox

import androidx.compose.runtime.Composable
import androidx.compose.ui.state.ToggleableState
import com.figma.code.connect.Figma
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=77-1410")
class KozmosCheckboxConnect {
    // Decision 188: Indeterminate is the mixed state.
    @FigmaProperty(FigmaType.Enum, "Checked")
    val checked: ToggleableState = Figma.mapping(
        "Unchecked" to ToggleableState.Off,
        "Checked" to ToggleableState.On,
        "Indeterminate" to ToggleableState.Indeterminate
    )

    @FigmaProperty(FigmaType.Text, "Label Text")
    val label: String = "Accept terms"

    @FigmaProperty(FigmaType.Enum, "State")
    val state: String = Figma.mapping(
        "Default" to "default",
        "Disabled" to "disabled",
        "Error" to "error"
    )

    @FigmaProperty(FigmaType.Boolean, "Show Description")
    val showDescription: Boolean = false

    @FigmaProperty(FigmaType.Text, "Description Text")
    val description: String = "Required to book a desk"

    @Composable
    fun ComponentExample() {
        KozmosCheckbox(
            state = checked,
            onCheckedChange = {},
            label = label,
            enabled = state != "disabled",
            error = state == "error",
            description = if (showDescription) description else null
        )
    }
}
