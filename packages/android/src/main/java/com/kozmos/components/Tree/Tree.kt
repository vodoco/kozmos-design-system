package com.kozmos.components.tree

import com.kozmos.tokens.KozmosDimensions

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.background
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.layout
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.offset
import com.kozmos.tokens.KozmosThemeTokens

data class TreeNode(
    val id: String,
    val name: String,
    val children: List<TreeNode> = emptyList()
)

enum class KozmosTreeDensity {
    Default,
    Compact
}

/**
 * A tree of [data].
 *
 * [divided] draws a 1dp stroke in the border role under every row and sets an
 * open parent row on a surface of its own, background 50 (GAP-201): a tree of
 * records, as Pointr Cloud's Map Content tree draws its buildings and levels,
 * rather than a navigation tree. The stroke is under the row, outside its
 * height, so a divided row is a dp taller. [bleed] takes the stroke and the
 * open row's surface that far past the tree on each side, to the panel's
 * edges, while the rows stay where they are: the panel's own padding, 16 in a
 * panel. 0 by default, the tree's own edges.
 */
@Composable
fun KozmosTree(
    data: List<TreeNode>,
    modifier: Modifier = Modifier,
    density: KozmosTreeDensity = KozmosTreeDensity.Default,
    divided: Boolean = false,
    bleed: Dp = 0.dp
) = KozmosTree(data, modifier, density, divided, bleed, expandedIds = emptySet())

/** A tree with the nodes of [expandedIds] open from the start: for tests. */
@Composable
internal fun KozmosTree(
    data: List<TreeNode>,
    modifier: Modifier = Modifier,
    density: KozmosTreeDensity = KozmosTreeDensity.Default,
    divided: Boolean = false,
    bleed: Dp = 0.dp,
    expandedIds: Set<String>
) {
    val reach = if (divided) bleed.coerceAtLeast(0.dp) else 0.dp
    // Wider than its slot by the bleed on each side, so the strokes and the
    // surface reach the panel's edges; each row takes the bleed back inside.
    LazyColumn(modifier = modifier.kozmosTreeBleed(reach)) {
        items(data) { item ->
            TreeItem(item, 0, density, divided, reach, expandedIds)
        }
    }
}

/** Lays the tree out [bleed] wider on each side than its slot, centred on it. */
private fun Modifier.kozmosTreeBleed(bleed: Dp): Modifier =
    if (bleed <= 0.dp) this else layout { measurable, constraints ->
        val extra = bleed.roundToPx() * 2
        val wide = constraints.copy(
            minWidth = (constraints.minWidth + extra).coerceAtMost(Constraints.Infinity),
            maxWidth = if (constraints.hasBoundedWidth) constraints.maxWidth + extra else Constraints.Infinity
        )
        val placeable = measurable.measure(wide)
        val width = (placeable.width - extra).coerceAtLeast(0)
        layout(width, placeable.height) { placeable.placeRelative(-extra / 2, 0) }
    }

@Composable
fun TreeItem(
    item: TreeNode,
    depth: Int,
    density: KozmosTreeDensity = KozmosTreeDensity.Default,
    divided: Boolean = false,
    bleed: Dp = 0.dp
) = TreeItem(item, depth, density, divided, bleed, expandedIds = emptySet())

@Composable
internal fun TreeItem(
    item: TreeNode,
    depth: Int,
    density: KozmosTreeDensity,
    divided: Boolean,
    bleed: Dp,
    expandedIds: Set<String>
) {
    var isExpanded by remember { mutableStateOf(item.id in expandedIds) }
    val hasChildren = item.children.isNotEmpty()
    val rotation by animateFloatAsState(targetValue = if (isExpanded) 90f else 0f, label = "rotation")
    val verticalPadding = if (density == KozmosTreeDensity.Compact) {
        KozmosDimensions.primitivesLayoutSpacing25
    } else {
        KozmosDimensions.primitivesLayoutSpacing50
    }

    Column {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier
                .fillMaxWidth()
                // Divided, an open parent sits on a surface of its own and a
                // stroke runs under the row, outside its height (GAP-201).
                .then(
                    if (divided) Modifier
                        .background(if (hasChildren && isExpanded) KozmosThemeTokens.primitivesColorsBackground50 else Color.Transparent)
                        .kozmosTreeRowStroke(KozmosThemeTokens.semanticsBorderSubtle)
                        .padding(horizontal = bleed)
                    else Modifier
                )
                .clickable { if (hasChildren) isExpanded = !isExpanded }
                .padding(vertical = verticalPadding, horizontal = KozmosDimensions.primitivesLayoutSpacing100)
        ) {
            Spacer(modifier = Modifier.width((depth * 16).dp))
            if (hasChildren) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.KeyboardArrowRight,
                    contentDescription = "Expand",
                    modifier = Modifier
                        .size(KozmosDimensions.primitivesLayoutSizing300)
                        .rotate(rotation)
                )
            } else {
                Spacer(modifier = Modifier.size(KozmosDimensions.primitivesLayoutSizing300))
            }
            Text(
                text = item.name,
                style = MaterialTheme.typography.bodyMedium,
                modifier = Modifier.padding(start = KozmosDimensions.primitivesLayoutSpacing100)
            )
        }
        AnimatedVisibility(visible = isExpanded) {
            Column {
                item.children.forEach { child ->
                    TreeItem(child, depth + 1, density, divided, bleed, expandedIds)
                }
            }
        }
    }
}

/** A 1dp stroke under the row, below its height: the row grows by it. */
private fun Modifier.kozmosTreeRowStroke(color: Color): Modifier =
    layout { measurable, constraints ->
        val stroke = 1.dp.roundToPx()
        val placeable = measurable.measure(constraints.offset(vertical = -stroke))
        layout(placeable.width, placeable.height + stroke) { placeable.placeRelative(0, 0) }
    }.drawBehind {
        val stroke = 1.dp.toPx()
        drawRect(color, topLeft = Offset(0f, size.height - stroke), size = Size(size.width, stroke))
    }
