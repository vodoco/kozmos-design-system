package com.kozmos.components.fieldwrapper

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.size
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.kozmos.tokens.KozmosThemeTokens

/**
 * A field that stands for several values at once (GAP-153): a property of a
 * multi-selection whose features differ. KozmosInput, KozmosNumberInput,
 * KozmosSelectTrigger and KozmosCombobox take it, as React's fields do.
 *
 * It is the product's state, as the selection is: `mixed` says the field
 * still stands for the several values, and the field shows none of its own,
 * `mixedLabel` in its place, which TalkBack says as its state. The visitor's
 * first edit comes through the field's own callback, and the product then
 * clears `mixed`, so the field keeps its mixed state until it is edited.
 * `onResetMixed`, given for a field whose values differ, offers
 * `resetMixedLabel` under the field once it is no longer mixed; pressed, it
 * calls back for the product to drop the edit and set `mixed` again.
 */
object KozmosMixedValue {
    /** What a mixed field shows and says. */
    const val LABEL = "Multiple values"

    /** The reset's words. */
    const val RESET_LABEL = "Reset to multiple values"

    /** Whether the reset is drawn: given, the field no longer mixed, and usable. */
    fun showsReset(
        mixed: Boolean,
        onReset: (() -> Unit)?,
        enabled: Boolean,
        readOnly: Boolean = false
    ): Boolean = onReset != null && !mixed && enabled && !readOnly
}

/**
 * The reset under a field that is no longer mixed, as React draws it: a text
 * button at the field's start, in the theme's colour at medium weight, the
 * size of the field's supporting text. TalkBack hears a button.
 */
@Composable
internal fun KozmosMixedReset(label: String, onClick: () -> Unit, modifier: Modifier = Modifier) {
    Text(
        text = label,
        style = MaterialTheme.typography.bodyMedium,
        fontWeight = FontWeight.Medium,
        color = KozmosThemeTokens.primitivesColorsTheme600,
        modifier = modifier.clickable(role = Role.Button, onClick = onClick)
    )
}

/**
 * A mixed field's drawn placeholder, kept from TalkBack while the field says
 * the mixed label as its state, so it is said once.
 */
internal fun Modifier.kozmosUnsaidWhen(unsaid: Boolean): Modifier =
    if (unsaid) clearAndSetSemantics { } else this

/**
 * The mixed mark (decisions 188 to 190): React's `Minus` icon at 16, a line
 * from 5 to 19 across the icon's 24, at its middle, stroked 2/24 of its size
 * with round caps. A mixed Checkbox draws it for its tick, a mixed Switch
 * where its thumb was, a mixed ToggleButton before its label. Drawn, never
 * read.
 */
@Composable
internal fun KozmosMixedDash(color: Color, modifier: Modifier = Modifier) {
    Canvas(modifier = modifier.size(16.dp).clearAndSetSemantics {}) {
        val unit = size.width / 24f
        drawLine(
            color = color,
            start = Offset(5f * unit, size.height / 2f),
            end = Offset(19f * unit, size.height / 2f),
            strokeWidth = 2f * unit,
            cap = StrokeCap.Round
        )
    }
}
