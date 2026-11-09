package com.kozmos.components.drawer

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
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
import com.kozmos.components.ReadNode
import com.kozmos.components.ReadSemantics
import com.kozmos.components.readSettledSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * GAP-198, decisions 139 and 148: `placement = Inline` draws the drawer in
 * its box with no scrim, a panel beside the page, as React's
 * `placement="inline"` has since 0.15.0 (#433). A left or right one floats:
 * 16 from every edge it reaches, 420 wide or the region less 16 each side, as
 * tall as its content up to the region less 16 above and below, and then it
 * scrolls. Read from the laid-out bounds, in dp, so nothing here is a golden.
 */
class KozmosDrawerInlineTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    private var density = 1f

    private fun read(
        width: Int = 800,
        height: Int = 600,
        side: KozmosDrawerSide = KozmosDrawerSide.Right,
        placement: KozmosDrawerPlacement = KozmosDrawerPlacement.Inline,
        contentHeight: Int = 100,
        direction: LayoutDirection = LayoutDirection.Ltr
    ): ReadSemantics {
        paparazzi.unsafeUpdateConfig(deviceConfig = DeviceConfig.PIXEL_C)
        return paparazzi.readSettledSemantics {
            density = LocalDensity.current.density
            CompositionLocalProvider(LocalLayoutDirection provides direction) {
                KozmosMaterialTheme {
                    Box(Modifier.size(width.dp, height.dp).semantics { contentDescription = "Region" }) {
                        KozmosDrawer(
                            open = true,
                            onDismissRequest = {},
                            side = side,
                            placement = placement,
                            label = "Get started",
                            drawerContent = {
                                Box(Modifier.fillMaxWidth().height(contentHeight.dp).semantics { contentDescription = "Body" })
                            }
                        ) {
                            Box(Modifier.fillMaxSize().semantics { contentDescription = "Page" })
                        }
                    }
                }
            }
        }
    }

    private fun ReadNode.dp() = Rect(bounds.left / density, bounds.top / density, bounds.right / density, bounds.bottom / density)
    private fun ReadSemantics.panel() = merged.first { it.paneTitle == "Get started" }

    @Test fun aRightInlineDrawerFloatsSixteenFromItsEdgesAsTallAsItsContent() {
        val tree = read()
        val region = tree.named("Region").dp()
        val panel = tree.panel().dp()
        val body = tree.named("Body").dp()
        assertEquals("16 from the right", 16f, region.right - panel.right, 1f)
        assertEquals("16 from the top", 16f, panel.top - region.top, 1f)
        assertEquals("420 wide", 420f, panel.width, 1f)
        assertEquals("as tall as its content and its 24 padding", 24f, panel.bottom - body.bottom, 1f)
    }

    @Test fun inANarrowRegionItIsTheRegionLessSixteenEachSide() {
        val panel = read(width = 360).panel().dp()
        assertEquals(328f, panel.width, 1f)
    }

    @Test fun tallContentStopsSixteenAboveTheRegionsBottomAndScrolls() {
        val tree = read(contentHeight = 2000)
        val region = tree.named("Region").dp()
        val panel = tree.panel()
        assertEquals("16 above the bottom", 16f, region.bottom - panel.dp().bottom, 1f)
        assertNotNull("the panel does not scroll", tree.merged.firstOrNull { it.scrollBy != null && it.dp().width <= 421f })
    }

    @Test fun leftFloatsAtTheStartAndTheSidesMirrorRightToLeft() {
        val left = read(side = KozmosDrawerSide.Left)
        assertEquals("16 from the left", 16f, left.panel().dp().left - left.named("Region").dp().left, 1f)
        val rtl = read(direction = LayoutDirection.Rtl)
        assertEquals("right to left, the right drawer at the left", 16f, rtl.panel().dp().left - rtl.named("Region").dp().left, 1f)
    }

    /** No scrim: nothing pressable covers the page, as the fixed drawer's scrim does. */
    @Test fun itDrawsNoScrimThatClosesIt() {
        fun scrims(tree: ReadSemantics): List<ReadNode> {
            val region = tree.named("Region").dp()
            return tree.merged.filter { it.click != null && it.dp().width >= region.width - 1 && it.dp().height >= region.height - 1 }
        }
        assertTrue("an inline drawer has a scrim", scrims(read()).isEmpty())
        assertFalse("the fixed drawer lost its scrim", scrims(read(placement = KozmosDrawerPlacement.Fixed)).isEmpty())
    }

    @Test fun itIsANamedPaneHoldingItsParts() {
        val tree = read()
        val panel = tree.panel()
        assertTrue(panel.traversalGroup)
        assertTrue(tree.names().containsAll(listOf("Body", "Close drawer", "Page")))
        val close = tree.named("Close drawer").dp()
        assertTrue("the close is outside the panel", panel.dp().contains(close.center))
    }

    /** Through the content overload, the close is the header's own, in its row. */
    @Test fun theContentOverloadPutsItsCloseInTheHeader() {
        paparazzi.unsafeUpdateConfig(deviceConfig = DeviceConfig.PIXEL_C)
        val tree = paparazzi.readSettledSemantics {
            density = LocalDensity.current.density
            KozmosMaterialTheme {
                Box(Modifier.size(800.dp, 600.dp)) {
                    KozmosDrawer(open = true, onDismissRequest = {}, title = "Get started", placement = KozmosDrawerPlacement.Inline) {}
                }
            }
        }
        assertEquals("one close", 1, tree.merged.count { it.description == "Close drawer" })
        val panel = tree.panel().dp()
        assertTrue(panel.contains(tree.named("Close drawer").dp().center))
    }
}
