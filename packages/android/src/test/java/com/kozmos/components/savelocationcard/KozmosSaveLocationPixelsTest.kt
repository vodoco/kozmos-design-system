package com.kozmos.components.savelocationcard

import androidx.compose.foundation.layout.width
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.unit.dp
import com.kozmos.components.KeptFrames
import com.kozmos.components.drawn
import com.kozmos.components.pixelsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

class KozmosSaveLocationPixelsTest {
    private val frames = KeptFrames()
    @get:Rule val paparazzi = pixelsPaparazzi(frames)

    @Test fun savedGuidanceDrawsTheCoreSuccessFillInBothThemes() {
        for (dark in listOf(false, true)) {
            var success = 0
            val pixels = paparazzi.drawn(frames) {
                CompositionLocalProvider(LocalKozmosUseDarkTokens provides dark) {
                    success = KozmosThemeTokens.componentsPrimaryButtonsSuccessButtonBackgroundIdle.toArgb()
                    KozmosMaterialTheme {
                        KozmosSaveLocationCard(modifier = Modifier.width(320.dp),
                            isSaved = true, onRouteToLocation = {})
                    }
                }
            }
            var fillPixels = 0
            for (y in 0 until pixels.height) for (x in 0 until pixels.width) {
                if (pixels.argb(x, y) == success) fillPixels++
            }
            assertTrue("Guide Me must paint the Core success fill (dark=$dark); found $fillPixels pixels", fillPixels > 100)
        }
    }
}
