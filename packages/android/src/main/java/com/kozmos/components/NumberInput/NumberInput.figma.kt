package com.kozmos.components.numberinput

import androidx.compose.runtime.Composable
import com.figma.code.connect.Figma
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType
import com.kozmos.components.input.KozmosInputStatus

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=338-1796")
class KozmosNumberInputConnect {
    @FigmaProperty(FigmaType.Text, "Label Text")
    val label: String = "Number"

    @FigmaProperty(FigmaType.Text, "Value Text")
    val valueText: String = "12"

    @FigmaProperty(FigmaType.Text, "Placeholder Text")
    val placeholder: String = "0"

    @FigmaProperty(FigmaType.Text, "Helper Text")
    val helperText: String = "Use a whole number."

    @FigmaProperty(FigmaType.Boolean, "Show Helper Text")
    val showHelperText: Boolean = true

    @FigmaProperty(FigmaType.Enum, "State")
    val state: String = Figma.mapping(
        "Default" to "default",
        "Focus" to "focus",
        "Disabled" to "disabled",
        "Readonly" to "readonly",
        "Mixed" to "mixed"
    )

    // GAP-153: its way back to the several values, once edited.
    @FigmaProperty(FigmaType.Boolean, "Reset Mixed")
    val resetMixed: Boolean = false

    @FigmaProperty(FigmaType.Enum, "Status")
    val status: KozmosInputStatus = Figma.mapping(
        "Default" to KozmosInputStatus.Default,
        "Error" to KozmosInputStatus.Error,
        "Warning" to KozmosInputStatus.Warning,
        "Success" to KozmosInputStatus.Success
    )

    @FigmaProperty(FigmaType.Enum, "Steppers")
    val showSteppers: Boolean = Figma.mapping(
        "True" to true,
        "False" to false
    )

    @Composable
    fun ComponentExample() {
        KozmosNumberInput(
            value = valueText.toDoubleOrNull(),
            onValueChange = {},
            label = label,
            placeholder = placeholder,
            enabled = state != "disabled",
            readOnly = state == "readonly",
            status = status,
            helperText = if (showHelperText) helperText else null,
            showSteppers = showSteppers,
            mixed = state == "mixed",
            onResetMixed = if (resetMixed) ({}) else null
        )
    }
}
