package com.kozmos.components.categoryfield

import com.kozmos.components.counter.KozmosInkedFill
import com.kozmos.components.categorytile.KozmosCategoryTint
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Flight
import androidx.compose.material.icons.filled.Restaurant
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import app.cash.paparazzi.Paparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.tokens.KozmosColors
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import org.junit.Rule
import org.junit.Test

/**
 * The category field in two colours: the prototype's form with a category
 * chosen. The field is translucent, so it is drawn on its host's surface —
 * Paparazzi's own window is dark. The name and the clear are in the
 * foreground, themed (Olcay, 2026-09-21); the icon, the border and the wash
 * keep the colour.
 */
class KozmosCategoryFieldPaparazziTest {
    @get:Rule
    val paparazzi = Paparazzi(maxPercentDifference = 0.0)

    @Test
    fun theFieldTakesTheCategorysColour() {
        paparazzi.snapshot { KozmosMaterialTheme { TwoFields() } }
    }

    @Test
    fun theFieldReadsInDarkMode() {
        paparazzi.snapshot {
            CompositionLocalProvider(LocalKozmosUseDarkTokens provides true) {
                KozmosMaterialTheme { TwoFields() }
            }
        }
    }

    @Composable
    private fun TwoFields() {
        Column(modifier = Modifier.background(KozmosThemeTokens.semanticsSurface0).padding(16.dp)) {
            KozmosCategoryField(
                label = "Gates", count = 2, tint = KozmosCategoryTint(KozmosColors.semanticsCategoryAccentYellow, KozmosInkedFill(KozmosColors.semanticsCategoryFillYellow, KozmosColors.semanticsCategoryOnfillYellow)), onClear = {},
                modifier = Modifier.fillMaxWidth(),
                icon = { Icon(Icons.Default.Flight, contentDescription = null) }
            )
            KozmosCategoryField(
                label = "Dining", count = 19, tint = KozmosCategoryTint(KozmosColors.semanticsCategoryAccentOrange, KozmosInkedFill(KozmosColors.semanticsCategoryFillOrange, KozmosColors.semanticsCategoryOnfillOrange)), onClear = {},
                modifier = Modifier.fillMaxWidth().padding(top = 12.dp),
                icon = { Icon(Icons.Default.Restaurant, contentDescription = null) }
            )
        }
    }
}
