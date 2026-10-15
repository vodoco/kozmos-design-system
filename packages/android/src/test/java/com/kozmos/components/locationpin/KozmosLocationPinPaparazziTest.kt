package com.kozmos.components.locationpin

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.LocalCafe
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import app.cash.paparazzi.Paparazzi
import com.kozmos.components.CROSS_PLATFORM_MAX_PERCENT_DIFFERENCE
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import org.junit.Rule
import org.junit.Test

/**
 * The SDK's map result markers (decision 71), in light and in dark, on the
 * page's background/100 as a map stands in for: the Result at rest and
 * selected, with a number that grows the pill and with its dot; the featured
 * tile, empty and with a logo, at rest and selected (52); the place; a
 * disabled Result, at 50%; and an external label below a Result. Each sits
 * in its 48dp target, so the rows are spaced by targets, not drawings.
 */
class KozmosLocationPinPaparazziTest {
    @get:Rule
    val paparazzi = Paparazzi(maxPercentDifference = CROSS_PLATFORM_MAX_PERCENT_DIFFERENCE)

    @Composable
    private fun Markers(dark: Boolean) {
        CompositionLocalProvider(LocalKozmosUseDarkTokens provides dark) {
            KozmosMaterialTheme {
                Column(
                    modifier = Modifier.background(KozmosThemeTokens.primitivesColorsBackground100).padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(24.dp)
                ) {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.Bottom) {
                        KozmosLocationPin(label = "Gate 1", number = 1)
                        KozmosLocationPin(label = "Gate 1", number = 1, selected = true)
                        KozmosLocationPin(label = "Gate 12", number = 12)
                        KozmosLocationPin(label = "Gate 128", number = 128)
                        KozmosLocationPin(label = "Gate 128", number = 128, selected = true)
                    }
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.Top) {
                        KozmosLocationPin(label = "Toilets")
                        KozmosLocationPin(label = "Toilets", selected = true)
                        KozmosLocationPin(label = "Gate 3", number = 3, enabled = false)
                        KozmosLocationPin(label = "Gate 12", number = 12, externalLabel = "Gate 12")
                    }
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.Bottom) {
                        KozmosLocationPin(label = "Burger King", featured = true)
                        KozmosLocationPin(label = "Burger King", featured = true, selected = true)
                        KozmosLocationPin(label = "Harbour Coffee", featured = true) {
                            Icon(Icons.Filled.LocalCafe, contentDescription = null, modifier = Modifier.size(24.dp))
                        }
                        KozmosLocationPin(label = "Harbour Coffee", place = true)
                    }
                }
            }
        }
    }

    @Test
    fun theMarkersInLightMode() {
        paparazzi.snapshot { Markers(dark = false) }
    }

    @Test
    fun theMarkersInDarkMode() {
        paparazzi.snapshot { Markers(dark = true) }
    }
}
