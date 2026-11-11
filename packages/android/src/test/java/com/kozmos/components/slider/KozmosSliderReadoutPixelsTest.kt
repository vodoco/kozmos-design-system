package com.kozmos.components.slider

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.kozmos.components.DrawnPixels
import com.kozmos.components.KeptFrames
import com.kozmos.components.pixelsPaparazzi
import com.kozmos.components.readSemantics
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.tokens.KozmosThemeTokens
import kotlin.math.roundToInt
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * Slider's readout (GAP-163) is drawn at rest, at the slider's end, beside the
 * track: right of it left to right, left of it right to left. Read off what is
 * drawn: muted-foreground ink between the slider's frame and the row's end.
 */
class KozmosSliderReadoutPixelsTest {
    private val frames = KeptFrames()

    @get:Rule val paparazzi = pixelsPaparazzi(frames)

    /** How many pixels of foreground/400 ink lie beside the slider, at its end. */
    private fun inkAtTheEnd(direction: LayoutDirection): Int {
        var canvas = IntSize(1, 1)
        var ink = 0
        var ground = 0
        val tree = paparazzi.readSemantics {
            CompositionLocalProvider(LocalLayoutDirection provides direction) {
                KozmosMaterialTheme {
                    ink = KozmosThemeTokens.primitivesColorsForeground400.toArgb()
                    ground = KozmosThemeTokens.primitivesColorsBackground0.toArgb()
                    Box(
                        Modifier.fillMaxSize()
                            .background(KozmosThemeTokens.primitivesColorsBackground0)
                            .onGloballyPositioned { canvas = it.size }
                    ) {
                        Box(Modifier.padding(16.dp).width(300.dp).testTag("row")) {
                            KozmosSlider(value = 0.6f, onValueChange = {}, showValue = true, formatValue = { "${(it * 100).roundToInt()}%" })
                        }
                    }
                }
            }
        }
        val drawn = DrawnPixels(checkNotNull(frames.last))
        val scale = drawn.width.toFloat() / canvas.width
        val row = tree.unmerged.single { it.tag == "row" }.frame
        val slider = tree.merged.single { it.progressRange != null }.frame
        val (from, to) = if (direction == LayoutDirection.Ltr) slider.right to row.right else row.left to slider.left
        var count = 0
        for (y in (slider.top * scale).roundToInt() until (slider.bottom * scale).roundToInt())
            for (x in (from * scale).roundToInt() until (to * scale).roundToInt()) {
                val argb = drawn.argb(x, y)
                if (!DrawnPixels.matches(argb, ground, 40) && DrawnPixels.matches(argb, ink, 40)) count++
            }
        return count
    }

    @Test fun theReadoutIsDrawnAtTheEndLeftToRight() {
        val ink = inkAtTheEnd(LayoutDirection.Ltr)
        assertTrue("no readout drawn right of the slider ($ink pixels)", ink > 10)
    }

    @Test fun theReadoutIsDrawnAtTheEndRightToLeft() {
        val ink = inkAtTheEnd(LayoutDirection.Rtl)
        assertTrue("no readout drawn left of the slider ($ink pixels)", ink > 10)
    }
}
