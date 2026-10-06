package com.kozmos.components.skeleton

import com.kozmos.components.motion.rememberKozmosAnimationsOn
import com.kozmos.tokens.KozmosDimensions

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.composed
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.isSpecified
import androidx.compose.ui.unit.sp
import com.kozmos.tokens.KozmosThemeTokens

/**
 * The sheen that passes across a placeholder: a band of white at 40 %, as wide
 * as the placeholder, from beyond its start to beyond its end every 1.5 s —
 * iOS's sheen, so a loading state reads the same on both. Between passes, and
 * held still when the system's animations are off (GAP-50), the band lies off
 * the placeholder, which shows its own grey.
 *
 * It was a diagonal of `background/300` at 20–60 % laid over the whole
 * placeholder and never off it, so at rest it darkened the grey it sat on:
 * `background/100` showed as about `#C1C4CC`, and no base colour was the
 * colour seen.
 */
fun Modifier.shimmer(): Modifier = composed {
    val transition = rememberInfiniteTransition(label = "shimmer")
    val passing = transition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 1500, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "shimmer"
    )
    val animationsOn = rememberKozmosAnimationsOn()
    sheen(if (animationsOn) passing.value else 0f)
}

/**
 * The band at [phase]: 0 is just before the placeholder's start and 1 just
 * past its end, so at either it draws nothing on the placeholder.
 */
internal fun Modifier.sheen(phase: Float): Modifier = drawWithContent {
    drawContent()
    val start = -size.width + size.width * 2 * phase
    drawRect(
        brush = Brush.horizontalGradient(
            colors = listOf(Color.Transparent, Color.White.copy(alpha = 0.4f), Color.Transparent),
            startX = start,
            endX = start + size.width
        )
    )
}

/**
 * What the placeholder stands in for, which is all that decides its shape.
 *
 * `Line` is a row of text; `Block` a card, a media tile, a panel; `Circle` an
 * avatar or a round icon button. The three are React's `shape` and the Figma
 * set's `Shape` axis, so a loading state drawn in one place reads the same in
 * the others (row 56, GAP-057).
 */
enum class KozmosSkeletonShape(val value: String) {
    Line("line"),
    Block("block"),
    Circle("circle")
}

/**
 * A placeholder while content loads: the surface's grey, with a sheen passing
 * across it.
 *
 * Give it a [shape] and the space it holds, and a loading row needs no
 * modifier doing a shape's work — which was the whole of row 56 (GAP-057):
 * each loading state sized and rounded its own box, and each one guessed.
 *
 * - A `Line` stands in for text, so it is text-high and fills its row unless
 *   told otherwise. Its height follows the font scale, as React's `h-4` — 1rem
 *   — follows the browser's text size; a [height] given is kept as given.
 * - A `Block` has no size of its own. It is whatever it replaces, and guessing
 *   would be worse than asking, so it fills its row and has no height until
 *   given one.
 * - A `Circle` is an avatar's 40 unless told otherwise, and takes [width] as
 *   its diameter: a circle should not need telling twice.
 *
 * A fraction of the row is the modifier's, as Compose has it:
 * `Modifier.fillMaxWidth(0.6f)` is React's `width="60%"`.
 *
 * Unset, [shape] draws as it always has — a box with the Marker radius that is
 * whatever size its modifier (or [width] and [height]) makes it — so the
 * callers that sized it with a modifier keep the placeholder they had. React's
 * default is `line`; here a line is asked for by name.
 */
@Composable
fun KozmosSkeleton(
    modifier: Modifier = Modifier,
    shape: KozmosSkeletonShape? = null,
    width: Dp = Dp.Unspecified,
    height: Dp = Dp.Unspecified
) {
    if (shape == null) {
        Box(
            modifier = modifier
                .then(if (width.isSpecified) Modifier.width(width) else Modifier)
                .then(if (height.isSpecified) Modifier.height(height) else Modifier)
                // Clipped, so the sheen keeps to the Marker radius's corners.
                .clip(RoundedCornerShape(KozmosDimensions.semanticsRadiusMarker))
                .background(Grey)
                .shimmer()
        )
        return
    }

    // A line's height when it is given none: React's 16 at the default text
    // size, growing with the text a line stands in for.
    val lineHeight = with(LocalDensity.current) { KozmosDimensions.primitivesLayoutSizing200.value.sp.toDp() }
    val span = if (width.isSpecified) Modifier.width(width) else Modifier.fillMaxWidth()
    val extent = when (shape) {
        KozmosSkeletonShape.Line -> span.height(if (height.isSpecified) height else lineHeight)
        KozmosSkeletonShape.Block -> if (height.isSpecified) span.height(height) else span
        KozmosSkeletonShape.Circle -> {
            val diameter = if (width.isSpecified) width else KozmosDimensions.primitivesLayoutSizing500
            Modifier.size(width = diameter, height = if (height.isSpecified) height else diameter)
        }
    }
    // The Control radius, which on a line lower than twice it meets in round
    // ends, as CSS and Figma draw it; a circle is the pill, which stays
    // round-ended when given a height of its own. Clipped before the sheen is
    // laid, so the sheen keeps to the shape.
    val outline = if (shape == KozmosSkeletonShape.Circle) {
        CircleShape
    } else {
        RoundedCornerShape(KozmosDimensions.semanticsRadiusControl)
    }
    Box(
        modifier = modifier
            .then(extent)
            .clip(outline)
            .background(Grey)
            .shimmer()
    )
}

/**
 * Figma's `Colors/background/200`, as React and iOS draw it. Android and React
 * drew 100, iOS 300, until Olcay chose Figma's on 2026-09-27.
 */
private val Grey: Color
    @Composable get() = KozmosThemeTokens.primitivesColorsBackground200
