// NavigationItem.mdx's Compose snippet ("Long labels"), word for word below
// the package line: compiled here, so a renamed or removed parameter fails in
// this target rather than in a reader's project, and measured by
// KozmosNavigationItemRailTest. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import com.kozmos.components.icon.KozmosIcon
import com.kozmos.components.icon.KozmosIconSize
import com.kozmos.components.navigationitem.KozmosNavigationItem
import com.kozmos.components.navigationitem.KozmosNavigationItemContent
import com.kozmos.components.navigationitem.KozmosNavigationItemPlacement
import com.kozmos.components.sidebar.KozmosSidebar
import com.kozmos.components.sidebar.KozmosSidebarVariant

// A rail item gives its icon a 24dp box, which KozmosIcon at its Lg size
// fills, in the item's colour: theme 600 while selected.
@Composable
fun RailNavigationExample() {
    KozmosSidebar(
        variant = KozmosSidebarVariant.Rail,
        navigation = {
            KozmosNavigationItem(
                label = "Home",
                placement = KozmosNavigationItemPlacement.Rail,
                content = KozmosNavigationItemContent.IconLabel,
                selected = true,
                icon = { KozmosIcon(name = "home-line", size = KozmosIconSize.Lg) }
            )
            KozmosNavigationItem(
                label = "Accessible routes",
                placement = KozmosNavigationItemPlacement.Rail,
                content = KozmosNavigationItemContent.IconLabel,
                icon = { KozmosIcon(name = "navigation-pointer-01", size = KozmosIconSize.Lg) }
            )
        }
    )
}
