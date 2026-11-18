package com.kozmos.components.table

import com.kozmos.tokens.KozmosDimensions

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Divider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.KozmosMotion
import com.kozmos.components.motion.rememberKozmosAnimationsOn
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.withFrameMillis
import androidx.compose.ui.graphics.Color
import kotlinx.coroutines.delay
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.state.ToggleableState
import com.kozmos.components.checkbox.KozmosCheckbox

/**
 * True inside a table's header: the table draws the line under its header, so
 * a [KozmosTableRow] there draws none of its own. With both, the header had
 * two lines, one on the other, twice as thick as a body row's.
 */
private val LocalKozmosTableHeader = staticCompositionLocalOf { false }

@Composable
fun KozmosTable(
    modifier: Modifier = Modifier,
    header: @Composable (() -> Unit)? = null,
    content: @Composable () -> Unit
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(KozmosDimensions.semanticsRadiusControl))
            .border(1.dp, KozmosThemeTokens.primitivesColorsBackground300, RoundedCornerShape(KozmosDimensions.semanticsRadiusControl))
    ) {
        if (header != null) {
            CompositionLocalProvider(LocalKozmosTableHeader provides true) { header() }
            Divider(color = KozmosThemeTokens.semanticsBorderSubtle)
        }
        content()
    }
}

/** A table row's highlight (GAP-276): [New], a row just added. */
enum class KozmosTableRowHighlight {
    /** A short tint in the informative surface that fades, so the eye finds the row. */
    New
}

/**
 * How much of a [KozmosTableRowHighlight.New] tint shows [elapsed]
 * milliseconds after it was set (GAP-276): all of it for three deliberate
 * durations, then fading over a fourth on the standard curve, then none. With
 * animations off it shows in full and clears at the same mark, with no fade.
 */
internal fun tableRowHighlightAlpha(elapsed: Long, animationsOn: Boolean): Float {
    val deliberate = KozmosMotion.semanticsMotionDurationDeliberate.toLong()
    val hold = deliberate * 3
    if (elapsed >= hold + deliberate) return 0f
    if (!animationsOn || elapsed <= hold) return 1f
    val progress = (elapsed - hold).toFloat() / deliberate
    return 1f - KozmosMotion.semanticsMotionEasingStandard.transform(progress)
}

/**
 * A table row, with a line under it. [highlight] [KozmosTableRowHighlight.New]
 * marks a row just added (GAP-276): it is drawn on the informative surface,
 * held three deliberate durations and faded over a fourth; with the system's
 * animations off it shows and clears at the same mark with no fade. Setting
 * it again after it has cleared does not run it again: key the row to show a
 * new one.
 */
@Composable
fun KozmosTableRow(
    modifier: Modifier = Modifier,
    highlight: KozmosTableRowHighlight? = null,
    content: @Composable RowScope.() -> Unit
) {
    KozmosTableRow(modifier = modifier, highlight = highlight, selected = false, onSelectedChange = null, content = content)
}

/**
 * A row of a selectable table (GAP-171), React's `TableRow` with a `rowId`
 * in a `selectable` Table. With [onSelectedChange], the row starts with a
 * checkbox that selects it, named [selectLabel] (pass the row's own words:
 * "Select Ada Lovelace"). [selected] draws it on the hover fill with no
 * divider under it (decision 207), its 1dp kept clear so no row moves. The
 * header's [KozmosTableSelectAllCell] selects every row.
 */
