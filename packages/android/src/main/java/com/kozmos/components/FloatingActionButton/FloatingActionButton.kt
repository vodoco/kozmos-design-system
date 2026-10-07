package com.kozmos.components.floatingactionbutton

import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.ripple.LocalRippleTheme
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import com.kozmos.components.KozmosFillStates
import com.kozmos.components.KozmosNoRipple

@Composable
fun KozmosFloatingActionButton(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    icon: ImageVector = Icons.Default.Add,
    // The presses, focus and hover it answers, as Material's own parameter.
    interactionSource: MutableInteractionSource? = null
) {
    val source = interactionSource ?: remember { MutableInteractionSource() }
    // The theme fill with the theme foreground on it, the same in both
    // themes (decision 59): background/0 turned black on it in the dark.
    // Pressed, focused or hovered it is the tokens' own step, with no ripple
    // over it: Material's white ripple lightened the fill.
    val (containerColor, contentColor) = KozmosFillStates.themed.colorsFor(source)
    CompositionLocalProvider(LocalRippleTheme provides KozmosNoRipple) {
        FloatingActionButton(
            onClick = onClick,
            modifier = modifier,
            containerColor = containerColor,
            contentColor = contentColor,
            interactionSource = source
        ) {
            Icon(icon, contentDescription = "Action")
        }
    }
}
