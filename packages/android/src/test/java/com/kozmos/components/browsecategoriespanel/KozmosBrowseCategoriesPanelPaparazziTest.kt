package com.kozmos.components.browsecategoriespanel

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Flight
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import app.cash.paparazzi.Paparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.contracts.KozmosCategoryPresentation
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import org.junit.Rule
import org.junit.Test

/**
 * The browse panel on the prototype's grid — four across 8 apart, rows 12
 * apart (row-gap 12px, column-gap 8px, measured on 2026-09-22) — under its
 * rule, and its empty state's dashed edge, both in the container edge's role,
 * light and dark. The search slot is a red bar so the rule can be found under
 * it. Drawn on its host's surface: Paparazzi's own window is dark.
 */
class KozmosBrowseCategoriesPanelPaparazziTest {
    @get:Rule
    val paparazzi = Paparazzi(maxPercentDifference = 0.0)

    private val eight = (1..8).map { KozmosCategoryPresentation(id = "c$it", label = "Gates") }

    @Test
    fun theGridIsFourAcrossWithRowsTwelveApartUnderARule() {
        paparazzi.snapshot { KozmosMaterialTheme { Panel(eight) } }
    }

    @Test
    fun theRuleReadsInDarkMode() {
        paparazzi.snapshot {
            CompositionLocalProvider(LocalKozmosUseDarkTokens provides true) {
                KozmosMaterialTheme { Panel(eight) }
            }
        }
    }

    @Test
    fun theEmptyStateHasADashedEdge() {
        paparazzi.snapshot {
            KozmosMaterialTheme { Panel(emptyList()) }
        }
    }

    @Composable
    private fun Panel(categories: List<KozmosCategoryPresentation>) {
        Column(modifier = Modifier.background(KozmosThemeTokens.semanticsSurface0)) {
            KozmosBrowseCategoriesPanel(
                categories = categories,
                onSelect = {},
                renderIcon = { Icon(Icons.Default.Flight, contentDescription = null) },
                search = { Box(Modifier.fillMaxWidth().height(44.dp).background(Color.Red)) },
                emptyState = { Box(Modifier.fillMaxWidth().height(40.dp)) }
            )
        }
    }
}
