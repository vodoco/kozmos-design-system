package com.kozmos.components.splitbutton

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
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
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import kotlin.math.abs
import kotlin.math.sqrt
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * React's SplitButton is two Buttons in a `rounded-control` group, each
 * `rounded-control` with its inner corners squared, and SwiftUI clips its
 * halves to `semanticsRadiusControl`: 16 at the four outer corners. Compose
 * rounded them with `semanticsRadiusPanel`, 24, which a 40dp-high button
 * draws as a half circle, 20.
 *
 * Read off what is drawn, at twice the density and found by colour, as
 * KozmosThemeFillPixelsTest reads the fills: one dp in from the top or the
 * bottom edge, a corner of radius r starts r - sqrt(r² - (r - 1)²) in from
 * the side, 10.4dp for 16 and 13.8dp for 20.
 */
class KozmosSplitButtonCornerTest {
    private val frames = KeptFrames()

    @get:Rule val paparazzi = pixelsPaparazzi(frames)

    private val host = 0xFFFF00FF.toInt()
    private val themeFill = 0xFF135BEC.toInt()

    /** Where a corner of [radius] dp starts, one dp in from the edge it rounds into. */
    private fun startOfCurve(radius: Float) = radius - sqrt(radius * radius - (radius - 1) * (radius - 1))

    @Test fun theOuterCornersAreTheControlRadiusInBothThemes() {
        val wrong = mutableListOf<String>()
        for (dark in listOf(false, true)) {
            var density = 1f
            var canvas = IntSize(1, 1)
            val drawn = paparazzi.drawn(frames) {
                val base = LocalDensity.current
                CompositionLocalProvider(
                    LocalKozmosUseDarkTokens provides dark,
                    LocalDensity provides Density(base.density * 2f, base.fontScale)
                ) {
                    density = LocalDensity.current.density
                    KozmosMaterialTheme {
                        Box(Modifier.fillMaxSize().background(Color(host)).onGloballyPositioned { canvas = it.size }) {
                            KozmosSplitButton(
                                label = "Share",
                                onMainClick = {},
                                menuItems = emptyList(),
                                modifier = Modifier.padding(16.dp)
                            )
                        }
                    }
                }
            }
            // Image pixels to a dp: Paparazzi may scale its frame down.
            val perDp = density * drawn.width / canvas.width
            val fill = (0 until drawn.height).flatMap { y ->
                (0 until drawn.width).filter { x -> DrawnPixels.matches(drawn.argb(x, y), themeFill, 12) }.map { x -> x to y }
            }
            val left = fill.minOf { it.first }
            val right = fill.maxOf { it.first }
            val top = fill.minOf { it.second }
            val bottom = fill.maxOf { it.second }
            val mode = if (dark) "dark" else "light"
            val oneDp = perDp.toInt().coerceAtLeast(1)
            val rows = mapOf("top" to top + oneDp, "bottom" to bottom - oneDp)
            for ((edge, y) in rows) {
                val row = (left..right).filter { x -> DrawnPixels.matches(drawn.argb(x, y), themeFill, 12) }
                val start = (row.first() - left) / perDp
                val end = (right - row.last()) / perDp
                val expected = startOfCurve(16f)
                println("SplitButton $mode, 1dp in from the $edge: the start corner's curve starts ${"%.1f".format(start)}dp in, the end's ${"%.1f".format(end)}dp; a 16dp corner's ${"%.1f".format(expected)}")
                if (abs(start - expected) > 1f) wrong += "$mode $edge start: the curve starts ${"%.1f".format(start)}dp in, a 16dp corner's ${"%.1f".format(expected)}"
                if (abs(end - expected) > 1f) wrong += "$mode $edge end: the curve starts ${"%.1f".format(end)}dp in, a 16dp corner's ${"%.1f".format(expected)}"
            }
        }
        assertTrue(wrong.joinToString("; "), wrong.isEmpty())
    }
}
