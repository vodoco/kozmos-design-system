package com.kozmos.components.adaptivemapshell

import androidx.compose.runtime.Composable
import androidx.compose.runtime.RememberObserver
import androidx.compose.runtime.Stable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.layout
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.offset

/**
 * The end of the shell's panel and who scrolls under it (GAP-085). The panel
 * keeps [inset] clear below its content: 16dp above a side panel's edge, and
 * in a sheet 16 above the bottom safe area, the two together. Content that
 * does not scroll stops above it, padded by the shell. A scroller that ends
 * the panel claims it instead, through [kozmosPanelScrollEndPadding]: the
 * shell stops padding, the scroller runs to the panel's edge, under the
 * navigation bar in a sheet, and takes [inset] as its own end content
 * padding, so only scrolled to its end does its last row stop above it. As
 * iOS's panel does with a safe-area inset and the web's with padding inside
 * its scroller.
 */
@Stable
internal class KozmosPanelScrollEnd(inset: Dp) {
    /** The whole space the panel keeps below its content, the safe area's included. */
    var inset by mutableStateOf(inset)

    /** How many scrollers have claimed the end. Read in the shell's measure, so a claim is honoured on its first frame. */
    var claims by mutableIntStateOf(0)
}

internal val LocalKozmosPanelScrollEnd = staticCompositionLocalOf<KozmosPanelScrollEnd?> { null }

/** A scroller's claim on the panel's end, held while it is composed. */
private class KozmosPanelScrollEndClaim(private val end: KozmosPanelScrollEnd) : RememberObserver {
    override fun onRemembered() {
        end.claims += 1
    }

    override fun onForgotten() {
        end.claims -= 1
    }

    override fun onAbandoned() = Unit
}

/**
 * The end content padding for a scroller that ends the shell's panel
 * (GAP-085): 16dp in a side panel, and in a sheet 16 plus the bottom safe
 * area. Calling it claims the panel's end, so the shell no longer keeps that
 * space below the content: the scroller runs to the panel's edge while it
 * scrolls, as on iOS and the web, and its last row stops above the edge only
 * at the end of the scroll. Apply it inside the scroll, as a `LazyColumn`'s
 * `contentPadding` bottom or as padding after `verticalScroll`; content that
 * fits ends the same distance above the edge. Call it once, for the scroller
 * that is the panel's last thing, and in ordinary composition (not inside a
 * lazy item or a `BoxWithConstraints`), so the claim holds from the first
 * frame.
 *
 * 0 outside a shell, and where [LocalKozmosPanelInsetBottom] is 0, a product
 * having said its part is not at the panel's end: then nothing is claimed and
 * the shell keeps padding below the content, which stops 16 above the edge
 * without scrolling under it.
 *
 * ```
 * LazyColumn(contentPadding = PaddingValues(bottom = kozmosPanelScrollEndPadding())) { … }
 * ```
 *
 * `docsnippets/PanelScrollingResults.kt` compiles a whole example, and
 * KozmosAdaptiveMapShellPanelScrollEndTest draws and measures it.
 */
@Composable
fun kozmosPanelScrollEndPadding(): Dp {
    val end = LocalKozmosPanelScrollEnd.current
    if (end == null || LocalKozmosPanelInsetBottom.current <= 0.dp) return 0.dp
    remember(end) { KozmosPanelScrollEndClaim(end) }
    return end.inset
}

/**
 * Pads the content [end] below it unless a scroller has claimed the panel's
 * end; read while measuring, so a claim changes the layout on its first frame.
 */
internal fun Modifier.kozmosPanelEndPadding(scrollEnd: KozmosPanelScrollEnd, end: Dp): Modifier =
    layout { measurable, constraints ->
        val pad = if (scrollEnd.claims > 0) 0 else end.roundToPx()
        val placeable = measurable.measure(constraints.offset(vertical = -pad))
        layout(placeable.width, placeable.height + pad) { placeable.place(0, 0) }
    }
