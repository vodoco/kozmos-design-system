package com.kozmos.components.progress

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.Icon
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
import androidx.compose.material3.LocalContentColor
import androidx.compose.material3.LocalTextStyle
import androidx.compose.ui.Alignment
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.em
import com.kozmos.components.motion.rememberKozmosAnimationsOn
import com.kozmos.components.KozmosEmotion
import com.kozmos.components.text.KozmosTextStyle
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
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.WindowInsetsSides
import androidx.compose.foundation.layout.only
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawscope.clipRect
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.animation.core.withInfiniteAnimationFrameNanos
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.draw.clip
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.layout.onPlaced
import androidx.compose.runtime.withFrameNanos
import android.os.SystemClock
import androidx.compose.ui.semantics.progressBarRangeInfo

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
 * Where a bar sits, React's `placement` (GAP-159). [Inline], the default, is
 * the bar in the flow. [Top] is the screen's loading bar: edge to edge, 4
 * tall (spacing 50) and square. Putting it at the top of the screen is the
 * caller's, in a `Box` with `Modifier.align(Alignment.TopCenter)` over the
 * content. A ring has one placement.
 */
enum class KozmosProgressPlacement { Inline, Top }

/**
 * How far something has got: a bar, or with [shape] Circular a ring of
 * [size] whose arc is [tone]'s colour, Tag's and Button's emotions (Themed,
 * the bar's own theme 600, by default), with [label] in its centre or, with
 * [labelPlacement] End, beside it, 12 on 16 in foreground 0 unless its content
 * says otherwise. [progress] is a fraction of 1, clamped, so over the total
 * is a full ring; one that is not a finite number is none done. A bar draws
 * no label. An Sm ring that is whole and has no label draws a check in its
 * hole. [placement] Top makes a bar the screen's loading bar; a ring ignores
 * it. A Top bar is named [accessibilityName] for TalkBack, "Progress" unless
 * the product says otherwise; an Inline bar takes the name its caller gives.
 */
