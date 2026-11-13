package com.kozmos.components.settingsrow

import androidx.compose.runtime.Composable
import com.figma.code.connect.Figma
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType
import com.kozmos.components.switch.KozmosSwitch

// GAP-040, decision 135: the SettingsRow set, built by the plugin.
@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2446-23163")
class KozmosSettingsRowConnect {
    @FigmaProperty(FigmaType.Text, "Label Text")
    val label: String = "Show the banner"

    @FigmaProperty(FigmaType.Text, "Description Text")
    val description: String = "A message above the map."

    @FigmaProperty(FigmaType.Enum, "State")
    val state: KozmosSettingsRowState? = Figma.mapping(
        "None" to null,
        "Inherited" to KozmosSettingsRowState.Inherited,
        "Overridden" to KozmosSettingsRowState.Overridden
    )

    @FigmaProperty(FigmaType.Enum, "Disabled")
    val enabled: Boolean = Figma.mapping(
        "False" to true,
        "True" to false
    )

    @FigmaProperty(FigmaType.Text, "Reason Text")
    val reason: String = "Turn on Positioning first."

    @Composable
    fun ComponentExample() {
        KozmosSettingsRow(
            label = label,
            description = description,
            state = state,
            onReset = {},
            enabled = enabled,
            disabledReason = reason
        ) { modifier, enabled ->
            KozmosSwitch(checked = true, onCheckedChange = {}, modifier = modifier, enabled = enabled)
        }
    }
}
