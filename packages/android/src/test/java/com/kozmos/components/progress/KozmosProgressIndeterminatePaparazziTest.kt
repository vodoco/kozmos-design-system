package com.kozmos.components.progress

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import app.cash.paparazzi.Paparazzi
import com.kozmos.components.CROSS_PLATFORM_MAX_PERCENT_DIFFERENCE
import com.kozmos.components.motion.LocalKozmosAnimatorScale
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import org.junit.Rule
import org.junit.Test

/**
 * GAP-159: the indeterminate bar, drawn with animations off so the segment
 * stands still in the middle, inline (8, round ends) and at the top (4,
 * square), with a determinate top bar at 40% from the inline start, left to
 * right and right to left, on the page surface in each theme.
 */
class KozmosProgressIndeterminatePaparazziTest {
    @get:Rule
    val paparazzi = Paparazzi(maxPercentDifference = CROSS_PLATFORM_MAX_PERCENT_DIFFERENCE)

    @Test
    fun theBarsInLightMode() = snapshotIn(dark = false)

    @Test
    fun theBarsInDarkMode() = snapshotIn(dark = true)

    private fun snapshotIn(dark: Boolean) {
        paparazzi.snapshot {
            CompositionLocalProvider(
                LocalKozmosUseDarkTokens provides dark,
                LocalKozmosAnimatorScale provides 0f
            ) {
                KozmosMaterialTheme {
                    Column(
                        verticalArrangement = Arrangement.spacedBy(16.dp),
                        modifier = Modifier
                            .background(KozmosThemeTokens.semanticsSurface0)
                            .padding(16.dp)
                            .width(320.dp)
                    ) {
                        for (direction in listOf(LayoutDirection.Ltr, LayoutDirection.Rtl)) {
                            CompositionLocalProvider(LocalLayoutDirection provides direction) {
                                Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                                    KozmosProgress()
                                    KozmosProgress(placement = KozmosProgressPlacement.Top)
                                    KozmosProgress(0.4f, placement = KozmosProgressPlacement.Top)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
