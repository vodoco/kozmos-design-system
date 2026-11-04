package com.kozmos.components.link

import androidx.compose.runtime.Composable
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=170-1385")
class KozmosLinkConnect {
    @FigmaProperty(FigmaType.Text, "Link Text")
    val label: String = "Docs"

    // GAP-202: External shows the new-tab icon.
    @FigmaProperty(FigmaType.Boolean, "External")
    val external: Boolean = false

    @Composable
    fun ComponentExample() {
        KozmosLink(
            text = label,
            onClick = {},
            external = external
        )
    }
}
