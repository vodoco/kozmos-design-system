package com.kozmos.components.codeblock

import androidx.compose.runtime.Composable
import com.figma.code.connect.Figma
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType

// GAP-216, decision 225: Overflow=Wrap is wrap, the default; Scroll is
// wrap = false. Copy is copyable. The label names the block and is the
// product's.
@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2572-68538")
class KozmosCodeBlockConnect {
    @FigmaProperty(FigmaType.Text, "Code Text")
    val code: String = "{ \"fid\": \"f-1209\" }"

    @FigmaProperty(FigmaType.Boolean, "Copy")
    val copyable: Boolean = false

    @FigmaProperty(FigmaType.Enum, "Overflow")
    val wrap: Boolean = Figma.mapping(
        "Wrap" to true,
        "Scroll" to false
    )

    @Composable
    fun ComponentExample() {
        KozmosCodeBlock(code = code, label = "Merged unit", wrap = wrap, copyable = copyable)
    }
}
