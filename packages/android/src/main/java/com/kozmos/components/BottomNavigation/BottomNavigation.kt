package com.kozmos.components.bottomnavigation

import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
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
                onClick = { onNavigate(item.route) }
            )
        }
    }
}
