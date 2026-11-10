package com.kozmos.components.alert

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.boundsInRoot
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.dp
import com.kozmos.components.KeptFrames
import com.kozmos.components.drawer.KozmosDrawerSide
import com.kozmos.components.drawer.drawerShape
import com.kozmos.components.drawn
import com.kozmos.components.pixelsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import kotlin.math.sqrt

/**
 * Decision 156: containers are 20 everywhere. Alert and Drawer took the
 * control's 16; they take the container's 20, as React's rounded-container
 * draws them, and as Card already did.
 *
 * The alert is read off what it draws, on a magenta page: how far in its
 * outline is 2 below its top, against its straight side, is
 * r − √(r² − (r − 2)²), 11.28 for 20 and 8.25 for 16. A drawer at its edge
 * rounds the two corners that face the page, and the two at the edge stay
 * square: read off the shape its surface, its shadow and its clip are drawn
 * with, at a density of 1, so a corner is in dp.
 */
class KozmosContainerCornerTest {
    private val frames = KeptFrames()

    @get:Rule val paparazzi = pixelsPaparazzi(frames)

    private fun inset(r: Float, y: Float = 2f) = r - sqrt(r * r - (r - y) * (r - y))

    @Test
    fun anAlertsCornerIsTheContainers() {
        val page = Color(0xFFFF00FF)
        var alert = Rect.Zero
        var rootWidth = 0f
        var density = 1f
        val drawn = paparazzi.drawn(frames) {
            density = LocalDensity.current.density
            CompositionLocalProvider(LocalKozmosUseDarkTokens provides false) {
                KozmosMaterialTheme {
                    Box(Modifier.fillMaxSize().background(page).onGloballyPositioned { rootWidth = it.size.width.toFloat() }) {
                        KozmosAlert(
                            status = AlertStatus.Info,
                            modifier = Modifier.padding(20.dp).width(320.dp).onGloballyPositioned { alert = it.boundsInRoot() }
                        ) { Box(Modifier.height(60.dp)) }
                    }
                }
            }
        }
        val scale = drawn.width / rootWidth
        /** Where the alert starts along a row [dp] below its top, in dp from its left. */
        fun start(dp: Float): Float {
            val y = ((alert.top + dp * density) * scale).toInt()
            var x = (alert.left * scale).toInt() - 2
            while (x < drawn.width) {
                val argb = drawn.argb(x, y)
                val magenta = (argb shr 16 and 0xFF) > 230 && (argb shr 8 and 0xFF) < 40 && (argb and 0xFF) > 230
                if (!magenta) break
                x++
            }
            return (x / scale - alert.left) / density
        }
        val measured = start(2f) - start(40f)
        assertEquals("a 16 corner is ${inset(16f)} in", inset(20f), measured, 1.2f)
    }

    private fun RoundedCornerShape.corners(): List<Float> {
        val size = Size(400f, 400f)
        val density = Density(1f)
        return listOf(
            topStart.toPx(size, density),
            topEnd.toPx(size, density),
            bottomEnd.toPx(size, density),
            bottomStart.toPx(size, density)
        )
    }

    @Test
    fun aDrawersCornersThatFaceThePageAreTheContainers() {
        // topStart, topEnd, bottomEnd, bottomStart.
        assertEquals("left", listOf(0f, 20f, 20f, 0f), drawerShape(KozmosDrawerSide.Left).corners())
        assertEquals("right", listOf(20f, 0f, 0f, 20f), drawerShape(KozmosDrawerSide.Right).corners())
        assertEquals("top", listOf(0f, 0f, 20f, 20f), drawerShape(KozmosDrawerSide.Top).corners())
        assertEquals("bottom", listOf(20f, 20f, 0f, 0f), drawerShape(KozmosDrawerSide.Bottom).corners())
    }
}
