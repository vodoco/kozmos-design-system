package com.kozmos.components.search

import androidx.compose.runtime.Composable
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=80-391")
class KozmosSearchConnect {
    @FigmaProperty(FigmaType.Text, "Placeholder Text")
    val placeholder: String = "Search"

    @FigmaProperty(FigmaType.Boolean, "Show Clear")
    val clearable: Boolean = false

    @Composable
    fun ComponentExample() {
        KozmosSearch(
            value = "",
            onValueChange = {},
            placeholder = placeholder,
            clearable = clearable
        )
    }
}
