package com.kozmos.components.tooltip

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.IntRect
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Popup
import androidx.compose.ui.window.PopupPositionProvider
import com.kozmos.tokens.KozmosShadows
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.tokens.KozmosThemeTokens

/**
 * Which side of its trigger a tooltip sits on. Top, Right, Bottom and Left
 * are physical, as React's Radix sides and Figma's are: the same in either
 * reading direction. Leading is the side reading starts on and Trailing the
 * side it ends on: Left and Right left to right, Right and Left right to
 * left (the owner's decision, 21 Oct).
 */
enum class KozmosTooltipSide {
    Top,
    Right,
    Bottom,
    Left,
    Leading,
    Trailing
}

/** The physical side [this] is in [direction]: Leading and Trailing resolved, the rest as they are. */
internal fun KozmosTooltipSide.physical(direction: LayoutDirection): KozmosTooltipSide = when (this) {
    KozmosTooltipSide.Leading -> if (direction == LayoutDirection.Rtl) KozmosTooltipSide.Right else KozmosTooltipSide.Left
    KozmosTooltipSide.Trailing -> if (direction == LayoutDirection.Rtl) KozmosTooltipSide.Left else KozmosTooltipSide.Right
    else -> this
}

@Composable
fun KozmosTooltip(
    tooltip: String,
    modifier: Modifier = Modifier,
    side: KozmosTooltipSide = KozmosTooltipSide.Top,
    visible: Boolean = false,
    content: @Composable () -> Unit
) {
    Box(modifier = modifier, contentAlignment = Alignment.Center) {
        content()
        if (visible) {
            val offsetPx = with(LocalDensity.current) {
                KozmosDimensions.primitivesLayoutSpacing50.roundToPx()
            }
            Popup(
                popupPositionProvider = TooltipPositionProvider(side, offsetPx)
            ) {
                TooltipBubble(text = tooltip, side = side)
            }
        }
    }
}

@Composable
internal fun TooltipBubble(
    text: String,
    side: KozmosTooltipSide,
    modifier: Modifier = Modifier
) {
    val physical = side.physical(LocalLayoutDirection.current)
    when (physical) {
        KozmosTooltipSide.Top -> {
            Column(modifier = modifier, horizontalAlignment = Alignment.CenterHorizontally) {
                TooltipSurface(text)
                TooltipTip(physical)
            }
        }
        KozmosTooltipSide.Bottom -> {
            Column(modifier = modifier, horizontalAlignment = Alignment.CenterHorizontally) {
                TooltipTip(physical)
                TooltipSurface(text)
            }
        }
        // A side tooltip sits on its trigger's physical side, and its tip,
        // drawn in physical coordinates, points at the trigger: laid out from
        // the physical left in either reading direction. Right to left, a
        // Row put the tip at its start, the right: on the far side, pointing
        // into the bubble. The text inside still reads right to left.
        KozmosTooltipSide.Right -> {
            Row(modifier = modifier, horizontalArrangement = Arrangement.Absolute.Left, verticalAlignment = Alignment.CenterVertically) {
                TooltipTip(physical)
                TooltipSurface(text)
            }
        }
        // Left; Leading and Trailing are resolved to Left or Right above.
        else -> {
            Row(modifier = modifier, horizontalArrangement = Arrangement.Absolute.Left, verticalAlignment = Alignment.CenterVertically) {
                TooltipSurface(text)
                TooltipTip(physical)
            }
        }
    }
}

@Composable
private fun TooltipSurface(text: String) {
    val shape = RoundedCornerShape(KozmosDimensions.semanticsRadiusControl)
    Text(
        text = text,
        color = KozmosThemeTokens.primitivesColorsForeground0,
        modifier = Modifier
            .shadow(elevation = KozmosShadows.semanticsElevationOverlay, shape = shape)
            .background(KozmosThemeTokens.primitivesColorsBackground0, shape)
            .border(1.dp, KozmosThemeTokens.primitivesColorsBackground200, shape)
            .padding(
                horizontal = KozmosDimensions.primitivesLayoutSpacing150,
                vertical = KozmosDimensions.primitivesLayoutSpacing75
            )
    )
}

@Composable
private fun TooltipTip(side: KozmosTooltipSide) {
    val color = KozmosThemeTokens.primitivesColorsBackground0
    Canvas(modifier = Modifier.size(width = tipWidth(side), height = tipHeight(side))) {
        drawPath(tooltipTipPath(side), color = color)
    }
}

private fun DrawScope.tooltipTipPath(side: KozmosTooltipSide): Path {
    return Path().apply {
        when (side) {
            KozmosTooltipSide.Top -> {
                moveTo(size.width / 2f, size.height)
                lineTo(0f, 0f)
                lineTo(size.width, 0f)
            }
            KozmosTooltipSide.Bottom -> {
                moveTo(size.width / 2f, 0f)
                lineTo(size.width, size.height)
                lineTo(0f, size.height)
            }
            KozmosTooltipSide.Right -> {
                moveTo(0f, size.height / 2f)
                lineTo(size.width, 0f)
                lineTo(size.width, size.height)
            }
            // Left; the bubble passes a physical side.
            else -> {
                moveTo(size.width, size.height / 2f)
                lineTo(0f, size.height)
                lineTo(0f, 0f)
            }
        }
        close()
    }
}

internal class TooltipPositionProvider(
    private val side: KozmosTooltipSide,
    private val offsetPx: Int
) : PopupPositionProvider {
    override fun calculatePosition(
        anchorBounds: IntRect,
        windowSize: IntSize,
        layoutDirection: LayoutDirection,
        popupContentSize: IntSize
    ): IntOffset {
        // Physical, resolved against the direction the popup is laid out in.
        return when (side.physical(layoutDirection)) {
            KozmosTooltipSide.Top -> IntOffset(
                x = anchorBounds.left + (anchorBounds.width - popupContentSize.width) / 2,
                y = anchorBounds.top - popupContentSize.height - offsetPx
            )
            KozmosTooltipSide.Right -> IntOffset(
                x = anchorBounds.right + offsetPx,
                y = anchorBounds.top + (anchorBounds.height - popupContentSize.height) / 2
            )
            KozmosTooltipSide.Bottom -> IntOffset(
                x = anchorBounds.left + (anchorBounds.width - popupContentSize.width) / 2,
                y = anchorBounds.bottom + offsetPx
            )
            // Left; Leading and Trailing are resolved to Left or Right above.
            else -> IntOffset(
                x = anchorBounds.left - popupContentSize.width - offsetPx,
                y = anchorBounds.top + (anchorBounds.height - popupContentSize.height) / 2
            )
        }
    }
}

// The tip's size, for a physical side: across a side tooltip's tip is its height.
private fun tipWidth(side: KozmosTooltipSide) = when (side) {
    KozmosTooltipSide.Top,
    KozmosTooltipSide.Bottom -> 8.dp
    else -> 4.dp
}

private fun tipHeight(side: KozmosTooltipSide) = when (side) {
    KozmosTooltipSide.Top,
    KozmosTooltipSide.Bottom -> 4.dp
    else -> 8.dp
}
