package com.kozmos.components.bottomnavigation

import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import com.kozmos.tokens.KozmosThemeTokens

data class BottomNavigationItem(
    val title: String,
    val icon: ImageVector,
    val route: String
)

@Composable
fun KozmosBottomNavigation(
    items: List<BottomNavigationItem>,
    currentRoute: String,
    onNavigate: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    // Kozmos's colours, not Material's purple: the selected item's icon and
    // label are theme-coloured text on a surface, theme/600, on the muted
    // fill (background/100), and the others the foreground, foreground/100,
    // as iOS and React draw their bars (decision 59).
    val colors = NavigationBarItemDefaults.colors(
        selectedIconColor = KozmosThemeTokens.primitivesColorsTheme600,
        selectedTextColor = KozmosThemeTokens.primitivesColorsTheme600,
        indicatorColor = KozmosThemeTokens.primitivesColorsBackground100,
        unselectedIconColor = KozmosThemeTokens.primitivesColorsForeground100,
        unselectedTextColor = KozmosThemeTokens.primitivesColorsForeground100
    )
    NavigationBar(
        modifier = modifier,
        containerColor = KozmosThemeTokens.primitivesColorsBackground0
    ) {
        items.forEach { item ->
            NavigationBarItem(
                icon = { Icon(item.icon, contentDescription = item.title) },
                // 11sp, Material's labelSmall, as React's and iOS's bars label
                // theirs (decision 41); NavigationBarItem's own is 12sp.
                label = { Text(item.title, style = MaterialTheme.typography.labelSmall) },
                selected = currentRoute == item.route,
                onClick = { onNavigate(item.route) },
                colors = colors
            )
        }
    }
}
