package com.kozmos.components.backdrop

import android.os.SystemClock
import android.view.InputDevice
import android.view.MotionEvent
import android.view.View
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.withFrameNanos
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.layout.boundsInRoot
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.platform.LocalView
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * React's Backdrop is a plain `div`: no role, no name, no tab stop, so a
 * screen reader and a keyboard pass over it, and SwiftUI's tap gesture on a
 * colour is no accessibility element either. Dismissing belongs to the sheet
 * or dialog the scrim dims, which has its own close and Back.
 *
 * Compose's scrim was a `clickable`: TalkBack focused an unnamed control that
 * dismissed something ("Double tap to activate"), and a keyboard's Tab
 * stopped on it. It now takes taps without being a control.
 */
class KozmosBackdropSemanticsTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    @Test fun theScrimIsNoControlTalkBackOrAKeyboardReaches() {
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme { KozmosBackdrop(onTap = {}) }
        }
        for (node in tree.unmerged) {
            assertTrue("a node TalkBack can activate: $node", node.click == null)
            assertTrue("a node a keyboard can focus: $node", node.requestFocus == null && node.focused == null)
        }
    }

    /** A one-finger touchscreen event at [x], [y]. */
    private fun finger(down: Long, action: Int, x: Float, y: Float): MotionEvent = MotionEvent.obtain(
        down, SystemClock.uptimeMillis(), action, 1,
        arrayOf(MotionEvent.PointerProperties().apply { id = 0; toolType = MotionEvent.TOOL_TYPE_FINGER }),
        arrayOf(MotionEvent.PointerCoords().apply { this.x = x; this.y = y; pressure = 1f; size = 1f }),
        0, 0, 1f, 1f, 0, 0, InputDevice.SOURCE_TOUCHSCREEN, 0
    )

    /** A finger's tap still dismisses, and the page under the scrim gets none of it. */
    @Test fun aTapOnTheScrimStillDismissesAndStopsThere() {
        var dismissed = 0
        var under = 0
        var frame = Rect.Zero
        val view = ComposeView(paparazzi.context).apply {
            setContent {
                val host = LocalView.current
                KozmosMaterialTheme {
                    Box(Modifier.fillMaxSize()) {
                        Box(Modifier.fillMaxSize().clickable { under++ })
                        KozmosBackdrop(
                            onTap = { dismissed++ },
                            modifier = Modifier.onGloballyPositioned { frame = it.boundsInRoot() }
                        )
                    }
                }
                LaunchedEffect(Unit) {
                    repeat(3) { withFrameNanos { } }
                    val down = SystemClock.uptimeMillis()
                    val press = finger(down, MotionEvent.ACTION_DOWN, frame.center.x, frame.center.y)
                    host.dispatchTouchEvent(press)
                    press.recycle()
                    withFrameNanos { }
                    val release = finger(down, MotionEvent.ACTION_UP, frame.center.x, frame.center.y)
                    host.dispatchTouchEvent(release)
                    release.recycle()
                    repeat(2) { withFrameNanos { } }
                }
            }
        }
        view.setLayerType(View.LAYER_TYPE_SOFTWARE, null)
        paparazzi.gif(view, "tap", start = 0L, end = 1000L, fps = 20)
        assertTrue("the scrim was never laid out", frame.width > 0f)
        assertEquals("taps the scrim's onTap received", 1, dismissed)
        assertEquals("taps that went through to the page under the scrim", 0, under)
    }
}
