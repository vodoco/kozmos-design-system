package com.kozmos.components.button

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.layout.boundsInRoot
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.dp
import com.kozmos.components.DrawnPixels
import com.kozmos.components.KeptFrames
import com.kozmos.components.drawn
import com.kozmos.components.pixelsPaparazzi
import com.kozmos.tokens.KozmosThemeTokens
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * D7 (2026-10-04): every Button is drawn 44dp tall, as on the web, on iOS and
 * in Figma. A labelled one keeps Android's 48dp touch target through
 * Material's minimum interactive size: its box is 48 and its surface 44 in
 * the middle of it. The icon-only size stays the 44 square it was.
 */
class KozmosButtonSizeTest {
    private val frames = KeptFrames()
    @get:Rule val paparazzi = pixelsPaparazzi(frames)

    @Test fun labelledSizesDraw44TallInsideA48dpTarget() {
        for (size in KozmosButtonSize.values()) {
            var root = Rect.Zero
            var box = Rect.Zero
            var density = 1f
            var fill = 0
            val pixels = paparazzi.drawn(frames) {
                density = LocalDensity.current.density
                fill = KozmosThemeTokens.componentsPrimaryButtonsThemedButtonBackgroundIdle.toArgb()
                MaterialTheme {
                    Box(Modifier.fillMaxSize().onGloballyPositioned { root = it.boundsInRoot() }.padding(40.dp)) {
                        KozmosButton(onClick = {}, size = size, modifier = Modifier.onGloballyPositioned { box = it.boundsInRoot() }) {
                            Text(if (size == KozmosButtonSize.Icon) "+" else "Go")
                        }
                    }
                }
            }
            // The frame is drawn smaller than the device: points in the frame per pixel laid out.
            val camera = pixels.width / root.width
            val dp = { px: Float -> px / camera / density }
            // The surface's height is the tallest run of its fill in any one column: the
            // columns through the label and the rounded corners have less.
            var top = Int.MAX_VALUE
            var bottom = -1
            var tallest = 0
            for (x in (box.left * camera).toInt()..(box.right * camera).toInt()) {
                var first = -1
                var last = -1
                for (y in ((box.top - 8 * density) * camera).toInt()..((box.bottom + 8 * density) * camera).toInt()) {
                    if (DrawnPixels.matches(pixels.argb(x, y), fill)) {
                        if (first < 0) first = y
                        last = y
                    }
                }
                if (first >= 0 && last - first + 1 > tallest) {
                    tallest = last - first + 1
                    top = first
                    bottom = last
                }
            }
            assertTrue("$size draws no fill", tallest > 0)
            assertEquals("$size is not drawn 44dp tall", 44f, dp(tallest.toFloat()), 1f)
            if (size == KozmosButtonSize.Icon) {
                assertEquals("the icon size is not the 44 square", 44f, box.height / density, 0.5f)
            } else {
                assertTrue("$size reserves less than the 48dp target: ${box.height / density}", box.height / density >= 47.5f)
                // In the middle of the target: as much above the surface as below it.
                val above = dp(top - box.top * camera)
                val below = dp(box.bottom * camera - (bottom + 1))
                assertEquals("$size's surface is not centred in its target: $above above, $below below", above, below, 1f)
            }
        }
    }
}