@Composable
fun KozmosProgress(
    progress: Float,
    modifier: Modifier = Modifier,
    shape: KozmosProgressShape = KozmosProgressShape.Linear,
    size: KozmosProgressSize = KozmosProgressSize.Md,
    tone: KozmosEmotion = KozmosEmotion.Themed,
    labelPlacement: KozmosProgressLabelPlacement = KozmosProgressLabelPlacement.Center,
    placement: KozmosProgressPlacement = KozmosProgressPlacement.Inline,
    accessibilityName: String = "Progress",
    label: (@Composable () -> Unit)? = null
) {
    if (shape == KozmosProgressShape.Circular) {
        KozmosProgressRing(progress, modifier, size, tone, labelPlacement, label)
        return
    }
    if (placement == KozmosProgressPlacement.Top) {
        // The top bar: the same colours, from the inline start, 4 tall and
        // square.
        val fraction = if (progress.isFinite()) progress.coerceIn(0f, 1f) else 0f
        val rtl = LocalLayoutDirection.current == LayoutDirection.Rtl
        val track = KozmosThemeTokens.primitivesColorsBackground200
        val fill = KozmosThemeTokens.primitivesColorsTheme600
        Canvas(
            modifier
                .kozmosProgressTopInsets(KozmosProgressPlacement.Top)
                .fillMaxWidth()
                .height(kozmosProgressBarHeight(KozmosProgressPlacement.Top))
                .progressSemantics(fraction)
                // Named, as SwiftUI's top bar is: a screen's loading bar has
                // no caller's semantics wrapped round it.
                .semantics { contentDescription = accessibilityName }
        ) {
            drawRect(track)
            val bounds = this.size
            val width = bounds.width * fraction
            drawRect(fill, topLeft = Offset(if (rtl) bounds.width - width else 0f, 0f), size = Size(width, bounds.height))
        }
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

/** The bar's height by placement: spacing 100 (8) in the flow, spacing 50 (4) at the top. */
internal fun kozmosProgressBarHeight(placement: KozmosProgressPlacement): Dp =
    if (placement == KozmosProgressPlacement.Top) KozmosDimensions.primitivesLayoutSpacing50
    else KozmosDimensions.primitivesLayoutSpacing100

/**
 * The top bar sits under the status bar and a display cutout, as React's
 * does under `env(safe-area-inset-top)`: the top of the safe drawing
 * insets, which a screen that has already consumed them (a Scaffold's
 * content) does not add again.
 */
@Composable
internal fun Modifier.kozmosProgressTopInsets(placement: KozmosProgressPlacement): Modifier =
    if (placement == KozmosProgressPlacement.Top) windowInsetsPadding(WindowInsets.safeDrawing.only(WindowInsetsSides.Top))
    else this

/**
 * Which waits share one announcement (decision of #522's second review):
 * only bars that start together. A wait that starts within
 * [KozmosProgressWaitWindowMillis] of its group's first joins the group and
 * is silent; one that starts later opens a group of its own and speaks, even
 * while an earlier, longer wait still runs. Five uploads starting together
 * are one "Loading"; a later "Uploading plan" beside a running "Sync" is
 * said. A wait starts when its bar is first placed on screen, not when it is
 * composed: a lazy list composes rows it prefetches off screen, and such a
 * row must not take the turn of the bar the visitor sees. Main thread only,
 * where layout runs.
 */
internal object KozmosProgressWaitGroups {
    /** The clock waits are timed by; a test sets its own. */
    var clock: () -> Long = { SystemClock.uptimeMillis() }
    private var groupStartedAt: Long? = null

    /** Whether a wait starting now opens a group, and so speaks. */
    fun start(): Boolean {
        val now = clock()
        val started = groupStartedAt
        if (started != null && now - started <= KozmosProgressWaitWindowMillis) return false
        groupStartedAt = now
        return true
    }

    /** Forgets the open group: for tests. */
    fun reset() { groupStartedAt = null }
}

/** How far apart waits may start and still be one announcement: half a second. */
internal const val KozmosProgressWaitWindowMillis = 500L

/** A quarter of the track: the indeterminate segment's width, as React's 25%. */
internal const val KozmosProgressSegment = 0.25f

/** One sweep, as React's `kozmos-progress-sweep` and Pointr Cloud's loading bar: 2 s, linear. */
internal const val KozmosProgressSweepMillis = 2000

/**
 * Where the indeterminate segment is, as fractions of the track from its
 * left edge, at [phase] (0 to 1) of a sweep. It enters wholly before the
 * inline start and leaves wholly past the inline end; right to left it runs
 * from the right. With animations off it stands still in the middle of the
 * track, 37.5% to 62.5%, where it reads as a wait and not as a value.
 */
internal fun kozmosProgressSegment(phase: Float, animationsOn: Boolean, rtl: Boolean): ClosedFloatingPointRange<Float> {
    val start = if (animationsOn) -KozmosProgressSegment + (1f + KozmosProgressSegment) * phase.coerceIn(0f, 1f)
    else (1f - KozmosProgressSegment) / 2f
    val left = if (rtl) 1f - start - KozmosProgressSegment else start
    return left..(left + KozmosProgressSegment)
}

/**
 * The sweep's clock, 0 to 1 every [KozmosProgressSweepMillis], scaled by the
 * system's animator scale, and paused while the screen is not resumed, as
 * the track's flow is. A state read where the segment is drawn, so the clock
 * redraws the bar without recomposing it.
 */
@Composable
private fun progressSweepPhase(enabled: Boolean): FloatState {
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
            var start = -1L
            val period = KozmosProgressSweepMillis / 1000.0
            while (true) withInfiniteAnimationFrameNanos {
                if (start < 0) start = it
                phase.floatValue = (((it - start) / 1_000_000_000.0 / scale / period) % 1.0).toFloat()
            }
        }
    }
    return phase
}

/**
 * An indeterminate bar (GAP-159): React's `<Progress />` with no value. A
 * segment a quarter of the track wide, theme 600 on background 200, sweeps
 * from the inline start to the inline end every 2 s, linear, for as long as
 * the bar is shown; with the system's animations off it stands still in the
 * middle of the track. [placement] Inline is 8 tall with round ends; Top is
 * the screen's loading bar, 4 tall and square.
 *
 * TalkBack meets one node: an indeterminate progress bar named [label],
 * "Loading" unless the product says otherwise. The name is said once per
 * wait. A wait starts when the bar is first placed on screen; the first of
 * the bars that start within half a second of each other becomes a polite
 * live region, empty for a frame and then given [label], so the change is
 * announced (a region that arrives with its words may go unheard, GAP-226),
 * and it keeps those words while it waits, so a label that changes is not
 * said again. A wait that starts later speaks too, even while an earlier one
 * still runs. Any other bar of the group, or one that has spoken and comes
 * back into a lazy list, is named by [label] and says nothing.
 * The sweep changes nothing TalkBack reads. Top sits under the status bar
 * (the top safe drawing insets).
 */
