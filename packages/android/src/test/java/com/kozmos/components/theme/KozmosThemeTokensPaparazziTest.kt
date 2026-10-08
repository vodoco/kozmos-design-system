package com.kozmos.components.theme

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.android.resources.NightMode
import com.kozmos.tokens.KozmosColors
import com.kozmos.tokens.KozmosColorsDark
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

/**
 * Six colours as the themed accessor reads them: a page primitive, a
 * primitive the hand-written accessor never wrapped (background/300, read 25
 * times as light-only before 2026-09-22), the container edge role, the themed
 * button's fill and a category accent, which are the same in both themes (the
 * fill since decision 59), and the outline button's text, a component colour
 * that still turns over with the theme.
 */
@Composable
internal fun readSample(): List<Color> = listOf(
    KozmosThemeTokens.primitivesColorsBackground0,
    KozmosThemeTokens.primitivesColorsBackground300,
    KozmosThemeTokens.semanticsBorderSubtle,
    KozmosThemeTokens.componentsPrimaryButtonsThemedButtonBackgroundIdle,
    KozmosThemeTokens.semanticsCategoryAccentBlue,
    KozmosThemeTokens.componentsSecondaryButtonsThemedButtonForegroundContentIdle,
)

internal val lightSample = listOf(
    KozmosColors.primitivesColorsBackground0,
    KozmosColors.primitivesColorsBackground300,
    KozmosColors.semanticsBorderSubtle,
    KozmosColors.componentsPrimaryButtonsThemedButtonBackgroundIdle,
    KozmosColors.semanticsCategoryAccentBlue,
    KozmosColors.componentsSecondaryButtonsThemedButtonForegroundContentIdle,
)

internal val darkSample = listOf(
    KozmosColorsDark.primitivesColorsBackground0,
    KozmosColorsDark.primitivesColorsBackground300,
    KozmosColorsDark.semanticsBorderSubtle,
    KozmosColorsDark.componentsPrimaryButtonsThemedButtonBackgroundIdle,
    KozmosColorsDark.semanticsCategoryAccentBlue,
    KozmosColorsDark.componentsSecondaryButtonsThemedButtonForegroundContentIdle,
)

@Composable
internal fun Swatches(colors: List<Color>) {
    Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
        colors.forEach { Box(Modifier.size(24.dp).background(it)) }
    }
}

/** The accessor on a light device: what it reads unforced, forced light and forced dark. */
class KozmosThemeTokensPaparazziTest {
    @get:Rule
    val paparazzi = Paparazzi(maxPercentDifference = 0.0)

    @Test
    fun theAccessorReadsTheThemeItIsIn() {
        var system = emptyList<Color>()
        var light = emptyList<Color>()
        var dark = emptyList<Color>()
        paparazzi.snapshot {
            Column(
                verticalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.background(Color(0xFF808080)).padding(8.dp)
            ) {
                system = readSample()
                Swatches(system)
                CompositionLocalProvider(LocalKozmosUseDarkTokens provides false) {
                    light = readSample()
                    Swatches(light)
                }
                CompositionLocalProvider(LocalKozmosUseDarkTokens provides true) {
                    dark = readSample()
                    Swatches(dark)
                }
            }
        }
        assertEquals("unforced on a light device", lightSample, system)
        assertEquals("forced light", lightSample, light)
        assertEquals("forced dark", darkSample, dark)
    }
}

/**
 * The accessor on a dark device with nothing forcing the theme — an app that
 * never wraps the components in `KozmosThemeProvider`. It follows the system.
 */
class KozmosThemeTokensNightPaparazziTest {
    @get:Rule
    val paparazzi = Paparazzi(
        deviceConfig = DeviceConfig.PIXEL_5.copy(nightMode = NightMode.NIGHT),
        maxPercentDifference = 0.0
    )

    @Test
    fun theAccessorFollowsADarkDevice() {
        var system = emptyList<Color>()
        var light = emptyList<Color>()
        paparazzi.snapshot {
            Column(
                verticalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.background(Color(0xFF808080)).padding(8.dp)
            ) {
                system = readSample()
                Swatches(system)
                CompositionLocalProvider(LocalKozmosUseDarkTokens provides false) {
                    light = readSample()
                    Swatches(light)
                }
            }
        }
        assertEquals("unforced on a dark device", darkSample, system)
        assertEquals("forced light on a dark device", lightSample, light)
    }
}
