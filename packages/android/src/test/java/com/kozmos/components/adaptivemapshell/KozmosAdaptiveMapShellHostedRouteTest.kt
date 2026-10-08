package com.kozmos.components.adaptivemapshell

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import app.cash.paparazzi.DeviceConfig
import com.kozmos.components.ReadNode
import com.kozmos.components.ReadSemantics
import com.kozmos.components.readSemantics
import com.kozmos.components.routepreviewpanel.KozmosRoutePreviewPanel
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.contracts.KozmosRouteOptionPresentation
import com.kozmos.contracts.KozmosRoutePreference
import com.kozmos.contracts.KozmosRouteReadiness
import com.kozmos.docsnippets.RoutePreviewSheet
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

/**
 * Decision 14 (2026-09-27): every part at the top of the shell's panel keeps
 * the handle's 4dp and tops its own 16 up to what the panel leaves above it
 * rather than adding to it, as the details card (GAP-083) and the category
 * browser (#135) do. The route preview's destination row padded 16 on every
 * side under the handle's 16dp row: its label 32 down and 16 in. Each case is
 * laid out as a device lays it out, and read as TalkBack is given it.
 */
class KozmosAdaptiveMapShellHostedRouteTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    private var density = 1f

    private val destination = "Harbour Coffee Co."

    /** Two ways there, the quicker one chosen, as a route preview opens. */
    private val options = listOf(
        KozmosRouteOptionPresentation(
            id = "quickest", label = "Quickest", durationSeconds = 240.0, durationLabel = "4 min",
            distanceMetres = 150.0, distanceLabel = "150 m", preference = KozmosRoutePreference.Quickest,
            selected = true
        ),
        KozmosRouteOptionPresentation(
            id = "step-free", label = "Step-free", durationSeconds = 360.0, durationLabel = "6 min",
            distanceMetres = 173.0, distanceLabel = "173 m", preference = KozmosRoutePreference.StepFree
        )
    )

    /** A 44dp stand-in for a product's own row, read by its name. */
    @Composable
    private fun Field(name: String, modifier: Modifier = Modifier) {
        Box(modifier = modifier.fillMaxWidth().height(44.dp).semantics { contentDescription = name })
    }

    /** The route preview as a product hosts it: the panel's whole content. */
    @Composable
    private fun Route() {
        KozmosRoutePreviewPanel(
            destinationName = destination,
            options = options,
            status = KozmosRouteReadiness.Ready,
            backLabel = "Back",
            continueLabel = "Start",
            onOptionSelect = {},
            onBack = {},
            onContinue = {}
        )
    }

    private fun read(
        detents: List<KozmosMapPanelDetent> = KozmosDefaultPanelDetents,
        detent: KozmosMapPanelDetent = KozmosMapPanelDetent.Medium,
        direction: LayoutDirection = LayoutDirection.Ltr,
        header: (@Composable () -> Unit)? = null,
        panel: @Composable () -> Unit = { Route() }
    ): ReadSemantics = paparazzi.readSemantics {
        density = LocalDensity.current.density
        CompositionLocalProvider(LocalLayoutDirection provides direction) {
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
    }

    /** The one text node that reads [value]. */
    private fun ReadSemantics.text(value: String): ReadNode {
        val found = merged.filter { it.texts == listOf(value) }
        check(found.size == 1) { "expected one text \"$value\", found ${found.size}" }
        return found.single()
    }

    /** The destination label, the first line of the preview's first row: "To", as the panel draws it. */
    private fun ReadSemantics.label(): ReadNode = text("TO")

    /** In dp: how far the destination label sits from the panel's top edge, and from its start edge — the right, right to left. */
    private data class Placed(val down: Float, val inward: Float)

    private fun ReadSemantics.placed(direction: LayoutDirection = LayoutDirection.Ltr, panelName: String = "Map details"): Placed {
        val panel = named(panelName).bounds
        val label = label().bounds
        return Placed(
            down = (label.top - panel.top) / density,
            inward = (if (direction == LayoutDirection.Rtl) panel.right - label.right else label.left - panel.left) / density
        )
    }

    private fun ReadSemantics.drawsHandle() = names().contains("Panel height")

    /** Docked: the panel runs the phone's whole width. */
    private fun ReadSemantics.assertSheet(panelName: String = "Map details") {
        assertEquals("not the docked sheet", merged.first().bounds.width, named(panelName).bounds.width, 0.5f)
    }

    /** Beside the map, not docked: the panel is 416dp of the tablet's width, with no handle. */
    private fun ReadSemantics.assertSidePanel() {
        assertEquals("not the side panel", 416f, named("Map details").bounds.width / density, 0.5f)
        assertEquals("the side panel draws a handle", false, drawsHandle())
    }

    // Under a handle

    /**
     * The docs' snippet (RoutePreviewPanel.mdx), drawn: the route preview as
     * the sheet's whole content, at the shell's default detents. Its
     * destination row padded 16 under the handle's 16dp row: the label 32
     * down and 16 in. The row tops its padding up to 16 instead of adding 16
     * to the row, and keeps the handle's clearance: 20 and 16, as the web's
     * 21 and 17 and iOS's 20 and 16.
     */
    @Test
    fun underAHandleTheDestinationRowSitsAsFarDownAsInPlusTheHandlesClearance() {
        val tree = paparazzi.readSemantics {
            density = LocalDensity.current.density
            KozmosMaterialTheme {
                RoutePreviewSheet(
                    destination = destination,
                    options = options,
                    status = KozmosRouteReadiness.Ready,
                    map = { Box(modifier = Modifier.fillMaxSize()) },
                    onSelect = {},
                    onBack = {},
                    onStart = {}
                )
            }
        }
        tree.assertSheet(panelName = "Directions")
        assertEquals("the sheet draws no handle", true, tree.drawsHandle())
        val at = tree.placed(panelName = "Directions")
        println("Decision 14 Android, route preview under a handle: the destination label ${at.down} from the top, ${at.inward} from the side")
        assertEquals("the destination label is ${at.inward} from the sheet's side", 16f, at.inward, 0.5f)
        assertEquals("the destination label is ${at.down} from the sheet's top and ${at.inward} from its side", at.inward + 4f, at.down, 0.5f)
    }

    /**
     * Only the first row tops up: the options sit under the destination row,
     * not under the handle — the row's 16 under the destination's name, its
     * rule's 1, the options' own 16.
     */
    @Test
    fun theOptionsUnderTheDestinationRowKeepTheir16() {
        val tree = read()
        val under = (tree.named("Route options").bounds.top - tree.text(destination).bounds.bottom) / density
        println("Decision 14 Android, options under the destination row: $under below the destination's name")
        assertEquals("the options are $under below the destination's name", 16f + 1f + 16f, under, 0.5f)
    }

    // No handle, a panel header, beside the map

    /** A single detent draws no handle, so the sheet leaves nothing above the preview and its row keeps its own 16. */
    @Test
    fun aSingleDetentSheetDrawsNoHandleAndTheRouteKeepsItsOwnPadding() {
        val tree = read(detents = listOf(KozmosMapPanelDetent.Medium))
        tree.assertSheet()
        assertEquals("a single detent draws a handle", false, tree.drawsHandle())
        val at = tree.placed()
        println("Decision 14 Android, route preview in a single-detent sheet: the destination label ${at.down} from the top, ${at.inward} from the side")
        assertEquals("the destination label is ${at.down} from the sheet's top and ${at.inward} from its side", at.inward, at.down, 0.5f)
        assertEquals("the destination label is ${at.inward} from the sheet's side", 16f, at.inward, 0.5f)
    }

    /** Under a panel header the space above the preview is the header, not empty: the preview keeps its own 16 under it. */
    @Test
    fun underAPanelHeaderTheRouteKeepsItsOwnPadding() {
        val tree = read(detent = KozmosMapPanelDetent.Large, header = { Field("Your header") })
        tree.assertSheet()
        val under = (tree.label().bounds.top - tree.named("Your header").bounds.bottom) / density
        println("Decision 14 Android, route preview under a panel header: the destination label $under under the header")
        assertEquals("the destination label is $under under the panel header", 16f, under, 0.5f)
    }

    /**
     * A native side panel leaves nothing above its content — the web's keeps
     * 16 there — so the preview keeps its own 16: the label 16 from the
     * panel's top and 16 from its start.
     */
    @Test
    fun inASidePanelTheDestinationRowSitsAsFarDownAsIn() {
        paparazzi.unsafeUpdateConfig(deviceConfig = DeviceConfig.PIXEL_C)
        val tree = read()
        tree.assertSidePanel()
        val at = tree.placed()
        println("Decision 14 Android, route preview in a side panel: the destination label ${at.down} from the top, ${at.inward} from the start")
        assertEquals("the destination label is ${at.down} from the panel's top and ${at.inward} from its start", at.inward, at.down, 0.5f)
        assertEquals("the destination label is ${at.inward} from the panel's start", 16f, at.inward, 0.5f)
    }

    /** Right to left the panel's start is its right edge. */
    @Test
    fun rightToLeftTheSidePanelsDestinationRowSitsAsFarDownAsFromTheRight() {
        paparazzi.unsafeUpdateConfig(deviceConfig = DeviceConfig.PIXEL_C)
        val tree = read(direction = LayoutDirection.Rtl)
        tree.assertSidePanel()
        val at = tree.placed(LayoutDirection.Rtl)
        println("Decision 14 Android, route preview in a side panel right to left: the destination label ${at.down} from the top, ${at.inward} from the right")
        assertEquals("the destination label is ${at.down} from the panel's top and ${at.inward} from its right", at.inward, at.down, 0.5f)
        assertEquals("the destination label is ${at.inward} from the panel's right", 16f, at.inward, 0.5f)
    }

    /**
     * A route preview the product puts under its own row is not the panel's
     * top, and the product says so: told the panel leaves nothing above it,
     * it keeps its 16 under the row.
     */
    @Test
    fun aRouteUnderAProductsOwnRowToldItIsNotTheTopKeepsItsPadding() {
        val tree = read(panel = {
            Column {
                Field("Your row", Modifier.padding(top = 8.dp))
                CompositionLocalProvider(
                    LocalKozmosPanelInsetTop provides 0.dp,
                    LocalKozmosPanelClearanceTop provides 0.dp
                ) { Route() }
            }
        })
        val under = (tree.label().bounds.top - tree.named("Your row").bounds.bottom) / density
        println("Decision 14 Android, route preview under a product's row: the destination label $under under the row")
        assertEquals("the destination label is $under under the product's row", 16f, under, 0.5f)
    }
}
