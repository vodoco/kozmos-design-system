package com.kozmos.components.adaptivemapshell

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import app.cash.paparazzi.DeviceConfig
import com.kozmos.components.ReadSemantics
import com.kozmos.components.browsecategoriespanel.KozmosBrowseCategoriesPanel
import com.kozmos.components.poiresultlist.KozmosPOIResultList
import com.kozmos.components.poiresultlist.KozmosPOIResultListItem
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.contracts.KozmosCategoryPresentation
import com.kozmos.contracts.KozmosPOIPresentation
import com.kozmos.contracts.KozmosPOIResultPresentation
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * Decision 14 (2026-09-27): every part at the top of the shell's panel keeps
 * the handle's 4dp, not only the details card, so no first control sits in
 * the handle's 24dp circle — and, as GAP-083 did for the card, tops its own 16
 * up to what the panel leaves above it rather than adding to it. The category
 * browser was first: its first row padded 16 on every side under the handle's
 * 16dp row, 32 down and 16 in. The panel header, where products put the search
 * field, sat flush under the handle. Each case is laid out as a device lays it
 * out, and read as TalkBack is given it.
 */
class KozmosAdaptiveMapShellHostedBrowseTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    private var density = 1f

    @Test fun genericContentKeepsSixteenBelowHeaderWithAndWithoutHandle() {
        for (detents in listOf(listOf(KozmosMapPanelDetent.Content), listOf(KozmosMapPanelDetent.Content, KozmosMapPanelDetent.Large))) {
            val tree = read(detents = detents, detent = KozmosMapPanelDetent.Content,
                header = { Field("Header probe") }, panel = { Field("Content probe") })
            assertEquals(16f, (tree.named("Content probe").bounds.top - tree.named("Header probe").bounds.bottom) / density, 0.5f)
        }
    }

    @Test fun genericGriplessContentKeepsSixteenFromTop() {
        val tree = read(detents = listOf(KozmosMapPanelDetent.Content), detent = KozmosMapPanelDetent.Content,
            panel = { Field("Content probe") })
        assertEquals(16f, tree.placed(tree.named("Content probe").bounds).down, 0.5f)
        assertEquals(maxOf(60f, tree.merged.first().bounds.height / density * 0.2f), tree.named("Map details").bounds.height / density, 0.5f)
    }

    @Test fun genericSidePanelKeepsTopAndHeaderGapsInBothDirections() {
        paparazzi.unsafeUpdateConfig(deviceConfig = DeviceConfig.PIXEL_C)
        for (direction in listOf(LayoutDirection.Ltr, LayoutDirection.Rtl)) {
            for (hasHeader in listOf(false, true)) {
                val tree = read(direction = direction,
                    header = if (hasHeader) ({ Field("Header probe") }) else null,
                    panel = { Field("Content probe") })
                val panel = tree.named("Map details").bounds
                val content = tree.named("Content probe").bounds
                val first = if (hasHeader) tree.named("Header probe").bounds else content
                assertEquals(16f, (first.top - panel.top) / density, 0.5f)
                if (hasHeader) assertEquals(16f, (content.top - first.bottom) / density, 0.5f)
                assertEquals(if (hasHeader) 120f else 60f, panel.height / density, 0.5f)
            }
        }
    }

    /** Eight tiles, two rows of four, as a venue's quick access has them. */
    private val categories = listOf("Gates", "Check-in", "Security", "Dining", "Shopping", "Toilets", "Parking", "Help")
        .map { KozmosCategoryPresentation(id = it.lowercase(), label = it) }

    /** A 44dp stand-in for a search field, read by its name. */
    @Composable
    private fun Field(name: String, modifier: Modifier = Modifier) {
        Box(modifier = modifier.fillMaxWidth().height(44.dp).semantics { contentDescription = name })
    }

    /** The browser as a product hosts it: the panel's whole content, with a search field or, with [search] false, the tiles alone. */
    @Composable
    private fun Browser(search: Boolean = true) {
        KozmosBrowseCategoriesPanel(
            categories = categories,
            onSelect = {},
            search = if (search) ({ Field("Search places") }) else null
        )
    }

    private fun read(
        detents: List<KozmosMapPanelDetent> = KozmosDefaultPanelDetents,
        detent: KozmosMapPanelDetent = KozmosMapPanelDetent.Medium,
        direction: LayoutDirection = LayoutDirection.Ltr,
        header: (@Composable () -> Unit)? = null,
        panel: @Composable () -> Unit = { Browser() }
    ): ReadSemantics = paparazzi.readSemantics {
        density = LocalDensity.current.density
        CompositionLocalProvider(LocalLayoutDirection provides direction) {
            MaterialTheme {
                KozmosAdaptiveMapShell(
                    map = { Box(modifier = Modifier.fillMaxSize()) },
                    panel = panel,
                    panelHeader = header,
                    panelDetents = detents,
                    panelDetent = detent
                )
            }
        }
    }

    /** In dp: how far [node] sits from the panel's top edge, and from its start edge — the right, right to left. */
    private data class Placed(val down: Float, val inward: Float)

    private fun ReadSemantics.placed(node: Rect, direction: LayoutDirection = LayoutDirection.Ltr): Placed {
        val panel = named("Map details").bounds
        return Placed(
            down = (node.top - panel.top) / density,
            inward = (if (direction == LayoutDirection.Rtl) panel.right - node.right else node.left - panel.left) / density
        )
    }

    private fun ReadSemantics.drawsHandle() = names().contains("Panel height")

    /** Docked: the panel runs the phone's whole width. */
    private fun ReadSemantics.assertSheet() {
        assertEquals("not the docked sheet", merged.first().bounds.width, named("Map details").bounds.width, 0.5f)
    }

    /** Beside the map, not docked: the panel is 416dp of the tablet's width, with no handle. */
    private fun ReadSemantics.assertSidePanel() {
        assertEquals("not the side panel", 416f, named("Map details").bounds.width / density, 0.5f)
        assertEquals("the side panel draws a handle", false, drawsHandle())
    }

    // Under a handle

    /**
     * The search row padded 16 under the handle's 16dp row: the field 32 down
     * and 16 in. The row tops its padding up to 16 instead of adding 16 to the
     * row, and keeps the handle's clearance: 20 and 16, as the web's 21 and 17
     * and iOS's 20 and 16.
     */
    @Test
    fun underAHandleTheSearchFieldSitsAsFarDownAsInPlusTheHandlesClearance() {
        val tree = read()
        tree.assertSheet()
        assertEquals("the sheet draws no handle", true, tree.drawsHandle())
        val at = tree.placed(tree.named("Search places").bounds)
        println("Decision 14 Android, browser under a handle: the search field ${at.down} from the top, ${at.inward} from the side")
        assertEquals("the search field is ${at.inward} from the sheet's side", 16f, at.inward, 0.5f)
        assertEquals("the search field is ${at.down} from the sheet's top and ${at.inward} from its side", at.inward + 4f, at.down, 0.5f)
    }

    /**
     * With no search row the tiles are the first row, and the same rule holds:
     * the first tile sat 32 down, and sits 20 — the handle's centre 8 and the
     * 12 of its 24dp circle, which the tiles span and must not enter.
     */
    @Test
    fun underAHandleWithNoSearchRowTheTilesSitAsFarDownAsInPlusTheHandlesClearance() {
        val tree = read(panel = { Browser(search = false) })
        tree.assertSheet()
        assertEquals("the sheet draws no handle", true, tree.drawsHandle())
        val at = tree.placed(tree.named("Gates").bounds)
        println("Decision 14 Android, tiles under a handle: the first tile ${at.down} from the top, ${at.inward} from the side")
        assertEquals("the first tile is ${at.inward} from the sheet's side", 16f, at.inward, 0.5f)
        assertEquals("the first tile is ${at.down} from the sheet's top and ${at.inward} from its side", at.inward + 4f, at.down, 0.5f)
    }

    /** Only the first row tops up: the tiles under the search row sit under that row — its 16, its rule's 1, their own 16. */
    @Test
    fun theTilesUnderTheSearchRowKeepTheir16() {
        val tree = read()
        val under = (tree.named("Gates").bounds.top - tree.named("Search places").bounds.bottom) / density
        println("Decision 14 Android, tiles under the search row: $under below the field")
        assertEquals("the tiles are $under below the search field", 16f + 1f + 16f, under, 0.5f)
    }

    // No handle, a panel header, beside the map

    /** A single detent draws no handle, so the sheet leaves nothing above the browser and its row keeps its own 16. */
    @Test
    fun aSingleDetentSheetDrawsNoHandleAndTheBrowserKeepsItsOwnPadding() {
        val tree = read(detents = listOf(KozmosMapPanelDetent.Medium))
        tree.assertSheet()
        assertEquals("a single detent draws a handle", false, tree.drawsHandle())
        val at = tree.placed(tree.named("Search places").bounds)
        println("Decision 14 Android, browser in a single-detent sheet: the search field ${at.down} from the top, ${at.inward} from the side")
        assertEquals("the search field is ${at.down} from the sheet's top and ${at.inward} from its side", at.inward, at.down, 0.5f)
        assertEquals("the search field is ${at.inward} from the sheet's side", 16f, at.inward, 0.5f)
    }

    /** Under a panel header the space above the browser is the header, not empty: the browser keeps its own 16 under it. */
    @Test
    fun underAPanelHeaderTheBrowserKeepsItsOwnPadding() {
        val tree = read(detent = KozmosMapPanelDetent.Large, header = { Field("Search this sheet") })
        tree.assertSheet()
        val under = (tree.named("Search places").bounds.top - tree.named("Search this sheet").bounds.bottom) / density
        println("Decision 14 Android, browser under a panel header: the search field $under under the header")
        assertEquals("the search field is $under under the panel header", 16f, under, 0.5f)
    }

    /**
     * A native side panel leaves nothing above its content — the web's keeps 16
     * there — so the browser keeps its own 16: the field 16 from the panel's top
     * and 16 from its start.
     */
    @Test
    fun inASidePanelTheSearchFieldSitsAsFarDownAsIn() {
        paparazzi.unsafeUpdateConfig(deviceConfig = DeviceConfig.PIXEL_C)
        val tree = read()
        tree.assertSidePanel()
        val at = tree.placed(tree.named("Search places").bounds)
        println("Decision 14 Android, browser in a side panel: the search field ${at.down} from the top, ${at.inward} from the start")
        assertEquals("the search field is ${at.down} from the panel's top and ${at.inward} from its start", at.inward, at.down, 0.5f)
        assertEquals("the search field is ${at.inward} from the panel's start", 16f, at.inward, 0.5f)
    }

    /** Right to left the panel's start is its right edge. */
    @Test
    fun rightToLeftTheSidePanelsSearchFieldSitsAsFarDownAsFromTheRight() {
        paparazzi.unsafeUpdateConfig(deviceConfig = DeviceConfig.PIXEL_C)
        val tree = read(direction = LayoutDirection.Rtl)
        tree.assertSidePanel()
        val at = tree.placed(tree.named("Search places").bounds, LayoutDirection.Rtl)
        println("Decision 14 Android, browser in a side panel right to left: the search field ${at.down} from the top, ${at.inward} from the right")
        assertEquals("the search field is ${at.down} from the panel's top and ${at.inward} from its right", at.inward, at.down, 0.5f)
        assertEquals("the search field is ${at.inward} from the panel's right", 16f, at.inward, 0.5f)
    }

    // The panel header

    /**
     * Products put the search field in the panel header. Under a handle it sat
     * flush under the handle's row, 16 from the sheet's top and 8 from the
     * handle's centre: inside the 24dp circle the handle's target keeps clear
     * (WCAG 2.5.8). The header keeps the handle's clearance, as the web's has
     * since #109: 20, on the circle's edge.
     */
    @Test
    fun underAHandleThePanelHeadersFirstControlKeepsTheHandlesClearance() {
        val tree = read(
            header = { Field("Search this sheet", Modifier.padding(horizontal = 16.dp)) },
            panel = { Box(modifier = Modifier.fillMaxSize()) }
        )
        tree.assertSheet()
        assertEquals("the sheet draws no handle", true, tree.drawsHandle())
        val at = tree.placed(tree.named("Search this sheet").bounds)
        println("Decision 14 Android, panel header under a handle: its field ${at.down} from the sheet's top, ${at.down - 8f} from the handle's centre")
        assertEquals("the header's field is ${at.down} from the sheet's top", 20f, at.down, 0.5f)
    }

    /** Without a handle the shell supplies a 16dp top inset for the header. */
    @Test
    fun withASingleDetentThePanelHeaderKeepsTheTopInset() {
        val tree = read(
            detents = listOf(KozmosMapPanelDetent.Medium),
            header = { Field("Search this sheet", Modifier.padding(horizontal = 16.dp)) },
            panel = { Box(modifier = Modifier.fillMaxSize()) }
        )
        tree.assertSheet()
        assertEquals("a single detent draws a handle", false, tree.drawsHandle())
        val at = tree.placed(tree.named("Search this sheet").bounds)
        println("Decision 14 Android, panel header in a single-detent sheet: its field ${at.down} from the sheet's top")
        assertEquals("the header's field is ${at.down} from the sheet's top", 16f, at.down, 0.5f)
    }

    /**
     * A browser the product puts under its own row is not the panel's top, and
     * the product says so: told the panel leaves nothing above it, it keeps its
     * 16 under the row.
     */
    @Test
    fun aBrowserUnderAProductsOwnRowToldItIsNotTheTopKeepsItsPadding() {
        val tree = read(panel = {
            Column {
                Field("Your row", Modifier.padding(top = 8.dp))
                CompositionLocalProvider(
                    LocalKozmosPanelInsetTop provides 0.dp,
                    LocalKozmosPanelClearanceTop provides 0.dp
                ) { Browser() }
            }
        })
        val under = (tree.named("Search places").bounds.top - tree.named("Your row").bounds.bottom) / density
        println("Decision 14 Android, browser under a product's row: the search field $under under the row")
        assertEquals("the search field is $under under the product's row", 16f, under, 0.5f)
    }

    // A result list

    /**
     * A result list brings no top padding of its own, yet natively its first
     * result already starts under the handle's row by its announcement's 1dp and
     * the list's 12 — clear of the handle's circle: at least 20 from the top.
     * The web's list started flush under the grip, and keeps its clearance now.
     */
    @Test
    fun underAHandleAHostedResultListKeepsItsFirstResultClear() {
        val items = (1..4).map { index ->
            KozmosPOIResultListItem(
                poi = KozmosPOIPresentation(id = "result-$index", name = "Result $index", floorId = "1", floorLabel = "Level one"),
                result = KozmosPOIResultPresentation(poiId = "result-$index", resultIndex = index, floorId = "1")
            )
        }
        val tree = read(panel = { KozmosPOIResultList(items = items, resultCountLabel = "4 results", onSelect = {}) })
        tree.assertSheet()
        val first = tree.merged.first { it.description?.startsWith("Result 1") == true }
        val at = tree.placed(first.bounds)
        println("Decision 14 Android, result list under a handle: the first result ${at.down} from the top")
        assertTrue("the first result is ${at.down} from the sheet's top, inside the handle's circle", at.down >= 20f - 0.5f)
    }
}
