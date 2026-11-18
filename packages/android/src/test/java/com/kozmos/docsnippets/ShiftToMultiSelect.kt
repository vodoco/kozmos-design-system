// Tooltip.mdx's Compose snippet ("Inverse tone"), word for word below the
// package line: compiled here, so a renamed or removed parameter fails in this
// target rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import com.kozmos.components.button.KozmosButton
import com.kozmos.components.button.KozmosButtonVariant
import com.kozmos.components.tooltip.KozmosTooltip
import com.kozmos.components.tooltip.KozmosTooltipTone

// The inverse tone is the dark tooltip: the inverse surface under the
// inverse on-surface's words, in both themes, the same size as the default.
@Composable
fun ShiftToMultiSelect(adjust: () -> Unit) {
    val interactions = remember { MutableInteractionSource() }
    val pressed by interactions.collectIsPressedAsState()
    KozmosTooltip(
        tooltip = "Keep holding Shift for multi-selection",
        visible = pressed,
        tone = KozmosTooltipTone.Inverse
    ) {
        KozmosButton(onClick = adjust, variant = KozmosButtonVariant.Outline, interactionSource = interactions) {
            Text("Adjust")
        }
    }
}
