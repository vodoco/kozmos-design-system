package com.kozmos.components.menu

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.boundsInRoot
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.kozmos.components.DrawnPixels
import com.kozmos.components.KeptFrames
import com.kozmos.components.drawn
import com.kozmos.components.pixelsPaparazzi
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import kotlin.math.roundToInt
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * A menu item's `external` (decision 152, GAP-202), as KozmosLink's: the
 * click is labelled "open in your browser", which TalkBack reads as
 * "Double-tap to open in your browser", or the product's words. Picking it is
 * still onItemClick's, and the menu closes. Read from the items KozmosMenu
 * and KozmosContextMenuArea both draw.
 */
class KozmosMenuItemExternalTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    private val items = KozmosMenuContent(
        items = listOf(
            KozmosMenuItem(text = "Help centre", external = true),
            KozmosMenuItem(text = "Rename")
        )
    )

    @Test fun anExternalItemLabelsItsClickAndPicksAsBefore() {
        val picked = mutableListOf<String>()
        var dismissed = 0
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme {
                Column { KozmosMenuItems(items, onItemClick = { picked += it.text }, onDismissRequest = { dismissed++ }) }
            }
        }
        val help = tree.saying("Help centre")
        assertEquals("the click's label", "open in your browser", help.clickLabel)
        help.click!!.invoke()
        assertEquals("picked", listOf("Help centre"), picked)
        assertEquals("the menu closes", 1, dismissed)
        assertNull("an item that stays has no label", tree.saying("Rename").clickLabel)
    }

    @Test fun theLabelIsTheProductsOwnWords() {
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme {
                Column {
                    KozmosMenuItems(
                        KozmosMenuContent(
                            items = listOf(KozmosMenuItem(text = "Hilfe", external = true, externalLabel = "im Browser öffnen"))
                        ),
                        onItemClick = {},
                        onDismissRequest = {}
                    )
                }
            }
        }
        assertEquals("im Browser öffnen", tree.saying("Hilfe").clickLabel)
    }
}

/**
 * What an external item draws: Pointr's new-tab icon at the row's end,
 * pointing to it, mirrored right to left. Read off what is drawn.
 */
class KozmosMenuItemExternalPixelsTest {
    private val frames = KeptFrames()

    @get:Rule val paparazzi = pixelsPaparazzi(frames)

    /** The dark ink in the row's last 48dp, at its end, in the frame's pixels; null for none. */
    private fun endInk(external: Boolean, direction: LayoutDirection): Pair<DrawnPixels, Rect?> {
        var row = Rect.Zero
        var canvas = IntSize(1, 1)
        val drawn = paparazzi.drawn(frames) {
            CompositionLocalProvider(
                LocalKozmosUseDarkTokens provides false,
                LocalLayoutDirection provides direction
            ) {
                KozmosMaterialTheme {
                    Box(Modifier.fillMaxSize().background(Color.White).onGloballyPositioned { canvas = it.size }) {
                        Column(Modifier.width(240.dp).onGloballyPositioned { row = it.boundsInRoot() }) {
                            KozmosMenuItems(
                                KozmosMenuContent(items = listOf(KozmosMenuItem(text = "Help", external = external))),
                                onItemClick = {},
                                onDismissRequest = {}
                            )
                        }
                    }
                }
            }
        }
        val frame = drawn.width.toFloat() / canvas.width
        val end = 48 * paparazzi.context.resources.displayMetrics.density
        val left = if (direction == LayoutDirection.Ltr) row.right - end else row.left
        val xs = (left * frame).roundToInt() until ((left + end) * frame).roundToInt()
        val ys = (row.top * frame).roundToInt() until (row.bottom * frame).roundToInt()
        val ink = { x: Int, y: Int -> DrawnPixels.lightness(drawn.argb(x, y)) < 450 }
        val columns = xs.filter { x -> ys.any { y -> ink(x, y) } }
        val rows = ys.filter { y -> xs.any { x -> ink(x, y) } }
        if (columns.isEmpty()) return drawn to null
        return drawn to Rect(columns.min().toFloat(), rows.min().toFloat(), columns.max() + 1f, rows.max() + 1f)
    }

    @Test fun anExternalItemDrawsTheIconAtItsEndPointingToIt() {
        for (direction in listOf(LayoutDirection.Ltr, LayoutDirection.Rtl)) {
            val (drawn, found) = endInk(external = true, direction)
            val icon = checkNotNull(found) { "no icon at the row's end, $direction" }
            // The arrow's head is the icon's topmost ink, at the end it points to.
            val headRow = icon.top.roundToInt()
            val head = (icon.left.roundToInt() until icon.right.roundToInt())
                .filter { x -> DrawnPixels.lightness(drawn.argb(x, headRow)) < 450 }
                .average().toFloat()
            println("decision 152 Compose, $direction: icon $icon, head at $head")
            if (direction == LayoutDirection.Ltr) {
                assertTrue("left to right the arrow points right: head $head in $icon", head > icon.center.x)
            } else {
                assertTrue("right to left the arrow points left: head $head in $icon", head < icon.center.x)
            }
        }
    }

    /** The guard: an item that stays draws nothing at its end. */
    @Test fun anItemThatStaysDrawsNoIcon() {
        assertNull(endInk(external = false, LayoutDirection.Ltr).second)
    }
}
