package com.kozmos.components.popover

import com.kozmos.tokens.KozmosDimensions

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.IntRect
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Popup
import androidx.compose.ui.window.PopupPositionProvider
import androidx.compose.ui.window.PopupProperties
import com.kozmos.tokens.KozmosThemeTokens

enum class KozmosPopoverSide {
    Top,
    Right,
    Bottom,
    Left
}

data class KozmosPopoverContent(
    val title: String,
    val description: String? = null,
    val side: KozmosPopoverSide = KozmosPopoverSide.Top
)

/**
 * A popover of your own content. It takes no side: it opens on the default
 * one, above what it shares a parent with, as the titled popover does.
 */
@Composable
fun KozmosPopover(
    isExpanded: Boolean,
    onDismissRequest: () -> Unit,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit
) {
    KozmosPopoverPopup(isExpanded, onDismissRequest, KozmosPopoverSide.Top, modifier, content)
}

/**
 * The popover on [side] of its parent, as React's Radix popover opens on its
 * side of the trigger: 4dp from it (`sideOffset`), centred on it, flipped to
 * the other side when there is no room, and slid along to stay on the
 * screen. It opened over its parent's top-start corner, whatever its side,
 * until 2026-10-20.
 */
@Composable
private fun KozmosPopoverPopup(
    isExpanded: Boolean,
    onDismissRequest: () -> Unit,
    side: KozmosPopoverSide,
    modifier: Modifier,
    content: @Composable () -> Unit
) {
    if (isExpanded) {
        val gap = with(LocalDensity.current) { KozmosDimensions.primitivesLayoutSpacing50.roundToPx() }
        Popup(
            popupPositionProvider = KozmosPopoverPosition(side, gap),
            onDismissRequest = onDismissRequest,
            properties = PopupProperties(focusable = true)
        ) {
            Surface(
                shape = RoundedCornerShape(KozmosDimensions.semanticsRadiusControl),
                shadowElevation = 4.dp,
                color = KozmosThemeTokens.semanticsSurface0,
                border = BorderStroke(1.dp, KozmosThemeTokens.semanticsBorderSubtle),
                modifier = modifier
            ) {
                Box(modifier = Modifier.padding(KozmosDimensions.primitivesLayoutSpacing200)) {
                    content()
                }
            }
        }
    }
}

@Composable
fun KozmosPopover(
    isExpanded: Boolean,
    onDismissRequest: () -> Unit,
    title: String,
    modifier: Modifier = Modifier,
    description: String? = null,
    side: KozmosPopoverSide = KozmosPopoverSide.Top
) {
    KozmosPopover(
        isExpanded = isExpanded,
        onDismissRequest = onDismissRequest,
        content = KozmosPopoverContent(
            title = title,
            description = description,
            side = side
        ),
        modifier = modifier
    )
}

@Composable
fun KozmosPopover(
    isExpanded: Boolean,
    onDismissRequest: () -> Unit,
    content: KozmosPopoverContent,
    modifier: Modifier = Modifier
) {
    KozmosPopoverPopup(
        isExpanded = isExpanded,
        onDismissRequest = onDismissRequest,
        side = content.side,
        modifier = modifier.widthIn(min = 288.dp, max = 288.dp)
    ) {
        Column {
            Text(
                text = content.title,
                color = KozmosThemeTokens.primitivesColorsForeground100
            )

            content.description?.let { description ->
                Box(modifier = Modifier.padding(top = KozmosDimensions.primitivesLayoutSpacing100)) {
                    Text(
                        text = description,
                        color = KozmosThemeTokens.primitivesColorsForeground400
                    )
                }
            }
        }
    }
}

/**
 * Where the popover goes: on [side] of the anchor, [gap] from it and centred
 * on it. Sides are physical, as Radix's are. Where the popover does not fit
 * between the anchor and the window's edge on that side, it goes to the other
 * side if it fits better there, as Radix's `avoidCollisions` flips it; then
 * it is slid along the anchor's edge to stay inside the window.
 */
internal class KozmosPopoverPosition(
    private val side: KozmosPopoverSide,
    private val gap: Int
) : PopupPositionProvider {
    override fun calculatePosition(
        anchorBounds: IntRect,
        windowSize: IntSize,
        layoutDirection: LayoutDirection,
        popupContentSize: IntSize
    ): IntOffset {
        val width = popupContentSize.width
        val height = popupContentSize.height
        // How far the popover would run past the window on each side.
        fun overflow(on: KozmosPopoverSide): Int = when (on) {
            KozmosPopoverSide.Top -> height + gap - anchorBounds.top
            KozmosPopoverSide.Bottom -> anchorBounds.bottom + gap + height - windowSize.height
            KozmosPopoverSide.Left -> width + gap - anchorBounds.left
            KozmosPopoverSide.Right -> anchorBounds.right + gap + width - windowSize.width
        }.coerceAtLeast(0)
        val opposite = when (side) {
            KozmosPopoverSide.Top -> KozmosPopoverSide.Bottom
            KozmosPopoverSide.Bottom -> KozmosPopoverSide.Top
            KozmosPopoverSide.Left -> KozmosPopoverSide.Right
            KozmosPopoverSide.Right -> KozmosPopoverSide.Left
        }
        val placed = if (overflow(side) > 0 && overflow(opposite) < overflow(side)) opposite else side
        fun slide(start: Int, size: Int, room: Int): Int =
            if (size >= room) 0 else start.coerceIn(0, room - size)
        val centredX = anchorBounds.left + (anchorBounds.width - width) / 2
        val centredY = anchorBounds.top + (anchorBounds.height - height) / 2
        return when (placed) {
            KozmosPopoverSide.Top -> IntOffset(slide(centredX, width, windowSize.width), anchorBounds.top - gap - height)
            KozmosPopoverSide.Bottom -> IntOffset(slide(centredX, width, windowSize.width), anchorBounds.bottom + gap)
            KozmosPopoverSide.Left -> IntOffset(anchorBounds.left - gap - width, slide(centredY, height, windowSize.height))
            KozmosPopoverSide.Right -> IntOffset(anchorBounds.right + gap, slide(centredY, height, windowSize.height))
        }
    }
}
