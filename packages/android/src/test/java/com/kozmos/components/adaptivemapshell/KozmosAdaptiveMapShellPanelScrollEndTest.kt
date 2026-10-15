package com.kozmos.components.adaptivemapshell

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
import app.cash.paparazzi.DeviceConfig
import com.kozmos.components.ReadNode
import com.kozmos.components.ReadSemantics
import com.kozmos.components.browsecategoriespanel.KozmosBrowseCategoriesPanel
import com.kozmos.components.live
import com.kozmos.components.poidetailpanel.KozmosPOIDetailPanel
import com.kozmos.components.poidetailpanel.KozmosPOIDetailPanelPresentation
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.contracts.KozmosCategoryPresentation
import com.kozmos.contracts.KozmosPOIPresentation
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * GAP-085, Olcay's decision of 15 Oct: the panel's scrolling content runs to
 * the panel's edge, as on iOS and the web, and only scrolled to its end does
 * its last row stop 16 above it — above the bottom safe area in a sheet. The
 * shell padded the 16 outside whatever scrolled, so mid-scroll the rows were
 * cut on a line 16 above the edge. Kozmos's own scrolling parts claim the
 * panel's end: the category browser's grid and the details card's body in
 * its sheet presentation. Each case is laid out as a device lays it out,
 * scrolled as TalkBack scrolls, and read as TalkBack is given it.
 */
class KozmosAdaptiveMapShellPanelScrollEndTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    private var density = 1f
    private var safeBottom = 0f

    private val categories = (1..60).map { KozmosCategoryPresentation(id = "place-$it", label = "Place $it") }

    private val description = (1..80).joinToString(" ") { "The café by the water serves breakfast and lunch every day, sentence $it." }
    private val poi = KozmosPOIPresentation(
        id = "harbour-coffee", name = "Harbour Coffee Co.", floorLabel = "Level 2",
        description = description, actions = emptyList()
    )

    private class Part(
        val name: String,
        val content: @Composable () -> Unit,
        val rows: (ReadSemantics) -> List<ReadNode>,
        /** The part's last row, once scrolled to the end. */
        val last: (ReadSemantics) -> ReadNode
    )

    private val parts = listOf(
        Part(
            "the category browser",
            { KozmosBrowseCategoriesPanel(categories = categories, onSelect = {}) },
            // Placed tiles only: the grid composes a row ahead that is not on screen.
            { tree -> tree.merged.filter { it.words?.startsWith("Place ") == true && it.placed } },
            { tree -> tree.merged.single { it.words == "Place 60" && it.placed } }
        ),
        Part(
            "the details card in its sheet presentation",
            {
                KozmosPOIDetailPanel(
                    poi = poi, actionLabels = emptyMap(), onAction = { _, _ -> },
                    presentation = KozmosPOIDetailPanelPresentation.Sheet
                )
            },
            { tree -> tree.merged.filter { description in it.texts } },
            { tree -> tree.merged.single { description in it.texts } }
        )
    )

    @Composable
    private fun Shell(panel: @Composable () -> Unit) {
        val local = LocalDensity.current
        density = local.density
        safeBottom = WindowInsets.safeDrawing.getBottom(local) / local.density
        KozmosMaterialTheme {
            KozmosAdaptiveMapShell(
                map = { Box(Modifier.fillMaxSize()) },
                panel = panel,
                panelDetent = KozmosMapPanelDetent.Large
            )
        }
    }

    /** Mid-scroll the lowest row shows to the panel's edge; at the end the last ends 16 (and the safe area) above it. */
    private fun assertScrollsToTheEdge(where: String, end: () -> Float) {
        for (part in parts) {
            paparazzi.live(durationMillis = 10_000, content = { Shell(part.content) }) {
                frames(2)
                scrollAndSettle(200 * density, part.rows)
                val middle = read()
                val panel = middle.named("Map details").frame
                val lowest = lowestShown(part.rows(middle))
                val shownTo = (panel.bottom - lowest.bounds.bottom) / density
                println("GAP-085 Android, $where, ${part.name} mid-scroll: drawn to ${"%.2f".format(shownTo)}dp above the panel's edge")
                assertTrue("$where, ${part.name}: mid-scroll its rows stop ${shownTo}dp above the panel's edge", shownTo <= 1f)

                scrollToTheEnd(part.rows)
                val last = part.last(read())
                val endsAt = (read().named("Map details").frame.bottom - last.frame.bottom) / density
                println("GAP-085 Android, $where, ${part.name} at the end: the last row ends ${"%.2f".format(endsAt)}dp above the panel's edge, the safe area $safeBottom")
                assertEquals("$where, ${part.name}: at the end its last row ends ${endsAt}dp above the panel's edge", end(), endsAt, 0.5f)
            }
        }
    }

    @Test
    fun inASidePanelKozmosScrollingPartsRunToTheEdgeAndEndSixteenAboveIt() {
        paparazzi.unsafeUpdateConfig(deviceConfig = DeviceConfig.PIXEL_C)
        assertScrollsToTheEdge("side panel") { 16f }
    }

    @Test
    fun inASheetKozmosScrollingPartsRunToTheEdgeAndEndSixteenAboveTheSafeArea() {
        assertScrollsToTheEdge("sheet") { 16f + safeBottom }
    }
}
