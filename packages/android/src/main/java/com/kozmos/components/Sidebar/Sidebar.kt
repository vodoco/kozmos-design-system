package com.kozmos.components.sidebar

import com.kozmos.tokens.KozmosDimensions

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
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
    inset: KozmosSidebarInset = KozmosSidebarInset.Default,
    content: @Composable ColumnScope.() -> Unit
) {
    KozmosSidebar(
        modifier = modifier,
        inset = inset,
        navigation = content
    )
}

@Composable
fun KozmosSidebar(
    modifier: Modifier = Modifier,
    variant: KozmosSidebarVariant = KozmosSidebarVariant.Expanded,
    // Before the slots, so a trailing lambda is still the footer.
    inset: KozmosSidebarInset = KozmosSidebarInset.Default,
    header: @Composable ColumnScope.() -> Unit = {},
    navigation: @Composable ColumnScope.() -> Unit,
    tools: @Composable ColumnScope.() -> Unit = {},
    footer: @Composable ColumnScope.() -> Unit = {}
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
            .width(if (isRail) KozmosRailWidth else 280.dp)
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
