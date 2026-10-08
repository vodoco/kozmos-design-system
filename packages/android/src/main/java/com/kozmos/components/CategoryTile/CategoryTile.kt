package com.kozmos.components.categorytile

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.draw.clip
import androidx.compose.foundation.border
import androidx.compose.foundation.background
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.material3.LocalContentColor
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.kozmos.components.counter.CounterTone
import com.kozmos.components.counter.KozmosCounter
import com.kozmos.contracts.KozmosCategoryPresentation
import com.kozmos.providers.KozmosAnalyticsEvent
import com.kozmos.providers.LocalKozmosAnalytics
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.tokens.KozmosThemeTokens

/**
 * A single browsable category cell.
 *
 * Mirrors the React `CategoryTile`: the tile owns presentation and selection
 * semantics only. Category identity, labels, counts, and selected state are
 * supplied by the consuming app through [KozmosCategoryPresentation]. A
 * `resultCount` draws as the system's counter at the icon square's top-right;
 * `resultCountLabel` is its spoken form, joined to the tile's name ("Cafés,
 * 12 results"), and draws nothing. A `tint` — the category's colours — takes the icon, the selection's
 * stroke and the counter's fill and ink; the square stays neutral.
 */
@Composable
fun KozmosCategoryTile(
    category: KozmosCategoryPresentation,
    onSelect: (String) -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    /** The category's own colour, as the chosen-category field wears it: it
     *  takes the icon and the counter's fill; the square stays neutral. */
    tint: KozmosCategoryTint? = null,
    icon: (@Composable () -> Unit)? = null
) {
    val trackEvent = LocalKozmosAnalytics.current
    val isEnabled = enabled && !category.disabled

    Surface(
        onClick = {
            trackEvent(
                KozmosAnalyticsEvent(
                    component = "CategoryTile",
                    eventName = "category_selected",
                    properties = mapOf("categoryId" to category.id)
                )
            )
            onSelect(category.id)
        },
        modifier = modifier
            .fillMaxWidth()
            .semantics {
                // The count joins the name, as React's hidden span and the
                // floor selector's levels do. Not the state description: in
                // Compose that replaces the "Selected" TalkBack would say, so
                // a chosen category with results was never said to be chosen.
                contentDescription = category.resultCountLabel
                    ?.let { "${category.label}, $it" }
                    ?: category.label
                selected = category.selected
            },
        enabled = isEnabled,
        shape = RoundedCornerShape(KozmosDimensions.semanticsRadiusControl),
        color = androidx.compose.ui.graphics.Color.Transparent
    ) {
        Column(
            modifier = Modifier.padding(KozmosDimensions.primitivesLayoutSpacing50),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(KozmosDimensions.primitivesLayoutSpacing75)
        ) {
            // The icon's square: 64, radius Control, the container edge; the
            // selection shows on it. The label sits under it, two lines at most.
            Box {
                Box(
                    modifier = Modifier
                        .size(KozmosDimensions.primitivesLayoutSizing800)
                        .clip(RoundedCornerShape(KozmosDimensions.semanticsRadiusControl))
                        .background(
                            // No tint: the theme's accent, theme/600, for the
                            // wash, the edge and the icon (decision 59).
                            if (category.selected) (tint?.accent ?: KozmosThemeTokens.primitivesColorsTheme600).copy(alpha = 0.05f)
                            else KozmosThemeTokens.primitivesColorsBackground0
                        )
                        .border(
                            width = if (category.selected) 2.dp else 1.dp,
                            color = if (category.selected) (tint?.accent ?: KozmosThemeTokens.primitivesColorsTheme600) else KozmosThemeTokens.semanticsBorderSubtle,
                            shape = RoundedCornerShape(KozmosDimensions.semanticsRadiusControl)
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    if (icon != null) {
                        // The icon in the theme colour, as on the other platforms;
                        // decorative, as there: the label names what it shows.
                        CompositionLocalProvider(LocalContentColor provides (tint?.accent ?: KozmosThemeTokens.primitivesColorsTheme600)) {
                            Box(modifier = Modifier.size(KozmosDimensions.primitivesLayoutSizing300).clearAndSetSemantics {}, contentAlignment = Alignment.Center) {
                                icon()
                            }
                        }
                    }
                }
                category.resultCount?.let { count ->
                    // The count: the system's counter, brand tone, at the
                    // square's top-right, four beyond its edges so the icon
                    // stays clear. The spoken form is `resultCountLabel`.
                    KozmosCounter(
                        text = count.toString(),
                        tone = CounterTone.Brand,
                        fill = tint?.fill,
                        modifier = Modifier.align(Alignment.TopEnd).offset(x = 4.dp, y = (-4).dp)
                    )
                }
            }

            Text(
                text = category.label,
                style = MaterialTheme.typography.labelSmall,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
                color = if (isEnabled) {
                    KozmosThemeTokens.primitivesColorsForeground100
                } else {
                    KozmosThemeTokens.primitivesColorsForeground100.copy(alpha = 0.5f)
                },
                textAlign = TextAlign.Center
            )
        }
    }
}
