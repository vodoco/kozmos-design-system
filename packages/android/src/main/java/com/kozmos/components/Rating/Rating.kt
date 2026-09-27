package com.kozmos.components.rating

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.ThumbDown
import androidx.compose.material.icons.filled.ThumbUp
import androidx.compose.material.icons.outlined.Star
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.tokens.KozmosThemeTokens

/**
 * What a rating is measured on.
 *
 * [Stars] is an ordinal scale: choosing four means "at least four", so four
 * fill. [Thumbs] is a choice between two, and exactly the one chosen fills - a
 * thumbs-up is not "two thumbs". The value is a number either way: **0 is
 * unanswered, 1 is down, 2 is up**, the same "1 is the lowest" rule the stars
 * follow.
 */
enum class KozmosRatingVariant {
    Stars,
    Thumbs
}

/**
 * Mirrors the React `Rating` and SwiftUI's `KozmosRating`.
 *
 * Every option is `selectable` with [Role.RadioButton] and a description.
 * Before, each was an `Icon` with `contentDescription = null` and a bare
 * `clickable`: TalkBack announced nothing at all, so the rating existed only
 * for people using their eyes and a finger.
 */
@Composable
fun KozmosRating(
    value: Int,
    onValueChange: (Int) -> Unit,
    modifier: Modifier = Modifier,
    variant: KozmosRatingVariant = KozmosRatingVariant.Stars,
    max: Int = 5,
    readOnly: Boolean = false,
    label: String = "Rating",
    itemLabel: (Int, Int, KozmosRatingVariant) -> String = ::kozmosRatingItemLabel,
    valueLabel: (Int, Int, KozmosRatingVariant) -> String = ::kozmosRatingValueLabel
) {
    val thumbs = variant == KozmosRatingVariant.Thumbs
    val steps = if (thumbs) 2 else max
    val filled: (Int) -> Boolean = { item -> if (thumbs) item == value else item <= value }

    // Read-only is not a control: it reads as one thing whose description is
    // the rating, rather than as a row of options nobody can take.
    val rowModifier = if (readOnly) {
        modifier.clearAndSetSemantics { contentDescription = valueLabel(value, steps, variant) }
    } else {
        modifier.semantics { contentDescription = label }.selectableGroup()
    }

    Row(
        modifier = rowModifier,
        // The stars space themselves: each glyph sits in a 32 box with 2 of
        // padding, so there are already 4 between them — the web's gap-1 and
        // SwiftUI's spacing50. Adding a row gap on top made it 8, which is a
        // silent redesign smuggled in behind an accessibility fix. The thumbs
        // are two circles and need the gap.
        horizontalArrangement =
            if (thumbs) Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing100)
            else Arrangement.Start,
        verticalAlignment = Alignment.CenterVertically
    ) {
        repeat(steps) { index ->
            val item = index + 1
            val itemModifier = if (readOnly) {
                Modifier
            } else {
                Modifier.selectable(
                    selected = item == value,
                    role = Role.RadioButton,
                    onClick = {
                        // Choosing what is already chosen clears it.
                        onValueChange(if (item == value) 0 else item)
                    }
                ).semantics { contentDescription = itemLabel(item, steps, variant) }
            }
            Box(modifier = itemModifier, contentAlignment = Alignment.Center) {
                if (thumbs) {
                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .background(
                                if (filled(item)) KozmosThemeTokens.primitivesColorsTheme0
                                else KozmosThemeTokens.primitivesColorsBackground100,
                                CircleShape
                            )
                            .border(
                                2.dp,
                                if (filled(item)) KozmosThemeTokens.primitivesColorsTheme600
                                else Color.Transparent,
                                CircleShape
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = if (item == 1) Icons.Filled.ThumbDown else Icons.Filled.ThumbUp,
                            contentDescription = null,
                            tint = if (filled(item)) KozmosThemeTokens.primitivesColorsTheme600
                            else KozmosThemeTokens.primitivesColorsForeground400,
                            modifier = Modifier
                            .size(KozmosDimensions.primitivesLayoutSizing300)
                            .padding(KozmosDimensions.primitivesLayoutSpacing25)
                        )
                    }
                } else {
                    Icon(
                        imageVector = if (filled(item)) Icons.Filled.Star else Icons.Outlined.Star,
                        contentDescription = null,
                        // semanticsDataYellow, as React and SwiftUI draw it.
                        // This was primitivesColorsEmotionalAlert600 - #f9a707
                        // against the other two platforms' #d97706, so the same
                        // star was a different colour on Android, in both themes.
                        tint = if (filled(item)) KozmosThemeTokens.semanticsDataYellow
                        else KozmosThemeTokens.primitivesColorsForeground400,
                        // 32 box, 2 of padding: a 28 glyph, exactly the size
                        // it was. Only the colour and the semantics change
                        // here — dropping the padding would have grown every
                        // star by four and called it an accessibility fix.
                        modifier = Modifier
                            .size(KozmosDimensions.primitivesLayoutSizing400)
                            .padding(KozmosDimensions.primitivesLayoutSpacing25)
                    )
                }
            }
        }
    }
}

fun kozmosRatingItemLabel(item: Int, max: Int, variant: KozmosRatingVariant): String =
    if (variant == KozmosRatingVariant.Thumbs) {
        if (item == 1) "Poor" else "Good"
    } else {
        "Rate $item out of $max stars"
    }

fun kozmosRatingValueLabel(value: Int, max: Int, variant: KozmosRatingVariant): String =
    when {
        value == 0 -> "Not rated"
        variant == KozmosRatingVariant.Thumbs -> if (value == 1) "Rated poor" else "Rated good"
        else -> "Rated $value out of $max stars"
    }
