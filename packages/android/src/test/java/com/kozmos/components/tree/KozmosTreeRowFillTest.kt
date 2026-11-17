package com.kozmos.components.tree

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.dp
import com.kozmos.components.DrawnPixels
import com.kozmos.components.KeptFrames
import com.kozmos.components.drawn
import com.kozmos.components.pixelsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * GAP-217, decision 196: a selected row's fill is React's. Inset, the
 * default, is the pill React's `rounded-control bg-hover-fill` draws: the
 * control radius (16), the tree's own width, inside any bleed. Band is a
 * square fill across the row and its bleed. The tree sits 16 in from a white
 * panel's edges; its first row, selected, runs from 16 to 56 down. Read from
 * what is drawn, at twice the density.
 */
class KozmosTreeRowFillTest {
    private val frames = KeptFrames()
    @get:Rule val paparazzi = pixelsPaparazzi(frames)

    private var density = 1f
    private var scale = 1f
    private var canvas = 0

    private val data = listOf(TreeNode("a", "A"), TreeNode("b", "B"))

    private fun draw(divided: Boolean = false, bleed: Int = 0, band: Boolean? = null): DrawnPixels =
        paparazzi.drawn(frames) {
            val base = LocalDensity.current
            CompositionLocalProvider(
                LocalKozmosUseDarkTokens provides false,
                LocalDensity provides Density(base.density * 2f, base.fontScale)
            ) {
                density = LocalDensity.current.density
                KozmosMaterialTheme {
                    Box(Modifier.fillMaxSize().onGloballyPositioned { canvas = it.size.width }) {
                        Box(Modifier.size(170.dp, 200.dp).background(Color.White).padding(16.dp)) {
                            when (band) {
                                null -> KozmosTree(
                                    data, divided = divided, bleed = bleed.dp,
                                    selectedIds = setOf("a"), expandedIds = emptySet()
                                )
                                else -> KozmosTree(
                                    data, divided = divided, bleed = bleed.dp,
                                    selectedIds = setOf("a"), expandedIds = emptySet(),
                                    rowFill = if (band) KozmosTreeRowFill.Band else KozmosTreeRowFill.Inset
                                )
                            }
                        }
                    }
                }
            }
        }.also { scale = it.width.toFloat() / canvas }

    private fun DrawnPixels.at(x: Float, y: Float): Int {
        val k = density * scale
        return argb((x * k).toInt().coerceIn(0, width - 1), (y * k).toInt().coerceIn(0, height - 1))
    }

    /** semanticsHoverFill in light, background 100, #E3E4E8. */
    private fun DrawnPixels.isFill(x: Float, y: Float) = DrawnPixels.matches(at(x, y), 0xFFE3E4E8.toInt(), 4)
    private fun DrawnPixels.isWhite(x: Float, y: Float) = DrawnPixels.matches(at(x, y), 0xFFFFFFFF.toInt(), 4)

    @Test fun insetByDefaultTheSelectedRowIsAPillOnTheTreesWidth() {
        val pixels = draw()
        // Its middle is filled from the tree's edge; its corner, 1 in, is not.
        assertTrue("middle", pixels.isFill(18f, 36f))
        assertTrue("corner left white by the 16 radius", pixels.isWhite(17f, 17f))
        assertTrue("far corner left white", pixels.isWhite(153f, 17f))
    }

    @Test fun insetStaysInsideTheBleedWhenDivided() {
        val pixels = draw(divided = true, bleed = 16)
        assertTrue("the bleed beside the row is white", pixels.isWhite(4f, 36f))
        assertTrue("the row's middle is filled", pixels.isFill(18f, 36f))
        assertTrue("corner white", pixels.isWhite(17f, 17f))
    }

    @Test fun bandIsSquareAcrossTheRow() {
        val pixels = draw(band = true)
        assertTrue("corner filled", pixels.isFill(17f, 17f))
        assertTrue("far corner filled", pixels.isFill(153f, 17f))
    }

    @Test fun bandReachesTheBleedDividedOrNot() {
        for (divided in listOf(true, false)) {
            val pixels = draw(divided = divided, bleed = 16, band = true)
            assertTrue("divided=$divided: the bleed is filled", pixels.isFill(2f, 36f))
            assertTrue("divided=$divided: the corner is filled", pixels.isFill(17f, 17f))
        }
    }
}
