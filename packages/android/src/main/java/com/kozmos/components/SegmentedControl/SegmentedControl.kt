package com.kozmos.components.segmentedcontrol

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kozmos.tokens.KozmosThemeTokens

enum class SegmentedControlSize {
    Sm, Default, Lg
}

@Composable
fun KozmosSegmentedControl(
    options: List<String>,
    selectedIndex: Int,
    onOptionSelected: (Int) -> Unit,
    modifier: Modifier = Modifier,
    size: SegmentedControlSize = SegmentedControlSize.Default,
    enabled: Boolean = true,
    fullWidth: Boolean = false
) {
    val metrics = segmentedControlMetrics(size)
    val containerShape = RoundedCornerShape(16.dp)

    Surface(
        modifier = modifier
            .then(if (fullWidth) Modifier.fillMaxWidth() else Modifier)
            .heightIn(min = metrics.containerHeight)
            .alpha(if (enabled) 1f else 0.5f)
            .border(1.dp, KozmosThemeTokens.primitivesColorsBackground200, containerShape),
        shape = containerShape,
        color = KozmosThemeTokens.primitivesColorsBackground100,
        contentColor = KozmosThemeTokens.primitivesColorsForeground400
    ) {
        Row(
            modifier = Modifier.padding(4.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            options.forEachIndexed { index, label ->
                val selected = index == selectedIndex
                val itemModifier = Modifier
                    .then(if (fullWidth) Modifier.weight(1f) else Modifier)
                    .then(
                        if (!fullWidth) {
                            Modifier.widthIn(min = metrics.itemMinWidth)
                        } else {
                            Modifier
                        }
                    )
                    .heightIn(min = metrics.itemHeight)
                    .clip(RoundedCornerShape(12.dp))
                    .background(
                        if (selected) {
                            KozmosThemeTokens.primitivesColorsBackground0
                        } else {
                            Color.Transparent
                        }
                    )
                    .clickable(enabled = enabled) { onOptionSelected(index) }

                Box(
                    modifier = itemModifier,
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = label,
                        modifier = Modifier.padding(horizontal = metrics.horizontalPadding),
                        color = if (selected) {
                            KozmosThemeTokens.primitivesColorsForeground0
                        } else {
                            KozmosThemeTokens.primitivesColorsForeground400
                        },
                        fontSize = metrics.fontSize,
                        fontWeight = FontWeight.Medium,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        textAlign = TextAlign.Center
                    )
                }
            }
        }
    }
}

private data class SegmentedControlMetrics(
    val containerHeight: Dp,
    val itemMinWidth: Dp,
    val itemHeight: Dp,
    val horizontalPadding: Dp,
    val fontSize: TextUnit
)

private fun segmentedControlMetrics(size: SegmentedControlSize): SegmentedControlMetrics =
    when (size) {
        SegmentedControlSize.Sm -> SegmentedControlMetrics(
            containerHeight = 52.dp,
            itemMinWidth = 97.dp,
            itemHeight = 44.dp,
            horizontalPadding = 12.dp,
            fontSize = 12.sp
        )
        SegmentedControlSize.Default -> SegmentedControlMetrics(
            containerHeight = 52.dp,
            itemMinWidth = 117.dp,
            itemHeight = 44.dp,
            horizontalPadding = 16.dp,
            fontSize = 14.sp
        )
        SegmentedControlSize.Lg -> SegmentedControlMetrics(
            containerHeight = 56.dp,
            itemMinWidth = 137.dp,
            itemHeight = 48.dp,
            horizontalPadding = 20.dp,
            fontSize = 14.sp
        )
    }
