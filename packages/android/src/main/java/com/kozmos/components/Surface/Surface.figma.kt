package com.kozmos.components.surface

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.figma.code.connect.Figma
import com.figma.code.connect.FigmaConnect
import com.figma.code.connect.FigmaProperty
import com.figma.code.connect.FigmaType
import com.kozmos.tokens.KozmosDimensions

// GAP-206, GAP-207: Variant is the style, Solid or Glass. Compose's Surface
// is a modifier, Modifier.kozmosSurface, on the container radius as React's
// is; Content Slot is what the box holds.
@FigmaConnect("https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=2606-18490")
class KozmosSurfaceConnect {
    @FigmaProperty(FigmaType.Enum, "Variant")
    val style: KozmosSurfaceStyle = Figma.mapping(
        "Solid" to KozmosSurfaceStyle.Solid,
        "Glass" to KozmosSurfaceStyle.Glass
    )

    @Composable
    fun ComponentExample() {
        Box(
            modifier = Modifier.kozmosSurface(
                shape = RoundedCornerShape(KozmosDimensions.semanticsRadiusContainer),
                style = style
            )
        ) {
            Text("Content")
        }
    }
}
