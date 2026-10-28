package com.kozmos.components.progress

import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.animation.core.AnimationSpec
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.snap
import androidx.compose.animation.core.tween
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.progressSemantics
import androidx.compose.material3.LocalTextStyle
import androidx.compose.material3.ProvideTextStyle
import androidx.compose.ui.Alignment
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import com.kozmos.components.motion.rememberKozmosAnimationsOn
import com.kozmos.components.KozmosEmotion
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.tokens.KozmosMotion
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.kozmos.components.motion.rememberKozmosAnimatorScale
import com.kozmos.tokens.KozmosThemeTokens
import androidx.compose.runtime.*
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawscope.clipRect
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.animation.core.withInfiniteAnimationFrameNanos
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver

data class KozmosProgressRange(val start: Float, val end: Float) {
    val isValid: Boolean get() = start.isFinite() && end.isFinite() && start >= 0f && end <= 1f && start < end
    fun position(value: Float?): Float? = value?.takeIf { isValid && it.isFinite() && it >= start && it <= end }
    fun fill(value: Float?, mode: KozmosProgressPositionMode): KozmosProgressRange? =
        if (!isValid) null else if (mode == KozmosProgressPositionMode.Static) this
        else position(value)?.takeIf { it > 0f }?.let { KozmosProgressRange(0f, it) }
    fun flow(value: Float?, mode: KozmosProgressPositionMode): KozmosProgressRange? =
        if (!isValid) null else if (mode == KozmosProgressPositionMode.Static) this
        else position(value)?.takeIf { it < end }?.let { KozmosProgressRange(it, end) }
}
enum class KozmosProgressTrackAppearance { Theme, Gradient }
enum class KozmosProgressPositionMode { Static, Live }
enum class KozmosProgressMotion { None, Directional }

/**
 * Core owns the clock and observes both reduced/disabled system animation and lifecycle.
 * A state, read where the cue is drawn, so the clock redraws the track without recomposing it.
 */
@Composable
private fun progressFlowPhase(enabled: Boolean): FloatState {
    val lifecycle = LocalLifecycleOwner.current.lifecycle
    var resumed by remember(lifecycle) { mutableStateOf(lifecycle.currentState.isAtLeast(Lifecycle.State.RESUMED)) }
    val scale = rememberKozmosAnimatorScale()
    DisposableEffect(lifecycle) {
        val observer = LifecycleEventObserver { _, _ -> resumed = lifecycle.currentState.isAtLeast(Lifecycle.State.RESUMED) }
        lifecycle.addObserver(observer)
        onDispose { lifecycle.removeObserver(observer) }
    }
    val phase = remember { mutableFloatStateOf(0f) }
    LaunchedEffect(enabled, resumed, scale) {
        phase.floatValue = 0f
        if (enabled && resumed && scale > 0 && scale.isFinite()) {
            // An infinite animation, as Compose's UI tests know one: a plain
            // frame loop keeps a host's test from ever going idle.
            var start = -1L
            while (true) withInfiniteAnimationFrameNanos {
                if (start < 0) start = it
                phase.floatValue = (((it - start) / 1_000_000_000.0 / scale) % 1.0).toFloat() * 20f
            }
        }
    }
    return phase
}

/** Decorative Core drawing; the owning control supplies accessible progress semantics. */
@Composable
fun KozmosProgressTrack(activeRange: KozmosProgressRange?, value: Float?, modifier: Modifier = Modifier,
    appearance: KozmosProgressTrackAppearance = KozmosProgressTrackAppearance.Theme,
    positionMode: KozmosProgressPositionMode = KozmosProgressPositionMode.Live,
    motion: KozmosProgressMotion = KozmosProgressMotion.None) {
    val rtl = LocalLayoutDirection.current == LayoutDirection.Rtl
    val neutral = KozmosThemeTokens.primitivesColorsBackground300
    val theme = KozmosThemeTokens.primitivesColorsTheme600
    val success = KozmosThemeTokens.primitivesColorsEmotionalSuccess600
    val flowColor = if (positionMode == KozmosProgressPositionMode.Static) Color.White.copy(alpha = 0.65f) else KozmosThemeTokens.primitivesColorsBackground600
    val flow = if (motion == KozmosProgressMotion.Directional) activeRange?.flow(value, positionMode) else null
    val phase = if (flow != null) progressFlowPhase(true) else null
    Canvas(modifier.fillMaxWidth().height(10.dp)) {
        fun point(fraction: Float) = Offset((if (rtl) 1f - fraction else fraction) * size.width, size.height / 2)
        drawLine(neutral, point(0f), point(1f), 6.dp.toPx(), StrokeCap.Round)
        activeRange?.fill(value, positionMode)?.let { range ->
            val brush = Brush.linearGradient(listOf(theme, if (appearance == KozmosProgressTrackAppearance.Gradient) success else theme),
                start = point(range.start), end = point(range.end))
            drawLine(brush, point(range.start), point(range.end), 6.dp.toPx(), StrokeCap.Round)
        }
        flow?.let { range ->
            val start = point(range.start); val end = point(range.end)
            clipRect(left = minOf(start.x, end.x), right = maxOf(start.x, end.x)) {
                drawLine(flowColor, start, end, 3.dp.toPx(), StrokeCap.Round,
                    pathEffect = PathEffect.dashPathEffect(floatArrayOf(5.dp.toPx(), 15.dp.toPx()), -(phase?.floatValue ?: 0f).dp.toPx()))
            }
        }
    }
}

