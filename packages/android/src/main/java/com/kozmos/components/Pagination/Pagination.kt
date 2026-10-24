package com.kozmos.components.pagination


import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowLeft
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.HorizontalAlignmentLine
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.layout.Measured
import androidx.compose.ui.layout.Placeable
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.constrainHeight
import androidx.compose.ui.unit.constrainWidth
import androidx.compose.ui.unit.dp
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.KozmosDimensions

/**
 * The pagination's parts in a row that wraps, as React's `flex flex-row
 * flex-wrap justify-center items-center gap-1` does and #392's
 * KozmosPaginationRowLayout wraps SwiftUI's: each part keeps its own width,
 * a part that would pass the end of a line starts the next one, each line is
 * centred, and each part sits on its line's middle, lines 4dp apart. A part
 * wider than the whole line is given the line's width. Placement is relative,
 * so right to left mirrors it. The parts keep their own 4dp each side, so
 * they sit 8dp apart along a line, as they did in the Row this replaces.
 *
 * It was a Row, which cannot wrap: with 44dp links, Code Connect's Basic
 * composition, 346dp, is wider than a 360dp phone's 328dp line, and the Row
 * squeezed Next to 64dp of its 82; on a 379dp line it squeezed the Ellipsis
 * composition's Next to 27dp, its word broken over four lines.
 * The content is still a [RowScope], so a call that compiled compiles, but
 * the scope's `weight`, `align` and `alignBy` do nothing here: a wrapping
 * row has no room to share out and centres every part.
 */
@Composable
fun KozmosPagination(
    modifier: Modifier = Modifier,
    content: @Composable RowScope.() -> Unit
) {
    Layout(content = { PaginationRowScope.content() }, modifier = modifier) { measurables, constraints ->
        val lineGap = KozmosDimensions.primitivesLayoutSpacing50.roundToPx()
        val loose = constraints.copy(minWidth = 0, minHeight = 0)
        val placeables = measurables.map { it.measure(loose) }
        val lineWidth = if (constraints.hasBoundedWidth) constraints.maxWidth else Int.MAX_VALUE
        val lines = mutableListOf<MutableList<Placeable>>()
        var widthSoFar = 0
        for (placeable in placeables) {
            val line = lines.lastOrNull()
            if (line == null || widthSoFar + placeable.width > lineWidth) {
                lines += mutableListOf(placeable)
                widthSoFar = placeable.width
            } else {
                line += placeable
                widthSoFar += placeable.width
            }
        }
        val widths = lines.map { line -> line.sumOf { it.width } }
        val heights = lines.map { line -> line.maxOf { it.height } }
        val width = constraints.constrainWidth(widths.maxOrNull() ?: 0)
        val height = constraints.constrainHeight(heights.sum() + lineGap * (lines.size - 1).coerceAtLeast(0))
        layout(width, height) {
            var y = 0
            lines.forEachIndexed { index, line ->
                var x = (width - widths[index]) / 2
                for (placeable in line) {
                    placeable.placeRelative(x, y + Alignment.CenterVertically.align(placeable.height, heights[index]))
                    x += placeable.width
                }
                y += heights[index] + lineGap
            }
        }
    }
}

/** The pagination's [RowScope]: its parts are placed by the wrapping row, so these change nothing. */
private object PaginationRowScope : RowScope {
    override fun Modifier.weight(weight: Float, fill: Boolean): Modifier = this
    override fun Modifier.align(alignment: Alignment.Vertical): Modifier = this
    override fun Modifier.alignBy(alignmentLine: HorizontalAlignmentLine): Modifier = this
    override fun Modifier.alignByBaseline(): Modifier = this
    override fun Modifier.alignBy(alignmentLineBlock: (Measured) -> Int): Modifier = this
}

