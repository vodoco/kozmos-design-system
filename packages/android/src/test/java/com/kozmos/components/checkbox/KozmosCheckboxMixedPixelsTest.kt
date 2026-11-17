package com.kozmos.components.checkbox

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.state.ToggleableState
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.dp
import com.kozmos.components.DrawnPixels
import com.kozmos.components.KeptFrames
import com.kozmos.components.drawn
import com.kozmos.components.pixelsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * Decision 188's look, read off what is drawn: a mixed checkbox is the theme
 * fill with the one mixed dash Switch and ToggleButton draw, React's `Minus`
 * at 16 (`KozmosMixedDash`), not Material's longer, thicker one. The dash is
 * 28/3 long with 2/3 round caps at each end, about 10.7 of the box's 20, and
 * 4/3 thick. The box sits on a mid grey that is none of its colours, drawn at
 * twice the density and found by colour, never by dp (Paparazzi scales its
 * frames).
 */
class KozmosCheckboxMixedPixelsTest {
    private val frames = KeptFrames()

    @get:Rule val paparazzi = pixelsPaparazzi(frames)

    private val host = 0xFF808080.toInt()
    private val theme500 = 0xFF135BEC.toInt()
    private val white = 0xFFFFFFFF.toInt()

    private fun draw(dark: Boolean): DrawnPixels = paparazzi.drawn(frames) {
        val density = LocalDensity.current
        CompositionLocalProvider(
            LocalKozmosUseDarkTokens provides dark,
            LocalDensity provides Density(density.density * 2f, density.fontScale)
        ) {
            KozmosMaterialTheme {
                Box(Modifier.fillMaxSize().background(Color(host)).padding(8.dp)) {
                    KozmosCheckbox(state = ToggleableState.Indeterminate, onCheckedChange = {})
                }
            }
        }
    }

    private fun DrawnPixels.bounds(colour: Int, xs: IntRange, ys: IntRange): Pair<IntRange, IntRange>? {
        var left = Int.MAX_VALUE; var top = Int.MAX_VALUE; var right = -1; var bottom = -1
        for (y in ys) for (x in xs) if (DrawnPixels.matches(argb(x, y), colour)) {
            left = minOf(left, x); right = maxOf(right, x); top = minOf(top, y); bottom = maxOf(bottom, y)
        }
        return if (right < 0) null else (left..right) to (top..bottom)
    }

    private val IntRange.size: Int get() = last - first + 1

    @Test fun aMixedCheckboxIsTheThemeFillWithTheSharedMixedDash() {
        for (dark in listOf(false, true)) {
            val mode = if (dark) "dark" else "light"
            val drawn = draw(dark)
            val (boxX, boxY) = checkNotNull(drawn.bounds(theme500, 0 until drawn.width, 0 until drawn.height)) {
                "$mode: no theme fill drawn"
            }
            val (dashX, dashY) = checkNotNull(drawn.bounds(white, boxX, boxY)) { "$mode: no white in the box" }
            // About 10.7 of the box's 20 across, caps and all; Material's
            // dash runs about 12 of it.
            assertTrue(
                "$mode: the dash is the shared one's length, ${dashX.size} wide in ${boxX.size}",
                dashX.size * 20 in (9 * boxX.size)..(23 * boxX.size / 2)
            )
            // 4/3 thick; Material's is 2.
            assertTrue(
                "$mode: the dash is the shared one's weight, ${dashY.size} tall in ${boxY.size}",
                dashY.size * 20 <= 7 * boxY.size / 4
            )
            val boxMiddle = (boxX.first + boxX.last) / 2.0
            val dashMiddle = (dashX.first + dashX.last) / 2.0
            assertTrue("$mode: the dash is centred ($dashMiddle in $boxMiddle)", kotlin.math.abs(boxMiddle - dashMiddle) <= 1.5)
            val boxMiddleY = (boxY.first + boxY.last) / 2.0
            val dashMiddleY = (dashY.first + dashY.last) / 2.0
            assertTrue("$mode: the dash is on the middle line", kotlin.math.abs(boxMiddleY - dashMiddleY) <= 1.5)
        }
    }
}
