package com.kozmos.components.navigationitem

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccessibleForward
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Place
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Icon
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.LayoutDirection
import app.cash.paparazzi.Paparazzi
import com.kozmos.components.CROSS_PLATFORM_MAX_PERCENT_DIFFERENCE
import com.kozmos.components.sidebar.KozmosSidebar
import com.kozmos.components.sidebar.KozmosSidebarVariant
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.KozmosTypography
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import org.junit.Rule
import org.junit.Test

/**
 * Decision 42: the rail as a product draws it, KozmosSidebar's 96dp rail on
 * the page in each theme and right to left. Its items fill it with no gap
 * between them: the muted foreground at rest, "Search" selected on theme/0
 * with a 2dp theme/600 bar down its end, against the rail's 1dp edge.
 * "Accessible routes" takes a second line and its item grows to hold it.
 */
class KozmosNavigationItemRailPaparazziTest {
    @get:Rule
    val paparazzi = Paparazzi(maxPercentDifference = CROSS_PLATFORM_MAX_PERCENT_DIFFERENCE)

    @Test
    fun theRailInLightMode() = snapshotIn(dark = false, direction = LayoutDirection.Ltr)

    @Test
    fun theRailInDarkMode() = snapshotIn(dark = true, direction = LayoutDirection.Ltr)

    @Test
    fun theRailRightToLeft() = snapshotIn(dark = false, direction = LayoutDirection.Rtl)

    private fun snapshotIn(dark: Boolean, direction: LayoutDirection) {
        paparazzi.snapshot {
            CompositionLocalProvider(
                LocalKozmosUseDarkTokens provides dark,
                LocalLayoutDirection provides direction
            ) {
                KozmosMaterialTheme(
                    typography = KozmosTypography.typography()
                ) {
                    Box(Modifier.fillMaxSize().background(KozmosThemeTokens.primitivesColorsBackground50)) {
                        KozmosSidebar(
                            variant = KozmosSidebarVariant.Rail,
                            navigation = {
                                listOf(
                                    Triple(Icons.Default.Home, "Home", false),
                                    Triple(Icons.Default.Search, "Search", true),
                                    Triple(Icons.Default.Place, "Nearby places", false),
                                    Triple(Icons.Default.AccessibleForward, "Accessible routes", false),
                                    Triple(Icons.Default.Settings, "Settings", false)
                                ).forEach { (icon, label, selected) ->
                                    KozmosNavigationItem(
                                        label = label,
                                        placement = KozmosNavigationItemPlacement.Rail,
                                        content = KozmosNavigationItemContent.IconLabel,
                                        selected = selected,
                                        icon = { Icon(icon, contentDescription = null) }
                                    )
                                }
                            }
                        )
                    }
                }
            }
        }
    }
}
