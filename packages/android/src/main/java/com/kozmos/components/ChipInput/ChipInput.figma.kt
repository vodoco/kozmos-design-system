package com.kozmos.components.chipinput

import androidx.compose.runtime.Composable
import com.figma.code.connect.Figma
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType

// GAP-222, decision 216: Content=Filled is the set's two entries, coffee and
// wifi, as chips; Empty is the placeholder alone. Focus is the keyboard's
// ring, not a parameter. Error is `error`, its message Error Text.
@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2572-68659")
class KozmosChipInputConnect {
    @FigmaProperty(FigmaType.Text, "Label Text")
    val label: String = "Keywords"

    @FigmaProperty(FigmaType.Text, "Placeholder Text")
    val placeholder: String = "Add a keyword"

    @FigmaProperty(FigmaType.Text, "Helper Text")
    val helperText: String = "Press Enter or type a comma to add one."

    @FigmaProperty(FigmaType.Text, "Error Text")
    val errorText: String = "Add at least one keyword"

    @FigmaProperty(FigmaType.Enum, "State")
    val state: String = Figma.mapping(
        "Default" to "default",
        "Focus" to "focus",
        "Disabled" to "disabled",
        "Readonly" to "readonly",
        "Error" to "error"
    )

    @FigmaProperty(FigmaType.Enum, "Content")
    val values: List<String> = Figma.mapping(
        "Filled" to listOf("coffee", "wifi"),
        "Empty" to emptyList()
    )

    @Composable
    fun ComponentExample() {
        KozmosChipInput(
            values = values,
            onValuesChange = {},
            label = label,
            placeholder = placeholder,
            enabled = state != "disabled",
            readOnly = state == "readonly",
            error = state == "error",
            helperText = helperText,
            errorMessage = if (state == "error") errorText else null
        )
    }
}
