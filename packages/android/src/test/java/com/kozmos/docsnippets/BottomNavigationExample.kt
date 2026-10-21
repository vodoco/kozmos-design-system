// BottomNavigation.mdx's Compose snippet, word for word below the package
// line: compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project, and composed by
// KozmosBottomNavigationTest. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Place
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import com.kozmos.components.bottomnavigation.BottomNavigationItem
import com.kozmos.components.bottomnavigation.KozmosBottomNavigation

// An item's icon is an ImageVector, not a Kozmos icon's name: Home, Place and
// Notifications are what KozmosIcon draws for "home-line", "marker-pin-01"
// and "bell-01".
@Composable
fun BottomNavigationExample() {
    var route by remember { mutableStateOf("home") }
    KozmosBottomNavigation(
        items = listOf(
            BottomNavigationItem(title = "Home", icon = Icons.Default.Home, route = "home"),
            BottomNavigationItem(title = "Maps", icon = Icons.Default.Place, route = "maps"),
            BottomNavigationItem(title = "Alerts", icon = Icons.Default.Notifications, route = "alerts")
        ),
        currentRoute = route,
        onNavigate = { route = it }
    )
}
