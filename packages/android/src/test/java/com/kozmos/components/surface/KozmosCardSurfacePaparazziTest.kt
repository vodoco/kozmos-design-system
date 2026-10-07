package com.kozmos.components.surface

import com.kozmos.components.CROSS_PLATFORM_MAX_PERCENT_DIFFERENCE
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.dp
import app.cash.paparazzi.Paparazzi
import app.cash.paparazzi.DeviceConfig
import com.kozmos.components.feedbackcard.KozmosFeedbackCard
import com.kozmos.components.routinginputgroup.KozmosRoutePoint
import com.kozmos.components.routinginputgroup.KozmosRoutingInputGroup
import com.kozmos.components.savelocationcard.KozmosSaveLocationCard
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Rule
import org.junit.Test
import org.junit.Assert.assertTrue

/**
 * The three cards React puts on its Surface, taking React's `surface` prop, on
 * red so the glass shows: solid, the cards are the background with the subtle
 * edge; glass, the red comes through the tint. Until 2026-09-22 Compose drew
 * all three solid only.
 */
class KozmosCardSurfacePaparazziTest {
    @get:Rule
    val paparazzi = Paparazzi(
        // A component contact sheet, not three cards competing for one phone screen.
        deviceConfig = DeviceConfig.NEXUS_5.copy(screenHeight = 3000),
        maxPercentDifference = CROSS_PLATFORM_MAX_PERCENT_DIFFERENCE
    )

    private fun cards(surface: KozmosSurfaceStyle) {
        var routingHeight = 0f
        var density = 1f
        paparazzi.snapshot {
            density = LocalDensity.current.density
            KozmosMaterialTheme {
                Column(
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier.background(Color.Red).padding(16.dp)
                ) {
                    KozmosFeedbackCard(modifier = Modifier.fillMaxWidth(), surface = surface)
                    KozmosSaveLocationCard(modifier = Modifier.fillMaxWidth(), surface = surface)
                    KozmosRoutingInputGroup(
                        points = listOf(KozmosRoutePoint(id = "a", value = ""), KozmosRoutePoint(id = "b", value = "")),
                        onPointChange = { _, _ -> },
                        modifier = Modifier.fillMaxWidth().onGloballyPositioned { routingHeight = it.size.height / density },
                        surface = surface
                    )
                }
            }
        }
        // Two 40dp fields, their 12dp gap and 16dp panel padding on each edge.
        // A squeezed last child can still produce a valid-looking golden.
        assertTrue("The gallery must not squeeze the route fields: $routingHeight dp", routingHeight >= 124f)
    }

    @Test
    fun theCardsOnTheSolidSurface() = cards(KozmosSurfaceStyle.Solid)

    @Test
    fun theCardsOnGlass() = cards(KozmosSurfaceStyle.Glass)
}
