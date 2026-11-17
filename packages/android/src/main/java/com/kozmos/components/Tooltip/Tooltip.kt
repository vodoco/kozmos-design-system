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
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.zIndex
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
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

/**
 * How a tooltip reads (decision 192, GAP-210). Mirrors React's
 * `TooltipContent` `tone`.
 *
 * [Default] is the page's surface, background/0, with a background/200 edge
 * and foreground/0 words. [Inverse] is Pointr Cloud's dark info and guidance
 * tooltip: the bubble and its tip the inverse surface (foreground/200) and
 * the words the inverse on-surface (background/0), with its edge in the
 * surface's own colour, so it is the same size. Both turn over in the dark.
 */
enum class KozmosTooltipTone {
    Default,
    Inverse
}

/** The bubble's colours for a tone: its surface and tip, its edge, its words. */
private data class TooltipColors(val surface: Color, val edge: Color, val words: Color)

@Composable
@ReadOnlyComposable
private fun KozmosTooltipTone.colors(): TooltipColors = when (this) {
    KozmosTooltipTone.Default -> TooltipColors(
        surface = KozmosThemeTokens.primitivesColorsBackground0,
        edge = KozmosThemeTokens.primitivesColorsBackground200,
        words = KozmosThemeTokens.primitivesColorsForeground0
    )
    KozmosTooltipTone.Inverse -> TooltipColors(
        surface = KozmosThemeTokens.semanticsInverseSurface,
        edge = KozmosThemeTokens.semanticsInverseSurface,
        words = KozmosThemeTokens.semanticsInverseOnsurface
    )
}

/**
 * A short label over [content], shown while [visible], on [side] of it.
 *
 * @param tone [KozmosTooltipTone.Default], the page's surface, or
 * [KozmosTooltipTone.Inverse], the dark tooltip (decision 192). After
 * [visible], so a trailing [content] lambda still compiles.
 */
@Composable
fun KozmosTooltip(
    tooltip: String,
    modifier: Modifier = Modifier,
    side: KozmosTooltipSide = KozmosTooltipSide.Top,
    visible: Boolean = false,
    tone: KozmosTooltipTone = KozmosTooltipTone.Default,
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
                TooltipBubble(text = tooltip, side = side, tone = tone)
            }
        }
    }
}

@Composable
internal fun TooltipBubble(
    text: String,
    side: KozmosTooltipSide,
    modifier: Modifier = Modifier,
    tone: KozmosTooltipTone = KozmosTooltipTone.Default
) {
    val physical = side.physical(LocalLayoutDirection.current)
    val colors = tone.colors()
    when (physical) {
        KozmosTooltipSide.Top -> {
            Column(modifier = modifier, horizontalAlignment = Alignment.CenterHorizontally) {
                TooltipSurface(text, colors)
                TooltipTip(physical, colors.surface)
            }
        }
        KozmosTooltipSide.Bottom -> {
            Column(modifier = modifier, horizontalAlignment = Alignment.CenterHorizontally) {
                TooltipTip(physical, colors.surface)
                TooltipSurface(text, colors)
            }
        }
        // A side tooltip sits on its trigger's physical side, and its tip,
        // drawn in physical coordinates, points at the trigger: laid out from
        // the physical left in either reading direction. Right to left, a
        // Row put the tip at its start, the right: on the far side, pointing
        // into the bubble. The text inside still reads right to left.
        KozmosTooltipSide.Right -> {
            Row(modifier = modifier, horizontalArrangement = Arrangement.Absolute.Left, verticalAlignment = Alignment.CenterVertically) {
                TooltipTip(physical, colors.surface)
                TooltipSurface(text, colors)
            }
        }
        // Left; Leading and Trailing are resolved to Left or Right above.
        else -> {
            Row(modifier = modifier, horizontalArrangement = Arrangement.Absolute.Left, verticalAlignment = Alignment.CenterVertically) {
                TooltipSurface(text, colors)
                TooltipTip(physical, colors.surface)
            }
        }
    }
}

@Composable
private fun TooltipSurface(text: String, colors: TooltipColors) {
    val shape = RoundedCornerShape(KozmosDimensions.semanticsRadiusControl)
    Text(
        text = text,
        color = colors.words,
        modifier = Modifier
            .shadow(elevation = KozmosShadows.semanticsElevationOverlay, shape = shape)
            .background(colors.surface, shape)
            .border(1.dp, colors.edge, shape)
            .padding(
                horizontal = KozmosDimensions.primitivesLayoutSpacing150,
                vertical = KozmosDimensions.primitivesLayoutSpacing75
            )
    )
}

@Composable
private fun TooltipTip(side: KozmosTooltipSide, color: Color) {
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
