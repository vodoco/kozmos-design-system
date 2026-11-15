package com.kozmos.components.list

import com.kozmos.tokens.KozmosDimensions

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.Divider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.KozmosTypography

@Composable
fun KozmosList(
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit
) {
    Column(modifier = modifier) {
        content()
    }
}

/**
 * A row of a [KozmosList]: its text alone, or, with any of its slots
 * (GAP-195, decision 135), React's ListItem filled in. A mark at the start,
 * centred on the title's line; the title ([text]) with [titleAddon] beside
 * it, [description] and [meta] under it; one control at the end. The
 * checklist row and the settings row are this row.
 *
 * TalkBack reads the slots in their order, so a status at the start is heard
 * before the title. [selected] tints the row theme 0, as a ticked persona's
 * row is; it is drawn only: the row's control says it is checked.
 *
 * @param text The row's text, or its title once it has slots.
 * @param description Under the title, in the muted colour.
 * @param meta Under the description, smaller, in the muted colour.
 * @param selected Tinted, theme 0: a row whose box is ticked.
 * @param leading At the start: a [KozmosListItemStatus], an icon, a mark.
 * @param titleAddon Beside the title: a role tag, an info button.
 * @param metaContent Under the description, in place of [meta]'s words.
 * @param trailing At the end, centred on the row: its one control.
 */
@Composable
fun KozmosListItem(
    text: String,
    modifier: Modifier = Modifier,
    showDivider: Boolean = true,
    description: String? = null,
    meta: String? = null,
    selected: Boolean = false,
    leading: (@Composable () -> Unit)? = null,
    titleAddon: (@Composable () -> Unit)? = null,
    metaContent: (@Composable () -> Unit)? = null,
    trailing: (@Composable () -> Unit)? = null
) {
    val slotted = description != null || meta != null || selected || leading != null ||
        titleAddon != null || metaContent != null || trailing != null
    Column(modifier = modifier.fillMaxWidth()) {
        if (slotted) {
            KozmosListItemSlots(
                text = text,
                description = description,
                meta = meta,
                selected = selected,
                leading = leading,
                titleAddon = titleAddon,
                metaContent = metaContent,
                trailing = trailing
            )
        } else {
            Text(
                text = text,
                style = MaterialTheme.typography.bodyLarge,
                color = KozmosThemeTokens.primitivesColorsForeground100,
                modifier = Modifier.padding(KozmosDimensions.primitivesLayoutSpacing200)
            )
        }
        if (showDivider) {
            Divider(color = KozmosThemeTokens.primitivesColorsBackground300)
        }
    }
}

// React's text-sm and text-xs, in the platform's font.
private val titleStyle: TextStyle
    get() = TextStyle(
        fontFamily = KozmosTypography.family,
        fontSize = 14.sp,
        lineHeight = 20.sp,
        fontWeight = FontWeight.Medium
    )
private val descriptionStyle: TextStyle
    get() = TextStyle(fontFamily = KozmosTypography.family, fontSize = 14.sp, lineHeight = 20.sp)
private val metaStyle: TextStyle
    get() = TextStyle(fontFamily = KozmosTypography.family, fontSize = 12.sp, lineHeight = 16.sp)

@Composable
private fun KozmosListItemSlots(
    text: String,
    description: String?,
    meta: String?,
    selected: Boolean,
    leading: (@Composable () -> Unit)?,
    titleAddon: (@Composable () -> Unit)?,
    metaContent: (@Composable () -> Unit)?,
    trailing: (@Composable () -> Unit)?
) {
    // React's tint: theme 0, CardHeader's subtle strip.
    val tint = if (selected) KozmosThemeTokens.primitivesColorsTheme0 else Color.Transparent
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(tint)
            .heightIn(min = 48.dp)
            .padding(
                horizontal = KozmosDimensions.primitivesLayoutSpacing200,
                vertical = KozmosDimensions.primitivesLayoutSpacing150
            ),
        horizontalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing150)
    ) {
        if (leading != null) {
            // Centred on the title's 20 line.
            Box(modifier = Modifier.heightIn(min = 20.dp), contentAlignment = Alignment.Center) {
                leading()
            }
        }
        Column(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing25)
        ) {
            Row(
                horizontalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing100),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = text,
                    style = titleStyle,
                    color = KozmosThemeTokens.primitivesColorsForeground0,
                    modifier = Modifier.weight(1f, fill = false)
                )
                if (titleAddon != null) titleAddon()
            }
            if (description != null) {
                Text(
                    text = description,
                    style = descriptionStyle,
                    color = KozmosThemeTokens.primitivesColorsForeground400
                )
            }
            if (metaContent != null) {
                metaContent()
            } else if (meta != null) {
                Text(
                    text = meta,
                    style = metaStyle,
                    color = KozmosThemeTokens.primitivesColorsForeground400
                )
            }
        }
        if (trailing != null) {
            Box(modifier = Modifier.align(Alignment.CenterVertically)) {
                trailing()
            }
        }
    }
}

/** A checklist row's status (GAP-195): not started, in progress, or done. */
enum class KozmosListItemStatusValue(val defaultLabel: String) {
    Todo("Not started"),
    InProgress("In progress"),
    Done("Done")
}

/**
 * A checklist row's status mark, for [KozmosListItem]'s `leading`: Stepper's
 * step marks at 20, as React's ListItemStatus draws them. Done is the theme
 * fill with a check; in progress a 2dp theme ring round an 8dp dot; not
 * started a 1dp ring in foreground 500. One node, read by its words, "Done"
 * by default: first in the row, so the status is heard with the title.
 *
 * @param label What TalkBack reads instead of the English default.
 */
@Composable
fun KozmosListItemStatus(
    status: KozmosListItemStatusValue,
    modifier: Modifier = Modifier,
    label: String? = null
) {
    val spoken = label ?: status.defaultLabel
    val base = modifier
        .size(20.dp)
        .clearAndSetSemantics { contentDescription = spoken }
    when (status) {
        KozmosListItemStatusValue.Done -> Box(
            modifier = base.background(
                KozmosThemeTokens.componentsPrimaryButtonsThemedButtonBackgroundIdle,
                CircleShape
            ),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.Check,
                contentDescription = null,
                tint = KozmosThemeTokens.componentsPrimaryButtonsThemedButtonForegroundContentIdle,
                modifier = Modifier.size(12.dp)
            )
        }
        KozmosListItemStatusValue.InProgress -> Box(
            modifier = base.border(2.dp, KozmosThemeTokens.primitivesColorsTheme600, CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Box(
                modifier = Modifier
                    .size(8.dp)
                    .background(KozmosThemeTokens.primitivesColorsTheme600, CircleShape)
            )
        }
        KozmosListItemStatusValue.Todo -> Box(
            modifier = base.border(1.dp, KozmosThemeTokens.primitivesColorsForeground500, CircleShape)
        )
    }
}
