package com.kozmos.components.adaptivemapshell

import androidx.compose.foundation.layout.Box
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.isTraversalGroup
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.Dp
import com.kozmos.tokens.KozmosDimensions

internal data class BottomControlsGeometry(val height: Int, val start: IntOffset, val end: IntOffset)

/**
 * Logical coordinates; Compose mirrors placeRelative without reordering
 * children. The top corners (GAP-123) take [alignsTop]: sharing a row their
 * tops line up, under the top bar; wrapped, the start sits above the end
 * either way.
 */
internal fun bottomControlsGeometry(width: Int, start: IntSize, end: IntSize, gap: Int, alignsTop: Boolean = false): BottomControlsGeometry {
    val wraps = start.width > 0 && end.width > 0 && start.width + gap + end.width > width
    val height = if (wraps) start.height + gap + end.height else maxOf(start.height, end.height)
    return BottomControlsGeometry(
        height,
        IntOffset(0, if (wraps || alignsTop) 0 else height - start.height),
        IntOffset(maxOf(0, width - end.width), if (alignsTop && !wraps) 0 else height - end.height)
    )
}

/**
 * The logical top corners (GAP-123) in one named container: measured always,
 * so the shell knows their height, and placed only while [shown], so corners
 * with no room keep their state but take no touches and no semantics.
 */
@Composable
internal fun TopControlsLayout(
    start: (@Composable () -> Unit)?,
    end: (@Composable () -> Unit)?,
    shown: Boolean,
    label: String,
    modifier: Modifier = Modifier,
    onHeight: (Int) -> Unit = {}
) {
    Layout(modifier = modifier.then(if (shown) Modifier.semantics {
        contentDescription = label
        isTraversalGroup = true
    } else Modifier.clearAndSetSemantics {}), content = {
        Box { start?.invoke() }
        Box { end?.invoke() }
    }) { measurables, constraints ->
        val loose = Constraints(maxWidth = constraints.maxWidth)
        val first = measurables[0].measure(loose)
        val second = measurables[1].measure(loose)
        val geometry = bottomControlsGeometry(
            constraints.maxWidth, IntSize(first.width, first.height), IntSize(second.width, second.height),
            KozmosDimensions.primitivesLayoutSpacing200.roundToPx(), alignsTop = true
        )
        onHeight(geometry.height)
        layout(constraints.maxWidth, if (shown) geometry.height else 0) {
            if (shown) {
                first.placeRelative(geometry.start)
                second.placeRelative(geometry.end)
            }
        }
    }
}

@Composable
internal fun BottomControlsLayout(
    start: (@Composable () -> Unit)?,
    end: (@Composable () -> Unit)?,
    availableHeight: Dp,
    modifier: Modifier = Modifier,
    label: String? = null,
    /** The corners' own height, in pixels, whether or not they fit. */
    onHeight: (Int) -> Unit = {}
) {
    var fits by remember { mutableStateOf(false) }
    val region = LocalMapPopupRegion.current
    Layout(modifier = modifier.then(if (fits && region?.available != false) Modifier.semantics {
        if (label != null) contentDescription = label
        isTraversalGroup = true
    } else Modifier.clearAndSetSemantics {}), content = {
        CompositionLocalProvider(LocalMapPopupRegion provides region?.copy(available = region.available && fits)) {
            Box { start?.invoke() }
            Box { end?.invoke() }
        }
    }) { measurables, constraints ->
        val loose = Constraints(maxWidth = constraints.maxWidth)
        val start = measurables[0].measure(loose)
        val end = measurables[1].measure(loose)
        val geometry = bottomControlsGeometry(
            constraints.maxWidth, IntSize(start.width, start.height), IntSize(end.width, end.height),
            KozmosDimensions.primitivesLayoutSpacing200.roundToPx()
        )
        onHeight(geometry.height)
        fits = geometry.height <= availableHeight.roundToPx() && constraints.maxWidth > 0
        layout(constraints.maxWidth, if (fits) geometry.height else 0) {
            // Unplaced children keep composition state but cannot receive
            // touches or accessibility focus behind a covering panel.
            if (fits) {
                start.placeRelative(geometry.start)
                end.placeRelative(geometry.end)
            }
        }
    }
}
