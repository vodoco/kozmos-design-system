// SpriteIcon.mdx's Compose snippet ("Implementation"), word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.unit.dp
import com.kozmos.components.spriteicon.KozmosSpriteIcon
import com.kozmos.components.spriteicon.KozmosSpriteIconSize

// A type's icon beside its name: decorative, since the name is beside it.
@Composable
fun DeskType(sprite: String = "https://mapscdn.pointr.tech/sprite/10.17.0/light/sprite") {
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
        KozmosSpriteIcon(sprite = sprite, name = "desk", size = KozmosSpriteIconSize.S20)
        Text("Office desk")
    }
}
