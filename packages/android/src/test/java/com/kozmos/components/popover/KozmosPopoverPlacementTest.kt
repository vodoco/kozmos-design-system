package com.kozmos.components.popover

import android.view.View
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.withFrameNanos
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.layout.boundsInWindow
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

/**
 * React's popover is Radix's: it opens on its `side` of the trigger,
 * `sideOffset` 4 from it and centred on it, flips to the other side when
 * there is no room, and slides along to stay on the screen. SwiftUI's opens
 * at its side's `arrowEdge`. Compose's kept `KozmosPopoverContent.side` and
 * drew nothing of it: every popover opened over its parent's top-start
 * corner, on top of the button that opened it.
 *
 * Measured where the popover is laid out, against the 48dp anchor it shares
 * a Box with, on Paparazzi's 360dp-wide screen.
 */
class KozmosPopoverPlacementTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    private class Placed(val anchor: Rect, val popover: Rect, val density: Float)

    /** The anchor at [x], [y] with [popover] in it, as laid out. */
    private fun place(x: Dp, y: Dp, popover: @Composable (Modifier) -> Unit): Placed {
        var anchor = Rect.Zero
        var placed = Rect.Zero
        var density = 1f
        val view = ComposeView(paparazzi.context).apply {
            setContent {
                density = LocalDensity.current.density
                KozmosMaterialTheme {
                    Box(Modifier.fillMaxSize()) {
                        Box(Modifier.offset(x, y).size(48.dp).onGloballyPositioned { anchor = it.boundsInWindow() }) {
                            popover(Modifier.onGloballyPositioned { placed = it.boundsInWindow() })
                        }
                    }
                }
                LaunchedEffect(Unit) { repeat(4) { withFrameNanos { } } }
            }
        }
        view.setLayerType(View.LAYER_TYPE_SOFTWARE, null)
        paparazzi.gif(view, "popover", start = 0L, end = 400L, fps = 10)
        check(anchor.width > 0f && placed.width > 0f) { "anchor $anchor, popover $placed: not laid out" }
        return Placed(anchor, placed, density)
    }

    private fun titled(side: KozmosPopoverSide): @Composable (Modifier) -> Unit = { modifier ->
        KozmosPopover(isExpanded = true, onDismissRequest = {}, title = "Transit filters", side = side, modifier = modifier)
    }

    private fun Placed.dp(px: Float) = px / density

    @Test fun aPopoverOnTheBottomOpensBelowItsAnchorCentredOnIt() {
        val placed = place(156.dp, 300.dp, titled(KozmosPopoverSide.Bottom))
        with(placed) {
            assertEquals("the gap from the anchor's bottom to the popover's top", 4f, dp(popover.top - anchor.bottom), 0.5f)
            assertEquals("the popover's centre from the anchor's", 0f, dp(popover.center.x - anchor.center.x), 0.5f)
        }
    }

    @Test fun aPopoverOnTheTopOpensAboveItsAnchorCentredOnIt() {
        val placed = place(156.dp, 300.dp, titled(KozmosPopoverSide.Top))
        with(placed) {
            assertEquals("the gap from the popover's bottom to the anchor's top", 4f, dp(anchor.top - popover.bottom), 0.5f)
            assertEquals("the popover's centre from the anchor's", 0f, dp(popover.center.x - anchor.center.x), 0.5f)
        }
    }

    /** With no room above, a top popover opens below, as Radix flips it; near an edge it slides onto the screen. */
    @Test fun aPopoverWithNoRoomOnItsSideFlipsAndStaysOnTheScreen() {
        val placed = place(0.dp, 8.dp, titled(KozmosPopoverSide.Top))
        with(placed) {
            assertEquals("the gap from the anchor's bottom to the popover's top", 4f, dp(popover.top - anchor.bottom), 0.5f)
            assertEquals("the popover's left edge, slid onto the screen", 0f, dp(popover.left), 0.5f)
        }
    }

    /** The content overload takes no side: it opens on the default one, the top, as the titled one does. */
    @Test fun aPopoverOfYourOwnContentOpensAbove() {
        val placed = place(156.dp, 300.dp) { modifier ->
            KozmosPopover(isExpanded = true, onDismissRequest = {}, modifier = modifier) { Text("Monday–Friday, 09:00–18:00") }
        }
        with(placed) {
            assertEquals("the gap from the popover's bottom to the anchor's top", 4f, dp(anchor.top - popover.bottom), 0.5f)
            assertEquals("the popover's centre from the anchor's", 0f, dp(popover.center.x - anchor.center.x), 0.5f)
        }
    }
}
