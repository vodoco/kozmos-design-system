package com.kozmos.components.combobox

import androidx.compose.runtime.Composable
import com.figma.code.connect.Figma
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType
import com.kozmos.components.input.KozmosInputStatus
import com.kozmos.components.listbox.KozmosListboxOption

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=398-8298")
class KozmosComboboxConnect {
    @FigmaProperty(FigmaType.Text, "Label Text")
    val label: String = "Facility"

    @FigmaProperty(FigmaType.Text, "Placeholder Text")
    val placeholder: String = "Search or select"

    @FigmaProperty(FigmaType.Text, "Helper Text")
    val helperText: String = "Choose one option."

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

    @FigmaProperty(FigmaType.Text, "Mixed Text")
    val mixedLabel: String = "Multiple values"

    @FigmaProperty(FigmaType.Text, "Reset Mixed Text")
    val resetMixedLabel: String = "Reset to multiple values"

    @FigmaProperty(FigmaType.Enum, "Status")
    val status: KozmosInputStatus = Figma.mapping(
        "Default" to KozmosInputStatus.Default,
        "Error" to KozmosInputStatus.Error,
        "Warning" to KozmosInputStatus.Warning,
        "Success" to KozmosInputStatus.Success
    )

    @FigmaProperty(FigmaType.Enum, "Content")
    val defaultExpanded: Boolean = Figma.mapping(
        "Closed" to false,
        "Open" to true
    )

    @FigmaProperty(FigmaType.Text, "Option 1 Text")
    val option1: String = "Metro Station"

    @FigmaProperty(FigmaType.Text, "Option 2 Text")
    val option2: String = "Bus Stop"

    @FigmaProperty(FigmaType.Text, "Option 3 Text")
    val option3: String = "Bike Parking"

    @Composable
    fun ComponentExample() {
        KozmosCombobox(
            value = "metro-station",
            onValueChange = { _, _ -> },
            inputValue = if (defaultExpanded) option1 else "",
            onInputValueChange = {},
            options = listOf(
                KozmosListboxOption("metro-station", option1),
                KozmosListboxOption("bus-stop", option2),
                KozmosListboxOption("bike-parking", option3)
            ),
            label = label,
            placeholder = placeholder,
            enabled = state != "disabled",
            readOnly = state == "readonly",
            status = status,
            helperText = if (showHelperText) helperText else null,
            defaultExpanded = defaultExpanded,
            mixed = state == "mixed",
            mixedLabel = mixedLabel,
            onResetMixed = if (resetMixed) ({}) else null,
            resetMixedLabel = resetMixedLabel
        )
    }
}
