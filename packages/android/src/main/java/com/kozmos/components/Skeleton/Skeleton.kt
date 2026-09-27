package com.kozmos.components.skeleton

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
import androidx.compose.ui.geometry.Offset
import android.provider.Settings
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.isSpecified
import androidx.compose.ui.unit.sp
import com.kozmos.tokens.KozmosThemeTokens

fun Modifier.shimmer(): Modifier = composed {
    val transition = rememberInfiniteTransition(label = "shimmer")
    val translateAnimation = transition.animateFloat(
        initialValue = 0f,
        targetValue = 1000f,
        animationSpec = infiniteRepeatable(
            animation = tween(
                durationMillis = 1000,
                easing = LinearEasing
            ),
            repeatMode = RepeatMode.Restart
        ),
        label = "shimmer"
    )
    
    val shimmerColors = listOf(
        KozmosThemeTokens.primitivesColorsBackground300.copy(alpha = 0.6f),
        KozmosThemeTokens.primitivesColorsBackground300.copy(alpha = 0.2f),
        KozmosThemeTokens.primitivesColorsBackground300.copy(alpha = 0.6f),
    )
    
    // Held still when the system's animations are off, as the assistant's ring
    // and the spinner are: the sheen ran whatever the preference said, which is
    // GAP-50's third part. Stopped it rests at the sweep's start, which is the
    // surface's own grey with the sheen off the end.
    val context = LocalContext.current
    val animationsOn = remember(context) {
        Settings.Global.getFloat(
            context.contentResolver,
            Settings.Global.ANIMATOR_DURATION_SCALE,
            1f
        ) > 0f
    }
    val sweep = if (animationsOn) translateAnimation.value else 1000f

    val brush = Brush.linearGradient(
        colors = shimmerColors,
        start = Offset.Zero,
        end = Offset(x = sweep, y = sweep)
    )
    
    background(brush)
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
                .background(KozmosThemeTokens.primitivesColorsBackground100, RoundedCornerShape(KozmosDimensions.semanticsRadiusMarker))
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
            .background(KozmosThemeTokens.primitivesColorsBackground100)
            .shimmer()
    )
}