@Composable
fun KozmosTableRow(
    modifier: Modifier = Modifier,
    highlight: KozmosTableRowHighlight? = null,
    selected: Boolean,
    onSelectedChange: ((Boolean) -> Unit)?,
    selectLabel: String = "Select row",
    content: @Composable RowScope.() -> Unit
) {
    val inHeader = LocalKozmosTableHeader.current
    val tint = if (highlight == KozmosTableRowHighlight.New) {
        val animationsOn = rememberKozmosAnimationsOn()
        var alpha by remember(highlight) { mutableFloatStateOf(1f) }
        LaunchedEffect(highlight, animationsOn) {
            if (!animationsOn) {
                delay(KozmosMotion.semanticsMotionDurationDeliberate * 4L)
                alpha = 0f
                return@LaunchedEffect
            }
            val start = withFrameMillis { it }
            while (alpha > 0f) {
                alpha = tableRowHighlightAlpha(withFrameMillis { it } - start, animationsOn = true)
            }
        }
        KozmosThemeTokens.semanticsEmotionInformativeSurface.copy(
            alpha = KozmosThemeTokens.semanticsEmotionInformativeSurface.alpha * alpha
        )
    } else {
        Color.Transparent
    }
    Column {
        Row(
            modifier = modifier
                .fillMaxWidth()
                .then(if (selected) Modifier.background(tableRowFill(selected = true)) else Modifier)
                .then(if (highlight != null) Modifier.background(tint) else Modifier)
                .padding(KozmosDimensions.primitivesLayoutSpacing200)
        ) {
            if (onSelectedChange != null) {
                KozmosCheckbox(
                    checked = selected,
                    onCheckedChange = onSelectedChange,
                    modifier = Modifier.semantics { contentDescription = selectLabel }
                )
            }
            content()
        }
        // One line under each row, as React's border-b; the table draws the
        // header's. None under a selected row (decision 207), whose fill is
        // the divider's own colour in dark: its 1dp stays, clear.
        if (!inHeader) Divider(color = tableRowDivider(selected))
    }
}

/** A row's fill: the hover fill while selected, as React's `bg-hover-fill`. */
@Composable
internal fun tableRowFill(selected: Boolean): Color =
    if (selected) KozmosThemeTokens.semanticsHoverFill else Color.Transparent

/** The line under a row: none under a selected one (decision 207). */
@Composable
internal fun tableRowDivider(selected: Boolean): Color =
    if (selected) Color.Transparent else KozmosThemeTokens.semanticsBorderSubtle

/**
 * What a selectable table says when its selection changes, by default
 * (GAP-171): "No rows selected", "1 row selected", "3 rows selected".
 */
fun kozmosTableSelectionAnnouncement(count: Int, total: Int): String = when (count) {
    0 -> "No rows selected"
    1 -> "1 row selected"
    else -> "$count rows selected"
}

/**
 * The select-all box's state (GAP-171): off with no row selected, on with
 * every row, indeterminate (mixed) between.
 */
fun kozmosTableSelectAllState(selected: Int, total: Int): ToggleableState = when {
    selected <= 0 || total <= 0 -> ToggleableState.Off
    selected >= total -> ToggleableState.On
    else -> ToggleableState.Indeterminate
}

/**
 * The header's checkbox in a selectable table (GAP-171), React's
 * `TableSelectAll`: put it first in the header's [KozmosTableRow]. It is
 * checked when [selectedCount] is [rowCount], mixed when it is fewer, and a
 * click asks [onSelectAllChange] to select every row (true) or clear them
 * (false); a mixed box's click selects them all, as decision 188's does.
 * Named [label]; TalkBack is told [announcement] of the count and the rows,
 * politely, each time the count changes.
 */
@Composable
fun RowScope.KozmosTableSelectAllCell(
    selectedCount: Int,
    rowCount: Int,
    onSelectAllChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier,
    label: String = "Select all rows",
    announcement: (count: Int, total: Int) -> String = ::kozmosTableSelectionAnnouncement
) {
    KozmosCheckbox(
        state = kozmosTableSelectAllState(selectedCount, rowCount),
        onCheckedChange = onSelectAllChange,
        enabled = rowCount > 0,
        modifier = modifier.semantics { contentDescription = label }
    )
    // The count, in a polite live region there from the start, so each
    // change is read, as React's status.
    val said = announcement(selectedCount, rowCount)
    Box(Modifier.size(1.dp).clearAndSetSemantics {
        liveRegion = LiveRegionMode.Polite
        contentDescription = said
    })
}

@Composable
fun RowScope.KozmosTableCell(
    text: String,
    modifier: Modifier = Modifier,
    weight: Float = 1f
) {
    Text(
        text = text,
        style = MaterialTheme.typography.bodyMedium,
        modifier = modifier.weight(weight)
    )
}

@Composable
fun RowScope.KozmosTableHeaderCell(
    text: String,
    modifier: Modifier = Modifier,
    weight: Float = 1f
) {
    Text(
        text = text,
        style = MaterialTheme.typography.titleSmall,
        color = KozmosThemeTokens.primitivesColorsForeground400,
        modifier = modifier.weight(weight)
    )
}
