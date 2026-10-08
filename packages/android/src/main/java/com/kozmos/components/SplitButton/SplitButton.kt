package com.kozmos.components.splitbutton

import com.kozmos.tokens.KozmosDimensions

import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Row
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

data class SplitContextMenuItem(val label: String, val onClick: () -> Unit)

@Composable
fun KozmosSplitButton(
    label: String,
    onMainClick: () -> Unit,
    menuItems: List<SplitContextMenuItem>,
    modifier: Modifier = Modifier,
    // The presses, focus and hover each half answers, as Material's own
    // parameter. Last, so a call by position still compiles.
    mainInteractionSource: MutableInteractionSource? = null,
    menuInteractionSource: MutableInteractionSource? = null
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
    Row(modifier = modifier) {
        KozmosFillButton(
            onClick = onMainClick,
            modifier = Modifier,
            enabled = true,
            shape = RoundedCornerShape(topStart = KozmosDimensions.semanticsRadiusPanel, bottomStart = KozmosDimensions.semanticsRadiusPanel, topEnd = KozmosDimensions.semanticsRadiusNone, bottomEnd = KozmosDimensions.semanticsRadiusNone),
            fill = KozmosFillStates.themed,
            interactionSource = mainSource
        ) {
            Text(label)
        }
        Spacer(modifier = Modifier.width(1.dp))
        KozmosFillButton(
            onClick = { expanded = true },
            modifier = Modifier,
            enabled = true,
            shape = RoundedCornerShape(topStart = KozmosDimensions.semanticsRadiusNone, bottomStart = KozmosDimensions.semanticsRadiusNone, topEnd = KozmosDimensions.semanticsRadiusPanel, bottomEnd = KozmosDimensions.semanticsRadiusPanel),
            fill = KozmosFillStates.themed,
            interactionSource = menuSource
        ) {
            Icon(Icons.Default.ArrowDropDown, contentDescription = "More actions")
            DropdownMenu(
                expanded = expanded,
                onDismissRequest = { expanded = false }
            ) {
                menuItems.forEach { item ->
                    DropdownMenuItem(
                        text = { Text(item.label) },
                        onClick = {
                            item.onClick()
                            expanded = false
                        }
                    )
                }
            }
        }
    }
}
