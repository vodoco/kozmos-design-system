package com.kozmos.components.button

import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import com.figma.code.connect.Figma
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=77-1055")
class KozmosButtonConnect {
    @FigmaProperty(FigmaType.Text, "Label Text")
    val label: String = "Button"

    @FigmaProperty(FigmaType.Enum, "Variant")
    val variant: KozmosButtonVariant = Figma.mapping(
        "Default" to KozmosButtonVariant.Default,
        "Destructive" to KozmosButtonVariant.Destructive,
        "Outline" to KozmosButtonVariant.Outline,
        "Secondary" to KozmosButtonVariant.Secondary,
        "Ghost" to KozmosButtonVariant.Ghost,
        "Link" to KozmosButtonVariant.Link,
        "Glass" to KozmosButtonVariant.Glass,
        "Subtle" to KozmosButtonVariant.Subtle
    )

    @FigmaProperty(FigmaType.Enum, "Size")
    val size: KozmosButtonSize = Figma.mapping(
        "Default" to KozmosButtonSize.Default,
        "Small" to KozmosButtonSize.Sm,
        "Large" to KozmosButtonSize.Lg,
        "Icon" to KozmosButtonSize.Icon
    )

    @FigmaProperty(FigmaType.Enum, "State")
    val state: String = Figma.mapping(
        "Default" to "default",
        "Disabled" to "disabled",
        "Loading" to "loading"
    )

    @Composable
    fun ComponentExample() {
        KozmosButton(
            onClick = {},
            variant = variant,
            size = size,
            enabled = state != "disabled",
            isLoading = state == "loading"
        ) {
            Text(label)
        }
    }
}
