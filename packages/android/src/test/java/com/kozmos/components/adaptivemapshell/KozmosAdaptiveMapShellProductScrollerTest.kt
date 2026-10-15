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
import com.kozmos.components.live
import com.kozmos.components.poiresultlist.KozmosPOIResultListItem
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.contracts.KozmosPOIPresentation
import com.kozmos.contracts.KozmosPOIResultPresentation
import com.kozmos.docsnippets.PanelScrollingResults
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * GAP-085, 15 Oct: a product's own scroller in the shell's panel, as
 * docsnippets/PanelScrollingResults.kt writes it — a scrolling column of
 * results with `kozmosPanelScrollEndPadding()` as its end padding. It claims
 * the panel's end: mid-scroll its results show to the panel's edge, scrolled
 * to its end the last ends 16 above it (above the safe area in a sheet), and
 * a short list that does not scroll ends 16 above it too. Laid out as a
 * device lays it out, scrolled as TalkBack scrolls.
 */
class KozmosAdaptiveMapShellProductScrollerTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    private var density = 1f
    private var safeBottom = 0f

    private fun results(count: Int) = (1..count).map { index ->
        KozmosPOIResultListItem(
            KozmosPOIPresentation(id = "result-$index", name = "Result $index", floorLabel = "Level 1"),
            KozmosPOIResultPresentation(poiId = "result-$index", resultIndex = index)
        )
    }

    private val rows: (ReadSemantics) -> List<ReadNode> = { tree ->
        tree.merged.filter { it.words?.startsWith("Result ") == true && it.click != null }
    }

    @Composable
    private fun Shell(count: Int, detents: List<KozmosMapPanelDetent> = KozmosDefaultPanelDetents, detent: KozmosMapPanelDetent = KozmosMapPanelDetent.Large) {
        val local = LocalDensity.current
        density = local.density
        safeBottom = WindowInsets.safeDrawing.getBottom(local) / local.density
        KozmosMaterialTheme {
            KozmosAdaptiveMapShell(
                map = { Box(Modifier.fillMaxSize()) },
                panel = { PanelScrollingResults(items = results(count), selectedPoiId = null, onSelect = {}) },
                panelDetents = detents,
                panelDetent = detent
            )
        }
    }

    private fun assertScrollsToTheEdge(where: String, end: () -> Float) {
        paparazzi.live(durationMillis = 10_000, content = { Shell(count = 24) }) {
            frames(2)
            scrollAndSettle(300 * density, rows)
            val middle = read()
            val panel = middle.named("Map details").frame
            val shownTo = (panel.bottom - lowestShown(rows(middle)).bounds.bottom) / density
            println("GAP-085 Android, $where, a product's scroller mid-scroll: drawn to ${"%.2f".format(shownTo)}dp above the panel's edge")
            assertTrue("$where: mid-scroll the results stop ${shownTo}dp above the panel's edge", shownTo <= 1f)

            scrollToTheEnd(rows)
            val tree = read()
            val last = tree.named("Map details").frame.bottom - rows(tree).single { it.words!!.startsWith("Result 24,") }.frame.bottom
            println("GAP-085 Android, $where, a product's scroller at the end: the last result ends ${"%.2f".format(last / density)}dp above the panel's edge, the safe area $safeBottom")
            assertEquals("$where: at the end the last result ends ${last / density}dp above the panel's edge", end(), last / density, 0.5f)
        }
    }

    @Test
    fun inASidePanelAProductsScrollerRunsToTheEdgeAndEndsSixteenAboveIt() {
        paparazzi.unsafeUpdateConfig(deviceConfig = DeviceConfig.PIXEL_C)
        assertScrollsToTheEdge("side panel") { 16f }
    }

    @Test
    fun inASheetAProductsScrollerRunsToTheEdgeAndEndsSixteenAboveTheSafeArea() {
        assertScrollsToTheEdge("sheet") { 16f + safeBottom }
    }

    /** Two results do not scroll: they end 16 above the side panel's edge, and the safe area and 16 above a fitted sheet's. */
    @Test
    fun aShortListInAProductsScrollerEndsSixteenAboveTheEdge() {
        val sheet = paparazzi.readSemantics {
            Shell(count = 2, detents = listOf(KozmosMapPanelDetent.Content, KozmosMapPanelDetent.Large), detent = KozmosMapPanelDetent.Content)
        }
        val sheetEnd = (sheet.named("Map details").frame.bottom - rows(sheet).maxBy { it.frame.bottom }.frame.bottom) / density
        println("GAP-085 Android, fitted sheet, two results in a product's scroller: the last ends ${"%.2f".format(sheetEnd)}dp above the sheet's edge")
        assertEquals("fitted sheet: the last result ends ${sheetEnd}dp above the edge", 16f + safeBottom, sheetEnd, 0.5f)

        paparazzi.unsafeUpdateConfig(deviceConfig = DeviceConfig.PIXEL_C)
        val side = paparazzi.readSemantics { Shell(count = 2) }
        val sideEnd = (side.named("Map details").frame.bottom - rows(side).maxBy { it.frame.bottom }.frame.bottom) / density
        println("GAP-085 Android, side panel, two results in a product's scroller: the last ends ${"%.2f".format(sideEnd)}dp above the panel's edge")
        assertEquals("side panel: the last result ends ${sideEnd}dp above the edge", 16f, sideEnd, 0.5f)
    }
}
