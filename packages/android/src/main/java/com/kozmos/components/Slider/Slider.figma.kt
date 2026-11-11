package com.kozmos.components.slider

import androidx.compose.runtime.Composable
import com.figma.code.connect.Figma
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=80-473")
class KozmosSliderConnect {
    @FigmaProperty(FigmaType.Text, "Label Text")
    val label: String = "Value"

    @FigmaProperty(FigmaType.Boolean, "Show Value")
    val showValue: Boolean = false

    @FigmaProperty(FigmaType.Enum, "State")
    val state: String = Figma.mapping(
        "Default" to "default",
        "Focus" to "focus",
        "Disabled" to "disabled"
    )

    @Composable
    fun ComponentExample() {
        KozmosSlider(
            value = 0.5f,
            onValueChange = {},
            enabled = state != "disabled",
            showValue = showValue
        )
    }
}
