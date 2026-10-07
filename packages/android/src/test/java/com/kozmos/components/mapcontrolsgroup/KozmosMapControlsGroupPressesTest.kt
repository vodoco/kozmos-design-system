package com.kozmos.components.mapcontrolsgroup

import android.os.SystemClock
import android.view.MotionEvent
import android.view.View
import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.withFrameNanos
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.platform.ViewRootForTest
import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.unit.dp
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * Decision 46 in Compose: the map takes every press outside the controls,
 * the 8dp between a group's controls included, and each control takes its
 * own. The web's group took the presses in its gaps (the night audit's M3);
 * this reads Compose's, with real touches: a map under the group, as a
 * renderer's view is, that takes what the controls do not, and a finger put
 * down on each control and in each gap, one a frame.
 */
class KozmosMapControlsGroupPressesTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    private val names = listOf("Zoom in", "Zoom out", "Reset bearing", "Locate me")

    /** Where the map was pressed, in the root's pixels. */
    private val mapPresses = mutableListOf<Offset>()

    /** The controls whose action ran, in order. */
    private val pressed = mutableListOf<String>()

    private fun SemanticsNode.all(): List<SemanticsNode> = listOf(this) + children.flatMap { it.all() }

    /**
     * Lays the group out over the map, reads where its controls are, and taps
     * at the points [at] picks from them, one tap a frame. Drawn in software:
     * on layoutlib's hardware renderer a control's ripple takes the renderer
     * down ("The Android framework has encountered a fatal error").
     */
    private fun tap(at: (Map<String, Rect>) -> List<Offset>): Map<String, Rect> {
        var controls: Map<String, Rect> = emptyMap()
        val view = ComposeView(paparazzi.context).apply {
            setContent {
                val host = LocalView.current
                KozmosMaterialTheme {
                    Box(Modifier.fillMaxSize()) {
                        Box(
                            Modifier
                                .fillMaxSize()
                                .pointerInput(Unit) {
                                    awaitEachGesture {
                                        mapPresses += awaitFirstDown(requireUnconsumed = false).position
                                    }
                                }
                        )
                        KozmosMapControlsGroup(
                            modifier = Modifier.padding(60.dp),
                            onZoomIn = { pressed += "Zoom in" },
                            onZoomOut = { pressed += "Zoom out" },
                            onCompassReset = { pressed += "Reset bearing" },
                            onMyLocation = { pressed += "Locate me" }
                        )
                    }
                }
                LaunchedEffect(Unit) {
                    repeat(3) { withFrameNanos { } }
                    val owner = (host as ViewRootForTest).semanticsOwner
                    controls = owner.rootSemanticsNode.all()
                        .mapNotNull { node ->
                            node.config.getOrNull(SemanticsProperties.ContentDescription)?.joinToString()
                                ?.takeIf { it in names }?.let { it to node.boundsInRoot }
                        }
                        .toMap()
                    for (point in at(controls)) {
                        val down = SystemClock.uptimeMillis()
                        host.dispatchTouchEvent(MotionEvent.obtain(down, down, MotionEvent.ACTION_DOWN, point.x, point.y, 0))
                        withFrameNanos { }
                        host.dispatchTouchEvent(MotionEvent.obtain(down, SystemClock.uptimeMillis(), MotionEvent.ACTION_UP, point.x, point.y, 0))
                        repeat(2) { withFrameNanos { } }
                    }
                }
            }
        }
        view.setLayerType(View.LAYER_TYPE_SOFTWARE, null)
        paparazzi.gif(view, "presses", start = 0L, end = 3000L, fps = 20)
        return controls
    }

    /** Three points across each gap between two controls, one above the other. */
    private fun gaps(controls: Map<String, Rect>): List<Offset> {
        val column = names.mapNotNull { controls[it] }.sortedBy { it.top }
        return column.zipWithNext().filter { (above, below) -> below.top - above.bottom >= 4f }.flatMap { (above, below) ->
            val y = (above.bottom + below.top) / 2
            listOf(above.left + 6f, above.center.x, above.right - 6f).map { Offset(it, y) }
        }
    }

    @Test
    fun aPressInTheGapsBetweenTheControlsReachesTheMap() {
        val controls = tap(::gaps)
        assertEquals("the group's controls: $controls", names.toSet(), controls.keys)
        val expected = gaps(controls)
        assertEquals("the group of four has two gaps, three points each: $controls", 6, expected.size)
        assertEquals("a press in a gap ran a control's action", emptyList<String>(), pressed)
        assertEquals("the map took ${mapPresses.size} of the 6 presses in the gaps: $mapPresses", 6, mapPresses.size)
        for ((point, press) in expected.zip(mapPresses)) {
            assertTrue("the map was pressed at $press, not the gap's $point", (point - press).getDistance() < 1f)
        }
    }

    /** A tap on each control is the control's: its action runs, and the map beneath it hears nothing. */
    @Test
    fun eachControlStillTakesItsOwnPress() {
        val controls = tap { controls -> names.mapNotNull { controls[it]?.center } }
        assertEquals("the group's controls: $controls", names.toSet(), controls.keys)
        assertEquals("the controls' presses", names, pressed)
        assertEquals("a press on a control reached the map beneath it: $mapPresses", emptyList<Offset>(), mapPresses)
    }
}
