package com.kozmos.components.floatingactionbutton

import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.FloatingActionButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ProvideTextStyle
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import com.kozmos.components.KozmosFillStates
import com.kozmos.components.KozmosFillSurface

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
    // Material's FloatingActionButton, drawn on Kozmos's own surface: pressed,
    // focused or hovered it is the tokens' own step with no ripple over it,
    // on any Material version, React's ring shows focus, and a quick tap is
    // still drawn pressed. Material's resting elevation, 6dp.
    KozmosFillSurface(
        onClick = onClick,
        modifier = modifier,
        enabled = true,
        shape = FloatingActionButtonDefaults.shape,
        fill = KozmosFillStates.themed,
        interactionSource = source,
        shadowElevation = 6.dp,
        tonalElevation = 6.dp
    ) {
        ProvideTextStyle(MaterialTheme.typography.labelLarge) {
            Box(
                modifier = Modifier.defaultMinSize(minWidth = 56.dp, minHeight = 56.dp),
                contentAlignment = Alignment.Center
            ) {
                Icon(icon, contentDescription = "Action")
            }
        }
    }
}
