package com.kozmos.components.togglebutton

import androidx.compose.runtime.Composable
import com.figma.code.connect.Figma
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=383-2019")
class KozmosToggleButtonConnect {
    @FigmaProperty(FigmaType.Text, "Label Text")
    val label: String = "Toggle"

    @FigmaProperty(FigmaType.Enum, "Variant")
    val variant: KozmosToggleButtonVariant = Figma.mapping(
        "Default" to KozmosToggleButtonVariant.Default,
        "Outline" to KozmosToggleButtonVariant.Outline
    )

    @FigmaProperty(FigmaType.Enum, "Size")
    val size: KozmosToggleButtonSize = Figma.mapping(
        "Small" to KozmosToggleButtonSize.Small,
        "Default" to KozmosToggleButtonSize.Default,
        "Large" to KozmosToggleButtonSize.Large
    )

    // Decision 190: Mixed is the toggle of a multi-selection whose features
    // differ.
    @FigmaProperty(FigmaType.Enum, "State")
    val state: String = Figma.mapping(
        "Default" to "default",
        "Pressed" to "pressed",
        "Disabled" to "disabled",
        "Focus" to "focus",
        "Mixed" to "mixed"
    )

    @Composable
    fun ComponentExample() {
        KozmosToggleButton(
            checked = state == "pressed",
            onCheckedChange = {},
            label = label,
            variant = variant,
            size = size,
            mixed = state == "mixed"
        )
    }
}
