package com.kozmos.components.wayfindingcard

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
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
import kotlin.math.sqrt
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * React's WayfindingCard is a Kozmos Card, `rounded-container`, and SwiftUI's
 * is clipped to `semanticsRadiusContainer`: 20. Compose's was a Material
 * Card given no shape, so it took Material's medium shape, 12.
 *
 * Read off what is drawn, at twice the density and found by the card's
 * fill: one dp in from the top or the bottom edge, a corner of radius r
 * starts r - sqrt(r² - (r - 1)²) in from the side, 13.8dp for 20 and 7.2dp
 * for 12.
 */
class KozmosWayfindingCardCornerTest {
    private val frames = KeptFrames()

    @get:Rule val paparazzi = pixelsPaparazzi(frames)

    private val host = 0xFFFF00FF.toInt()

    /** Where a corner of [radius] dp starts, one dp in from the edge it rounds into. */
    private fun startOfCurve(radius: Float) = radius - sqrt(radius * radius - (radius - 1) * (radius - 1))

    @Test fun theCardsCornersAreTheContainerRadiusInBothThemes() {
        val wrong = mutableListOf<String>()
        for (dark in listOf(false, true)) {
            var density = 1f
            var canvas = IntSize(1, 1)
            var fillColour = 0
            val drawn = paparazzi.drawn(frames) {
                val base = LocalDensity.current
                CompositionLocalProvider(
                    LocalKozmosUseDarkTokens provides dark,
                    LocalDensity provides Density(base.density * 2f, base.fontScale)
                ) {
                    density = LocalDensity.current.density
                    fillColour = KozmosThemeTokens.primitivesColorsBackground0.toArgb()
                    KozmosMaterialTheme {
                        Box(Modifier.fillMaxSize().background(Color(host)).onGloballyPositioned { canvas = it.size }) {
                            KozmosWayfindingCard(modifier = Modifier.padding(24.dp).width(280.dp), title = "Route") {
                                Spacer(Modifier.height(80.dp))
                            }
                        }
                    }
                }
            }
            // Image pixels to a dp: Paparazzi may scale its frame down.
            val perDp = density * drawn.width / canvas.width
            fun isFill(x: Int, y: Int) = DrawnPixels.matches(drawn.argb(x, y), fillColour, 12)
            val fill = (0 until drawn.height).flatMap { y -> (0 until drawn.width).filter { x -> isFill(x, y) }.map { x -> x to y } }
            val left = fill.minOf { it.first }
            val right = fill.maxOf { it.first }
            val top = fill.minOf { it.second }
            val bottom = fill.maxOf { it.second }
            val mode = if (dark) "dark" else "light"
            val oneDp = perDp.toInt().coerceAtLeast(1)
            val expected = startOfCurve(20f)
            for ((edge, y) in mapOf("top" to top + oneDp, "bottom" to bottom - oneDp)) {
                val row = (left..right).filter { x -> isFill(x, y) }
                val start = (row.first() - left) / perDp
                val end = (right - row.last()) / perDp
                println("WayfindingCard $mode, 1dp in from the $edge: the start corner's curve starts ${"%.1f".format(start)}dp in, the end's ${"%.1f".format(end)}dp; a 20dp corner's ${"%.1f".format(expected)}")
                if (abs(start - expected) > 1.5f) wrong += "$mode $edge start: the curve starts ${"%.1f".format(start)}dp in, a 20dp corner's ${"%.1f".format(expected)}"
                if (abs(end - expected) > 1.5f) wrong += "$mode $edge end: the curve starts ${"%.1f".format(end)}dp in, a 20dp corner's ${"%.1f".format(expected)}"
            }
        }
        assertTrue(wrong.joinToString("; "), wrong.isEmpty())
    }
}
