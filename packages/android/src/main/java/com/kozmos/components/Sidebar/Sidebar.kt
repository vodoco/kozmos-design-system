package com.kozmos.components.sidebar

import com.kozmos.tokens.KozmosDimensions

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.material3.DrawerDefaults
import androidx.compose.material3.PermanentDrawerSheet
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.kozmos.tokens.KozmosThemeTokens

/**
 * The rail's width, its edge included. KozmosNavbar's `logoInset` column reads
 * it too (GAP-208), so the two can't part.
 */
internal val KozmosRailWidth = 96.dp

/** The expanded sidebar's width, 256, as React's w-64 and SwiftUI's (decision 157). It was 280. */
internal val KozmosSidebarWidth = 256.dp

/** The room above [KozmosSidebar]'s first slot, as React's `inset` (GAP-199). */
enum class KozmosSidebarInset {
    /** The top padded as the bottom is: 24. */
    Default,
    /**
     * No room above the first slot, so it starts at the sidebar's top edge: a
     * rail's first item flush under a fixed header, as Pointr Cloud draws its
     * side menu. The bottom keeps its 24.
     */
    Flush
}

enum class KozmosSidebarVariant {
    Expanded,
    Rail
}

@Composable
fun KozmosSidebar(
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit
) {
    KozmosSidebarLayout(modifier, KozmosSidebarVariant.Expanded, KozmosSidebarInset.Default, {}, content, {}, {})
}

/**
 * The short form with the room above its first slot (GAP-199): an overload of
 * its own, with [inset] required, so `KozmosSidebar(modifier) { … }` and every
 * other call the sidebar took before still resolve as they did.
 */
@Composable
fun KozmosSidebar(
    modifier: Modifier = Modifier,
    inset: KozmosSidebarInset,
    content: @Composable ColumnScope.() -> Unit
) {
    KozmosSidebarLayout(modifier, KozmosSidebarVariant.Expanded, inset, {}, content, {}, {})
}

@Composable
fun KozmosSidebar(
    modifier: Modifier = Modifier,
    variant: KozmosSidebarVariant = KozmosSidebarVariant.Expanded,
    header: @Composable ColumnScope.() -> Unit = {},
    navigation: @Composable ColumnScope.() -> Unit,
    tools: @Composable ColumnScope.() -> Unit = {},
    footer: @Composable ColumnScope.() -> Unit = {}
) {
    KozmosSidebarLayout(modifier, variant, KozmosSidebarInset.Default, header, navigation, tools, footer)
}

/**
 * The sidebar with the room above its first slot (GAP-199): an overload of its
 * own, with [inset] required, so every call the sidebar took before, by
 * position or with a trailing lambda, still resolves to the one above.
 * [KozmosSidebarInset.Flush] also gives the sheet no window insets: a flush
 * sidebar sits under a header that has already taken the status bar.
 */
@Composable
fun KozmosSidebar(
    modifier: Modifier = Modifier,
    variant: KozmosSidebarVariant = KozmosSidebarVariant.Expanded,
    inset: KozmosSidebarInset,
    header: @Composable ColumnScope.() -> Unit = {},
    navigation: @Composable ColumnScope.() -> Unit,
    tools: @Composable ColumnScope.() -> Unit = {},
    footer: @Composable ColumnScope.() -> Unit = {}
) {
    KozmosSidebarLayout(modifier, variant, inset, header, navigation, tools, footer)
}

/**
 * The window insets the sheet pads by. Flush, none: the sidebar starts at its
 * own top edge, under a fixed header that has taken the status bar, as React's
 * flush sidebar starts at its box's edge. By default, Material's drawer insets,
 * as before, so a sidebar at the top of the screen still clears the status bar.
 */
internal fun kozmosSidebarWindowInsets(inset: KozmosSidebarInset, default: WindowInsets): WindowInsets =
    if (inset == KozmosSidebarInset.Flush) WindowInsets(0, 0, 0, 0) else default

@Composable
private fun KozmosSidebarLayout(
    modifier: Modifier,
    variant: KozmosSidebarVariant,
    inset: KozmosSidebarInset,
    header: @Composable ColumnScope.() -> Unit,
    navigation: @Composable ColumnScope.() -> Unit,
    tools: @Composable ColumnScope.() -> Unit,
    footer: @Composable ColumnScope.() -> Unit
) {
    val isRail = variant == KozmosSidebarVariant.Rail
    val railBorder = KozmosThemeTokens.semanticsBorderSubtle
    // The rail (decision 42) is 96dp on the surface, with a 1dp edge in the
    // border role at its end: the right, and the left right to left. The
    // edge is inside the 96, as a CSS border is, and the rail has no other
    // horizontal padding, so its KozmosNavigationItems fill it and end where
    // the edge begins; they stack with no gap between them.
    PermanentDrawerSheet(
        modifier = modifier
            // Expanded, 256, as React's w-64 and SwiftUI draw it (decision 157).
            .width(if (isRail) KozmosRailWidth else KozmosSidebarWidth)
            .then(
                if (isRail) {
                    Modifier.drawWithContent {
                        drawContent()
                        val edge = 1.dp.toPx()
                        drawRect(
                            color = railBorder,
                            topLeft = Offset(if (layoutDirection == LayoutDirection.Ltr) size.width - edge else 0f, 0f),
                            size = Size(edge, size.height)
                        )
                    }
                } else {
                    Modifier
                }
            ),
        drawerContainerColor = KozmosThemeTokens.semanticsSurface0,
        windowInsets = kozmosSidebarWindowInsets(inset, DrawerDefaults.windowInsets),
    ) {
        Column(
            modifier = Modifier
                .padding(
                    start = if (isRail) 0.dp else KozmosDimensions.primitivesLayoutSpacing200,
                    end = if (isRail) 1.dp else KozmosDimensions.primitivesLayoutSpacing200,
                    // Flush, the first slot starts at the top edge (GAP-199).
                    // React drops its navigation's own 16 there too, on a rail
                    // with no header; this navigation has none, so the 24 is
                    // all there is.
                    top = if (inset == KozmosSidebarInset.Flush) 0.dp else KozmosDimensions.primitivesLayoutSpacing300,
                    bottom = KozmosDimensions.primitivesLayoutSpacing300
                )
                .fillMaxHeight(),
            horizontalAlignment = if (isRail) Alignment.CenterHorizontally else Alignment.Start,
            verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing200)
        ) {
            header()
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f),
                horizontalAlignment = if (isRail) Alignment.CenterHorizontally else Alignment.Start,
                verticalArrangement = Arrangement.spacedBy(if (isRail) 0.dp else KozmosDimensions.primitivesLayoutSpacing100),
                content = navigation
            )
            tools()
            footer()
        }
    }
}
