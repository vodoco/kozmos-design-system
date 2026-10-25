package com.kozmos.components.surface

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.dp
import com.kozmos.components.DrawnPixels
import com.kozmos.components.KeptFrames
import com.kozmos.components.KozmosInertAlpha
import com.kozmos.components.drawn
import com.kozmos.components.pixelsPaparazzi
import com.kozmos.components.switch.KozmosSwitch
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * An unchecked switch's track is the muted colour, foreground/400, as React's
 * is (`border-muted-foreground bg-muted-foreground`, Switch.tsx); it was
 * foreground/500. Disabled, it is as it was: foreground/500, the whole switch
 * at half (owner, 24 Oct).
 *
 * Each switch is drawn alone on the page at twice the density, light and dark.
 * The track and its edge are one colour and the thumb is the page's, so the
 * commonest colour that is not the page's is the track's. It is held to a
 * swatch of the token drawn the same way, within 3 a channel.
 */
class KozmosSwitchTrackTest {
    private val frames = KeptFrames()

    @get:Rule
    val paparazzi = pixelsPaparazzi(frames)

    /** The commonest opaque colour in the drawing that is not the page's. */
    private fun commonest(dark: Boolean, content: @Composable () -> Unit): Int? {
        val drawn = paparazzi.drawn(frames) {
            val density = LocalDensity.current
            CompositionLocalProvider(
                LocalKozmosUseDarkTokens provides dark,
                LocalDensity provides Density(density.density * 2f, density.fontScale)
            ) {
                KozmosMaterialTheme {
                    Box(Modifier.fillMaxSize().background(KozmosThemeTokens.primitivesColorsBackground0).padding(16.dp)) {
                        content()
                    }
                }
            }
        }
        val page = drawn.argb(0, 0)
        val counts = HashMap<Int, Int>()
        for (y in 0 until drawn.height) for (x in 0 until drawn.width) {
            val argb = drawn.argb(x, y)
            if (argb ushr 24 <= 240 || DrawnPixels.matches(argb, page, tolerance = 6)) continue
            counts[argb] = (counts[argb] ?: 0) + 1
        }
        return counts.maxByOrNull { it.value }?.key
    }

    /** A swatch of [colour] at [alpha], as the switch's track would draw it. */
    private fun swatch(dark: Boolean, alpha: Float, colour: @Composable () -> Color): Int? = commonest(dark) {
        Box(Modifier.size(44.dp, 24.dp).alpha(alpha).background(colour()))
    }

    private class Case(val name: String, val content: @Composable () -> Unit, val want: Int?)

    @Test
    fun anUncheckedSwitchsTrackIsTheMutedColourAndADisabledOneIsAsItWas() {
        val wrong = mutableListOf<String>()
        for (dark in listOf(false, true)) {
            val theme = if (dark) "dark" else "light"
            val cases = listOf(
                Case("enabled, foreground/400", { KozmosSwitch(checked = false, onCheckedChange = {}) },
                    swatch(dark, 1f) { KozmosThemeTokens.primitivesColorsForeground400 }),
                Case("disabled, foreground/500 at half", { KozmosSwitch(checked = false, onCheckedChange = {}, enabled = false) },
                    swatch(dark, KozmosInertAlpha) { KozmosThemeTokens.primitivesColorsForeground500 })
            )
            for (case in cases) {
                val (name, want) = case.name to case.want
                val track = commonest(dark, case.content)
                println("Switch track Android, unchecked $name, $theme: ${track?.let(DrawnPixels::hex)}, want ${want?.let(DrawnPixels::hex)}")
                if (track == null || want == null || !DrawnPixels.matches(track, want, tolerance = 3)) {
                    wrong += "unchecked $name, $theme: the track is ${track?.let(DrawnPixels::hex)}, not ${want?.let(DrawnPixels::hex)}"
                }
            }
        }
        assertTrue(wrong.joinToString("; "), wrong.isEmpty())
    }
}
