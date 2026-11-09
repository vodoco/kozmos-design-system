// NumberInput.mdx's Compose snippet ("A unit"), word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import com.kozmos.components.numberinput.KozmosNumberInput

// The unit is drawn after the value and never typed: the value stays a
// number. TalkBack hears the value, then the unit's spoken name.
@Composable
fun WidthField(width: Double?, onWidthChange: (Double?) -> Unit) {
    KozmosNumberInput(
        value = width,
        onValueChange = onWidthChange,
        label = "Width",
        min = 0.0,
        unit = "m",
        unitLabel = "metres"
    )
}
