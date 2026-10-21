package com.kozmos.components.tooltip

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.boundsInRoot
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.kozmos.components.DrawnPixels
import com.kozmos.components.KeptFrames
import com.kozmos.components.pixelsPaparazzi
import com.kozmos.components.readSemantics
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import kotlin.math.roundToInt
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * A side tooltip's tip points at its trigger, as React's Radix arrow does.
 * KozmosTooltip places a Right tooltip to the trigger's physical right and a
 * Left one to its physical left, in either reading direction, as React's
 * Radix sides and Figma's are; Leading and Trailing (the owner's decision, 21
 * Oct) are the side reading starts and ends on. So a Right tooltip's tip is at
 * the bubble's physical left, pointing left, and a Left one's at its physical
 * right, pointing right; a Leading one's is a Left one's left to right and a
 * Right one's right to left.
 * Right to left, Compose's bubble put the tip at its start, now the right,
 * while the tip's path stayed physical: it stood on the far side, pointing
 * into the bubble. iOS had the same defect (#356).
 *
 * Read off the bubble as the popup draws it (Paparazzi draws only the root
 * window, never a Popup's), at twice the density, on a magenta page.
 */
class KozmosTooltipTipTest {
    private val frames = KeptFrames()

    @get:Rule val paparazzi = pixelsPaparazzi(frames)

    private val page = 0xFFFF00FF.toInt()

    @Test fun eachSidesTipPointsAtItsTriggerInBothDirections() {
        // Every side, the four physical ones and Leading and Trailing.
        assertTrue(KozmosTooltipSide.values().map { it.name }.containsAll(listOf("Leading", "Trailing")))
        val wrong = mutableListOf<String>()
        for (direction in listOf(LayoutDirection.Ltr, LayoutDirection.Rtl)) {
            for (side in KozmosTooltipSide.values()) {
                var canvas = IntSize(1, 1)
                var density = 1f
                var row = Rect.Zero
                paparazzi.readSemantics {
                    val base = LocalDensity.current
                    CompositionLocalProvider(
                        LocalLayoutDirection provides direction,
                        LocalDensity provides Density(base.density * 2f, base.fontScale)
                    ) {
                        density = LocalDensity.current.density
                        KozmosMaterialTheme {
                            Box(Modifier.fillMaxSize().background(Color(page)).onGloballyPositioned { canvas = it.size }) {
                                Box(Modifier.padding(24.dp)) {
                                    TooltipBubble(
                                        text = "Aufzug",
                                        side = side,
                                        modifier = Modifier.onGloballyPositioned { row = it.boundsInRoot() }
                                    )
                                }
                            }
                        }
                    }
                }
                val drawn = DrawnPixels(checkNotNull(frames.last))
                val scale = drawn.width.toFloat() / canvas.width
                fun at(x: Float, y: Float) = drawn.argb((x * scale).roundToInt(), (y * scale).roundToInt())
                // The surface's shadow falls on the tip and the page beside
                // it, so a colour is read by kind, not matched exactly: the
                // page is magenta, shaded or not; the tip a light neutral, not
                // the bubble's #C7CAD1 border.
                fun channels(c: Int) = listOf(c shr 16 and 0xFF, c shr 8 and 0xFF, c and 0xFF)
                fun isPage(c: Int) = channels(c).let { (r, g, b) -> r > 0x90 && b > 0x90 && g < 0x50 }
                fun isTip(c: Int) = channels(c).let { it.min() > 0xD0 && it.max() - it.min() < 0x18 }
                val dp = density
                // The bubble's end toward its trigger, and the way into the
                // bubble from there: a Right tooltip's trigger is to its left,
                // a Top one's below it.
                // Leading and Trailing are the physical side reading starts
                // and ends on: Left and Right left to right, mirrored right to left.
                val physical = when (side) {
                    KozmosTooltipSide.Leading -> if (direction == LayoutDirection.Rtl) KozmosTooltipSide.Right else KozmosTooltipSide.Left
                    KozmosTooltipSide.Trailing -> if (direction == LayoutDirection.Rtl) KozmosTooltipSide.Left else KozmosTooltipSide.Right
                    else -> side
                }
                val vertical = physical == KozmosTooltipSide.Top || physical == KozmosTooltipSide.Bottom
                val end = when (physical) {
                    KozmosTooltipSide.Right -> row.left
                    KozmosTooltipSide.Left -> row.right
                    KozmosTooltipSide.Top -> row.bottom
                    else -> row.top
                }
                val inward = if (physical == KozmosTooltipSide.Right || physical == KozmosTooltipSide.Bottom) 1 else -1
                // A point [depth] dp in from the end, [across] dp off the tip's middle line.
                fun sample(depth: Float, across: Float): Int {
                    val along = end + inward * depth * dp
                    return if (vertical) at(row.center.x + across * dp, along) else at(along, row.center.y + across * dp)
                }
                val case = "$direction $side" + if (physical != side) " ($physical)" else ""
                // A tip 4dp long and 8 across, its point at the end: half a dp
                // in, 3 off the middle, is the page beside the point; 1dp in,
                // on the middle, the point; 3.5dp in, 3 off, its broad base.
                val besidePoint = sample(0.5f, -3f)
                if (!isPage(besidePoint)) wrong += "$case: no point at the trigger's end: beside it is ${DrawnPixels.hex(besidePoint)}, not the page"
                val point = sample(1f, 0f)
                if (!isTip(point)) wrong += "$case: no tip at the trigger's end: ${DrawnPixels.hex(point)}"
                val base = sample(3.5f, -3f)
                if (!isTip(base)) wrong += "$case: the tip does not widen toward the bubble: ${DrawnPixels.hex(base)}"
            }
        }
        assertTrue(wrong.joinToString("; "), wrong.isEmpty())
    }
}
