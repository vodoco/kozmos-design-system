package com.kozmos.components.navigationitem

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bookmark
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Place
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import app.cash.paparazzi.Paparazzi
import com.kozmos.components.CROSS_PLATFORM_MAX_PERCENT_DIFFERENCE
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.KozmosTypography
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import org.junit.Rule
import org.junit.Test

/**
 * Decision 36 (row 25 / GAP-013): a rail as a product draws it, on the page
 * surface in each theme. Every label is labelSmall, 11sp on 14sp lines, up to
 * two: "Nearby places" takes its second line and its tile stays 72dp tall, as
 * the one-line tiles are; "Saved places and recent routes" needs a third and
 * is cut at the end of its second. The rail drew one line, so "Nearby pl…".
 */
class KozmosNavigationItemRailPaparazziTest {
    @get:Rule
    val paparazzi = Paparazzi(maxPercentDifference = CROSS_PLATFORM_MAX_PERCENT_DIFFERENCE)

    @Test
    fun theRailInLightMode() = snapshotIn(dark = false)

    @Test
    fun theRailInDarkMode() = snapshotIn(dark = true)

    private fun snapshotIn(dark: Boolean) {
        paparazzi.snapshot {
            CompositionLocalProvider(LocalKozmosUseDarkTokens provides dark) {
                MaterialTheme(
                    colorScheme = if (dark) darkColorScheme() else lightColorScheme(),
                    typography = KozmosTypography.typography()
                ) {
                    Column(
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier
                            .background(KozmosThemeTokens.semanticsSurface0)
                            .padding(8.dp)
                    ) {
                        listOf(
                            Triple(Icons.Default.Home, "Home", false),
                            Triple(Icons.Default.Search, "Search", true),
                            Triple(Icons.Default.Place, "Nearby places", false),
                            Triple(Icons.Default.Settings, "Settings", false),
                            Triple(Icons.Default.Bookmark, "Saved places and recent routes", false)
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
                }
            }
        }
    }
}
