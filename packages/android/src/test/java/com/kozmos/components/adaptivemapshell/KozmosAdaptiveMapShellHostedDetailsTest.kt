package com.kozmos.components.adaptivemapshell

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
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
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.contracts.KozmosPOIAction
import com.kozmos.contracts.KozmosPOIPresentation
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
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

    /** The card as a product hosts it: favourite and save, or [toggles], and its close button. */
    @Composable
    private fun Card(
        presentation: KozmosPOIDetailPanelPresentation,
        toggles: List<KozmosPOIAction> = poi.actions
    ) {
        KozmosPOIDetailPanel(
            poi = poi.copy(actions = toggles),
            actionLabels = mapOf(KozmosPOIAction.Favourite to "Favourite", KozmosPOIAction.Bookmark to "Save"),
            onAction = { _, _ -> },
            onClose = {},
            presentation = presentation
        )
    }

    /** A phone [widthDp] wide, as the default device is drawn: 3 pixels to the dp, 640 tall. */
    private fun phone(widthDp: Int) = DeviceConfig.NEXUS_5.copy(screenWidth = widthDp * 3)

    private fun read(
        presentation: KozmosPOIDetailPanelPresentation = KozmosPOIDetailPanelPresentation.Sheet,
        detents: List<KozmosMapPanelDetent> = KozmosDefaultPanelDetents,
        detent: KozmosMapPanelDetent = KozmosMapPanelDetent.Medium,
        direction: LayoutDirection = LayoutDirection.Ltr,
        toggles: List<KozmosPOIAction> = poi.actions,
        header: (@Composable () -> Unit)? = null
    ): ReadSemantics = paparazzi.readSemantics {
        density = LocalDensity.current.density
        CompositionLocalProvider(LocalLayoutDirection provides direction) {
            KozmosMaterialTheme {
                KozmosAdaptiveMapShell(
                    map = { Box(modifier = Modifier.fillMaxSize()) },
                    panel = { Card(presentation, toggles) },
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
     * 16dp row and the header's own 16 — and 16 from its side. The card then
     * topped its header up to 16 instead of adding 16 to the row, and kept
     * the handle's 4dp clearance too: 20 and 16. Decision 51: the header
     * takes the 4 back wherever its buttons stay clear of the handle's target
     * anyway, and on a phone they do — at 360 (the default device), 390 and
     * 430 wide, 16 and 16.
     */
    @Test
    fun underAHandleOnAPhoneTheCloseButtonSitsAsFarDownAsIn() {
        for (width in listOf(360, 390, 430)) {
            paparazzi.unsafeUpdateConfig(deviceConfig = phone(width))
            val tree = read()
            tree.assertSheet()
            assertEquals("$width: the sheet's width", width.toFloat(), tree.named("Map details").bounds.width / density, 0.5f)
            assertEquals("$width: the sheet draws no handle", true, tree.drawsHandle())
            val at = tree.closeButton()
            println("Decision 51 Android, $width wide under a handle: the close button ${at.down} from the top, ${at.inward} from the side")
            assertEquals("$width wide: the close button is ${at.down} from the sheet's top and ${at.inward} from its side", 16f, at.down, 0.5f)
            assertEquals("$width wide: the close button is ${at.inward} from the sheet's side", 16f, at.inward, 0.5f)
        }
    }

    /** Where the header's buttons sit against the handle's 24dp circle, in dp: each one's distance from the handle's centre as drawn, and flush under the handle's row. */
    private data class Clearance(val drawn: Map<String, Float>, val flush: Map<String, Float>) {
        /** Whether, flush under the handle's row, every button would stay out of the circle. */
        val flushClears get() = flush.values.all { it >= 12f }
    }

    /**
     * The handle's target is its whole 16dp row, "Panel height", and WCAG
     * 2.5.8 keeps a 24dp circle on its centre clear of every other target.
     * Where each of [names] sits across the sheet does not depend on the
     * header's top padding, so how far it would be from the centre flush
     * under the row is read off the same bounds.
     */
    private fun ReadSemantics.clearance(names: List<String>): Clearance {
        val handle = named("Panel height").bounds
        val cx = handle.center.x
        val cy = handle.center.y
        fun distance(dx: Float, dy: Float) = kotlin.math.hypot(dx, dy) / density
        val drawn = mutableMapOf<String, Float>()
        val flush = mutableMapOf<String, Float>()
        for (name in names) {
            val b = named(name).bounds
            val dx = maxOf(b.left - cx, 0f, cx - b.right)
            drawn[name] = distance(dx, maxOf(b.top - cy, 0f, cy - b.bottom))
            flush[name] = distance(dx, handle.bottom - cy)
        }
        return Clearance(drawn, flush)
    }

    /**
     * Decision 51's rule, from what is drawn at each width rather than from
     * the widths it gives: the header sits flush under the handle's row —
     * 16 from the top — wherever its buttons would then stay out of the
     * handle's circle, and keeps the handle's 4dp clearance — 20 — wherever
     * they would not; and at every width no button meets the circle. Flush,
     * the buttons' top edge is 8 under the handle's centre, so the favourite,
     * the first of three 44dp buttons 6 apart 16 in from the end, must start
     * √(12² − 8²) ≈ 8.9 past the middle: from 338 wide. Below, it meets the
     * circle at a tangent at most: at 320 it starts at the sheet's middle.
     */
    @Test
    fun theHeaderKeepsTheHandlesClearanceOnlyWhereItsButtonsWouldMeetTheHandlesCircle() {
        val expected = mapOf(320 to 20f, 330 to 20f, 337 to 20f, 338 to 16f, 339 to 16f, 350 to 16f, 375 to 16f, 412 to 16f, 440 to 16f)
        for ((width, down) in expected) {
            paparazzi.unsafeUpdateConfig(deviceConfig = phone(width))
            val tree = read()
            assertEquals("$width: the sheet draws no handle", true, tree.drawsHandle())
            val clearance = tree.clearance(listOf("Favourite", "Save", "Close details"))
            val at = tree.closeButton()
            println("Decision 51 Android, $width wide: the close button ${at.down} from the top; from the handle's centre ${clearance.drawn}, flush ${clearance.flush}")
            assertEquals(
                "$width wide: flush under the row the buttons would ${if (clearance.flushClears) "clear" else "meet"} the circle ${clearance.flush}",
                down == 16f, clearance.flushClears
            )
            assertEquals("$width wide: the close button is ${at.down} from the sheet's top", down, at.down, 0.5f)
            assertEquals("$width wide: the close button is ${at.inward} from the sheet's side", 16f, at.inward, 0.5f)
            for ((name, distance) in clearance.drawn) {
                assertTrue("$width wide: $name is $distance from the handle's centre, inside its 24dp circle", distance >= 12f - 0.01f)
            }
        }
    }

    /** Fewer buttons reach the circle only on narrower sheets: a toggle and close under 238 wide, close alone under 138. */
    @Test
    fun withFewerButtonsTheHeaderKeepsEqualInsetsOnNarrowerSheets() {
        val cases = listOf(
            Triple(listOf(KozmosPOIAction.Favourite), 237, 20f),
            Triple(listOf(KozmosPOIAction.Favourite), 238, 16f),
            Triple(emptyList<KozmosPOIAction>(), 137, 20f),
            Triple(emptyList<KozmosPOIAction>(), 138, 16f)
        )
        for ((toggles, width, down) in cases) {
            paparazzi.unsafeUpdateConfig(deviceConfig = phone(width))
            val tree = read(toggles = toggles)
            val name = "${if (toggles.isEmpty()) "close alone" else "${toggles.size + 1} buttons"}, $width wide"
            assertEquals("$name: the sheet draws no handle", true, tree.drawsHandle())
            val buttons = listOf("Favourite", "Close details").takeLast(toggles.size + 1)
            val clearance = tree.clearance(buttons)
            val at = tree.closeButton()
            println("Decision 51 Android, $name: the close button ${at.down} from the top; from the handle's centre ${clearance.drawn}")
            assertEquals("$name: the close button is ${at.down} from the sheet's top", down, at.down, 0.5f)
            for ((button, distance) in clearance.drawn) {
                assertTrue("$name: $button is $distance from the handle's centre, inside its 24dp circle", distance >= 12f - 0.01f)
            }
        }
    }

    /** Right to left the buttons stand at the header's left end; the circle is the same. */
    @Test
    fun rightToLeftUnderAHandleTheCloseButtonSitsAsFarDownAsFromTheLeft() {
        for ((width, down) in listOf(390 to 16f, 338 to 16f, 337 to 20f, 320 to 20f)) {
            paparazzi.unsafeUpdateConfig(deviceConfig = phone(width))
            val tree = read(direction = LayoutDirection.Rtl)
            assertEquals("$width: the sheet draws no handle", true, tree.drawsHandle())
            val clearance = tree.clearance(listOf("Favourite", "Save", "Close details"))
            val at = tree.closeButton(LayoutDirection.Rtl)
            println("Decision 51 Android, right to left, $width wide: the close button ${at.down} from the top, ${at.inward} from the left")
            assertEquals("right to left, $width wide: the close button is ${at.down} from the sheet's top", down, at.down, 0.5f)
            assertEquals("right to left, $width wide: the close button is ${at.inward} from the sheet's left", 16f, at.inward, 0.5f)
            for ((name, distance) in clearance.drawn) {
                assertTrue("right to left, $width wide: $name is $distance from the handle's centre", distance >= 12f - 0.01f)
            }
        }
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
     * A bordered card keeps its own 16 inside its border, in addition to
     * the shell's 16 above the card. Surfaceless cards consume that inset.
     */
    @Test
    fun inASidePanelTheBorderedCardKeepsItsInternalPadding() {
        paparazzi.unsafeUpdateConfig(deviceConfig = DeviceConfig.PIXEL_C)
        val tree = read(presentation = KozmosPOIDetailPanelPresentation.Panel)
        tree.assertSidePanel()
        val at = tree.closeButton()
        println("GAP-083 Android, side panel: the close button ${at.down} from the top, ${at.inward} from the end")
        assertEquals("the bordered card keeps its own top padding below the shell inset", at.inward + 16f, at.down, 0.5f)
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
            KozmosMaterialTheme {
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

    /** A single detent draws no handle: the shell supplies the top inset. */
    @Test
    fun withASingleDetentTheContentIsToldTheTopInset() {
        assertEquals(16.dp to 0.dp, told(detents = listOf(KozmosMapPanelDetent.Medium)))
    }

    /** The header supplies a 16dp gap below itself. */
    @Test
    fun underAPanelHeaderTheContentIsToldTheGap() {
        assertEquals(16.dp to 0.dp, told { Box(modifier = Modifier.fillMaxWidth().height(56.dp)) })
    }

    /** A side panel supplies the same top inset as a gripless sheet. */
    @Test
    fun besideTheMapTheContentIsToldTheTopInset() {
        paparazzi.unsafeUpdateConfig(deviceConfig = DeviceConfig.PIXEL_C)
        assertEquals(16.dp to 0.dp, told())
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
        assertEquals("the RTL bordered card keeps its own padding below the shell inset", at.inward + 16f, at.down, 0.5f)
        assertEquals("the close button is ${at.inward} from the panel's left", 16f, at.inward, 0.5f)
    }
}
