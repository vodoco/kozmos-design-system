package com.kozmos.components.browsecategoriespanel

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Divider
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.kozmos.components.adaptivemapshell.LocalKozmosPanelClearanceTop
import com.kozmos.components.adaptivemapshell.LocalKozmosPanelInsetTop
import com.kozmos.components.adaptivemapshell.LocalKozmosPanelSurface
import com.kozmos.components.categorytile.KozmosCategoryTile
import com.kozmos.components.categorytile.KozmosCategoryTint
import com.kozmos.components.surface.kozmosDashedEdge
import com.kozmos.contracts.KozmosCategoryPresentation
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.tokens.KozmosThemeTokens

/**
 * A scrollable grid of browsable categories with optional search and actions.
 *
 * Mirrors the React `BrowseCategoriesPanel`. The panel renders whatever
 * categories it is given; filtering, searching, and result counts belong to
 * the consuming app.
 *
 * Standing alone it fills with the background colour; in the map shell's
 * panel it paints no fill of its own ([LocalKozmosPanelSurface]), the panel's
 * surface being the one surface (decision 43). As that panel's content it is
 * the panel's top: its first row — the search row, or the tiles when there is
 * none — tops its padding up to what the panel already leaves above it
 * ([LocalKozmosPanelInsetTop], [LocalKozmosPanelClearanceTop]) rather than
 * adding to it, so the search field sits as far from the panel's top as from
 * its side and keeps the handle's target clear (decision 14).
 */
@Composable
fun KozmosBrowseCategoriesPanel(
    categories: List<KozmosCategoryPresentation>,
    onSelect: (String) -> Unit,
    modifier: Modifier = Modifier,
    label: String = "Browse categories",
    renderIcon: (@Composable (KozmosCategoryPresentation) -> Unit)? = null,
    /** A category's colours for its tile, or null for the theme's. */
    tint: (KozmosCategoryPresentation) -> KozmosCategoryTint? = { null },
    search: (@Composable () -> Unit)? = null,
    actions: (@Composable () -> Unit)? = null,
    emptyState: (@Composable () -> Unit)? = null
) {
    val padding = KozmosDimensions.primitivesLayoutSpacing200
    val hasHeader = search != null || actions != null
    // The first row's top padding. Hosted in the shell's panel, the space the
    // panel leaves above it — the handle's row — is the browser's own top: the
    // row tops its 16 up to it rather than adding 16 to it, and keeps the
    // clearance the panel asks for under a handle. It padded 16 under the
    // handle's 16dp row: the search field sat 32 from the sheet's top and 16
    // from its side. Outside a shell both are 0, and it keeps its 16.
    val firstRowTop = maxOf(LocalKozmosPanelClearanceTop.current, padding - LocalKozmosPanelInsetTop.current)
    // Standing alone the browser fills its box with the background colour,
    // as the web's and iOS's do; in the shell's panel it paints none, the
    // panel's surface being the one surface (decision 43). It painted none
    // standing alone too.
    val fill = if (LocalKozmosPanelSurface.current == null) {
        KozmosThemeTokens.primitivesColorsBackground0
    } else {
        Color.Transparent
    }
    Column(
        modifier = modifier
            .fillMaxWidth()
            .background(fill)
            .semantics { contentDescription = label }
    ) {
        if (hasHeader) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(start = padding, top = firstRowTop, end = padding, bottom = padding),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing100)
            ) {
                if (search != null) {
                    Box(modifier = Modifier.weight(1f)) { search() }
                }
                if (actions != null) {
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(
                            KozmosDimensions.primitivesLayoutSpacing100
                        )
                    ) {
                        actions()
                    }
                }
            }

            // The container edge's role, as React's border-b draws it and as
            // the prototype draws every rule (a light grey), themed. It was
            // foreground/300, a text colour, in its light value only, until
            // 2026-09-22.
            Divider(color = KozmosThemeTokens.semanticsBorderSubtle)
        }

        // Under the search row the tiles sit under that row, not under whatever
        // the panel leaves: they keep their 16.
        val tilesTop = if (hasHeader) padding else firstRowTop
        if (categories.isEmpty()) {
            // Dashed, in the same role, as React's and SwiftUI's empty states
            // are; it was a solid foreground/300 edge until 2026-09-22.
            val radius = KozmosDimensions.semanticsRadiusPanel
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(start = padding, top = tilesTop, end = padding, bottom = padding)
                    .kozmosDashedEdge(KozmosThemeTokens.semanticsBorderSubtle, radius),
                shape = RoundedCornerShape(radius),
                color = KozmosThemeTokens.primitivesColorsBackground100.copy(alpha = 0.4f)
            ) {
                Box(
                    modifier = Modifier.padding(KozmosDimensions.primitivesLayoutSpacing300),
                    contentAlignment = Alignment.Center
                ) {
                    emptyState?.invoke()
                }
            }
        } else {
            LazyVerticalGrid(
                // Four across, 8 apart, and rows 12 apart: the prototype's grid
                // (row-gap 12px, column-gap 8px, measured on 2026-09-22). The
                // rows were 8 apart here until then.
                columns = GridCells.Fixed(4),
                modifier = Modifier.fillMaxWidth(),
                contentPadding = androidx.compose.foundation.layout.PaddingValues(
                    start = padding,
                    top = tilesTop,
                    end = padding,
                    bottom = padding
                ),
                horizontalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing100),
                verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing150)
            ) {
                items(categories, key = { it.id }) { category ->
                    KozmosCategoryTile(
                        category = category,
                        onSelect = onSelect,
                        tint = tint(category),
                        icon = renderIcon?.let { render -> { render(category) } }
                    )
                }
            }
        }
    }
}
