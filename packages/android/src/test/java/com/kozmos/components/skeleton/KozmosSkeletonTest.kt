package com.kozmos.components.skeleton

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.dp
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * Row 56 (GAP-057): Skeleton takes a shape and the space to hold, so a loading
 * row needs no modifier of its own. React gained `shape`, `width` and `height`
 * in #93; the shapes are the Figma set's `Shape` axis. Measured as laid out,
 * in a row 300 wide.
 */
class KozmosSkeletonTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    /**
     * The placeholder's laid-out size in dp, at [fontScale]. Read as it is laid
     * out rather than from its semantics bounds, which clip to nothing when a
     * block has no height.
     */
    private fun measure(fontScale: Float = 1f, content: @Composable (Modifier) -> Unit): Pair<Float, Float> {
        var density = 1f
        var size = IntSize.Zero
        paparazzi.readSemantics {
            val device = LocalDensity.current
            density = device.density
            CompositionLocalProvider(LocalDensity provides Density(device.density, fontScale)) {
                KozmosMaterialTheme {
                    Box(Modifier.width(300.dp)) { content(Modifier.onGloballyPositioned { size = it.size }) }
                }
            }
        }
        return size.width / density to size.height / density
    }

    private fun assertSize(expected: Pair<Float, Float>, actual: Pair<Float, Float>, what: String) {
        assertEquals("$what: width", expected.first, actual.first, 0.5f)
        assertEquals("$what: height", expected.second, actual.second, 0.5f)
    }

    @Test
    fun unsetItIsTheSizeItsModifierGivesAsItAlwaysWas() {
        // Unset, it draws as it always has, so the callers that sized it with a
        // modifier keep the placeholder they had. This holds before the change
        // and after it.
        assertSize(96f to 24f, measure { KozmosSkeleton(modifier = it.width(96.dp).height(24.dp)) }, "unset")
    }

    @Test
    fun aLineIsTextHighAndFillsItsRow() {
        // React's `h-4 w-full`, the Figma line's 16.
        assertSize(300f to 16f, measure { KozmosSkeleton(modifier = it, shape = KozmosSkeletonShape.Line) }, "line")
    }

    @Test
    fun aLineHoldsTheSpaceItIsGiven() {
        // Told a size, it stops assuming one — and a fraction of the row is the
        // modifier's, as Compose has it.
        assertSize(
            120f to 12f,
            measure { KozmosSkeleton(modifier = it, shape = KozmosSkeletonShape.Line, width = 120.dp, height = 12.dp) },
            "line 120 by 12"
        )
        assertSize(
            180f to 16f,
            measure { KozmosSkeleton(modifier = it.fillMaxWidth(0.6f), shape = KozmosSkeletonShape.Line) },
            "line at 60%"
        )
    }

    @Test
    fun aLineGrowsWithTheTextItStandsIn() {
        // A line stands in for text, so it grows with the font scale, as React's
        // `h-4` — 1rem — follows the browser's text size. A height the product
        // gives is kept.
        val (_, height) = measure(fontScale = 2f) { KozmosSkeleton(modifier = it, shape = KozmosSkeletonShape.Line) }
        assertTrue("the line is $height high at twice the text size", height > 16f && height < 48f)
        assertSize(
            300f to 12f,
            measure(fontScale = 2f) { KozmosSkeleton(modifier = it, shape = KozmosSkeletonShape.Line, height = 12.dp) },
            "a given height at twice the text size"
        )
    }

    @Test
    fun aBlockHasNoSizeOfItsOwn() {
        // A block is whatever it replaces, and guessing would be worse than
        // asking: it fills the row and has no height until given one.
        assertSize(300f to 0f, measure { KozmosSkeleton(modifier = it, shape = KozmosSkeletonShape.Block) }, "block")
        assertSize(
            300f to 80f,
            measure { KozmosSkeleton(modifier = it, shape = KozmosSkeletonShape.Block, height = 80.dp) },
            "block 80 high"
        )
    }

    @Test
    fun aCircleTakesOneNumberAsItsDiameter() {
        // An avatar's 40 unless told otherwise; a circle should not need
        // telling twice.
        assertSize(40f to 40f, measure { KozmosSkeleton(modifier = it, shape = KozmosSkeletonShape.Circle) }, "circle")
        assertSize(
            64f to 64f,
            measure { KozmosSkeleton(modifier = it, shape = KozmosSkeletonShape.Circle, width = 64.dp) },
            "circle 64 across"
        )
    }
}
