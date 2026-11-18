package com.kozmos.components.descriptionlist

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.wrapContentHeight
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.widthIn
import androidx.compose.material3.LocalTextStyle
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.tokens.KozmosThemeTokens

/** How a [KozmosDescriptionList]'s items sit (GAP-221). */
enum class KozmosDescriptionListLayout {
    /** One under another, each as wide as the list. */
    Stack,

    /** Side by side, wrapping onto a new line when the next does not fit. */
    Row
}

/** In a row, each item at least this wide. */
private val ItemMinWidth = 160.dp

/** Whether the items are side by side, so each takes its minimum width. */
private val LocalDescriptionListRow = compositionLocalOf { false }

/**
 * A read-only record (GAP-221, decision 199): each value under its label,
 * with no field chrome, as a Read-Only view of a form shows it. Put
 * [KozmosDescriptionListItem]s in [content]. [layout] stacks them or sets them
 * side by side, wrapping. TalkBack hears each item as its label and its
 * value; an item's action is a control of its own. Not MetaStrip, which is a
 * strip of tiles about a place.
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun KozmosDescriptionList(
    modifier: Modifier = Modifier,
    layout: KozmosDescriptionListLayout = KozmosDescriptionListLayout.Stack,
    content: @Composable () -> Unit
) {
    val gap = KozmosDimensions.primitivesLayoutSpacing200
    CompositionLocalProvider(LocalDescriptionListRow provides (layout == KozmosDescriptionListLayout.Row)) {
        when (layout) {
            KozmosDescriptionListLayout.Stack -> Column(
                modifier = modifier,
                verticalArrangement = Arrangement.spacedBy(gap)
            ) { content() }
            KozmosDescriptionListLayout.Row -> FlowRow(
                modifier = modifier,
                horizontalArrangement = Arrangement.spacedBy(gap),
                verticalArrangement = Arrangement.spacedBy(gap)
            ) { content() }
        }
    }
}

/** An item whose value is text. */
@Composable
fun KozmosDescriptionListItem(
    label: String,
    value: String,
    modifier: Modifier = Modifier,
    action: (@Composable () -> Unit)? = null
) = KozmosDescriptionListItem(label = label, modifier = modifier, action = action) { Text(value) }

/** An item whose value is a yes or a no, said as [yesLabel] or [noLabel]. */
@Composable
fun KozmosDescriptionListItem(
    label: String,
    checked: Boolean,
    modifier: Modifier = Modifier,
    yesLabel: String = "Yes",
    noLabel: String = "No",
    action: (@Composable () -> Unit)? = null
) = KozmosDescriptionListItem(label = label, modifier = modifier, action = action) {
    Text(if (checked) yesLabel else noLabel)
}

/**
 * An item: [label], 12sp in foreground 400, over [value], any content (tags,
 * a link), drawn in 14sp foreground 100 where it is text, 4dp apart. [action]
 * (a Copy IconButton) sits at the end of the value's line, a control of its
 * own; the label and the value are one node to TalkBack.
 */
@Composable
fun KozmosDescriptionListItem(
    label: String,
    modifier: Modifier = Modifier,
    action: (@Composable () -> Unit)? = null,
    value: @Composable () -> Unit
) {
    val inRow = LocalDescriptionListRow.current
    Row(
        modifier = modifier.then(if (inRow) Modifier.widthIn(min = ItemMinWidth) else Modifier),
        verticalAlignment = Alignment.Bottom
    ) {
        Column(
            modifier = Modifier
                .weight(1f, fill = !inRow)
                .semantics(mergeDescendants = true) {},
            verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing50)
        ) {
            Text(
                text = label,
                fontSize = 12.sp,
                lineHeight = 16.sp,
                color = KozmosThemeTokens.primitivesColorsForeground400
            )
            CompositionLocalProvider(
                LocalTextStyle provides TextStyle(
                    fontSize = 14.sp,
                    lineHeight = 20.sp,
                    color = KozmosThemeTokens.primitivesColorsForeground100
                )
            ) {
                value()
            }
        }
        if (action != null) {
            // Centred on the value's line, at the item's foot: laid out as
            // tall as a line, the action drawn over it, so the item is no
            // taller for it.
            Box(
                modifier = Modifier
                    .padding(start = KozmosDimensions.primitivesLayoutSpacing100)
                    .height(20.dp)
                    .wrapContentHeight(Alignment.CenterVertically, unbounded = true),
                contentAlignment = Alignment.Center
            ) { action() }
        }
    }
}