/**
 * The two forms of [KozmosProgress], React's `shape`: [Linear], the bar, and
 * [Circular], a ring with a label in its centre for a count out of a total
 * (decision 131, GAP-038).
 */
enum class KozmosProgressShape { Linear, Circular }

/**
 * A ring's size, React's `size`: the layout spacing tokens 600, 900 and 1000
 * across (48, 96 and 128) and 50, 100 and 150 thick (4, 8 and 12). A bar has
 * one size.
 */
enum class KozmosProgressSize(val diameter: Dp, val stroke: Dp) {
    Sm(KozmosDimensions.primitivesLayoutSpacing600, KozmosDimensions.primitivesLayoutSpacing50),
    Md(KozmosDimensions.primitivesLayoutSpacing900, KozmosDimensions.primitivesLayoutSpacing100),
    Lg(KozmosDimensions.primitivesLayoutSpacing1000, KozmosDimensions.primitivesLayoutSpacing150)
}

/**
 * Where a ring's label is drawn, React's `labelPlacement`: in the hole, or
 * beside the ring at the inline end, so on its left right to left.
 */
enum class KozmosProgressLabelPlacement { Center, End }

/**
 * How far something has got: a bar, or with [shape] Circular a ring of
 * [size] whose arc is [tone]'s colour, Tag's and Button's emotions (Themed,
 * the bar's own theme 600, by default), with [label] in its centre or, with
 * [labelPlacement] End, beside it. [progress] is a fraction of 1, clamped;
 * NaN is none done. A bar draws no label.
 */
@Composable
fun KozmosProgress(
    progress: Float,
    modifier: Modifier = Modifier,
    shape: KozmosProgressShape = KozmosProgressShape.Linear,
    size: KozmosProgressSize = KozmosProgressSize.Md,
    tone: KozmosEmotion = KozmosEmotion.Themed,
    labelPlacement: KozmosProgressLabelPlacement = KozmosProgressLabelPlacement.Center,
    label: (@Composable () -> Unit)? = null
) {
    if (shape == KozmosProgressShape.Circular) {
        KozmosProgressRing(progress, modifier, size, tone, labelPlacement, label)
        return
    }
    // React's colours: bg-primary (theme 600) on bg-secondary (background
    // 200), in light and dark. Theme 500 on background 300 read 2.56:1, and
    // 1.58:1 dark, under the 3:1 a bar needs against its track.
    LinearProgressIndicator(
        progress = progress,
        modifier = modifier,
        color = KozmosThemeTokens.primitivesColorsTheme600,
        trackColor = KozmosThemeTokens.primitivesColorsBackground200,
    )
}

/** A new value sweeps round over the standard duration; with animations off it is drawn there at once. */
internal fun kozmosProgressSweep(animationsOn: Boolean): AnimationSpec<Float> =
    if (animationsOn) tween(KozmosMotion.semanticsMotionDurationStandard, easing = KozmosMotion.semanticsMotionEasingStandard)
    else snap()

/**
 * The dial, and its label beside it at the inline end when asked: a Row, so
 * right to left the label is on its left. The ring is one node: the label's
 * words, with its progress.
 *
 * The track and the arc are one circle's strokes, inside the dial's box: the
 * arc is the tone's emotion text colour, Themed's theme 600 by default, as
 * the bar's fill, on background 100: 4.8:1 or more for every tone, light and
 * dark. It runs from 12 o'clock clockwise. A Canvas is not mirrored right to
 * left, and a progress ring does not mirror.
 */
@Composable
private fun KozmosProgressRing(
    progress: Float,
    modifier: Modifier,
    ringSize: KozmosProgressSize,
    tone: KozmosEmotion,
    labelPlacement: KozmosProgressLabelPlacement,
    label: (@Composable () -> Unit)?
) {
    val target = if (progress.isNaN()) 0f else progress.coerceIn(0f, 1f)
    val swept by animateFloatAsState(target, kozmosProgressSweep(rememberKozmosAnimationsOn()), label = "sweep")
    val track = KozmosThemeTokens.primitivesColorsBackground100
    val fill = tone.text
    Row(
        modifier
            .semantics(mergeDescendants = true) {}
            .progressSemantics(target),
        horizontalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing150),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(Modifier.size(ringSize.diameter), contentAlignment = Alignment.Center) {
            Canvas(Modifier.matchParentSize()) {
                val stroke = ringSize.stroke.toPx()
                val corner = Offset(stroke / 2, stroke / 2)
                val circle = Size(size.width - stroke, size.height - stroke)
                drawArc(track, 0f, 360f, false, corner, circle, style = Stroke(stroke))
                if (swept > 0f) {
                    drawArc(fill, -90f, 360f * swept, false, corner, circle, style = Stroke(stroke, cap = StrokeCap.Butt))
                }
            }
            if (label != null && labelPlacement == KozmosProgressLabelPlacement.Center) {
                // Inside the square the hole holds, centred.
                Box(
                    Modifier.widthIn(max = (ringSize.diameter - ringSize.stroke * 2) * 0.7071f),
                    contentAlignment = Alignment.Center
                ) {
                    ProvideTextStyle(LocalTextStyle.current.copy(textAlign = TextAlign.Center)) { label() }
                }
            }
        }
        if (label != null && labelPlacement == KozmosProgressLabelPlacement.End) label()
    }
}
