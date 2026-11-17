package com.kozmos.components.listbox

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.boundsInRoot
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.dp
import com.kozmos.components.DrawnPixels
import com.kozmos.components.KeptFrames
import com.kozmos.components.drawn
import com.kozmos.components.pixelsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import kotlin.math.roundToInt
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * GAP-271 (MAP-32's Switch client): an embedded Listbox, inside a Dialog,
 * Popover or Card, draws no box of its own: no surface, no edge, no inset.
 * Its first row starts at its own top-start; the standalone list keeps its
 * surface and its 1dp edge.
 */
class KozmosListboxEmbeddedTest {
    private val frames = KeptFrames()

    @get:Rule val paparazzi = pixelsPaparazzi(frames)

    private val host = 0xFFFF00FF.toInt()
    private val options = listOf(KozmosListboxOption("acme", "Acme"), KozmosListboxOption("globex", "Globex"))

    private fun drawn(embedded: Boolean): Triple<DrawnPixels, Rect, Float> {
        var canvas = IntSize(1, 1)
        var list = Rect.Zero
        val pixels = paparazzi.drawn(frames) {
            KozmosMaterialTheme {
                Box(Modifier.fillMaxSize().background(Color(host)).onGloballyPositioned { canvas = it.size }) {
                    KozmosListbox(
                        options = options,
                        modifier = Modifier.padding(16.dp).width(240.dp).onGloballyPositioned { list = it.boundsInRoot() },
                        embedded = embedded
                    )
                }
            }
        }
        return Triple(pixels, list, pixels.width.toFloat() / canvas.width)
    }

    @Test fun anEmbeddedListDrawsNoBoxOfItsOwn() {
        val (pixels, list, scale) = drawn(embedded = true)
        // On its edge, half way down, and 2px inside it, between rows' ends.
        val y = ((list.top + list.bottom) / 2 * scale).roundToInt()
        for (x in listOf((list.left * scale).roundToInt(), ((list.right - 1) * scale).roundToInt())) {
            assertTrue("the embedded list drew ${DrawnPixels.hex(pixels.argb(x, y))} at its edge", DrawnPixels.matches(pixels.argb(x, y), host))
        }
    }

    @Test fun theStandaloneListKeepsItsSurfaceAndEdge() {
        val (pixels, list, scale) = drawn(embedded = false)
        val y = ((list.top + list.bottom) / 2 * scale).roundToInt()
        val x = (list.left * scale).roundToInt()
        assertFalse("the standalone list drew no edge", DrawnPixels.matches(pixels.argb(x, y), host))
    }
}
