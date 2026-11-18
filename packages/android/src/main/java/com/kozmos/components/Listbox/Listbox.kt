package com.kozmos.components.listbox

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.key
import com.kozmos.components.button.KozmosButton
import com.kozmos.components.button.KozmosButtonVariant
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.unit.dp
import com.kozmos.components.avatar.KozmosAvatar
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.tokens.KozmosThemeTokens

/**
 * An option's leading Avatar (decision 215, GAP-282), as React's
 * `ComboboxOption.media`: its image, or its initials when it has none or
 * until it loads (by default the label's first letters).
 */
data class KozmosOptionMedia(val imageUrl: String? = null, val initials: String? = null)

/** A label's initials: the first letter of its first two words, "PC" for "Pointr Cloud", as React's. */
internal fun optionInitials(label: String): String =
    label.trim().split(Regex("\\s+")).take(2)
        .mapNotNull { word -> word.codePoints().findFirst().takeIf { it.isPresent }?.let { String(Character.toChars(it.asInt)) } }
        .joinToString("").uppercase()

data class KozmosListboxOption(
    val value: String,
    val label: String,
    val description: String? = null,
    val disabled: Boolean = false,
    /** A leading Avatar, drawn before the label (decision 215). Decoration: the label stays the option's name. */
    val media: KozmosOptionMedia? = null,
    /** What the option shows at its end, before the check (GAP-260): a property's type. Muted, and said after the label. */
    val trailing: String? = null
)

/** A row's fill: background/100 chosen, the hover fill active (GAP-260), none otherwise. */
@Composable
internal fun listboxRowFill(selected: Boolean, active: Boolean): Color = when {
    selected -> KozmosThemeTokens.primitivesColorsBackground100
    active -> KozmosThemeTokens.semanticsHoverFill
    else -> Color.Transparent
}

/** A picker command, never a selectable option or query value. IDs must be unique. */
data class KozmosPickerAction(val id: String, val label: String, val disabled: Boolean = false, val onAction: () -> Unit)

internal fun validPickerActions(actions: List<KozmosPickerAction>): List<KozmosPickerAction> {
    val counts = actions.groupingBy { it.id }.eachCount()
    return actions.filter { it.id.isNotBlank() && counts[it.id] == 1 }
}

/**
 * A list of options always in view, on a surface of its own with a 1dp edge.
 * [embedded], for a list inside a Dialog, Popover or Card (GAP-271), draws no
 * box of its own: the container's box is the list's.
 */
@Composable
fun KozmosListbox(
    options: List<KozmosListboxOption>,
    selectedValues: List<String> = emptyList(),
    onSelectionChange: (List<String>, KozmosListboxOption) -> Unit = { _, _ -> },
    modifier: Modifier = Modifier,
    multiple: Boolean = false,
    enabled: Boolean = true,
    maxHeight: androidx.compose.ui.unit.Dp = 256.dp,
    actions: List<KozmosPickerAction> = emptyList(),
    emptyText: String? = null,
    embedded: Boolean = false,
    /**
     * The active option's value (GAP-260), for a product that moves it, as a
     * search field driving the list with a hardware keyboard does: drawn
     * with the hover fill, as React's active row; a chosen row keeps its own.
     */
    activeValue: String? = null
) {
    val shape = RoundedCornerShape(KozmosDimensions.semanticsRadiusControl)

    Column(
        modifier = modifier
            .fillMaxWidth()
            .heightIn(max = maxHeight)
            // Embedded (GAP-271), inside a Dialog, Popover or Card, the list
            // draws no box of its own: no surface, no edge, no inset; its rows
            // are as they are.
            .then(
                if (embedded) Modifier
                else Modifier
                    .clip(shape)
                    .background(KozmosThemeTokens.primitivesColorsBackground0)
                    .border(1.dp, KozmosThemeTokens.semanticsBorderSubtle, shape)
            )
            .verticalScroll(rememberScrollState())
            .then(if (embedded) Modifier else Modifier.padding(KozmosDimensions.primitivesLayoutSpacing50)),
        verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing50)
    ) {
        if (options.isEmpty() && emptyText != null) {
            Text(emptyText, style = MaterialTheme.typography.bodyMedium,
                color = KozmosThemeTokens.primitivesColorsForeground400,
                modifier = Modifier.padding(KozmosDimensions.primitivesLayoutSpacing150))
        }
        options.forEach { option ->
            val selected = selectedValues.contains(option.value)
            val rowShape = RoundedCornerShape(KozmosDimensions.semanticsRadiusControl)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    // At least 44dp, as React's rows are (decision 115): the
                    // density's control height, 44 in touch. It was 35, 8 above
                    // and below a line.
                    .heightIn(min = 44.dp)
                    .clip(rowShape)
                    .background(listboxRowFill(selected, active = option.value == activeValue && !option.disabled))
                    .selectable(selected = selected, enabled = enabled && !option.disabled) {
                        val nextValues = if (multiple) {
                            if (selected) {
                                selectedValues.filterNot { it == option.value }
                            } else {
                                selectedValues + option.value
                            }
                        } else {
                            listOf(option.value)
                        }
                        onSelectionChange(nextValues, option)
                    }
                    .padding(
                        horizontal = KozmosDimensions.primitivesLayoutSpacing150,
                        vertical = KozmosDimensions.primitivesLayoutSpacing100
                    ),
                horizontalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing100),
                // On the row's middle line, as React's `items-center`.
                verticalAlignment = Alignment.CenterVertically
            ) {
                option.media?.let { media ->
                    KozmosAvatar(
                        imageUrl = media.imageUrl,
                        fallbackText = media.initials ?: optionInitials(option.label),
                        // Decoration: the label names the option.
                        modifier = Modifier.clearAndSetSemantics { }
                    )
                }
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = option.label,
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Medium,
                        color = if (option.disabled) {
                            KozmosThemeTokens.primitivesColorsForeground500
                        } else {
                            MaterialTheme.colorScheme.onSurface
                        },
                        maxLines = 1
                    )
                    if (!option.description.isNullOrBlank()) {
                        // Muted; on a disabled option, the disabled label's
                        // colour, never darker than it.
                        Text(
                            text = option.description,
                            style = MaterialTheme.typography.bodySmall,
                            color = if (option.disabled) {
                                KozmosThemeTokens.primitivesColorsForeground500
                            } else {
                                KozmosThemeTokens.primitivesColorsForeground400
                            },
                            maxLines = 1
                        )
                    }
                }

                if (!option.trailing.isNullOrBlank()) {
                    Text(
                        text = option.trailing,
                        style = MaterialTheme.typography.bodySmall,
                        color = if (option.disabled) {
                            KozmosThemeTokens.primitivesColorsForeground500
                        } else {
                            KozmosThemeTokens.primitivesColorsForeground400
                        },
                        maxLines = 1
                    )
                }

                if (selected) {
                    Icon(
                        imageVector = Icons.Default.Check,
                        contentDescription = null,
                        modifier = Modifier.size(18.dp),
                        // An icon on a surface: theme/600 (decision 59).
                        tint = KozmosThemeTokens.primitivesColorsTheme600
                    )
                }
            }
        }
        validPickerActions(actions).forEach { action -> key(action.id) {
            KozmosButton(onClick = { if (enabled && !action.disabled) action.onAction() },
                modifier = Modifier.fillMaxWidth(), variant = KozmosButtonVariant.Ghost,
                enabled = enabled && !action.disabled) { Text(action.label) }
        } }
    }
}
