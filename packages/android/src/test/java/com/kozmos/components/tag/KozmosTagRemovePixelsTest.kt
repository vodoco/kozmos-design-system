package com.kozmos.components.tag

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.dp
import com.kozmos.components.DrawnPixels
import com.kozmos.components.KeptFrames
import com.kozmos.components.KozmosEmotion
import com.kozmos.components.drawn
import com.kozmos.components.pixelsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * A Tag's remove mark is drawn in the Tag's own ink, the emotion's when it has
 * one, as its words are and as SwiftUI and React draw it. Compose tinted it
 * with the variant's ink whatever the emotion: on a destructive Tag with a
 * success emotion, a white mark on the light green.
 */
class KozmosTagRemovePixelsTest {
    private val frames = KeptFrames()

    @get:Rule
    val paparazzi = pixelsPaparazzi(frames)

    @Test
    fun theRemoveMarkIsTheEmotionsInk() {
        val wrong = mutableListOf<String>()
        for (dark in listOf(false, true)) {
            var ink = 0
            var variantInk = 0
            // A Tag with no words, at twice the density on a mid grey: the
            // only marks on its surface are the remove button's.
            val drawn = paparazzi.drawn(frames) {
                val density = LocalDensity.current
                CompositionLocalProvider(
                    LocalKozmosUseDarkTokens provides dark,
                    LocalDensity provides Density(density.density * 2f, density.fontScale)
                ) {
                    KozmosMaterialTheme {
                        ink = KozmosEmotion.Success.onSurface.toArgb()
                        variantInk = KozmosThemeTokens.primitivesColorsBackground0.toArgb()
                        Box(Modifier.fillMaxSize().background(Color(0xFF808080)).padding(8.dp)) {
                            KozmosTag(
                                text = " ",
                                variant = KozmosTagVariant.Destructive,
                                emotion = KozmosEmotion.Success,
                                onRemove = {}
                            )
                        }
                    }
                }
            }
            val mode = if (dark) "dark" else "light"
            val inked = drawn.count(ink)
            val variantInked = drawn.count(variantInk)
            println("Tag remove mark, $mode: $inked pixels in the emotion's ink, $variantInked in the variant's")
            if (inked < 20 || variantInked * 10 > inked) {
                wrong += "$mode: the mark is not the emotion's ink ${DrawnPixels.hex(ink)}" +
                    " ($inked pixels; $variantInked in the variant's ${DrawnPixels.hex(variantInk)})"
            }
        }
        assertTrue(wrong.joinToString("\n"), wrong.isEmpty())
    }

    private fun DrawnPixels.count(colour: Int, tolerance: Int = 12): Int {
        var found = 0
        for (y in 0 until height) for (x in 0 until width) if (DrawnPixels.matches(argb(x, y), colour, tolerance)) found++
        return found
    }
}
