package com.kozmos.components

import android.os.SystemClock
import android.view.InputDevice
import android.view.MotionEvent
import android.view.View
import androidx.compose.foundation.Indication
import androidx.compose.foundation.IndicationInstance
import androidx.compose.foundation.interaction.InteractionSource
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.drawscope.ContentDrawScope

/**
 * How a press reaches a target in a [live] composition.
 *
 * [Finger] is a touchscreen finger, as a phone sends it. Compose widens a
 * finger's press on a target smaller than ViewConfiguration's 48dp to 48,
 * where it hits nothing else, so a finger finds a small target a few dp
 * outside what it draws. [Pointer] is a pointer of no known kind, which
 * Compose does not widen: it reaches a target only inside the target's own
 * box, so it measures the box a part lays out for its press.
 */
enum class Press { Finger, Pointer }

/** One press, down and up, at [at] in the view's pixels. */
suspend fun LiveSemantics.press(at: Offset, how: Press) {
    // Drawn in software from here on: on layoutlib's hardware renderer a
    // Material ripple takes the renderer down once a press lands ("The
    // Android framework has encountered a fatal error").
    view.setLayerType(View.LAYER_TYPE_SOFTWARE, null)
    (view.parent as? View)?.setLayerType(View.LAYER_TYPE_SOFTWARE, null)
    val down = SystemClock.uptimeMillis()
    for ((action, time) in listOf(MotionEvent.ACTION_DOWN to down, MotionEvent.ACTION_UP to down + 50)) {
        val event = when (how) {
            Press.Pointer -> MotionEvent.obtain(down, time, action, at.x, at.y, 0)
            Press.Finger -> MotionEvent.obtain(
                down, time, action, 1,
                arrayOf(MotionEvent.PointerProperties().apply { id = 0; toolType = MotionEvent.TOOL_TYPE_FINGER }),
                arrayOf(MotionEvent.PointerCoords().apply { x = at.x; y = at.y; pressure = 1f; size = 1f }),
                0, 0, 1f, 1f, 0, 0, InputDevice.SOURCE_TOUCHSCREEN, 0
            )
        }
        view.dispatchTouchEvent(event)
        event.recycle()
        frames(2)
    }
    frames(2)
}

/**
 * Points 1dp inside each edge of a [side]-square box centred on [around]'s
 * centre, at the middle of the edge: off a centred glyph or word, and, where
 * [around] is smaller than [side], outside it. [density] is pixels per dp.
 */
fun edgesOfSquare(around: Rect, side: Float, density: Float): Map<String, Offset> {
    val reach = (side / 2 - 1f) * density
    val centre = around.center
    return mapOf(
        "top" to Offset(centre.x, centre.y - reach),
        "bottom" to Offset(centre.x, centre.y + reach),
        "left" to Offset(centre.x - reach, centre.y),
        "right" to Offset(centre.x + reach, centre.y)
    )
}

/**
 * An indication that draws nothing: what these tests read is where a press
 * goes, which an indication only paints.
 */
@Suppress("DEPRECATION")
object UnpaintedIndication : Indication {
    @Composable
    override fun rememberUpdatedInstance(interactionSource: InteractionSource): IndicationInstance =
        remember {
            object : IndicationInstance {
                override fun ContentDrawScope.drawIndication() = drawContent()
            }
        }
}
