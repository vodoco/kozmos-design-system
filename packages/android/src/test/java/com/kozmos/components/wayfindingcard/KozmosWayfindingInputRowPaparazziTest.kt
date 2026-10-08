package com.kozmos.components.wayfindingcard

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import app.cash.paparazzi.Paparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import org.junit.Rule
import org.junit.Test

/**
 * The row as React draws it, measured at React's width (a 360 host padded 16):
 * a rail of a 10 ring, a line and a 16 pin, 12 from two 40-high borderless
 * fields 8 apart, washed in muted at half and raised, with a 48dp swap target
 * 12 in from their end, centred between them. Until 2026-09-22 Compose drew
 * two outlined Material fields with the swap in a row of its own.
 */
class KozmosWayfindingInputRowPaparazziTest {
    @get:Rule
    // Linux CI is the reference renderer for the dark golden. One edge pixel
    // on macOS exceeds Paparazzi's off-by-two allowance; keep the strict gate.
    val paparazzi = Paparazzi(maxPercentDifference = 0.0)

    private fun row(dark: Boolean) = paparazzi.snapshot {
        CompositionLocalProvider(LocalKozmosUseDarkTokens provides dark) {
            KozmosMaterialTheme {
                Box(
                    Modifier
                        .width(360.dp)
                        .background(KozmosThemeTokens.semanticsSurface0)
                        .padding(16.dp)
                ) {
                    KozmosWayfindingInputRow(
                        originValue = "Current location",
                        onOriginChange = {},
                        destinationValue = "",
                        onDestinationChange = {},
                        onSwap = {}
                    )
                }
            }
        }
    }

    @Test
    fun theRowInLightMode() = row(dark = false)

    @Test
    fun theRowInDarkMode() = row(dark = true)
}
