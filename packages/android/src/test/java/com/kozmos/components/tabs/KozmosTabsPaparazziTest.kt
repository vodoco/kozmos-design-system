package com.kozmos.components.tabs

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.kozmos.components.CROSS_PLATFORM_MAX_PERCENT_DIFFERENCE
import com.kozmos.components.motion.LocalKozmosAnimatorScale
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import org.junit.Rule
import org.junit.Test

/**
 * GAP-254, decision 182 drawn, in a 320dp column: three tabs of words that
 * fit, filling the track as they always have; then the Cloud type picker's
 * five families, each an icon over its title, too wide for the column, so
 * the list scrolls inside its track with no scroll bar and the selected
 * fourth tab, Structural, is in view. In each theme, and right to left,
 * where the list starts at the right.
 */
class KozmosTabsPaparazziTest {
    @get:Rule
    val paparazzi = Paparazzi(
        maxPercentDifference = CROSS_PLATFORM_MAX_PERCENT_DIFFERENCE,
        deviceConfig = DeviceConfig.PIXEL_5
    )

    private val families = listOf("Everything", "POI", "Interior asset", "Structural", "Virtual")

    @Test
    fun fittingAndScrollingListsInLightMode() = snapshotIn(dark = false)

    @Test
    fun fittingAndScrollingListsInDarkMode() = snapshotIn(dark = true)

    @Test
    fun fittingAndScrollingListsRightToLeft() = snapshotIn(dark = false, rtl = true)

    @Composable
    private fun Lists() {
        Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
            KozmosTabs {
                KozmosTabsList {
                    for (title in listOf("Overview", "Details", "Usage")) {
                        KozmosTabsTrigger(
                            value = title.lowercase(),
                            title = title,
                            selectedValue = "details",
                            onValueChange = {}
                        )
                    }
                }
            }
            KozmosTabs {
                KozmosTabsList {
                    for (title in families) {
                        KozmosTabsTrigger(
                            value = title.lowercase(),
                            title = title,
                            selectedValue = "structural",
                            onValueChange = {},
                            icon = { Icon(Icons.Filled.Home, contentDescription = null) }
                        )
                    }
                }
            }
        }
    }

    private fun snapshotIn(dark: Boolean, rtl: Boolean = false) {
        paparazzi.snapshot {
            CompositionLocalProvider(
                LocalKozmosUseDarkTokens provides dark,
                LocalLayoutDirection provides if (rtl) LayoutDirection.Rtl else LayoutDirection.Ltr,
                // The selected tab is placed at once, not mid-animation.
                LocalKozmosAnimatorScale provides 0f
            ) {
                KozmosMaterialTheme {
                    Column(
                        modifier = Modifier
                            .width(352.dp)
                            .background(KozmosThemeTokens.semanticsSurface0)
                            .padding(16.dp)
                    ) {
                        Lists()
                    }
                }
            }
        }
    }
}
