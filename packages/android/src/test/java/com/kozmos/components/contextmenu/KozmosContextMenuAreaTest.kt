package com.kozmos.components.contextmenu

import android.os.SystemClock
import android.view.InputDevice
import android.view.KeyEvent
import android.view.MotionEvent
import android.view.View
import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Text
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.input.pointer.positionChanged
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.kozmos.components.LiveSemantics
import com.kozmos.components.button.KozmosButton
import com.kozmos.components.live
import com.kozmos.components.menu.KozmosMenuContent
import com.kozmos.components.menu.KozmosMenuItem
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Rule
import org.junit.Test

/**
 * `KozmosContextMenuArea` (GAP-155): a long press or a secondary click opens
 * the menu at the press; the Menu key or Shift+F10 opens it at the area's
 * start; TalkBack offers it as the area's long-press action, "Show menu" or
 * the product's words. A tap opens nothing.
 *
 * Where it is open is read from the area's state: Paparazzi draws only the
 * root window, never a popup's.
 */
class KozmosContextMenuAreaTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    private val menu = KozmosMenuContent(items = listOf(KozmosMenuItem(text = "Copy"), KozmosMenuItem(text = "Share")))

    @Test fun talkBackOffersTheMenuAsTheLongPressAction() {
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme { KozmosContextMenuArea(menu = menu, onItemClick = {}) { Text("Gate A12", Modifier.kozmosContextMenuTarget()) } }
        }
        assertEquals("Show menu", tree.saying("Gate A12").longClickLabel)
        val german = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosContextMenuArea(menu = menu, onItemClick = {}, showMenuLabel = "Menü anzeigen") {
                    Text("Gate A12", Modifier.kozmosContextMenuTarget())
                }
            }
        }
        assertEquals("Menü anzeigen", german.saying("Gate A12").longClickLabel)
    }

    @Test fun talkBacksLongPressOpensTheMenuAtTheAreasStart() {
        for (direction in listOf(LayoutDirection.Ltr, LayoutDirection.Rtl)) {
            val state = KozmosContextMenuState()
            paparazzi.live(content = { Area(state, direction) }) {
                frames(2)
                assertNull("closed at first", state.openAt)
                read().saying("Gate A12").longClick!!.invoke()
                frames(2)
                val width = (200 * view.resources.displayMetrics.density).toInt()
                val start = if (direction == LayoutDirection.Ltr) 0 else width
                assertEquals("$direction: open at the start", IntOffset(start, 0), state.openAt)
            }
        }
    }

    @androidx.compose.runtime.Composable
    private fun TwoButtons(state: KozmosContextMenuState) = KozmosMaterialTheme {
        Box {
            KozmosContextMenuArea(menu, {}, Modifier, "Show menu", state) {
                Column {
                    KozmosButton(onClick = {}, modifier = Modifier.kozmosContextMenuTarget()) { Text("Gate A12") }
                    KozmosButton(onClick = {}, modifier = Modifier.kozmosContextMenuTarget()) { Text("Gate B7") }
                }
            }
        }
    }

    /**
     * Controls inside the area stay focus stops of their own, each a button
     * that offers the menu as its long-press action and opens it at itself.
     */
    @Test fun eachControlInsideIsItsOwnStopOfferingTheMenuAtItself() {
        val state = KozmosContextMenuState()
        paparazzi.live(content = { TwoButtons(state) }) {
            frames(2)
            val tree = read()
            val a = tree.saying("Gate A12")
            val b = tree.saying("Gate B7")
            assertNotNull("Gate A12 is a button of its own", a.click)
            assertNotNull("Gate B7 is a button of its own", b.click)
            assertEquals("Gate A12 offers the menu", "Show menu", a.longClickLabel)
            assertEquals("Gate B7 offers the menu", "Show menu", b.longClickLabel)
            b.longClick!!.invoke()
            frames(2)
            assertEquals("open at Gate B7", IntOffset(0, (b.bounds.top - a.bounds.top).toInt()), state.openAt)
        }
    }

    /** From a keyboard, the Menu key opens it at the focused control. */
    @Test fun theMenuKeyOpensTheMenuAtTheFocusedControl() {
        val state = KozmosContextMenuState()
        paparazzi.live(content = { TwoButtons(state) }) {
            frames(2)
            val tree = read()
            val a = tree.saying("Gate A12")
            val b = tree.saying("Gate B7")
            b.requestFocus!!.invoke()
            frames(2)
            val now = SystemClock.uptimeMillis()
            view.dispatchKeyEvent(KeyEvent(now, now, KeyEvent.ACTION_DOWN, KeyEvent.KEYCODE_MENU, 0))
            view.dispatchKeyEvent(KeyEvent(now, now, KeyEvent.ACTION_UP, KeyEvent.KEYCODE_MENU, 0))
            frames(2)
            assertEquals("open at Gate B7", IntOffset(0, (b.bounds.top - a.bounds.top).toInt()), state.openAt)
        }
    }

    @Test fun aLongPressOpensTheMenuWhereItWasPressed() {
        val state = KozmosContextMenuState()
        paparazzi.live(content = { Area(state) }) {
            frames(2)
            val at = Offset(60f, 30f)
            touch(MotionEvent.ACTION_DOWN, at)
            frames(30) // a second of frames, past the long-press timeout
            assertNotNull("open while still held", state.openAt)
            touch(MotionEvent.ACTION_UP, at)
            frames(2)
            assertEquals(IntOffset(60, 30), state.openAt)
        }
    }

    @Test fun aTapOpensNothing() {
        val state = KozmosContextMenuState()
        paparazzi.live(content = { Area(state) }) {
            frames(2)
            val at = Offset(60f, 30f)
            touch(MotionEvent.ACTION_DOWN, at)
            frames(1)
            touch(MotionEvent.ACTION_UP, at)
            frames(30)
            assertNull(state.openAt)
        }
    }

    /**
     * A press that moves past the touch slop is a scroll or a drag, not a
     * long press: held past the timeout, it opens nothing.
     */
    @Test fun aPressThatMovesPastTheSlopOpensNothing() {
        val state = KozmosContextMenuState()
        paparazzi.live(content = { Area(state) }) {
            frames(2)
            val slop = android.view.ViewConfiguration.get(view.context).scaledTouchSlop
            touch(MotionEvent.ACTION_DOWN, Offset(60f, 30f))
            frames(2)
            touch(MotionEvent.ACTION_MOVE, Offset(60f + slop * 3, 30f))
            frames(30) // a second of frames, past the long-press timeout
            assertNull("a moved press opens nothing", state.openAt)
            touch(MotionEvent.ACTION_UP, Offset(60f + slop * 3, 30f))
            frames(2)
            assertNull(state.openAt)
        }
    }

    /**
     * A press whose movement another handler takes, a scroller under the
     * finger, is that handler's: it opens nothing, though it moved less than
     * the slop.
     */
    @Test fun aPressAnotherHandlerTakesOpensNothing() {
        val state = KozmosContextMenuState()
        paparazzi.live(content = {
            KozmosMaterialTheme {
                Box {
                    KozmosContextMenuArea(menu, {}, Modifier.size(200.dp, 80.dp), "Show menu", state) {
                        // Takes every movement, as a scroller does.
                        Box(
                            Modifier.size(200.dp, 80.dp).pointerInput(Unit) {
                                awaitEachGesture {
                                    awaitFirstDown(requireUnconsumed = false)
                                    do {
                                        val event = awaitPointerEvent()
                                        event.changes.forEach { if (it.positionChanged()) it.consume() }
                                    } while (event.changes.any { it.pressed })
                                }
                            }
                        ) { Text("Gate A12") }
                    }
                }
            }
        }) {
            frames(2)
            touch(MotionEvent.ACTION_DOWN, Offset(60f, 30f))
            frames(2)
            touch(MotionEvent.ACTION_MOVE, Offset(62f, 30f))
            frames(30)
            assertNull("a press another handler took opens nothing", state.openAt)
            touch(MotionEvent.ACTION_UP, Offset(62f, 30f))
            frames(2)
        }
    }

    @Test fun aSecondaryClickOpensTheMenuWhereItWasClicked() {
        val state = KozmosContextMenuState()
        paparazzi.live(content = { Area(state) }) {
            frames(2)
            val at = Offset(80f, 20f)
            mouse(MotionEvent.ACTION_DOWN, at, MotionEvent.BUTTON_SECONDARY)
            frames(2)
            assertEquals("open on the press", IntOffset(80, 20), state.openAt)
            mouse(MotionEvent.ACTION_UP, at, 0)
            frames(2)
        }
    }

    @Test fun theMenuKeyOrShiftF10OpensTheMenuAtTheAreasStart() {
        for ((name, key, meta) in listOf(
            Triple("Menu", KeyEvent.KEYCODE_MENU, 0),
            Triple("Shift+F10", KeyEvent.KEYCODE_F10, KeyEvent.META_SHIFT_ON or KeyEvent.META_SHIFT_LEFT_ON)
        )) {
            val state = KozmosContextMenuState()
            paparazzi.live(content = {
                KozmosMaterialTheme {
                    KozmosContextMenuArea(menu, {}, Modifier, "Show menu", state) {
                        KozmosButton(onClick = {}) { Text("Gate A12") }
                    }
                }
            }) {
                frames(2)
                val button = read().merged.single { it.requestFocus != null }
                button.requestFocus!!.invoke()
                frames(2)
                val now = SystemClock.uptimeMillis()
                view.dispatchKeyEvent(KeyEvent(now, now, KeyEvent.ACTION_DOWN, key, 0, meta))
                view.dispatchKeyEvent(KeyEvent(now, now, KeyEvent.ACTION_UP, key, 0, meta))
                frames(2)
                assertEquals("$name opens at the start", IntOffset(0, 0), state.openAt)
            }
        }
    }

    @androidx.compose.runtime.Composable
    private fun Area(state: KozmosContextMenuState, direction: LayoutDirection = LayoutDirection.Ltr) {
        CompositionLocalProvider(LocalLayoutDirection provides direction) {
            KozmosMaterialTheme {
                // A Box lets the area be its own size: the window's root
                // would stretch it to its own.
                Box {
                    KozmosContextMenuArea(menu, {}, Modifier.size(200.dp, 80.dp), "Show menu", state) {
                        Box(Modifier.size(200.dp, 80.dp)) { Text("Gate A12", Modifier.kozmosContextMenuTarget()) }
                    }
                }
            }
        }
    }

    private fun LiveSemantics.software() {
        // As Taps.press: a ripple on layoutlib's hardware renderer takes it down.
        view.setLayerType(View.LAYER_TYPE_SOFTWARE, null)
        (view.parent as? View)?.setLayerType(View.LAYER_TYPE_SOFTWARE, null)
    }

    private var downAt = 0L

    /** A finger on the touchscreen, at [at] in the view's pixels. */
    private fun LiveSemantics.touch(action: Int, at: Offset) {
        software()
        val now = SystemClock.uptimeMillis()
        if (action == MotionEvent.ACTION_DOWN) downAt = now
        val event = MotionEvent.obtain(
            downAt, now, action, 1,
            arrayOf(MotionEvent.PointerProperties().apply { id = 0; toolType = MotionEvent.TOOL_TYPE_FINGER }),
            arrayOf(MotionEvent.PointerCoords().apply { x = at.x; y = at.y; pressure = 1f; size = 1f }),
            0, 0, 1f, 1f, 0, 0, InputDevice.SOURCE_TOUCHSCREEN, 0
        )
        view.dispatchTouchEvent(event)
        event.recycle()
    }

    /** A mouse with [buttons] held, at [at] in the view's pixels. */
    private fun LiveSemantics.mouse(action: Int, at: Offset, buttons: Int) {
        software()
        val now = SystemClock.uptimeMillis()
        if (action == MotionEvent.ACTION_DOWN) downAt = now
        val event = MotionEvent.obtain(
            downAt, now, action, 1,
            arrayOf(MotionEvent.PointerProperties().apply { id = 0; toolType = MotionEvent.TOOL_TYPE_MOUSE }),
            arrayOf(MotionEvent.PointerCoords().apply { x = at.x; y = at.y; pressure = 1f; size = 1f }),
            0, buttons, 1f, 1f, 0, 0, InputDevice.SOURCE_MOUSE, 0
        )
        view.dispatchTouchEvent(event)
        event.recycle()
    }
}
