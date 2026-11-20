package com.kozmos.components.multiselect

import androidx.compose.runtime.Composable
import com.figma.code.connect.Figma
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType
import com.kozmos.components.input.KozmosInputStatus
import com.kozmos.components.listbox.KozmosListboxOption
import com.kozmos.components.listbox.KozmosOptionMedia

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

    // GAP-255: its way back to the several values, once edited.
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

    // Decision 215, GAP-282: Show Media is each option's Sm Avatar, its
    // initials the label's. GAP-260: Show Trailing is each option's muted
    // words at its end, before the check.
    @FigmaProperty(FigmaType.Boolean, "Show Media")
    val media: KozmosOptionMedia? = Figma.mapping(true to KozmosOptionMedia(), false to null)

    @FigmaProperty(FigmaType.Boolean, "Show Trailing")
    val showTrailing: Boolean = false

    @FigmaProperty(FigmaType.Text, "Option 1 Trailing")
    val option1Trailing: String = "Text"

    @FigmaProperty(FigmaType.Text, "Option 2 Trailing")
    val option2Trailing: String = "Number"

    @FigmaProperty(FigmaType.Text, "Option 3 Trailing")
    val option3Trailing: String = "Image"

    @Composable
    fun ComponentExample() {
        KozmosMultiSelect(
            selectedValues = if (content == "empty") emptyList() else listOf("metro-station", "bus-stop"),
            onValueChange = {},
            searchValue = "",
            onSearchValueChange = {},
            options = listOf(
                KozmosListboxOption("metro-station", option1, media = media, trailing = if (showTrailing) option1Trailing else null),
                KozmosListboxOption("bus-stop", option2, media = media, trailing = if (showTrailing) option2Trailing else null),
                KozmosListboxOption("bike-parking", option3, media = media, trailing = if (showTrailing) option3Trailing else null)
            ),
            label = label,
            placeholder = placeholder,
            enabled = state != "disabled",
            readOnly = state == "readonly",
            status = status,
            helperText = if (showHelperText) helperText else null,
            defaultExpanded = content == "open",
            mixed = state == "mixed",
            mixedLabel = mixedLabel,
            onResetMixed = if (resetMixed) ({}) else null,
            resetMixedLabel = resetMixedLabel
        )
    }
}
