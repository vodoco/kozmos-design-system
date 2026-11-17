package com.kozmos.components.segmentedcontrol

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.IntrinsicMeasurable
import androidx.compose.ui.layout.IntrinsicMeasureScope
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.layout.Measurable
import androidx.compose.ui.layout.MeasurePolicy
import androidx.compose.ui.layout.MeasureResult
import androidx.compose.ui.layout.MeasureScope
import androidx.compose.ui.layout.layout
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kozmos.components.fieldwrapper.KozmosMixedReset
import com.kozmos.components.fieldwrapper.KozmosMixedValue
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.tokens.KozmosThemeTokens
import kotlin.math.max
import kotlin.math.roundToInt
import kotlin.math.sign

enum class SegmentedControlSize {
    Sm, Default, Lg
}

/**
 * A choice of one option from a few, drawn as segments in a track. Each
 * option is a radio in a selectable group, as React's are.
 *
 * Its options keep their width, 97, 117 or 137dp by [size], when there is
 * room, and shrink toward their words when the space is short, never past
 * them (GAP-267, decision 201): the words are never cut short or run into
 * the next option's. Only when the words alone are wider than the space does
 * the track run past it.
 *
 * [mixed] (decisions 188 and 191): the control stands for several values
 * that differ, a property of a multi-selection whose features chose
 * different options. No option is selected, and [mixedLabel] is drawn under
 * the track, read after the options: a radio has no mixed state to say.
 * Choosing an option calls [onOptionSelected], and the product clears
 * `mixed`. [onResetMixed] offers [resetMixedLabel] under the track once it
 * is no longer mixed, never while disabled; pressed, focus goes back to the
 * options, and the product sets `mixed` again.
 */
@Composable
fun KozmosSegmentedControl(
    options: List<String>,
    selectedIndex: Int,
    onOptionSelected: (Int) -> Unit,
    modifier: Modifier = Modifier,
    size: SegmentedControlSize = SegmentedControlSize.Default,
    enabled: Boolean = true,
    fullWidth: Boolean = false,
    mixed: Boolean = false,
    mixedLabel: String = KozmosMixedValue.LABEL,
    onResetMixed: (() -> Unit)? = null,
    resetMixedLabel: String = KozmosMixedValue.RESET_LABEL
) {
    val showsReset = KozmosMixedValue.showsReset(mixed, onResetMixed, enabled)
    val optionFocus = remember { FocusRequester() }
    // Only a control with a line under it is a column: the track alone is
    // the box the caller's modifier sizes, as it always was.
    if (!mixed && !showsReset) {
        KozmosSegmentedTrack(options, selectedIndex, onOptionSelected, modifier, size, enabled, fullWidth, mixed, optionFocus)
        return
    }
    Column(
        modifier = modifier,
        verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing75)
    ) {
        KozmosSegmentedTrack(options, selectedIndex, onOptionSelected, Modifier, size, enabled, fullWidth, mixed, optionFocus)
        if (mixed) {
            // Drawn and read after the options, as the field's helper text.
            Text(
                text = mixedLabel,
                style = MaterialTheme.typography.bodyMedium,
                color = KozmosThemeTokens.primitivesColorsForeground400
            )
        } else {
            KozmosMixedReset(label = resetMixedLabel, onClick = {
                // The reset goes as the control turns mixed again: focus
                // goes back to the options, as on the web.
                optionFocus.requestFocus()
                onResetMixed?.invoke()
            })
        }
    }
}

