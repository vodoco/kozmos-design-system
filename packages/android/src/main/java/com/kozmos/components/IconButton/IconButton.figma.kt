package com.kozmos.components.iconbutton

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Search
import androidx.compose.runtime.Composable
import com.figma.code.connect.Figma
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=77-1203")
class KozmosIconButtonConnect {
    @FigmaProperty(FigmaType.Enum, "Variant")
    val variant: KozmosIconButtonVariant = Figma.mapping(
        "Default" to KozmosIconButtonVariant.Default,
        "Destructive" to KozmosIconButtonVariant.Destructive,
        "Outline" to KozmosIconButtonVariant.Outline,
        "Secondary" to KozmosIconButtonVariant.Secondary,
        "Ghost" to KozmosIconButtonVariant.Ghost,
        "Link" to KozmosIconButtonVariant.Link,
        "Glass" to KozmosIconButtonVariant.Glass
    )

    @FigmaProperty(FigmaType.Enum, "Size")
    val size: KozmosIconButtonSize = Figma.mapping(
        "Default" to KozmosIconButtonSize.Default,
        "Small" to KozmosIconButtonSize.Sm,
        "Large" to KozmosIconButtonSize.Lg
    )

    @FigmaProperty(FigmaType.Enum, "State")
    val state: String = Figma.mapping(
        "Default" to "default",
        "Disabled" to "disabled",
        "Loading" to "loading"
    )

    // GAP-197: Counter shows the count over the icon's top-end corner. Counter
    // Text is a sample in the design; in code the count is the product's
    // number, which a snippet cannot read from text.
    @FigmaProperty(FigmaType.Boolean, "Counter")
    val counter: Int? = Figma.mapping(
        true to 3,
        false to null
    )

    @Composable
    fun ComponentExample() {
        KozmosIconButton(
            icon = Icons.Default.Search,
            onClick = {},
            contentDescription = "Icon action",
            variant = variant,
            size = size,
            enabled = state != "disabled",
            isLoading = state == "loading",
            counter = counter
        )
    }
}
