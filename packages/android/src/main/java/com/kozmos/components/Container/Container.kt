package com.kozmos.components.container

import com.kozmos.tokens.KozmosDimensions

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.IntrinsicMeasurable
import androidx.compose.ui.layout.IntrinsicMeasureScope
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.layout.Measurable
import androidx.compose.ui.layout.MeasurePolicy
import androidx.compose.ui.layout.MeasureResult
import androidx.compose.ui.layout.MeasureScope
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.constrainHeight
import androidx.compose.ui.unit.constrainWidth
import androidx.compose.ui.unit.dp
import kotlin.math.max

/** What a container's side padding responds to, as React's `inset`. */
enum class KozmosContainerInset {
    /** Steps 16, 24 and 32 with the width the container is given (from 640 and from 1024 dp): right for a page. */
    Window,
    /** 16 whatever the width: right for anything inside a fixed-width region, such as a map shell's sheet or side panel. */
    Panel;

    /** The side padding for a container this wide. */
    internal fun padding(width: Dp): Dp = when {
        this == Panel -> KozmosDimensions.primitivesLayoutSpacing200
        width >= 1024.dp -> KozmosDimensions.primitivesLayoutSpacing400
        width >= 640.dp -> KozmosDimensions.primitivesLayoutSpacing300
        else -> KozmosDimensions.primitivesLayoutSpacing200
    }
}

/** Pads all four sides by 16, as before [KozmosContainerInset]. */
@Composable
fun KozmosContainer(
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit
) {
    Box(
        modifier = modifier.padding(KozmosDimensions.primitivesLayoutSpacing200)
    ) {
        content()
    }
}

/**
 * Fills the width and pads the sides only, as React's Container does:
 * [KozmosContainerInset.Panel] keeps 16, [KozmosContainerInset.Window] steps
 * with the width the container is given.
 */
@Composable
fun KozmosContainer(
    inset: KozmosContainerInset,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit
) {
    val measurePolicy = remember(inset) { InsetMeasurePolicy(inset) }
    Layout(
        content = { Box { content() } },
        modifier = modifier.fillMaxWidth(),
        measurePolicy = measurePolicy
    )
}

/**
 * Picks the side padding from the width the container is given, in one
 * measure, and answers intrinsic measurements — a row that matches its
 * children's heights, a column as wide as its widest child — which a
 * BoxWithConstraints cannot: it is a SubcomposeLayout, and they throw.
 *
 * Its one child is a Box holding the content, so the content stacks, starts
 * at the top start and gets loose constraints, as inside a padded Box.
 */
private class InsetMeasurePolicy(private val inset: KozmosContainerInset) : MeasurePolicy {
    /** The side padding for a container [width] px wide. */
    private fun Density.side(width: Int): Int =
        inset.padding(if (width == Constraints.Infinity) Dp.Infinity else width.toDp()).roundToPx()

    /**
     * The side padding for a container sized by content [content] px wide,
     * and at least [minWidth]: the narrowest step that the width it makes
     * picks. A step only ever widens the container, so it settles within the
     * three.
     */
    private fun Density.sideAround(content: Int, minWidth: Int = 0): Int {
        var side = side(max(minWidth, content))
        repeat(3) {
            val next = side(max(minWidth, content + 2 * side))
            if (next == side) return side
            side = next
        }
        return side
    }

    /** The width the content gets inside a container [width] px wide. */
    private fun Density.inner(width: Int): Int =
        if (width == Constraints.Infinity) width else (width - 2 * side(width)).coerceAtLeast(0)

    override fun MeasureScope.measure(measurables: List<Measurable>, constraints: Constraints): MeasureResult {
        val content = measurables.single()
        if (constraints.hasBoundedWidth) {
            // fillMaxWidth: the container is as wide as it may be.
            val width = constraints.maxWidth
            val side = side(width)
            val inner = inner(width)
            val placeable = content.measure(Constraints(minWidth = inner, maxWidth = inner, maxHeight = constraints.maxHeight))
            return layout(width, constraints.constrainHeight(placeable.height)) { placeable.placeRelative(side, 0) }
        }
        // Nothing bounds it, as in a horizontal scroll: it is its content's
        // width and the padding that width takes.
        val placeable = content.measure(Constraints(maxHeight = constraints.maxHeight))
        val side = sideAround(placeable.width, constraints.minWidth)
        val width = constraints.constrainWidth(placeable.width + 2 * side)
        return layout(width, constraints.constrainHeight(placeable.height)) { placeable.placeRelative(side, 0) }
    }

    override fun IntrinsicMeasureScope.minIntrinsicWidth(measurables: List<IntrinsicMeasurable>, height: Int): Int {
        val content = measurables.single().minIntrinsicWidth(height)
        return content + 2 * sideAround(content)
    }

    override fun IntrinsicMeasureScope.maxIntrinsicWidth(measurables: List<IntrinsicMeasurable>, height: Int): Int {
        val content = measurables.single().maxIntrinsicWidth(height)
        return content + 2 * sideAround(content)
    }

    override fun IntrinsicMeasureScope.minIntrinsicHeight(measurables: List<IntrinsicMeasurable>, width: Int): Int =
        measurables.single().minIntrinsicHeight(inner(width))

    override fun IntrinsicMeasureScope.maxIntrinsicHeight(measurables: List<IntrinsicMeasurable>, width: Int): Int =
        measurables.single().maxIntrinsicHeight(inner(width))
}