@Composable
fun KozmosProgress(
    modifier: Modifier = Modifier,
    placement: KozmosProgressPlacement = KozmosProgressPlacement.Inline,
    label: String = "Loading"
) {
    val rtl = LocalLayoutDirection.current == LayoutDirection.Rtl
    val animationsOn = rememberKozmosAnimationsOn()
    val phase = progressSweepPhase(animationsOn)
    val track = KozmosThemeTokens.primitivesColorsBackground200
    val fill = KozmosThemeTokens.primitivesColorsTheme600
    // Once per wait. The wait starts when the bar is first placed (not
    // when a lazy list composes it off screen); only the first of the bars
    // that start together speaks; one that has spoken and comes back
    // (scrolled back into a lazy list) does not speak again; and its words
    // are the ones read when the wait started.
    var spoken by rememberSaveable { mutableStateOf(false) }
    var placed by remember { mutableStateOf(false) }
    var speaks by remember { mutableStateOf(false) }
    var words by remember { mutableStateOf<String?>(null) }
    val latest by rememberUpdatedState(label)
    LaunchedEffect(speaks) {
        if (speaks) {
            // The region is in the tree, empty, for a frame before its
            // words arrive, so the change is announced (GAP-226).
            withFrameNanos { }
            words = latest
            spoken = true
        }
    }
    val shape = if (placement == KozmosProgressPlacement.Top) RoundedCornerShape(KozmosDimensions.semanticsRadiusNone)
    else RoundedCornerShape(percent = 50)
    Canvas(
        modifier
            .kozmosProgressTopInsets(placement)
            .fillMaxWidth()
            .height(kozmosProgressBarHeight(placement))
            .clip(shape)
            .onPlaced {
                if (!placed) {
                    placed = true
                    if (!spoken) speaks = KozmosProgressWaitGroups.start()
                }
            }
            .semantics {
                progressBarRangeInfo = ProgressBarRangeInfo.Indeterminate
                if (speaks) {
                    // Composed with no name, then given the words, so the
                    // change is announced (GAP-226).
                    liveRegion = LiveRegionMode.Polite
                    contentDescription = words ?: ""
                } else {
                    contentDescription = label
                }
            }
    ) {
        drawRect(track)
        val segment = kozmosProgressSegment(phase.floatValue, animationsOn, rtl)
        drawRect(
            fill,
            topLeft = Offset(segment.start * size.width, 0f),
            size = Size(KozmosProgressSegment * size.width, size.height)
        )
    }
}

/** A new value sweeps round over the standard duration; with animations off it is drawn there at once. */
internal fun kozmosProgressSweep(animationsOn: Boolean): AnimationSpec<Float> =
    if (animationsOn) tween(KozmosMotion.semanticsMotionDurationStandard, easing = KozmosMotion.semanticsMotionEasingStandard)
    else snap()

/**
 * What a ring's label is drawn in, on either path, as React's
 * `.kozmos-progress-ring` sets it: foreground 0, and the caption step, 12 on
 * 16, until its content says otherwise. The colour is the ring's own: with
 * no Material Surface above it, what is around it is Material's black, on a
 * dark page too. The line height is a share of the size, so a label that
 * sets only a larger size keeps its lines apart.
 */
@Composable
private fun KozmosProgressRingLabel(textAlign: TextAlign, label: @Composable () -> Unit) {
    CompositionLocalProvider(
        LocalContentColor provides KozmosThemeTokens.primitivesColorsForeground0,
        LocalTextStyle provides KozmosTextStyle.Caption.textStyle.copy(
            lineHeight = (16f / 12f).em,
            textAlign = textAlign
        ),
        content = label
    )
}

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
 *
 * "100%" is 31.8 wide at 12, in the 28.28 square an Sm hole holds (owner,
 * 2 Nov), so a whole Sm ring with no label of the product's draws a check, in
 * the arc's colour, and says 100% by a name of its own: outermost, a name of
 * the caller's replaces it.
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
    val target = if (progress.isFinite()) progress.coerceIn(0f, 1f) else 0f
    val swept by animateFloatAsState(target, kozmosProgressSweep(rememberKozmosAnimationsOn()), label = "sweep")
    val track = KozmosThemeTokens.primitivesColorsBackground100
    val fill = tone.text
    val drawsCheck = ringSize == KozmosProgressSize.Sm && label == null && target >= 1f
    Row(
        modifier
            .semantics(mergeDescendants = true) {}
            .progressSemantics(target)
            .then(if (drawsCheck) Modifier.semantics { contentDescription = "100%" } else Modifier),
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
            if (drawsCheck) {
                Icon(
                    imageVector = Icons.Default.Check,
                    contentDescription = null,
                    tint = fill,
                    modifier = Modifier.size(KozmosDimensions.primitivesLayoutSizing300)
                )
            }
            if (label != null && labelPlacement == KozmosProgressLabelPlacement.Center) {
                // Inside the square the hole holds, centred.
                Box(
                    Modifier.widthIn(max = (ringSize.diameter - ringSize.stroke * 2) * 0.7071f),
                    contentAlignment = Alignment.Center
                ) {
                    KozmosProgressRingLabel(TextAlign.Center, label)
                }
            }
        }
        if (label != null && labelPlacement == KozmosProgressLabelPlacement.End) {
            KozmosProgressRingLabel(TextAlign.Start, label)
        }
    }
}
