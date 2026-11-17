package com.kozmos.components.multiselect

import androidx.compose.runtime.Composable
import com.figma.code.connect.Figma
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType
import com.kozmos.components.input.KozmosInputStatus
import com.kozmos.components.listbox.KozmosListboxOption

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=401-9365")
class KozmosMultiSelectConnect {
    @FigmaProperty(FigmaType.Text, "Label Text")
    val label: String = "Facilities"

    @FigmaProperty(FigmaType.Text, "Placeholder Text")
    val placeholder: String = "Select options"

    @FigmaProperty(FigmaType.Text, "Helper Text")
    val helperText: String = "Choose one or more options."

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

    // GAP-255: Reset Mixed, Mixed Text and Reset Mixed Text are mapped once
    // the owner's plugin Update has put them in the library.

    @FigmaProperty(FigmaType.Enum, "Status")
    val status: KozmosInputStatus = Figma.mapping(
        "Default" to KozmosInputStatus.Default,
        "Error" to KozmosInputStatus.Error,
        "Warning" to KozmosInputStatus.Warning,
        "Success" to KozmosInputStatus.Success
    )

    @FigmaProperty(FigmaType.Enum, "Content")
    val content: String = Figma.mapping(
        "Empty" to "empty",
        "Selected" to "selected",
        "Open" to "open"
    )

    @FigmaProperty(FigmaType.Text, "Option 1 Text")
    val option1: String = "Metro Station"

    @FigmaProperty(FigmaType.Text, "Option 2 Text")
    val option2: String = "Bus Stop"

    @FigmaProperty(FigmaType.Text, "Option 3 Text")
    val option3: String = "Bike Parking"

    @Composable
    fun ComponentExample() {
        KozmosMultiSelect(
            selectedValues = if (content == "empty") emptyList() else listOf("metro-station", "bus-stop"),
            onValueChange = {},
            searchValue = "",
            onSearchValueChange = {},
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
            defaultExpanded = content == "open",
            mixed = state == "mixed"
        )
    }
}