@Composable
fun KozmosPaginationLink(
    text: String,
    isActive: Boolean = false,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val trackEvent = com.kozmos.providers.LocalKozmosAnalytics.current
    Box(
        modifier = modifier
            .padding(horizontal = KozmosDimensions.primitivesLayoutSpacing50)
            // A 44dp square, as React's link is Button's icon size in touch
            // (`h-icon-control w-icon-control`), and all of it takes a press.
            // It was 36.
            .defaultMinSize(minWidth = PaginationTarget, minHeight = PaginationTarget)
            .clip(RoundedCornerShape(KozmosDimensions.semanticsRadiusControl))
            // Active, the page is theme/600 text and edge on a 10% tint of it,
            // as React's is (decision 59); it was theme/500.
            .background(if (isActive) KozmosThemeTokens.primitivesColorsTheme600.copy(alpha = 0.1f) else Color.Transparent)
            .clickable { 
                trackEvent(com.kozmos.providers.KozmosAnalyticsEvent(component = "Pagination", eventName = "page_changed"))
                onClick() 
            }
            .then(
                if (isActive) Modifier.border(1.dp, KozmosThemeTokens.primitivesColorsTheme600, RoundedCornerShape(KozmosDimensions.semanticsRadiusControl))
                else Modifier
            ),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = text,
            color = if (isActive) KozmosThemeTokens.primitivesColorsTheme600 else KozmosThemeTokens.primitivesColorsForeground100,
            style = MaterialTheme.typography.bodyMedium
        )
    }
}

@Composable
fun KozmosPaginationPrevious(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    /**
     * The word drawn beside the arrow, and what TalkBack says. "Previous" by
     * default, as React's `label`; a product that translates passes its own.
     */
    label: String = "Previous"
) {
    Box(
        modifier = modifier
            .padding(horizontal = KozmosDimensions.primitivesLayoutSpacing50)
            // As tall as the page links, as React's is (decision 82). It was 36.
            .defaultMinSize(minHeight = PaginationTarget)
            .clip(RoundedCornerShape(KozmosDimensions.semanticsRadiusControl))
            .clickable(onClick = onClick)
            .padding(horizontal = KozmosDimensions.primitivesLayoutSpacing100),
        contentAlignment = Alignment.Center
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            // Decoration, as React's hidden chevron: the word names the
            // control. Described as "Previous" too, TalkBack said it twice.
            Icon(Icons.AutoMirrored.Filled.KeyboardArrowLeft, contentDescription = null, tint = KozmosThemeTokens.primitivesColorsForeground100)
            Spacer(modifier = Modifier.width(KozmosDimensions.primitivesLayoutSpacing50))
            Text(label, color = KozmosThemeTokens.primitivesColorsForeground100, style = MaterialTheme.typography.bodyMedium)
        }
    }
}

@Composable
fun KozmosPaginationNext(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    /**
     * The word drawn beside the arrow, and what TalkBack says. "Next" by
     * default, as React's `label`; a product that translates passes its own.
     */
    label: String = "Next"
) {
    Box(
        modifier = modifier
            .padding(horizontal = KozmosDimensions.primitivesLayoutSpacing50)
            // As tall as the page links, as React's is (decision 82). It was 36.
            .defaultMinSize(minHeight = PaginationTarget)
            .clip(RoundedCornerShape(KozmosDimensions.semanticsRadiusControl))
            .clickable(onClick = onClick)
            .padding(horizontal = KozmosDimensions.primitivesLayoutSpacing100),
        contentAlignment = Alignment.Center
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(label, color = KozmosThemeTokens.primitivesColorsForeground100, style = MaterialTheme.typography.bodyMedium)
            Spacer(modifier = Modifier.width(KozmosDimensions.primitivesLayoutSpacing50))
            // Decoration, as React's hidden chevron: the word names the
            // control. Described as "Next" too, TalkBack said it twice.
            Icon(Icons.AutoMirrored.Filled.KeyboardArrowRight, contentDescription = null, tint = KozmosThemeTokens.primitivesColorsForeground100)
        }
    }
}

/** A page link's side, and Previous's and Next's height: React's touch size, 44. */
private val PaginationTarget = 44.dp

@Composable
fun KozmosPaginationEllipsis(modifier: Modifier = Modifier) {
    // React's 36 (`h-9 w-9`): it takes no press.
    Box(
        modifier = modifier.defaultMinSize(minWidth = 36.dp, minHeight = 36.dp),
        contentAlignment = Alignment.Center
    ) {
        Text("...", color = KozmosThemeTokens.primitivesColorsForeground500, style = MaterialTheme.typography.bodyLarge)
    }
}