@Composable
private fun KozmosSegmentedTrack(
    options: List<String>,
    selectedIndex: Int,
    onOptionSelected: (Int) -> Unit,
    modifier: Modifier,
    size: SegmentedControlSize,
    enabled: Boolean,
    fullWidth: Boolean,
    mixed: Boolean,
    optionFocus: FocusRequester
) {
    val metrics = segmentedControlMetrics(size)
    val containerShape = RoundedCornerShape(16.dp)
    // Where focus goes back to after a reset: the option chosen before it,
    // or the first that can be chosen.
    val focusIndex = if (selectedIndex in options.indices) selectedIndex else 0
    val scroll = rememberScrollState()
    val viewport = remember { IntArray(1) { Constraints.Infinity } }

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
        Layout(
            modifier = Modifier
                .padding(4.dp)
                // The width the options may take, read before the scroll
                // measures them unbounded: they shrink into it, and the
                // track scrolls only when their words alone are wider, as
                // React's does.
                .layout { measurable, constraints ->
                    viewport[0] = if (constraints.hasBoundedWidth) constraints.maxWidth else Constraints.Infinity
                    val placeable = measurable.measure(constraints)
                    layout(placeable.width, placeable.height) { placeable.place(0, 0) }
                }
                .horizontalScroll(scroll)
                .selectableGroup(),
            measurePolicy = remember(fullWidth, size) { KozmosSegmentedMeasurePolicy(viewport, fullWidth, metrics.itemMinWidth) },
            content = {
                options.forEachIndexed { index, label ->
                    // Mixed, no option is selected (decision 191).
                    val selected = !mixed && index == selectedIndex

                    Box(
                        modifier = Modifier
                            .then(if (index == focusIndex) Modifier.focusRequester(optionFocus) else Modifier)
                            .heightIn(min = metrics.itemHeight)
                            .clip(RoundedCornerShape(12.dp))
                            .background(
                                if (selected) {
                                    KozmosThemeTokens.primitivesColorsBackground0
                                } else {
                                    Color.Transparent
                                }
                            )
                            .selectable(
                                selected = selected,
                                enabled = enabled,
                                role = Role.RadioButton,
                                onClick = { onOptionSelected(index) }
                            ),
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
        )
    }
}

/**
 * Lays the options out in a row, each [kozmosSegmentWidths] wide, centred
 * on the row's height. Its intrinsic widths are the options' own, so a
 * parent that asks reads the track's room with and without shrinking.
 */
private class KozmosSegmentedMeasurePolicy(
    private val viewport: IntArray,
    private val fullWidth: Boolean,
    private val itemMinWidth: Dp
) : MeasurePolicy {
    override fun MeasureScope.measure(measurables: List<Measurable>, constraints: Constraints): MeasureResult {
        // Each option's words with its padding, and its width with room:
        // its minimum, or its words if they are wider. Full width, the
        // options share the track and none is narrower than its words.
        val words = measurables.map { it.maxIntrinsicWidth(Constraints.Infinity) }
        val bound = if (constraints.hasBoundedWidth) constraints.maxWidth else viewport[0]
        val widths = kozmosSegmentWidths(
            words = words,
            minimum = if (fullWidth) 0 else itemMinWidth.roundToPx(),
            available = bound.takeIf { it != Constraints.Infinity },
            share = fullWidth
        )
        val placeables = measurables.mapIndexed { index, measurable ->
            measurable.measure(
                Constraints(
                    minWidth = widths[index],
                    maxWidth = widths[index],
                    minHeight = 0,
                    maxHeight = constraints.maxHeight
                )
            )
        }
        val height = max(placeables.maxOfOrNull { it.height } ?: 0, constraints.minHeight)
            .coerceAtMost(constraints.maxHeight)
        val width = widths.sum().coerceAtLeast(constraints.minWidth)
            .let { if (constraints.hasBoundedWidth) it.coerceAtMost(constraints.maxWidth) else it }
        return layout(width, height) {
            var x = 0
            placeables.forEach { placeable ->
                placeable.placeRelative(x, Alignment.CenterVertically.align(placeable.height, height))
                x += placeable.width
            }
        }
    }

    override fun IntrinsicMeasureScope.maxIntrinsicWidth(measurables: List<IntrinsicMeasurable>, height: Int): Int {
        val minimum = if (fullWidth) 0 else itemMinWidth.roundToPx()
        return measurables.sumOf { max(it.maxIntrinsicWidth(height), minimum) }
    }

    override fun IntrinsicMeasureScope.minIntrinsicWidth(measurables: List<IntrinsicMeasurable>, height: Int): Int =
        measurables.sumOf { it.maxIntrinsicWidth(height) }

    override fun IntrinsicMeasureScope.maxIntrinsicHeight(measurables: List<IntrinsicMeasurable>, width: Int): Int =
        measurables.maxOfOrNull { it.maxIntrinsicHeight(Constraints.Infinity) } ?: 0

    override fun IntrinsicMeasureScope.minIntrinsicHeight(measurables: List<IntrinsicMeasurable>, width: Int): Int =
        measurables.maxOfOrNull { it.minIntrinsicHeight(Constraints.Infinity) } ?: 0
}

/**
 * Each option's width in [available] (null when unbounded): GAP-267's rule,
 * as React's options lay out (CSS flexbox). Not [share]d, an option takes
 * its minimum or its [words], whichever is wider; short of room, each gives
 * up width in proportion to that width, never past its words, as a flex
 * item shrinks. [share]d (full width), the options split the space equally,
 * none narrower than its words. Past what the words need, they keep their
 * words and the track runs past [available]: never cut short.
 */
internal fun kozmosSegmentWidths(words: List<Int>, minimum: Int, available: Int?, share: Boolean): List<Int> {
    if (words.isEmpty()) return emptyList()
    val preferred = words.map { max(it, minimum) }
    if (!share) {
        if (available == null || preferred.sum() <= available) return preferred
        val target = preferred.map { it.toFloat() }.toMutableList()
        val frozen = preferred.indices.map { preferred[it] <= words[it] }.toMutableList()
        while (true) {
            val open = target.indices.filter { !frozen[it] }
            if (open.isEmpty()) break
            val base = open.sumOf { preferred[it] }.toFloat()
            val free = available - target.indices.filter { frozen[it] }.sumOf { target[it].toDouble() }.toFloat() - base
            var violated = false
            for (i in open) {
                target[i] = preferred[i] + free * preferred[i] / base
                if (target[i] < words[i]) {
                    target[i] = words[i].toFloat()
                    frozen[i] = true
                    violated = true
                }
            }
            if (!violated) break
        }
        return roundKeepingSum(target)
    }
    if (available == null) return words
    val target = MutableList(words.size) { 0f }
    val frozen = MutableList(words.size) { false }
    while (true) {
        val open = target.indices.filter { !frozen[it] }
        if (open.isEmpty()) break
        val share = (available - target.indices.filter { frozen[it] }.sumOf { target[it].toDouble() }.toFloat()) / open.size
        var violated = false
        for (i in open) {
            target[i] = share
            if (share < words[i]) {
                target[i] = words[i].toFloat()
                frozen[i] = true
                violated = true
            }
        }
        if (!violated) break
    }
    return roundKeepingSum(target)
}

/**
 * Whole pixels that add up to the rounded total, the remainder a pixel each
 * from the first, as Row splits weighted space.
 */
private fun roundKeepingSum(target: List<Float>): List<Int> {
    val rounded = target.map { it.roundToInt() }.toMutableList()
    var remainder = target.sum().roundToInt() - rounded.sum()
    var i = 0
    while (remainder != 0 && i < rounded.size) {
        val unit = remainder.sign
        rounded[i] += unit
        remainder -= unit
        i++
    }
    return rounded
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
