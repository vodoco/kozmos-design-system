package com.kozmos.components.table

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.layout.boundsInRoot
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.dp
import com.kozmos.components.DrawnPixels
import com.kozmos.components.KeptFrames
import com.kozmos.components.drawn
import com.kozmos.components.pixelsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import kotlin.math.abs
import kotlin.math.roundToInt
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * React's table draws one line under its header row (`thead [&_tr]:border-b`)
 * and one under each body row. Compose's header row, a KozmosTableRow as the
 * docs and Code Connect write it, drew its own divider, and KozmosTable drew
 * another under the header: two lines, one on the other, twice as thick as
 * the rest.
 */
class KozmosTableDividerTest {
    private val frames = KeptFrames()

    @get:Rule val paparazzi = pixelsPaparazzi(frames)

    private val host = 0xFFFF00FF.toInt()

    /**
     * The lines drawn down the table's inside, top to bottom, each as its
     * thickness in dp. A pixel's share of a line is how far it is from the
     * host's colour towards the line's, so a line's thickness is the sum of
     * its pixels' shares: a line that straddles two pixels, or that a
     * renderer anti-aliases differently (Linux CI's), measures the same.
     */
    private fun dividers(header: @Composable () -> Unit, dark: Boolean): List<Float> {
        var density = 1f
        var canvas = IntSize(1, 1)
        var table = Rect.Zero
        var line = 0
        val drawn = paparazzi.drawn(frames) {
            val base = LocalDensity.current
            CompositionLocalProvider(
                LocalKozmosUseDarkTokens provides dark,
                LocalDensity provides Density(base.density * 2f, base.fontScale)
            ) {
                density = LocalDensity.current.density
                line = KozmosThemeTokens.semanticsBorderSubtle.toArgb()
                KozmosMaterialTheme {
                    Box(Modifier.fillMaxSize().background(Color(host)).onGloballyPositioned { canvas = it.size }) {
                        KozmosTable(
                            modifier = Modifier.padding(16.dp).width(200.dp).onGloballyPositioned { table = it.boundsInRoot() },
                            header = header
                        ) {
                            KozmosTableRow {
                                KozmosTableCell(text = "1")
                                KozmosTableCell(text = "G")
                            }
                            KozmosTableRow {
                                KozmosTableCell(text = "2")
                                KozmosTableCell(text = "E")
                            }
                        }
                    }
                }
            }
        }
        val scale = drawn.width.toFloat() / canvas.width
        // Down a column 20dp from the end, clear of the words and of the
        // border's 16dp curves: from 3dp under the top to 3dp over the
        // bottom, where the last row's divider lies under the border.
        val x = ((table.right - 20 * density) * scale).roundToInt()
        val ys = ((table.top + 3 * density) * scale).roundToInt()..((table.bottom - 3 * density) * scale).roundToInt()
        fun channels(argb: Int) = listOf(argb shr 16 and 0xFF, argb shr 8 and 0xFF, argb and 0xFF)
        val towards = channels(line).zip(channels(host)) { l, h -> l - h }
        val reach = towards.sumOf { it * it }.toFloat()
        fun share(argb: Int): Float {
            val drawnTowards = channels(argb).zip(channels(host)) { d, h -> d - h }
            return (drawnTowards.zip(towards) { d, t -> d * t }.sum() / reach).coerceIn(0f, 1f)
        }
        val lines = mutableListOf<Float>()
        var thickness = 0f
        for (y in ys) {
            val part = share(drawn.argb(x, y))
            if (part > 0.05f) thickness += part else if (thickness > 0f) { lines += thickness; thickness = 0f }
        }
        if (thickness > 0f) lines += thickness
        val perDp = density * scale
        return lines.map { it / perDp }
    }

    /** "1.0dp, 2.0dp": the lines as a failure prints them. */
    private fun List<Float>.said() = joinToString { "%.1fdp".format(it) }

    @Test fun aHeaderRowHasOneLineUnderItAsThickAsABodyRowsInBothThemes() {
        for (dark in listOf(false, true)) {
            val runs = dividers(dark = dark, header = {
                KozmosTableRow {
                    KozmosTableHeaderCell(text = "Name")
                    KozmosTableHeaderCell(text = "Floor")
                }
            })
            val mode = if (dark) "dark" else "light"
            // Two lines inside, under the header and under the first body
            // row, each the 1dp of a divider.
            assertEquals("$mode: the lines inside the table, the header's first: ${runs.said()}", 2, runs.size)
            assertTrue("$mode: the lines' thickness, the header's first: ${runs.said()}", runs.all { abs(it - 1f) < 0.3f })
        }
    }

    @Test fun aHeaderOfCellsInAPlainRowStillHasItsLine() {
        for (dark in listOf(false, true)) {
            val runs = dividers(dark = dark, header = {
                Row(Modifier.fillMaxWidth().padding(16.dp)) {
                    KozmosTableHeaderCell(text = "Name")
                    KozmosTableHeaderCell(text = "Floor")
                }
            })
            val mode = if (dark) "dark" else "light"
            assertEquals("$mode: the lines inside the table, the header's first: ${runs.said()}", 2, runs.size)
            assertTrue("$mode: the lines' thickness, the header's first: ${runs.said()}", runs.all { abs(it - 1f) < 0.3f })
        }
    }
}
