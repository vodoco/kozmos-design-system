package com.kozmos.components.switch

import androidx.compose.runtime.Composable
import com.figma.code.connect.Figma
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=77-1465")
class KozmosSwitchConnect {
    @FigmaProperty(FigmaType.Enum, "Checked")
    val checked: Boolean = Figma.mapping(
        "Unchecked" to false,
        "Checked" to true
    )

    @FigmaProperty(FigmaType.Text, "Label Text")
    val label: String = "Enable notifications"

    @FigmaProperty(FigmaType.Enum, "State")
    val state: String = Figma.mapping(
        "Default" to "default",
        "Disabled" to "disabled",
        "Error" to "error"
    )

    @FigmaProperty(FigmaType.Boolean, "Show Description")
    val showDescription: Boolean = false

    @FigmaProperty(FigmaType.Text, "Description Text")
    val description: String = "Sends a push when your gate changes"

    @FigmaProperty(FigmaType.Boolean, "Show State Label")
    val showStateLabel: Boolean = false

    @Composable
    fun ComponentExample() {
        KozmosSwitch(
            checked = checked,
            onCheckedChange = {},
            label = label,
            enabled = state != "disabled",
            error = state == "error",
            description = if (showDescription) description else null,
            showStateLabel = showStateLabel
        )
    }
}
