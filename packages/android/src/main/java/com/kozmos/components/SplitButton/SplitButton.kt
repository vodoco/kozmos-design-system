package com.kozmos.components.splitbutton

import com.kozmos.tokens.KozmosDimensions

import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.ripple.LocalRippleTheme
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.kozmos.components.KozmosFillStates
import com.kozmos.components.KozmosNoRipple

data class SplitContextMenuItem(val label: String, val onClick: () -> Unit)

@Composable
fun KozmosSplitButton(
    label: String,
    onMainClick: () -> Unit,
    menuItems: List<SplitContextMenuItem>,
    modifier: Modifier = Modifier
) {
    var expanded by remember { mutableStateOf(false) }
    // Both halves are a filled Button: the theme fill with the theme
    // foreground on it, the same in both themes (decision 59).
    // background/0 turned black on it in the dark. Each half answers its own
    // touch with the tokens' pressed, focus and hover steps, with no ripple
    // over the fill: Material's white ripple lightened it.
    val mainSource = remember { MutableInteractionSource() }
    val menuSource = remember { MutableInteractionSource() }
    val (mainContainer, mainContent) = KozmosFillStates.themed.colorsFor(mainSource)
    val (menuContainer, menuContent) = KozmosFillStates.themed.colorsFor(menuSource)
    // The menu the second half opens keeps the ripple it had.
    val outerRipple = LocalRippleTheme.current

    CompositionLocalProvider(LocalRippleTheme provides KozmosNoRipple) {
        Row(modifier = modifier) {
            Button(
                onClick = onMainClick,
                shape = RoundedCornerShape(topStart = KozmosDimensions.semanticsRadiusPanel, bottomStart = KozmosDimensions.semanticsRadiusPanel, topEnd = KozmosDimensions.semanticsRadiusNone, bottomEnd = KozmosDimensions.semanticsRadiusNone),
                colors = ButtonDefaults.buttonColors(containerColor = mainContainer, contentColor = mainContent),
                interactionSource = mainSource
            ) {
                Text(label)
            }
            Spacer(modifier = Modifier.width(1.dp))
            Button(
                onClick = { expanded = true },
                shape = RoundedCornerShape(topStart = KozmosDimensions.semanticsRadiusNone, bottomStart = KozmosDimensions.semanticsRadiusNone, topEnd = KozmosDimensions.semanticsRadiusPanel, bottomEnd = KozmosDimensions.semanticsRadiusPanel),
                colors = ButtonDefaults.buttonColors(containerColor = menuContainer, contentColor = menuContent),
                interactionSource = menuSource
            ) {
                Icon(Icons.Default.ArrowDropDown, contentDescription = "More actions")
                CompositionLocalProvider(LocalRippleTheme provides outerRipple) {
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
    }
}
