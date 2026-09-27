package com.kozmos.components.rating

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import app.cash.paparazzi.Paparazzi
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import org.junit.Rule
import org.junit.Test

/**
 * Both scales, in both themes.
 *
 * The stars are drawn on a host surface rather than bare: Paparazzi's own
 * window is dark, and a star judged against it would hide a colour that only
 * reads on the light theme. The star was
 * `primitivesColorsEmotionalAlert600` here and `semanticsDataYellow` on the
 * other two platforms until 2026-09-25 — #f9a707 against #d97706, a different
 * star on Android in both themes, which no snapshot caught because no
 * snapshot compared platforms.
 */
class KozmosRatingPaparazziTest {
    @get:Rule
    val paparazzi = Paparazzi(maxPercentDifference = 0.0)

    @Test
    fun bothScalesInLightMode() {
        paparazzi.snapshot { MaterialTheme { Scales() } }
    }

    @Test
    fun bothScalesInDarkMode() {
        paparazzi.snapshot {
            CompositionLocalProvider(LocalKozmosUseDarkTokens provides true) {
                MaterialTheme { Scales() }
            }
        }
    }

    @Composable
    private fun Scales() {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(KozmosThemeTokens.primitivesColorsBackground0)
                .padding(16.dp)
        ) {
            // Stars: an ordinal scale, so three fill.
            KozmosRating(value = 3, onValueChange = {})
            // Thumbs: a choice of two, so exactly the one chosen fills.
            KozmosRating(value = 2, onValueChange = {}, variant = KozmosRatingVariant.Thumbs)
            KozmosRating(value = 1, onValueChange = {}, variant = KozmosRatingVariant.Thumbs)
            // Unanswered: neither.
            KozmosRating(value = 0, onValueChange = {}, variant = KozmosRatingVariant.Thumbs)
            // Read-only is not a control at all.
            KozmosRating(value = 4, onValueChange = {}, readOnly = true)
        }
    }
}
