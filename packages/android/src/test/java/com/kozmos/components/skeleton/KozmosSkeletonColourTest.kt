package com.kozmos.components.skeleton

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import com.kozmos.components.DrawnPixels
import com.kozmos.components.KeptFrames
import com.kozmos.components.drawn
import com.kozmos.components.pixelsPaparazzi
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * The Skeleton's grey, read off what is drawn.
 *
 * One grey on every surface: Figma's `Colors/background/200`, which Olcay
 * chose on 2026-09-27. Android drew `background/100` and laid a diagonal of
 * `background/300` at 20–60 % over the whole placeholder, never off it, so at
 * rest it showed neither colour. Now the sheen is iOS's: a band of white that
 * crosses the placeholder and lies off it at rest.
 */
class KozmosSkeletonColourTest {
    private val frames = KeptFrames()

    @get:Rule
    val paparazzi = pixelsPaparazzi(frames)

    /**
     * The colour drawn at the middle of the frame, where [content] fills it.
     * Paparazzi scales its frames down, so a point is found from the frame's
     * own size, never from dp and density.
     */
    private fun middleOf(dark: Boolean, content: @Composable () -> Unit): Int {
        val drawn = paparazzi.drawn(frames) {
            CompositionLocalProvider(LocalKozmosUseDarkTokens provides dark) { content() }
        }
        return drawn.argb(drawn.width / 2, drawn.height / 2)
    }

    /** `background/200` as it resolves in a theme: drawn as a swatch and read back. */
    private fun grey(dark: Boolean): Int = middleOf(dark) {
        Box(Modifier.fillMaxSize().background(KozmosThemeTokens.primitivesColorsBackground200))
    }

    @Test
    fun atRestItIsFigmasGreyInBothThemes() {
        for (dark in listOf(false, true)) {
            val expected = grey(dark)
            val placeholders: List<Pair<String, @Composable () -> Unit>> = listOf(
                "unset" to { KozmosSkeleton(modifier = Modifier.fillMaxSize()) },
                "block" to { KozmosSkeleton(modifier = Modifier.fillMaxSize(), shape = KozmosSkeletonShape.Block) }
            )
            for ((name, placeholder) in placeholders) {
                val drawn = middleOf(dark, placeholder)
                assertTrue(
                    "${if (dark) "dark" else "light"} $name: drew ${DrawnPixels.hex(drawn)}, " +
                        "not background/200 ${DrawnPixels.hex(expected)}",
                    DrawnPixels.matches(drawn, expected)
                )
            }
        }
    }

    @Test
    fun theSheenCrossesAsALighterBandAndLiesOffItAtEitherEnd() {
        for (dark in listOf(false, true)) {
            val base = grey(dark)
            fun at(phase: Float) = middleOf(dark) {
                Box(
                    Modifier
                        .fillMaxSize()
                        .background(KozmosThemeTokens.primitivesColorsBackground200)
                        .sheen(phase)
                )
            }
            val theme = if (dark) "dark" else "light"
            assertTrue("$theme: the sheen lay on the grey at its start", DrawnPixels.matches(at(0f), base))
            assertTrue("$theme: the sheen lay on the grey at its end", DrawnPixels.matches(at(1f), base))
            val midway = at(0.5f)
            assertTrue(
                "$theme: midway the middle drew ${DrawnPixels.hex(midway)}, no lighter than ${DrawnPixels.hex(base)}",
                DrawnPixels.lightness(midway) > DrawnPixels.lightness(base) + 60
            )
        }
    }
}
