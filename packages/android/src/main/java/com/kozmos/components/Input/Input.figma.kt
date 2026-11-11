package com.kozmos.components.input

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Star
import androidx.compose.runtime.Composable
import com.figma.code.connect.Figma
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType
import com.figma.code.connect.FigmaVariant

// One connect per Action (GAP-154): None, Copy, and the toggle at rest and
// pressed. Action Icon is an instance a native snippet cannot name, so the
// toggle shows the Featured star as Compose draws it.
@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=77-1558")
@FigmaVariant("Action", "None")
class KozmosInputConnect {
    @FigmaProperty(FigmaType.Text, "Label Text")
    val label: String = "Email"

    @FigmaProperty(FigmaType.Text, "Placeholder Text")
    val placeholder: String = "Placeholder"

    @FigmaProperty(FigmaType.Text, "Helper Text")
    val helperText: String = "Use a work email address."

    @FigmaProperty(FigmaType.Boolean, "Show Helper Text")
    val showHelperText: Boolean = true

    @FigmaProperty(FigmaType.Enum, "State")
    val state: String = Figma.mapping(
        "Default" to "default",
        "Focus" to "focus",
        "Disabled" to "disabled",
        "Readonly" to "readonly"
    )

    @FigmaProperty(FigmaType.Enum, "Status")
    val status: KozmosInputStatus = Figma.mapping(
        "Default" to KozmosInputStatus.Default,
        "Error" to KozmosInputStatus.Error,
        "Warning" to KozmosInputStatus.Warning,
        "Success" to KozmosInputStatus.Success
    )

    @Composable
    fun ComponentExample() {
        KozmosInput(
            value = "",
            onValueChange = {},
            label = label,
            placeholder = placeholder,
            enabled = state != "disabled",
            readOnly = state == "readonly",
            status = status,
            helperText = if (showHelperText) helperText else null
        )
    }
}

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=77-1558")
@FigmaVariant("Action", "Copy")
class KozmosInputCopyConnect {
    @FigmaProperty(FigmaType.Text, "Label Text")
    val label: String = "Email"

    @FigmaProperty(FigmaType.Text, "Placeholder Text")
    val placeholder: String = "Placeholder"

    @FigmaProperty(FigmaType.Text, "Helper Text")
    val helperText: String = "Use a work email address."

    @FigmaProperty(FigmaType.Boolean, "Show Helper Text")
    val showHelperText: Boolean = true

    @FigmaProperty(FigmaType.Enum, "State")
    val state: String = Figma.mapping(
        "Default" to "default",
        "Focus" to "focus",
        "Disabled" to "disabled",
        "Readonly" to "readonly"
    )

    @FigmaProperty(FigmaType.Enum, "Status")
    val status: KozmosInputStatus = Figma.mapping(
        "Default" to KozmosInputStatus.Default,
        "Error" to KozmosInputStatus.Error,
        "Warning" to KozmosInputStatus.Warning,
        "Success" to KozmosInputStatus.Success
    )

    @Composable
    fun ComponentExample() {
        KozmosInput(
            value = "",
            onValueChange = {},
            label = label,
            placeholder = placeholder,
            enabled = state != "disabled",
            readOnly = state == "readonly",
            status = status,
            helperText = if (showHelperText) helperText else null,
            action = KozmosInputAction.Copy()
        )
    }
}

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=77-1558")
@FigmaVariant("Action", "Toggle")
class KozmosInputToggleConnect {
    @FigmaProperty(FigmaType.Text, "Label Text")
    val label: String = "Email"

    @FigmaProperty(FigmaType.Text, "Placeholder Text")
    val placeholder: String = "Placeholder"

    @FigmaProperty(FigmaType.Text, "Helper Text")
    val helperText: String = "Use a work email address."

    @FigmaProperty(FigmaType.Boolean, "Show Helper Text")
    val showHelperText: Boolean = true

    @FigmaProperty(FigmaType.Enum, "State")
    val state: String = Figma.mapping(
        "Default" to "default",
        "Focus" to "focus",
        "Disabled" to "disabled",
        "Readonly" to "readonly"
    )

    @FigmaProperty(FigmaType.Enum, "Status")
    val status: KozmosInputStatus = Figma.mapping(
        "Default" to KozmosInputStatus.Default,
        "Error" to KozmosInputStatus.Error,
        "Warning" to KozmosInputStatus.Warning,
        "Success" to KozmosInputStatus.Success
    )

    @Composable
    fun ComponentExample() {
        KozmosInput(
            value = "",
            onValueChange = {},
            label = label,
            placeholder = placeholder,
            enabled = state != "disabled",
            readOnly = state == "readonly",
            status = status,
            helperText = if (showHelperText) helperText else null,
            action = KozmosInputAction.Toggle(label = "Featured", icon = Icons.Default.Star, pressed = false, onPressedChange = {})
        )
    }
}

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=77-1558")
@FigmaVariant("Action", "TogglePressed")
class KozmosInputTogglePressedConnect {
    @FigmaProperty(FigmaType.Text, "Label Text")
    val label: String = "Email"

    @FigmaProperty(FigmaType.Text, "Placeholder Text")
    val placeholder: String = "Placeholder"

    @FigmaProperty(FigmaType.Text, "Helper Text")
    val helperText: String = "Use a work email address."

    @FigmaProperty(FigmaType.Boolean, "Show Helper Text")
    val showHelperText: Boolean = true

    @FigmaProperty(FigmaType.Enum, "State")
    val state: String = Figma.mapping(
        "Default" to "default",
        "Focus" to "focus",
        "Disabled" to "disabled",
        "Readonly" to "readonly"
    )

    @FigmaProperty(FigmaType.Enum, "Status")
    val status: KozmosInputStatus = Figma.mapping(
        "Default" to KozmosInputStatus.Default,
        "Error" to KozmosInputStatus.Error,
        "Warning" to KozmosInputStatus.Warning,
        "Success" to KozmosInputStatus.Success
    )

    @Composable
    fun ComponentExample() {
        KozmosInput(
            value = "",
            onValueChange = {},
            label = label,
            placeholder = placeholder,
            enabled = state != "disabled",
            readOnly = state == "readonly",
            status = status,
            helperText = if (showHelperText) helperText else null,
            action = KozmosInputAction.Toggle(label = "Featured", icon = Icons.Default.Star, pressed = true, onPressedChange = {})
        )
    }
}
