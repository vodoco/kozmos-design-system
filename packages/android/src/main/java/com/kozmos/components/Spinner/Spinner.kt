package com.kozmos.components.spinner

import android.provider.Settings
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.tokens.KozmosThemeTokens

/**
 * Layout of the spinner, mirroring the React `Spinner.size`.
 *
 * The `Spinner/size` scale (small, medium, large, xlarge): 16, 24, 32 and 48,
 * as React's classes and the Figma variables draw them. The natives have no
 * generated token for these — the four live as Figma component variables — so
 * the scale is written here and on SwiftUI until they reach `packages/tokens`.
 *
 * The doc sits above the declaration, not inside the body: the variant-parity
 * check splits an enum body on commas to read its entries, and a comment
 * holding one took Spinner's whole axis with it.
 */
enum class KozmosSpinnerSize(val value: String, val dimension: Dp) {
    Sm("sm", 16.dp),
    Md("md", 24.dp),
    Lg("lg", 32.dp),
    Xl("xl", 48.dp)
}

/**
 * Indeterminate loading: the system's arc, turning.
 *
 * Before 2026-09-22 this was material3's `CircularProgressIndicator` at its own
 * default size, while React drew lucide's arc, iOS drew a `ProgressView` tinted
 * a hard-coded blue and Figma drew an ellipse with a dash pattern. Four
 * drawings, no two alike — and material3 1.1.2's indeterminate indicator is the
 * one Paparazzi cannot render against animation-core 1.6.0, so no golden has
 * ever shown one.
 *
 * This is the one drawing: three quarters of a circle from the top, round caps,
 * stroke 2 in the icons' own 24 box so the weight scales with the mark. It
 * rests when the system's animations are off; the description still says what
 * is happening.
 */
@Composable
fun KozmosSpinner(
    modifier: Modifier = Modifier,
    size: KozmosSpinnerSize = KozmosSpinnerSize.Md,
    label: String = "Loading",
    // The theme's own text colour, as React's `currentColor` and SwiftUI's
    // foreground style resolve to. It defaulted to theme/500 whatever it sat
    // on, which was the last place the three platforms disagreed once the arc
    // was one drawing. `LocalContentColor` is the closer-looking analogue and
    // is wrong here: outside a material `Surface` it stays its own default,
    // black, which drew an invisible spinner on the dark surface — the first
    // dark golden was a black rectangle. A control that sets a content colour
    // — a Button, an IconButton — passes it in.
    color: Color = KozmosThemeTokens.primitivesColorsForeground0
) {
    // One turn a second, linear — the same turn React's `kozmos-spin` takes.
    val transition = rememberInfiniteTransition(label = "kozmos-spinner")
    val angle by transition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 1000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "kozmos-spinner-angle"
    )
    val context = LocalContext.current
    val animationsOn = remember(context) {
        Settings.Global.getFloat(
            context.contentResolver,
            Settings.Global.ANIMATOR_DURATION_SCALE,
            1f
        ) > 0f
    }
    val strokeWidth = KozmosDimensions.primitivesIconStrokeMd * (size.dimension / 24.dp)
    Canvas(
        modifier = modifier
            .size(size.dimension)
            .semantics { contentDescription = label }
    ) {
        val stroke = strokeWidth.toPx()
        // The path is radius 9 in the icons' 24 box, as React's `d` is and as
        // SwiftUI insets to: three units from the edge to the path, so the ink
        // — one unit either side of it — sits two units inside the box. Half
        // the stroke is not enough: it put the ink on the box's edge here while
        // React kept it inside, which is three drawings of one arc.
        val inset = this.size.width / 8f
        drawArc(
            color = color,
            // From the top. Compose measures from 3 o'clock, so -90 puts the
            // gap at the end of three quarters rather than across the top.
            startAngle = -90f + if (animationsOn) angle else 0f,
            sweepAngle = 270f,
            useCenter = false,
            topLeft = Offset(inset, inset),
            size = Size(this.size.width - inset * 2f, this.size.height - inset * 2f),
            style = Stroke(width = stroke, cap = StrokeCap.Round)
        )
    }
}
