package com.kozmos.components.select

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.focusable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.disabled
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.kozmos.components.combobox.selectionFieldColors
import com.kozmos.components.input.KozmosInputStatus
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.tokens.KozmosThemeTokens

/**
 * How a trigger inside [KozmosSelect] opens and closes the menu from a
 * keyboard: Material's menu anchor answers taps and TalkBack, not keys.
 */
private val LocalKozmosSelectToggle = compositionLocalOf<(() -> Unit)?> { null }

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun KozmosSelect(
    expanded: Boolean,
    onExpandedChange: (Boolean) -> Unit,
    trigger: @Composable ExposedDropdownMenuBoxScope.(Boolean) -> Unit,
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit
) {
    ExposedDropdownMenuBox(
        expanded = expanded,
        onExpandedChange = onExpandedChange,
        modifier = modifier
    ) {
        CompositionLocalProvider(LocalKozmosSelectToggle provides { onExpandedChange(!expanded) }) {
            trigger(expanded)
        }
        ExposedDropdownMenu(
            expanded = expanded,
            onDismissRequest = { onExpandedChange(false) },
        ) {
            content()
        }
    }
}

/**
 * The closed field a [KozmosSelect] opens from, as React's `SelectTrigger`
 * and `SelectValue`: Figma's Select, which is its Text-Input with a caret. A
 * field 44 high with the control radius, the input border on background/0,
 * 12 in at each end; the choice in the field's words, or the placeholder in
 * foreground/400 until there is one; and a 16dp chevron at the end in the
 * placeholder's colour. Focused, it is edged in theme/600; in error, in
 * danger/600 with its words in it; disabled, it is background/100 with
 * foreground/500 words and opens nothing.
 *
 * It is one control for TalkBack, a drop-down list that says its choice or
 * its placeholder, with the menu anchor's own description and open or closed
 * state. A tap, TalkBack's double tap, and Enter or Space from a keyboard
 * open the menu. It anchors the menu itself: call it in [KozmosSelect]'s
 * trigger, without `menuAnchor()`.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ExposedDropdownMenuBoxScope.KozmosSelectTrigger(
    value: String?,
    placeholder: String,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    error: Boolean = false
) {
    val colors = selectionFieldColors(
        status = if (error) KozmosInputStatus.Error else KozmosInputStatus.Default,
        enabled = enabled,
        readOnly = false
    )
    val toggle = LocalKozmosSelectToggle.current
    val interaction = remember { MutableInteractionSource() }
    val focused by interaction.collectIsFocusedAsState()
    val shape = RoundedCornerShape(KozmosDimensions.semanticsRadiusControl)
    val edge = if (focused && enabled && !error) KozmosThemeTokens.primitivesColorsTheme600 else colors.border

    Row(
        modifier = modifier
            // Disabled, it is no anchor: Material's would still open on a tap.
            .then(if (enabled) Modifier.menuAnchor() else Modifier)
            .fillMaxWidth()
            .height(44.dp)
            .background(colors.background, shape)
            .border(1.dp, edge, shape)
            .semantics(mergeDescendants = true) {
                role = Role.DropdownList
                if (!enabled) disabled()
            }
            .onKeyEvent { event ->
                val opens = enabled && event.type == KeyEventType.KeyUp &&
                    event.key in setOf(Key.Enter, Key.NumPadEnter, Key.Spacebar, Key.DirectionCenter)
                if (opens) toggle?.invoke()
                opens
            }
            .focusable(enabled = enabled, interactionSource = interaction)
            .padding(horizontal = KozmosDimensions.primitivesLayoutSpacing150),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing100)
    ) {
        Text(
            text = value ?: placeholder,
            style = MaterialTheme.typography.bodyMedium,
            color = if (value != null) colors.text else colors.placeholder,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier.weight(1f)
        )
        Icon(
            imageVector = Icons.Default.KeyboardArrowDown,
            contentDescription = null,
            tint = colors.placeholder,
            modifier = Modifier.size(16.dp)
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun KozmosSelectItem(
    value: String,
    label: String,
    onValueChange: (String) -> Unit,
    onDismissRequest: () -> Unit,
    modifier: Modifier = Modifier
) {
    val trackEvent = com.kozmos.providers.LocalKozmosAnalytics.current
    DropdownMenuItem(
        text = { Text(label) },
        onClick = {
            trackEvent(com.kozmos.providers.KozmosAnalyticsEvent(component = "Select", eventName = "select_value_changed", properties = mapOf("value" to value.toString())))
            onValueChange(value)
            onDismissRequest()
        },
        contentPadding = ExposedDropdownMenuDefaults.ItemContentPadding,
        modifier = modifier
    )
}
