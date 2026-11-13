package com.kozmos.components.container

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.widthIn
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.figma.code.connect.Figma
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType

@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=170-1034")
class KozmosContainerConnect {
    @FigmaProperty(FigmaType.Enum, "Centered")
    val centered: String = Figma.mapping(
        "True" to "true",
        "False" to "false"
    )

    @FigmaProperty(FigmaType.Enum, "Inset")
    val inset: KozmosContainerInset = Figma.mapping(
        "Window" to KozmosContainerInset.Window,
        "Panel" to KozmosContainerInset.Panel
    )

    // GAP-116: the space above and below the content, both edges one step.
    @FigmaProperty(FigmaType.Enum, "Block")
    val block: String = Figma.mapping(
        "None" to "none",
        "Small" to "sm",
        "Medium" to "md",
        "Large" to "lg"
    )

    @Composable
    fun ComponentExample() {
        KozmosContainer(
            inset = inset,
            modifier = if (centered == "true") {
                Modifier.widthIn(max = 720.dp)
            } else {
                Modifier.fillMaxWidth()
            },
            block = when (block) {
                "sm" -> KozmosContainerBlock.Sm
                "md" -> KozmosContainerBlock.Md
                "lg" -> KozmosContainerBlock.Lg
                else -> KozmosContainerBlock.None
            }
        ) {
            Text("Container content")
        }
    }
}
