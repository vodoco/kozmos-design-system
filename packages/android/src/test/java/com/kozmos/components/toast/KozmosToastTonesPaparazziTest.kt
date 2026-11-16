package com.kozmos.components.toast

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import app.cash.paparazzi.Paparazzi
import com.kozmos.components.CROSS_PLATFORM_MAX_PERCENT_DIFFERENCE
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import org.junit.Rule
import org.junit.Test

/**
 * The five tones (GAP-167), in both themes, as React's Tones story draws
 * them: Neutral with no icon, then Success, Info, Warning, and Critical
 * with an action. On the background, not bare: Paparazzi's own window is
 * dark.
 */
class KozmosToastTonesPaparazziTest {
    @get:Rule
    val paparazzi = Paparazzi(maxPercentDifference = CROSS_PLATFORM_MAX_PERCENT_DIFFERENCE)

    @Test
    fun tonesInLightMode() {
        paparazzi.snapshot { KozmosMaterialTheme { Tones() } }
    }

    @Test
    fun tonesInDarkMode() {
        paparazzi.snapshot {
            CompositionLocalProvider(LocalKozmosUseDarkTokens provides true) {
                KozmosMaterialTheme { Tones() }
            }
        }
    }

    @Composable
    private fun Tones() {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(KozmosThemeTokens.primitivesColorsBackground0)
                .padding(16.dp)
        ) {
            KozmosToast(title = "Route copied", description = "Paste it into a message.", onDismiss = {})
            KozmosToast(title = "Location saved", description = "Find it in your saved places.", onDismiss = {}, tone = KozmosToastTone.Success)
            KozmosToast(title = "New floor plan", description = "Level 2 was updated today.", onDismiss = {}, tone = KozmosToastTone.Info)
            KozmosToast(title = "Location is approximate", description = "Move near a window for a closer fix.", onDismiss = {}, tone = KozmosToastTone.Warning)
            KozmosToast(
                title = "Could not save",
                description = "Check your connection and try again.",
                actionText = "Retry",
                onAction = {},
                onDismiss = {},
                tone = KozmosToastTone.Critical
            )
        }
    }
}
