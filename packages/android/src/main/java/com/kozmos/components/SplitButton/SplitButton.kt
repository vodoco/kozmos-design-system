package com.kozmos.components.splitbutton

import com.kozmos.tokens.KozmosDimensions

import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Divider
import com.kozmos.tokens.KozmosThemeTokens
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.kozmos.components.KozmosFillButton
import com.kozmos.components.KozmosFillStates

/** An entry in a split button's menu (GAP-168): an item or a separator. */
sealed interface SplitContextMenuEntry

/**
 * An action in a split button's menu, as React's `menuItems` (GAP-168):
 * [icon] before its words, which are its name, and [enabled] false to grey
 * it, which TalkBack says is disabled and a click does not run.
 */
data class SplitContextMenuItem(
    val label: String,
    val icon: (@Composable () -> Unit)? = null,
    val enabled: Boolean = true,
    // Last, so `SplitContextMenuItem("Save draft") { … }` still compiles.
    val onClick: () -> Unit
) : SplitContextMenuEntry {
    /** The item as it was before GAP-168: its words and what it runs. */
    constructor(label: String, onClick: () -> Unit) : this(label, null, true, onClick)
}

/** A line between groups of items in a split button's menu (GAP-168). */
data object SplitContextMenuSeparator : SplitContextMenuEntry

/**
 * A split button's menu rows (GAP-168): each item Material's
 * DropdownMenuItem, its icon as the leading icon, each separator a divider,
 * then the custom content. [close] closes the menu, after an item runs.
 */
@Composable
internal fun ColumnScope.KozmosSplitButtonMenuRows(
    menuItems: List<SplitContextMenuEntry>,
    close: () -> Unit,
    menuContent: (@Composable ColumnScope.(close: () -> Unit) -> Unit)? = null
) {
    menuItems.forEach { entry ->
        when (entry) {
            is SplitContextMenuItem -> DropdownMenuItem(
                text = { Text(entry.label) },
                leadingIcon = entry.icon,
                enabled = entry.enabled,
                onClick = {
                    entry.onClick()
                    close()
                }
            )
            SplitContextMenuSeparator -> Divider(
                modifier = Modifier.padding(vertical = KozmosDimensions.primitivesLayoutSpacing50),
                color = KozmosThemeTokens.semanticsBorderSubtle
            )
        }
    }
    menuContent?.invoke(this, close)
}

@Composable
fun KozmosSplitButton(
    label: String,
    onMainClick: () -> Unit,
    menuItems: List<SplitContextMenuEntry>,
    modifier: Modifier = Modifier,
    // The presses, focus and hover each half answers, as Material's own
    // parameter. Last, so a call by position still compiles.
    mainInteractionSource: MutableInteractionSource? = null,
    menuInteractionSource: MutableInteractionSource? = null,
    /**
     * What TalkBack calls the menu half, which shows only an arrow. "More
     * options" by default, as React's `menuLabel`; a product that translates
     * passes its own. Last, so a call by position still compiles.
     */
    menuLabel: String = "More options",
    // Last, so a call by position still compiles.
    enabled: Boolean = true,
    /**
     * Custom content drawn after [menuItems] (GAP-168): Material's
     * DropdownMenuItem, or anything a column holds. It is given the
     * function that closes the menu. Last, so a call by position still
     * compiles.
     */
    menuContent: (@Composable ColumnScope.(close: () -> Unit) -> Unit)? = null
) {
    var expanded by remember { mutableStateOf(false) }
    // Both halves are a filled Button: the theme fill with the theme
    // foreground on it, the same in both themes (decision 59).
    // background/0 turned black on it in the dark.
    val mainSource = mainInteractionSource ?: remember { MutableInteractionSource() }
    val menuSource = menuInteractionSource ?: remember { MutableInteractionSource() }

    // Each half is Material's filled Button drawn on Kozmos's own surface:
    // pressed, focused or hovered it is the tokens' own step with no ripple
    // over the fill, on any Material version, React's ring shows focus, and a
    // quick tap is still drawn pressed.
    // The outer corners are the control radius, 16, as React's
    // rounded-control halves and SwiftUI's are; they were the panel's 24,
    // which a 40dp-high half draws as a half circle.
    Row(modifier = modifier) {
        KozmosFillButton(
            onClick = onMainClick,
            modifier = Modifier,
            enabled = enabled,
            shape = RoundedCornerShape(topStart = KozmosDimensions.semanticsRadiusControl, bottomStart = KozmosDimensions.semanticsRadiusControl, topEnd = KozmosDimensions.semanticsRadiusNone, bottomEnd = KozmosDimensions.semanticsRadiusNone),
            fill = KozmosFillStates.themed,
            interactionSource = mainSource
        ) {
            Text(label)
        }
        Spacer(modifier = Modifier.width(1.dp))
        KozmosFillButton(
            onClick = { expanded = true },
            modifier = Modifier,
            enabled = enabled,
            shape = RoundedCornerShape(topStart = KozmosDimensions.semanticsRadiusNone, bottomStart = KozmosDimensions.semanticsRadiusNone, topEnd = KozmosDimensions.semanticsRadiusControl, bottomEnd = KozmosDimensions.semanticsRadiusControl),
            fill = KozmosFillStates.themed,
            interactionSource = menuSource
        ) {
            Icon(Icons.Default.ArrowDropDown, contentDescription = menuLabel)
            DropdownMenu(
                expanded = expanded,
                onDismissRequest = { expanded = false }
            ) {
                KozmosSplitButtonMenuRows(menuItems, close = { expanded = false }, menuContent = menuContent)
            }
        }
    }
}
