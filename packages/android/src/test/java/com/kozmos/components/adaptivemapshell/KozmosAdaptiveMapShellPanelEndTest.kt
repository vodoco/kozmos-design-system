package com.kozmos.components.adaptivemapshell

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import app.cash.paparazzi.DeviceConfig
import com.kozmos.components.ReadSemantics
import com.kozmos.components.browsecategoriespanel.KozmosBrowseCategoriesPanel
import com.kozmos.components.poidetailpanel.KozmosPOIDetailPanel
import com.kozmos.components.poidetailpanel.KozmosPOIDetailPanelPresentation
import com.kozmos.components.readSemantics
import com.kozmos.components.routepreviewpanel.KozmosRoutePreviewPanel
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.contracts.KozmosCategoryPresentation
import com.kozmos.contracts.KozmosPOIPresentation
import com.kozmos.contracts.KozmosRouteOptionPresentation
import com.kozmos.contracts.KozmosRoutePreference
import com.kozmos.contracts.KozmosRouteReadiness
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

/**
 * GAP-085, the panel's other end (MAP-474): the shell's panel keeps 16 below
 * its content, as it keeps 16 above it. A two-result list in a side panel
 * ended against the panel's bottom edge, and in a sheet fitted to its content
 * against the navigation bar's inset: the content box padded nothing there.
 * Now it ends 16 above the side panel's edge, and 16 above the inset in a
 * sheet. A part that pads its own end and draws no surface of its own still
 * ends 16 above, not 32: the route preview tops its padding up to the
 * panel's 16, as it does at its top (GAP-083), and the details card in its
 * sheet presentation and the category browser, which scroll, claim the
 * panel's end and take the 16 as their own (15 Oct;
 * KozmosAdaptiveMapShellPanelScrollEndTest scrolls them). Each case is laid
 * out as a device lays it out, and read as TalkBack is given it.
 */
class KozmosAdaptiveMapShellPanelEndTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    private var density = 1f

    /** The device's safe-drawing inset at the bottom, in dp: what a sheet keeps its content above. */
    private var safeBottom = 0f

    /** A 44dp stand-in for a result, read by its name. */
    @Composable
    private fun Field(name: String) {
        Box(modifier = Modifier.fillMaxWidth().height(44.dp).semantics { contentDescription = name })
    }

    /** Results the product lays out itself, padding nothing: the last is read. */
    @Composable
    private fun Results(count: Int) {
        Column { (1..count).forEach { Field(if (it == count) "Last result" else "Result $it") } }
    }

    private fun read(
        detents: List<KozmosMapPanelDetent> = KozmosDefaultPanelDetents,
        detent: KozmosMapPanelDetent = KozmosMapPanelDetent.Medium,
        header: (@Composable () -> Unit)? = null,
        panel: @Composable () -> Unit
    ): ReadSemantics = paparazzi.readSemantics {
        val local = LocalDensity.current
        density = local.density
        safeBottom = WindowInsets.safeDrawing.getBottom(local) / local.density
        KozmosMaterialTheme {
            KozmosAdaptiveMapShell(
                map = { Box(modifier = Modifier.fillMaxSize()) },
                panel = panel,
                panelHeader = header,
                panelDetents = detents,
                panelDetent = detent
            )
        }
    }

    /** In dp: from [node]'s bottom edge to the panel's. */
    private fun ReadSemantics.endGap(node: androidx.compose.ui.geometry.Rect): Float =
        (named("Map details").bounds.bottom - node.bottom) / density

    private fun ReadSemantics.isSidePanel() = named("Map details").bounds.width / density < merged.first().bounds.width / density - 1f

    private val headers: List<(@Composable () -> Unit)?> = listOf(null, { Field("Header probe") })

    @Test
    fun inASidePanelTheContentEndsSixteenAboveThePanelsBottomEdge() {
        paparazzi.unsafeUpdateConfig(deviceConfig = DeviceConfig.PIXEL_C)
        for (header in headers) for (count in listOf(2, 5)) {
            val tree = read(header = header, panel = { Results(count) })
            assertEquals("not the side panel", true, tree.isSidePanel())
            val gap = tree.endGap(tree.named("Last result").bounds)
            val case = "$count results, ${if (header == null) "no header" else "a header"}"
            println("GAP-085 Android, side panel, $case: the last result ends $gap above the panel's bottom edge")
            assertEquals("side panel, $case: the last result ends $gap above the panel's edge", 16f, gap, 0.5f)
        }
    }

    /** Fitted to its content, gripless and under a grip; six results so the sheet is taller than its least. */
    @Test
    fun inAFittedSheetTheContentEndsSixteenAboveTheSafeInset() {
        for (detents in listOf(listOf(KozmosMapPanelDetent.Content), listOf(KozmosMapPanelDetent.Content, KozmosMapPanelDetent.Large))) {
            for (header in headers) {
                val tree = read(detents = detents, detent = KozmosMapPanelDetent.Content, header = header, panel = { Results(6) })
                assertEquals("not the sheet", false, tree.isSidePanel())
                val gap = tree.endGap(tree.named("Last result").bounds)
                val case = "${detents.size} detent(s), ${if (header == null) "no header" else "a header"}"
                println("GAP-085 Android, fitted sheet, $case: the last result ends $gap above the sheet's bottom edge, the safe inset $safeBottom")
                assertEquals("sheet, $case: the last result ends $gap above the sheet's edge", 16f + safeBottom, gap, 0.5f)
            }
        }
    }

    private val poi = KozmosPOIPresentation(
        id = "harbour-coffee", name = "Harbour Coffee Co.", floorLabel = "Level 2",
        description = "A quiet café by the water.", actions = emptyList()
    )

    private val categories = listOf("Gates", "Check-in", "Security", "Dining", "Shopping", "Toilets", "Parking", "Help")
        .map { KozmosCategoryPresentation(id = it.lowercase(), label = it) }

    private val options = listOf(
        KozmosRouteOptionPresentation(
            id = "quickest", label = "Quickest", durationSeconds = 240.0, durationLabel = "4 min",
            distanceMetres = 150.0, distanceLabel = "150 m", preference = KozmosRoutePreference.Quickest, selected = true
        )
    )

    private class Part(
        val name: String,
        val content: @Composable () -> Unit,
        /** The part's last drawn thing, whose end is read. */
        val last: (ReadSemantics) -> androidx.compose.ui.geometry.Rect,
        /** How far that ends above the part's own end: its own padding, as it always was. */
        val ends: Float = 16f
    )

    private val parts: List<Part> = listOf(
        Part(
            "the details card in its sheet presentation",
            { KozmosPOIDetailPanel(poi = poi, actionLabels = emptyMap(), onAction = { _, _ -> }, presentation = KozmosPOIDetailPanelPresentation.Sheet) },
            { tree -> tree.merged.single { "A quiet café by the water." in it.texts }.bounds }
        ),
        Part(
            "the category browser",
            { KozmosBrowseCategoriesPanel(categories = categories, onSelect = {}) },
            { tree -> tree.merged.single { it.words == "Help" }.bounds }
        ),
        Part(
            "the route preview",
            {
                KozmosRoutePreviewPanel(
                    destinationName = "Harbour Coffee Co.", options = options, status = KozmosRouteReadiness.Ready,
                    backLabel = "Back", continueLabel = "Start", onOptionSelect = {}, onBack = {}, onContinue = {}
                )
            },
            { tree -> tree.merged.single { "Start" in it.texts }.bounds },
            // Start is 44 tall, centred in the footer's 48dp row: 2 more.
            ends = 18f
        )
    )

    @Test
    fun aPartThatPadsItsOwnEndIsNotPaddedTwiceInASidePanel() {
        paparazzi.unsafeUpdateConfig(deviceConfig = DeviceConfig.PIXEL_C)
        for (part in parts) {
            val tree = read(panel = part.content)
            assertEquals("not the side panel", true, tree.isSidePanel())
            val gap = tree.endGap(part.last(tree))
            println("GAP-085 Android, side panel, ${part.name}: its last row ends $gap above the panel's bottom edge")
            assertEquals("side panel, ${part.name}: its last row ends $gap above the panel's edge", part.ends, gap, 0.5f)
        }
    }

    @Test
    fun aPartThatPadsItsOwnEndIsNotPaddedTwiceInAFittedSheet() {
        for (part in parts) {
            val tree = read(
                detents = listOf(KozmosMapPanelDetent.Content, KozmosMapPanelDetent.Large),
                detent = KozmosMapPanelDetent.Content,
                panel = part.content
            )
            assertEquals("not the sheet", false, tree.isSidePanel())
            val gap = tree.endGap(part.last(tree))
            println("GAP-085 Android, fitted sheet, ${part.name}: its last row ends $gap above the sheet's bottom edge, the safe inset $safeBottom")
            assertEquals("sheet, ${part.name}: its last row ends $gap above the sheet's edge", part.ends + safeBottom, gap, 0.5f)
        }
    }
}
