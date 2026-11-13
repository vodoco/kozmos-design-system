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
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.graphics.drawscope.clipRect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.LayoutDirection
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
                    RatingStar(if (filled(item)) RatingStarFill.Full else RatingStarFill.Empty)
                }
            }
        }
    }
}

/**
 * A read-only star rating of a score that need not be whole, an average of
 * reviews: it is drawn to the nearest half (decision 181), 4.3 as 4.5, 4.2 as
 * 4 and 4.25 as 4.5, and TalkBack hears the rounded value, "Rated 4.5 out of 5
 * stars". Editing stays whole stars: the `value` overload is the control.
 */
@Composable
fun KozmosRating(
    rating: Float,
    modifier: Modifier = Modifier,
    max: Int = 5,
    valueLabel: (Float, Int) -> String = ::kozmosRatingScoreLabel
) {
    val shown = kozmosRatingRoundedToHalf(rating)
    Row(
        // Not a control: one thing whose description is the score, as the
        // read-only `value` overload is.
        modifier = modifier.clearAndSetSemantics { contentDescription = valueLabel(shown, max) },
        horizontalArrangement = Arrangement.Start,
        verticalAlignment = Alignment.CenterVertically
    ) {
        repeat(max) { index ->
            val item = index + 1
            RatingStar(
                when {
                    item <= shown -> RatingStarFill.Full
                    item - 0.5f == shown -> RatingStarFill.Half
                    else -> RatingStarFill.Empty
                }
            )
        }
    }
}

private enum class RatingStarFill { Full, Half, Empty }

@Composable
private fun RatingStar(fill: RatingStarFill) {
    // 32 box, 2 of padding: a 28 glyph, exactly the size it was. Dropping the
    // padding would have grown every star by four and called it an
    // accessibility fix.
    val glyph = Modifier
        .size(KozmosDimensions.primitivesLayoutSizing400)
        .padding(KozmosDimensions.primitivesLayoutSpacing25)
    if (fill != RatingStarFill.Half) {
        Icon(
            imageVector = if (fill == RatingStarFill.Full) Icons.Filled.Star else Icons.Outlined.Star,
            contentDescription = null,
            // semanticsDataYellow, as React and SwiftUI draw it. This was
            // primitivesColorsEmotionalAlert600 - #f9a707 against the other two
            // platforms' #d97706, so the same star was a different colour on
            // Android, in both themes.
            tint = if (fill == RatingStarFill.Full) KozmosThemeTokens.semanticsDataYellow
            else KozmosThemeTokens.primitivesColorsForeground400,
            modifier = glyph
        )
        return
    }
    // The empty star, and the filled one over it clipped to its start half:
    // the left half left to right, the right half right to left. Same glyphs,
    // size and colours as a full and an empty star.
    Box {
        Icon(
            imageVector = Icons.Outlined.Star,
            contentDescription = null,
            tint = KozmosThemeTokens.primitivesColorsForeground400,
            modifier = glyph
        )
        Icon(
            imageVector = Icons.Filled.Star,
            contentDescription = null,
            tint = KozmosThemeTokens.semanticsDataYellow,
            modifier = Modifier
                .matchParentSize()
                .drawWithContent {
                    val half = size.width / 2
                    if (layoutDirection == LayoutDirection.Ltr) {
                        clipRect(right = half) { this@drawWithContent.drawContent() }
                    } else {
                        clipRect(left = half) { this@drawWithContent.drawContent() }
                    }
                }
                .padding(KozmosDimensions.primitivesLayoutSpacing25)
        )
    }
}

/**
 * A score to the nearest half: the doubled value rounded half up, as React's
 * `Math.round(value * 2) / 2` and SwiftUI's are.
 */
fun kozmosRatingRoundedToHalf(rating: Float): Float = kotlin.math.floor(rating * 2 + 0.5f) / 2

/** How the `rating` overload reads, given the rounded value: "Rated 4.5 out of 5 stars". */
fun kozmosRatingScoreLabel(value: Float, max: Int): String {
    if (value == 0f) return "Not rated"
    val spoken = if (value % 1f == 0f) value.toInt().toString() else value.toString()
    return "Rated $spoken out of $max stars"
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
