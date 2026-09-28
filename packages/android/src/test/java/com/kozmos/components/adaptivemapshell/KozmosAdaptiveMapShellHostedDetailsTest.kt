package com.kozmos.components.adaptivemapshell

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import app.cash.paparazzi.DeviceConfig
import com.kozmos.components.ReadSemantics
import com.kozmos.components.poidetailpanel.KozmosPOIDetailPanel
import com.kozmos.components.poidetailpanel.KozmosPOIDetailPanelPresentation
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.contracts.KozmosPOIAction
import com.kozmos.contracts.KozmosPOIPresentation
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

/**
 * GAP-083 (row 82), found on the MAP-474 boards: hosted in the shell's panel,
 * the details card's close button sat further from the panel's top than from
 * its side. The card's header pads 16 on every side, and a sheet that draws a
 * handle already leaves the handle's 16dp row above its content: 32 down and
 * 16 in. Each case is laid out as a device lays it out, and the button's
 * bounds read against the panel's as TalkBack is given them.
 */
class KozmosAdaptiveMapShellHostedDetailsTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    private var density = 1f

    private val poi = KozmosPOIPresentation(
        id = "harbour-coffee",
        name = "Harbour Coffee Co.",
        floorId = "2",
        floorLabel = "Level 2",
        actions = listOf(KozmosPOIAction.Favourite, KozmosPOIAction.Bookmark)
    )

    /** The card as a product hosts it: favourite and save, and its close button. */
    @Composable
    private fun Card(presentation: KozmosPOIDetailPanelPresentation) {
        KozmosPOIDetailPanel(
            poi = poi,
            actionLabels = mapOf(KozmosPOIAction.Favourite to "Favourite", KozmosPOIAction.Bookmark to "Save"),
            onAction = { _, _ -> },
            onClose = {},
            presentation = presentation
        )
    }

    private fun read(
        presentation: KozmosPOIDetailPanelPresentation = KozmosPOIDetailPanelPresentation.Sheet,
        detents: List<KozmosMapPanelDetent> = KozmosDefaultPanelDetents,
        detent: KozmosMapPanelDetent = KozmosMapPanelDetent.Medium,
        direction: LayoutDirection = LayoutDirection.Ltr,
        header: (@Composable () -> Unit)? = null
    ): ReadSemantics = paparazzi.readSemantics {
        density = LocalDensity.current.density
        CompositionLocalProvider(LocalLayoutDirection provides direction) {
            MaterialTheme {
                KozmosAdaptiveMapShell(
                    map = { Box(modifier = Modifier.fillMaxSize()) },
                    panel = { Card(presentation) },
                    panelHeader = header,
                    panelDetents = detents,
                    panelDetent = detent
                )
            }
        }
    }

    /** In dp: how far the close button sits from the panel's top edge, and from its end edge — the left, right to left. */
    private data class Placed(val down: Float, val inward: Float)

    private fun ReadSemantics.closeButton(direction: LayoutDirection = LayoutDirection.Ltr): Placed {
        val panel = named("Map details").bounds
        val close = named("Close details").bounds
        assertEquals("not the close button's 44dp target: $close", 44f, close.width / density, 0.5f)
        return Placed(
            down = (close.top - panel.top) / density,
            inward = (if (direction == LayoutDirection.Rtl) close.left - panel.left else panel.right - close.right) / density
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

    // A sheet

    /**
     * Under a handle: the button sat 32 from the sheet's top — the handle's
     * 16dp row and the header's own 16 — and 16 from its side. The card tops
     * its header up to 16 instead of adding 16 to the row, and keeps the
     * handle's clearance: 4dp, so the handle's 16dp target keeps its WCAG
     * 2.5.8 spacing, as the web's does. 20 and 16.
     */
    @Test
    fun underAHandleTheCloseButtonSitsAsFarDownAsInPlusTheHandlesClearance() {
        val tree = read()
        tree.assertSheet()
        assertEquals("the sheet draws no handle", true, tree.drawsHandle())
        val at = tree.closeButton()
        println("GAP-083 Android, sheet with a handle: the close button ${at.down} from the top, ${at.inward} from the side")
        assertEquals("the close button is ${at.down} from the sheet's top and ${at.inward} from its side", at.inward + 4f, at.down, 0.5f)
        assertEquals("the close button is ${at.inward} from the sheet's side", 16f, at.inward, 0.5f)
    }

    /** A single detent draws no handle, so the sheet leaves nothing above the card and its header keeps its own 16. */
    @Test
    fun aSingleDetentSheetDrawsNoHandleAndTheCardKeepsItsOwnPadding() {
        val tree = read(detents = listOf(KozmosMapPanelDetent.Medium))
        tree.assertSheet()
        assertEquals("a single detent draws a handle", false, tree.drawsHandle())
        val at = tree.closeButton()
        println("GAP-083 Android, single-detent sheet: the close button ${at.down} from the top, ${at.inward} from the side")
        assertEquals("the close button is ${at.down} from the sheet's top and ${at.inward} from its side", at.inward, at.down, 0.5f)
        assertEquals("the close button is ${at.inward} from the sheet's side", 16f, at.inward, 0.5f)
    }

    /** Under a panel header the space above the card is the header, not empty, so the card keeps its own 16 under it. */
    @Test
    fun underAPanelHeaderTheCardKeepsItsOwnPadding() {
        val tree = read(detent = KozmosMapPanelDetent.Large) {
            Box(modifier = Modifier.fillMaxWidth().height(56.dp).semantics { contentDescription = "Search places" })
        }
        tree.assertSheet()
        assertEquals("the sheet draws no handle", true, tree.drawsHandle())
        val header = tree.named("Search places").bounds
        val under = (tree.named("Close details").bounds.top - header.bottom) / density
        val at = tree.closeButton()
        println("GAP-083 Android, under a panel header: the close button $under under the header, ${at.inward} from the side")
        assertEquals("the close button is $under under the panel header", 16f, under, 0.5f)
        assertEquals("the close button is ${at.inward} from the sheet's side", 16f, at.inward, 0.5f)
    }

    /**
     * An inline card keeps its own padding wherever it is placed: in the
     * sheet, under the handle, its button still sits 32 down — the
     * presentation for a card lower in the panel than its top.
     */
    @Test
    fun anInlineCardKeepsItsOwnPaddingUnderTheHandle() {
        val tree = read(presentation = KozmosPOIDetailPanelPresentation.Inline)
        tree.assertSheet()
        assertEquals("the sheet draws no handle", true, tree.drawsHandle())
        val at = tree.closeButton()
        println("GAP-083 Android, inline card under a handle: the close button ${at.down} from the top, ${at.inward} from the side")
        assertEquals("the inline card's close button is ${at.down} from the sheet's top", 32f, at.down, 0.5f)
        assertEquals("the inline card's close button is ${at.inward} from the sheet's side", 16f, at.inward, 0.5f)
    }

    /**
     * A card in its panel presentation draws its own bordered surface, so the
     * handle's row lies outside its border, not inside it. Topped up to the
     * row, its header met its own top border — the close button 4 under the
     * line; the web's visual review caught the same at 0, in a side panel. It
     * keeps its 16 inside the border, as the inline card does: the button 16
     * under the card's top edge, which is under the row.
     */
    @Test
    fun underAHandleABorderedPanelCardKeepsItsPaddingInsideItsBorder() {
        val tree = read(presentation = KozmosPOIDetailPanelPresentation.Panel)
        tree.assertSheet()
        assertEquals("the sheet draws no handle", true, tree.drawsHandle())
        val card = tree.named(poi.name).bounds
        val sheet = tree.named("Map details").bounds
        assertEquals("the card does not start under the handle's row", 16f, (card.top - sheet.top) / density, 0.5f)
        val under = (tree.named("Close details").bounds.top - card.top) / density
        val at = tree.closeButton()
        println("GAP-083 Android, panel card under a handle: the close button $under under the card's top edge, ${at.inward} from the side")
        assertEquals("the panel card's close button is $under under its own top edge", 16f, under, 0.5f)
        assertEquals("the panel card's close button is ${at.inward} from the sheet's side", 16f, at.inward, 0.5f)
    }

    // Beside the map

    /** The surfaceless card, which products host beside the map too, keeps its 16 there as well. */
    @Test
    fun inASidePanelTheSurfacelessCardSitsAsFarDownAsIn() {
        paparazzi.unsafeUpdateConfig(deviceConfig = DeviceConfig.PIXEL_C)
        val tree = read(presentation = KozmosPOIDetailPanelPresentation.Sheet)
        tree.assertSidePanel()
        val at = tree.closeButton()
        println("GAP-083 Android, side panel, surfaceless card: the close button ${at.down} from the top, ${at.inward} from the end")
        assertEquals("the close button is ${at.down} from the panel's top and ${at.inward} from its end", at.inward, at.down, 0.5f)
        assertEquals("the close button is ${at.inward} from the panel's end", 16f, at.inward, 0.5f)
    }

    /**
     * A native side panel leaves nothing above its content — the web's keeps
     * 16 there — so the card keeps its own 16: the button 16 from the
     * panel's top and 16 from its end.
     */
    @Test
    fun inASidePanelTheCloseButtonSitsAsFarDownAsIn() {
        paparazzi.unsafeUpdateConfig(deviceConfig = DeviceConfig.PIXEL_C)
        val tree = read(presentation = KozmosPOIDetailPanelPresentation.Panel)
        tree.assertSidePanel()
        val at = tree.closeButton()
        println("GAP-083 Android, side panel: the close button ${at.down} from the top, ${at.inward} from the end")
        assertEquals("the close button is ${at.down} from the panel's top and ${at.inward} from its end", at.inward, at.down, 0.5f)
        assertEquals("the close button is ${at.inward} from the panel's end", 16f, at.inward, 0.5f)
    }

    // What the shell tells its content

    /** What the panel's content is told the panel leaves above it, and asked to keep clear below that. */
    private fun told(
        detents: List<KozmosMapPanelDetent> = KozmosDefaultPanelDetents,
        header: (@Composable () -> Unit)? = null
    ): Pair<Dp, Dp> {
        var inset = Dp.Unspecified
        var clearance = Dp.Unspecified
        paparazzi.readSemantics {
            MaterialTheme {
                KozmosAdaptiveMapShell(
                    map = { Box(modifier = Modifier.fillMaxSize()) },
                    panel = {
                        inset = LocalKozmosPanelInsetTop.current
                        clearance = LocalKozmosPanelClearanceTop.current
                        Box(modifier = Modifier.fillMaxSize())
                    },
                    panelHeader = header,
                    panelDetents = detents
                )
            }
        }
        return inset to clearance
    }

    /** Under a handle: its 16dp row, and 4 more for its target's spacing. */
    @Test
    fun underAHandleTheContentIsToldTheRowAndItsClearance() {
        assertEquals(16.dp to 4.dp, told())
    }

    /** A single detent draws no handle: nothing is left above the content. */
    @Test
    fun withASingleDetentTheContentIsToldNothing() {
        assertEquals(0.dp to 0.dp, told(detents = listOf(KozmosMapPanelDetent.Medium)))
    }

    /** A panel header sits in the handle's place: the space above the content is the header. */
    @Test
    fun underAPanelHeaderTheContentIsToldNothing() {
        assertEquals(0.dp to 0.dp, told { Box(modifier = Modifier.fillMaxWidth().height(56.dp)) })
    }

    /** A side panel starts its content at its top edge. */
    @Test
    fun besideTheMapTheContentIsToldNothing() {
        paparazzi.unsafeUpdateConfig(deviceConfig = DeviceConfig.PIXEL_C)
        assertEquals(0.dp to 0.dp, told())
    }

    /** Right to left the panel's end is its left edge. */
    @Test
    fun rightToLeftTheSidePanelsCloseButtonSitsAsFarDownAsFromTheLeft() {
        paparazzi.unsafeUpdateConfig(deviceConfig = DeviceConfig.PIXEL_C)
        val tree = read(presentation = KozmosPOIDetailPanelPresentation.Panel, direction = LayoutDirection.Rtl)
        tree.assertSidePanel()
        val panel = tree.named("Map details").bounds
        assertEquals("right to left, the side panel is not on the left", 16f, panel.left / density, 0.5f)
        val at = tree.closeButton(LayoutDirection.Rtl)
        println("GAP-083 Android, side panel right to left: the close button ${at.down} from the top, ${at.inward} from the left")
        assertEquals("the close button is ${at.down} from the panel's top and ${at.inward} from its left", at.inward, at.down, 0.5f)
        assertEquals("the close button is ${at.inward} from the panel's left", 16f, at.inward, 0.5f)
    }
}
