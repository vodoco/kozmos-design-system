package com.kozmos.components.routinginputgroup

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
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
 * The group as React draws it, at 360: a rail of a 14 start ring in the
 * accent, 2 × 36 connectors in the border role and a 16 pin, 8 apart and 12
 * down; 40-high fields 12 apart, washed black at 5 % on light and white at
 * 10 % on dark; a 40 swap 24 down in the secondary fill; the add 20 below it
 * with two points and at the top with three; a waypoint's 40 remove in the
 * muted foreground. Until 2026-09-22 the fields were Material's, 56 high.
 */
class KozmosRoutingInputGroupPaparazziTest {
    // Source compatibility: the original last callback remains a removal callback.
    @androidx.compose.runtime.Composable
    private fun legacyPositionalAndTrailingCall() {
        KozmosRoutingInputGroup(emptyList(), { _, _ -> }, Modifier,
            com.kozmos.components.surface.KozmosSurfaceStyle.Solid, null, null) { _: String -> }
    }
    @get:Rule
    val paparazzi = Paparazzi(maxPercentDifference = 0.0)

    private fun groups(dark: Boolean) = paparazzi.snapshot {
        CompositionLocalProvider(LocalKozmosUseDarkTokens provides dark) {
            KozmosMaterialTheme {
                Column(
                    verticalArrangement = Arrangement.spacedBy(16.dp),
                    modifier = Modifier
                        .background(KozmosThemeTokens.semanticsSurface0)
                        .padding(16.dp)
                ) {
                    KozmosRoutingInputGroup(
                        points = listOf(
                            KozmosRoutePoint(id = "a", value = "Current location"),
                            KozmosRoutePoint(id = "c", value = "")
                        ),
                        onPointChange = { _, _ -> },
                        onSwap = {},
                        onAddPoint = {},
                        modifier = Modifier.width(360.dp)
                    )
                    KozmosRoutingInputGroup(
                        points = listOf(
                            KozmosRoutePoint(id = "a", value = "Current location"),
                            KozmosRoutePoint(id = "b", value = "Security"),
                            KozmosRoutePoint(id = "c", value = "Gate B12")
                        ),
                        onPointChange = { _, _ -> },
                        onAddPoint = {},
                        onRemovePoint = {},
                        modifier = Modifier.width(360.dp)
                    )
                }
            }
        }
    }

    @Test
    fun theGroupsInLightMode() = groups(dark = false)

    @Test
    fun theGroupsInDarkMode() = groups(dark = true)
}
