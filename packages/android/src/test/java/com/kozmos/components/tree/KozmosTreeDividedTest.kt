package com.kozmos.components.tree

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.Density
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.foundation.layout.fillMaxSize
import com.kozmos.components.DrawnPixels
import com.kozmos.components.KeptFrames
import com.kozmos.components.drawn
import com.kozmos.components.pixelsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * GAP-201: `divided` draws a 1dp stroke in the border role under every row
 * and sets an open parent row on background 50, as React's Tree has since
 * 0.15.0 (#433); `bleed` takes both past the tree to the panel's edges while
 * the rows stay where they are. The tree sits 16 in from a white panel's
 * edges, as in a panel, 170 wide: at twice the density, so a 1dp stroke is
 * pixels wide in Paparazzi's scaled frame, that is what its screen holds.
 * Read from what is drawn, in a column clear of the rows' words.
 */
class KozmosTreeDividedTest {
    private val frames = KeptFrames()
    @get:Rule val paparazzi = pixelsPaparazzi(frames)

    private var density = 1f
    /** Drawn pixels per laid-out pixel: Paparazzi scales the frame it keeps. */
    private var scale = 1f
    private var canvas = 0

    private val data = listOf(
        TreeNode("main", "B1", listOf(TreeNode("ground", "L0"), TreeNode("first", "L1"))),
        TreeNode("park", "P")
    )

    private fun draw(divided: Boolean = true, bleed: Int = 0): DrawnPixels = paparazzi.drawn(frames) {
        val base = LocalDensity.current
        CompositionLocalProvider(
            LocalKozmosUseDarkTokens provides false,
            // Twice the density, so a 1dp stroke is pixels wide once scaled.
            LocalDensity provides Density(base.density * 2f, base.fontScale)
        ) {
            density = LocalDensity.current.density
            KozmosMaterialTheme {
                Box(Modifier.fillMaxSize().onGloballyPositioned { canvas = it.size.width }) {
                    Box(Modifier.size(170.dp, 300.dp).background(Color.White).padding(16.dp)) {
                        KozmosTree(data, divided = divided, bleed = bleed.dp, expandedIds = setOf("main"))
                    }
                }
            }
        }
    }.also { scale = it.width.toFloat() / canvas }

    private fun DrawnPixels.at(x: Float, y: Int) = argb((x * density * scale).toInt().coerceIn(0, width - 1), y)

    /** semanticsBorderSubtle, #C7CAD1 in light. */
    private fun DrawnPixels.isStroke(x: Float, y: Int) = DrawnPixels.matches(at(x, y), 0xFFC7CAD1.toInt(), 6)

    /** The pixel rows a stroke is drawn on, down the column at `x` dp, one per stroke. */
    private fun DrawnPixels.strokes(x: Float): List<Int> {
        val found = mutableListOf<Int>()
        for (y in 0 until minOf(height, (300 * density * scale).toInt())) {
            if (isStroke(x, y) && (found.isEmpty() || y - found.last() > density * scale * 2)) found += y
        }
        return found
    }

    @Test fun aStrokeRunsUnderEveryRowOutsideItsHeight() {
        val strokes = draw().strokes(140f)
        assertEquals("one under each of the four rows: $strokes", 4, strokes.size)
        val undivided = draw(divided = false).strokes(140f)
        assertTrue("an undivided tree draws strokes: $undivided", undivided.isEmpty())
    }

    @Test fun anOpenParentSitsOnTheSurfaceAndAClosedRowDoesNot() {
        val pixels = draw()
        val strokes = pixels.strokes(140f)
        val surface = 0xFFF1F2F4.toInt()
        val above = { y: Int -> pixels.at(140f, y - (4 * density * scale).toInt()) }
        assertTrue("the open row is not on background 50: ${DrawnPixels.hex(above(strokes[0]))}",
            DrawnPixels.matches(above(strokes[0]), surface, 3))
        assertFalse("a closed row is on background 50", DrawnPixels.matches(above(strokes[1]), surface, 3))
    }

    @Test fun bleedTakesTheStrokesToThePanelsEdges() {
        val tree = draw(bleed = 0)
        val y = tree.strokes(140f).first()
        assertFalse("a stroke runs past the tree with no bleed", tree.isStroke(8f, y))
        val bled = draw(bleed = 16)
        val y2 = bled.strokes(140f).first()
        assertTrue("the stroke does not reach the panel's start", bled.isStroke(1f, y2))
        assertTrue("the stroke does not reach the panel's end", bled.isStroke(169f, y2))
    }
}
