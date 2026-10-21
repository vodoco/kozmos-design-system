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
import androidx.compose.ui.zIndex
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.platform.LocalDensity
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

enum class KozmosTooltipSide {
    Top,
    Right,
    Bottom,
    Left
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
    when (side) {
        KozmosTooltipSide.Top -> {
            Column(modifier = modifier, horizontalAlignment = Alignment.CenterHorizontally) {
                TooltipSurface(text)
                TooltipTip(side)
            }
        }
        KozmosTooltipSide.Bottom -> {
            Column(modifier = modifier, horizontalAlignment = Alignment.CenterHorizontally) {
                TooltipTip(side)
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
                TooltipTip(side)
                TooltipSurface(text)
            }
        }
        KozmosTooltipSide.Left -> {
            Row(modifier = modifier, horizontalArrangement = Arrangement.Absolute.Left, verticalAlignment = Alignment.CenterVertically) {
                TooltipSurface(text)
                TooltipTip(side)
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
    // Above its bubble, as React's arrow is drawn above the content's shadow:
    // where the tip came before the bubble (Right, Bottom), the bubble's
    // shadow fell over it, greying it (#E0E0E0 on a #FFFFFF bubble).
    Canvas(modifier = Modifier.zIndex(1f).size(width = tipWidth(side), height = tipHeight(side))) {
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
            KozmosTooltipSide.Left -> {
                moveTo(size.width, size.height / 2f)
                lineTo(0f, size.height)
                lineTo(0f, 0f)
            }
        }
        close()
    }
}

private class TooltipPositionProvider(
    private val side: KozmosTooltipSide,
    private val offsetPx: Int
) : PopupPositionProvider {
    override fun calculatePosition(
        anchorBounds: IntRect,
        windowSize: IntSize,
        layoutDirection: LayoutDirection,
        popupContentSize: IntSize
    ): IntOffset {
        return when (side) {
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
            KozmosTooltipSide.Left -> IntOffset(
                x = anchorBounds.left - popupContentSize.width - offsetPx,
                y = anchorBounds.top + (anchorBounds.height - popupContentSize.height) / 2
            )
        }
    }
}

private fun tipWidth(side: KozmosTooltipSide) = when (side) {
    KozmosTooltipSide.Left,
    KozmosTooltipSide.Right -> 4.dp
    KozmosTooltipSide.Top,
    KozmosTooltipSide.Bottom -> 8.dp
}

private fun tipHeight(side: KozmosTooltipSide) = when (side) {
    KozmosTooltipSide.Left,
    KozmosTooltipSide.Right -> 8.dp
    KozmosTooltipSide.Top,
    KozmosTooltipSide.Bottom -> 4.dp
}
