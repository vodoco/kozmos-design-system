package com.kozmos.components.navigation

import android.os.SystemClock
import android.view.InputDevice
import android.view.MotionEvent
import android.view.View
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Navigation
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.withFrameNanos
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.platform.ViewRootForTest
import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.kozmos.components.readSemantics
import com.kozmos.components.routesummary.KozmosRouteSummary
import com.kozmos.components.routesummary.KozmosRouteSummaryState
import com.kozmos.components.semanticsPaparazzi
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * The estimate layout's two words a product translates, as React takes them:
 * `endRouteLabel` names the End icon button and `startNavigationLabel` is
 * Start's label, both today's English when left out; and its End, an icon
 * button, keeps Android's 48dp touch target.
 */
class KozmosRouteSummaryEstimateTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    @Test fun customLabelsNameEndAndStart() {
        val translated = paparazzi.readSemantics {
            MaterialTheme {
                Column(Modifier.width(360.dp)) {
                    KozmosRouteSummary(etaText = "4 min", distanceText = "201 m", onEndRoute = {},
                        endRouteLabel = "Route beenden")
                    KozmosRouteSummary(etaText = "4 min", distanceText = "201 m", onEndRoute = {},
                        state = KozmosRouteSummaryState.Preview, onStartNavigation = {},
                        startNavigationLabel = "Navigation starten")
                }
            }
        }
        assertEquals(Role.Button, translated.named("Route beenden").role)
        val start = translated.merged.single { it.role == Role.Button && it.click != null && it.description == null }
        assertEquals(listOf("Navigation starten"), start.texts)
        assertFalse(translated.names().contains("End route"))

        // Left out, the words are today's.
        val english = paparazzi.readSemantics {
            MaterialTheme {
                Column(Modifier.width(360.dp)) {
                    KozmosRouteSummary(etaText = "4 min", distanceText = "201 m", onEndRoute = {})
                    KozmosRouteSummary(etaText = "4 min", distanceText = "201 m", onEndRoute = {},
                        state = KozmosRouteSummaryState.Preview, onStartNavigation = {})
                }
            }
        }
        assertEquals(Role.Button, english.named("End route").role)
        assertTrue(english.merged.any { it.role == Role.Button && it.texts == listOf("Start Navigation") })
    }

    /** A one-finger touchscreen event at [x], [y], as KozmosButtonTouchTest sends it. */
    private fun finger(down: Long, action: Int, x: Float, y: Float): MotionEvent = MotionEvent.obtain(
        down, SystemClock.uptimeMillis(), action, 1,
        arrayOf(MotionEvent.PointerProperties().apply { id = 0; toolType = MotionEvent.TOOL_TYPE_FINGER }),
        arrayOf(MotionEvent.PointerCoords().apply { this.x = x; this.y = y; pressure = 1f; size = 1f }),
        0, 0, 1f, 1f, 0, 0, InputDevice.SOURCE_TOUCHSCREEN, 0
    )

    private fun SemanticsNode.all(): List<SemanticsNode> = listOf(this) + children.flatMap { it.all() }

    /**
     * Real finger presses across End's target, from its centre: 1dp inside
     * each edge of a 48dp square, which must reach it, and 1dp outside,
     * which must not. Material's minimum interactive size gives the 48;
     * a size(40.dp) on the button took it away.
     */
    @Test fun theEstimateEndTakesAFingerAcross48dp() {
        var density = 1f
        val hits = mutableListOf<String>()
        var pressed = ""
        val view = ComposeView(paparazzi.context).apply {
            setContent {
                val host = LocalView.current
                density = LocalDensity.current.density
                MaterialTheme {
                    Box(Modifier.fillMaxSize().padding(60.dp)) {
                        KozmosRouteSummary(etaText = "4 min", distanceText = "201 m", onEndRoute = { hits.add(pressed) })
                    }
                }
                LaunchedEffect(Unit) {
                    repeat(3) { withFrameNanos { } }
                    val owner = (host as ViewRootForTest).semanticsOwner
                    val end = owner.rootSemanticsNode.all().single {
                        it.config.getOrNull(SemanticsProperties.ContentDescription)?.contains("End route") == true
                    }
                    val centre = end.boundsInRoot.center
                    val inside = 23f * density
                    val outside = 25f * density
                    for ((name, at) in listOf(
                        "centre" to Offset.Zero,
                        "inside start" to Offset(-inside, 0f), "inside end" to Offset(inside, 0f),
                        "inside top" to Offset(0f, -inside), "inside bottom" to Offset(0f, inside),
                        "outside start" to Offset(-outside, 0f), "outside end" to Offset(outside, 0f),
                        "outside top" to Offset(0f, -outside), "outside bottom" to Offset(0f, outside)
                    )) {
                        pressed = name
                        val x = centre.x + at.x
                        val y = centre.y + at.y
                        val down = SystemClock.uptimeMillis()
                        val press = finger(down, MotionEvent.ACTION_DOWN, x, y)
                        host.dispatchTouchEvent(press)
                        press.recycle()
                        withFrameNanos { }
                        val release = finger(down, MotionEvent.ACTION_UP, x, y)
                        host.dispatchTouchEvent(release)
                        release.recycle()
                        repeat(2) { withFrameNanos { } }
                    }
                }
            }
        }
        view.setLayerType(View.LAYER_TYPE_SOFTWARE, null)
        paparazzi.gif(view, "touch", start = 0L, end = 2000L, fps = 20)
        assertEquals("density $density", listOf("centre", "inside start", "inside end", "inside top", "inside bottom"), hits)
    }

    /**
     * Material's minimum interactive size reserves End's 48dp square in the
     * row, as it does every Kozmos Button's (D7): its centre sits 24dp in
     * from the card's 16dp of padding. A size(40.dp) on the button forced a
     * 40dp box, centred 20dp in, and left the rest of the target to
     * Compose's touch-only widening, which yields to anything nearer.
     */
    @Test fun theEstimateEndReservesA48dpTarget() {
        var density = 1f
        val tree = paparazzi.readSemantics {
            density = LocalDensity.current.density
            MaterialTheme {
                Box(Modifier.width(360.dp).semantics { contentDescription = "Summary" }) {
                    // Positional to the fourth parameter, and the transport mode
                    // as a trailing lambda: both as they were.
                    KozmosRouteSummary("4 min", "201 m", {}, Modifier) {
                        Icon(Icons.Default.Navigation, contentDescription = null,
                            modifier = Modifier.semantics { contentDescription = "Walking" })
                    }
                }
            }
        }
        val end = tree.named("End route").bounds
        val card = tree.named("Summary").bounds
        assertEquals("End's centre from the card's end", 16f + 24f, (card.right - end.center.x) / density, 0.5f)
        assertTrue("the trailing lambda is not the transport mode", tree.names().contains("Walking"))
    }
}
