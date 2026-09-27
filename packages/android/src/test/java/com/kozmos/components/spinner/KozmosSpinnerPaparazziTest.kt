package com.kozmos.components.spinner

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import app.cash.paparazzi.Paparazzi
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import org.junit.Rule
import org.junit.Test

/**
 * The system's arc, drawn.
 *
 * There was no golden of a spinner on Android at all: material3's indeterminate
 * indicator throws NoSuchMethodError (KeyframesSpecConfig.at) against
 * animation-core 1.6.0, so nothing that drew one could be recorded. The arc is a
 * Canvas on a plain tween, so these are the first.
 *
 * Both themes, on the theme's own surface. Paparazzi's window is dark, so a part
 * that takes its colour from what is around it reads its host, not its intent,
 * unless the host is drawn — which is how a spinner defaulting to theme/500 on a
 * themed surface would have gone unnoticed. The arc takes the content colour
 * now, as React's `currentColor` and SwiftUI's foreground style do.
 */
class KozmosSpinnerPaparazziTest {
    @get:Rule
    val paparazzi = Paparazzi(maxPercentDifference = 0.0)

    @Test
    fun everySizeInLightMode() = snapshotIn(dark = false) { EverySize() }

    @Test
    fun everySizeInDarkMode() = snapshotIn(dark = true) { EverySize() }

    private fun snapshotIn(dark: Boolean, content: @Composable () -> Unit) {
        paparazzi.snapshot {
            CompositionLocalProvider(LocalKozmosUseDarkTokens provides dark) {
                MaterialTheme(colorScheme = if (dark) darkColorScheme() else lightColorScheme()) {
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(16.dp),
                        verticalAlignment = Alignment.Bottom,
                        modifier = Modifier
                            .background(KozmosThemeTokens.semanticsSurface0)
                            .padding(16.dp)
                    ) {
                        content()
                    }
                }
            }
        }
    }
}

@Composable
private fun EverySize() {
    KozmosSpinner(size = KozmosSpinnerSize.Sm)
    KozmosSpinner(size = KozmosSpinnerSize.Md)
    KozmosSpinner(size = KozmosSpinnerSize.Lg)
    KozmosSpinner(size = KozmosSpinnerSize.Xl)
}
