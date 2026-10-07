package com.kozmos.components.navigation

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import app.cash.paparazzi.DeviceConfig
import com.kozmos.components.ReadSemantics
import com.kozmos.components.adaptivemapshell.KozmosAdaptiveMapShell
import com.kozmos.components.adaptivemapshell.KozmosMapPanelDetent
import com.kozmos.components.adaptivemapshell.LocalKozmosPanelSurface
import com.kozmos.components.readSemantics
import com.kozmos.components.routesummary.KozmosRoutePresentation
import com.kozmos.components.routesummary.KozmosRouteSummary
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.surface.KozmosSurfaceStyle
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Rule
import org.junit.Test

/**
 * Decision 43: in the map shell's panel, the panel's surface is the one
 * surface. The navigation summary there takes its hosted presentation by
 * itself, with no surface, radius, shadow or outer padding of its own;
 * standing alone it draws its card; a presentation the caller names wins.
 * Read by where the destination's heading sits: 16dp in on the card, at the
 * edge hosted.
 */
class KozmosRouteSummaryPresentationTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    private var density = 1f

    @Composable
    private fun Summary(presentation: KozmosRoutePresentation?) {
        if (presentation == null) {
            KozmosRouteSummary(destination = "Gate 12", durationText = "4 min", distanceText = "201 m", onEndRoute = {})
        } else {
            KozmosRouteSummary(destination = "Gate 12", durationText = "4 min", distanceText = "201 m", onEndRoute = {},
                presentation = presentation)
        }
    }

    private fun ReadSemantics.heading() = merged.single { it.texts == listOf("Gate 12") }

    /** How far in from the summary's start its heading sits, in dp, on [panel] or standing alone. */
    private fun inset(panel: KozmosSurfaceStyle?, presentation: KozmosRoutePresentation?): Float {
        val read = paparazzi.readSemantics {
            density = LocalDensity.current.density
            MaterialTheme {
                CompositionLocalProvider(LocalKozmosPanelSurface provides panel) {
                    Box(Modifier.width(320.dp).semantics { contentDescription = "Summary" }) { Summary(presentation) }
                }
            }
        }
        return (read.heading().bounds.left - read.named("Summary").bounds.left) / density
    }

    @Test fun onTheShellsPanelTheSummaryIsHosted() {
        for (panel in KozmosSurfaceStyle.values()) assertEquals("on the $panel panel", 0f, inset(panel, null), 0.5f)
    }

    @Test fun standingAloneTheSummaryDrawsItsCard() {
        assertEquals(16f, inset(null, null), 0.5f)
    }

    @Test fun aNamedPresentationWins() {
        assertEquals(16f, inset(KozmosSurfaceStyle.Solid, KozmosRoutePresentation.Standalone), 0.5f)
        assertEquals(0f, inset(null, KozmosRoutePresentation.Hosted), 0.5f)
    }

    /** The real shell: the summary as its panel sits where the hosted one does, not where the card would. */
    @Test fun theMapShellsPanelHostsTheSummary() {
        fun heading(presentation: KozmosRoutePresentation?) = paparazzi.readSemantics {
            MaterialTheme {
                KozmosAdaptiveMapShell(
                    map = { Box(Modifier.fillMaxSize()) },
                    panel = { Summary(presentation) },
                    panelDetent = KozmosMapPanelDetent.Medium
                )
            }
        }.heading().bounds
        val automatic = heading(null)
        assertEquals("the shell's panel does not host the summary", heading(KozmosRoutePresentation.Hosted), automatic)
        assertNotEquals("the hosted and standalone summaries sit alike", heading(KozmosRoutePresentation.Standalone), automatic)
    }

    /**
     * The panel header sits on the panel's surface as its content does: a
     * summary there is hosted too, docked and beside the map, as SwiftUI and
     * the web host it.
     */
    private fun assertTheHeaderHostsTheSummary(side: Boolean) {
        fun read(presentation: KozmosRoutePresentation?) = paparazzi.readSemantics {
            density = LocalDensity.current.density
            MaterialTheme {
                KozmosAdaptiveMapShell(
                    map = { Box(Modifier.fillMaxSize()) },
                    panel = { Box(Modifier.fillMaxWidth().height(44.dp)) },
                    panelHeader = { Summary(presentation) },
                    panelDetent = KozmosMapPanelDetent.Medium
                )
            }
        }
        fun heading(presentation: KozmosRoutePresentation?) = read(presentation).heading().bounds
        // Docked, the panel runs the screen's width; beside the map it is 416dp.
        val tree = read(null)
        val panelWidth = tree.named("Map details").bounds.width
        if (side) assertEquals("not the side panel", 416f, panelWidth / density, 0.5f)
        else assertEquals("not the docked sheet", tree.merged.first().bounds.width, panelWidth, 0.5f)
        val automatic = heading(null)
        assertEquals("the shell's panel header does not host the summary", heading(KozmosRoutePresentation.Hosted), automatic)
        assertNotEquals("the hosted and standalone summaries sit alike", heading(KozmosRoutePresentation.Standalone), automatic)
    }

    @Test fun theMapShellsSheetHeaderHostsTheSummary() = assertTheHeaderHostsTheSummary(side = false)

    @Test fun theMapShellsSidePanelHeaderHostsTheSummary() {
        paparazzi.unsafeUpdateConfig(deviceConfig = DeviceConfig.PIXEL_C)
        assertTheHeaderHostsTheSummary(side = true)
    }
}
