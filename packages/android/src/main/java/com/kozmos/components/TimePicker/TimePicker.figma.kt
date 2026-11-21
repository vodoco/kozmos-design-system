package com.kozmos.components.timepicker

import androidx.compose.runtime.Composable
import com.figma.code.connect.Figma
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType
import java.time.LocalTime

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=444-12011")
class KozmosTimePickerConnect {
    @FigmaProperty(FigmaType.Text, "Label Text")
    val label: String = "Time"

    @FigmaProperty(FigmaType.Enum, "State")
    val state: String = Figma.mapping(
        "Default" to "default",
        "Focus" to "focus",
        "Disabled" to "disabled",
        "Readonly" to "readonly",
        "Mixed" to "mixed"
    )

    // GAP-255: its way back to the several values, once edited.
    @FigmaProperty(FigmaType.Boolean, "Reset Mixed")
    val resetMixed: Boolean = false

    @FigmaProperty(FigmaType.Text, "Mixed Text")
    val mixedLabel: String = "Multiple values"

    @FigmaProperty(FigmaType.Text, "Reset Mixed Text")
    val resetMixedLabel: String = "Reset to multiple values"

    @Composable
    fun ComponentExample() {
        KozmosTimePicker(
            time = LocalTime.of(9, 30),
            onTimeSelected = {},
            label = label,
            enabled = state != "disabled",
            readOnly = state == "readonly",
            mixed = state == "mixed",
            mixedLabel = mixedLabel,
            onResetMixed = if (resetMixed) ({}) else null,
            resetMixedLabel = resetMixedLabel
        )
    }
}
