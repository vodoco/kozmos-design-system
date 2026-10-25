// Tooltip.mdx's Compose snippet, word for word below the package line:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import com.kozmos.components.button.KozmosButton
import com.kozmos.components.tooltip.KozmosTooltip

// Compose's tooltip shows only while visible is true: it watches nothing
// itself, so this one follows the button's press. Its side is Top by
// default; Top, Right, Bottom and Left are physical, as React's are, and
// Leading and Trailing follow the reading direction.
@Composable
fun AddToLibrary(add: () -> Unit) {
    val interactions = remember { MutableInteractionSource() }
    val pressed by interactions.collectIsPressedAsState()
    KozmosTooltip(tooltip = "Add to library", visible = pressed) {
        KozmosButton(onClick = add, interactionSource = interactions) { Text("Hover") }
    }
}
