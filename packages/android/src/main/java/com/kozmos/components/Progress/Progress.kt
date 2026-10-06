package com.kozmos.components.progress

import androidx.compose.material3.LinearProgressIndicator
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

@Composable
fun KozmosProgress(
    progress: Float,
    modifier: Modifier = Modifier
) {
    LinearProgressIndicator(
        progress = progress,
        modifier = modifier,
        color = KozmosThemeTokens.primitivesColorsTheme500,
        trackColor = KozmosThemeTokens.primitivesColorsBackground300,
    )
}
