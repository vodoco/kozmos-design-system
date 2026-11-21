package com.kozmos.components.spriteicon

import androidx.compose.runtime.Composable
import com.figma.code.connect.Figma
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType

// GAP-150, decisions 86 and 219: one cell of a published MapLibre sprite
// atlas. Sprite is the atlas's version-pinned base URL, Cell Name the cell.
@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2572-68551")
class KozmosSpriteIconConnect {
    @FigmaProperty(FigmaType.Text, "Sprite")
    val sprite: String = "https://mapscdn.pointr.tech/sprite/10.17.0/light/sprite"

    @FigmaProperty(FigmaType.Text, "Cell Name")
    val name: String = "desk"

    @FigmaProperty(FigmaType.Enum, "Size")
    val size: KozmosSpriteIconSize = Figma.mapping(
        "16" to KozmosSpriteIconSize.S16,
        "20" to KozmosSpriteIconSize.S20,
        "24" to KozmosSpriteIconSize.S24
    )

    @Composable
    fun ComponentExample() {
        KozmosSpriteIcon(sprite = sprite, name = name, size = size)
    }
}
