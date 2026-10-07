package com.kozmos.components.floatingactionbutton

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import com.kozmos.tokens.KozmosThemeTokens

@Composable
fun KozmosFloatingActionButton(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    icon: ImageVector = Icons.Default.Add
) {
    FloatingActionButton(
        onClick = onClick,
        modifier = modifier,
        // The theme fill with the theme foreground on it, the same in both
        // themes (decision 59): background/0 turned black on it in the dark.
        containerColor = KozmosThemeTokens.componentsPrimaryButtonsThemedButtonBackgroundIdle,
        contentColor = KozmosThemeTokens.componentsPrimaryButtonsThemedButtonForegroundContentIdle
    ) {
        Icon(icon, contentDescription = "Action")
    }
}
