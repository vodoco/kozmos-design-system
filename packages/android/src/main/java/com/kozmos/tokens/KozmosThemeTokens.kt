// Do not edit directly, this file was auto-generated.
package com.kozmos.tokens

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.ui.graphics.Color

/**
 * Which palette `KozmosThemeTokens` reads: true for dark, false for light,
 * null to follow the system. `KozmosThemeProvider` provides it from its theme
 * mode.
 */
val LocalKozmosUseDarkTokens = compositionLocalOf<Boolean?> { null }

/**
 * Every colour in the palette, read for the theme the composition is in: the
 * palette a composable draws with. `KozmosColors` and `KozmosColorsDark` hold
 * one theme each, and a component that reads either stays in that theme
 * whatever the device shows. `pnpm tokens:theme:check` holds the components to
 * this object.
 */
object KozmosThemeTokens {
    /**
     * Whether the composition reads the dark palette:
     * `LocalKozmosUseDarkTokens` when a provider sets it, the system's theme
     * otherwise. Every accessor below decides by it. Read it only for what one
     * colour cannot carry, such as a wash that is black at 5 % on light and
     * white at 10 % on dark, as React's `bg-black/5 dark:bg-white/10` is.
     */
    val isDark: Boolean
        @Composable @ReadOnlyComposable get() =
            LocalKozmosUseDarkTokens.current ?: isSystemInDarkTheme()

    @Composable
    @ReadOnlyComposable
    private fun themed(light: Color, dark: Color): Color = if (isDark) dark else light

    val primitivesColorsTheme0: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsTheme0,
            KozmosColorsDark.primitivesColorsTheme0
        )

    val primitivesColorsTheme100: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsTheme100,
            KozmosColorsDark.primitivesColorsTheme100
        )

    val primitivesColorsTheme200: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsTheme200,
            KozmosColorsDark.primitivesColorsTheme200
        )

    val primitivesColorsTheme300: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsTheme300,
            KozmosColorsDark.primitivesColorsTheme300
        )

    val primitivesColorsTheme400: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsTheme400,
            KozmosColorsDark.primitivesColorsTheme400
        )

    val primitivesColorsTheme500: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsTheme500,
            KozmosColorsDark.primitivesColorsTheme500
        )

    val primitivesColorsTheme600: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsTheme600,
            KozmosColorsDark.primitivesColorsTheme600
        )

    val primitivesColorsTheme700: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsTheme700,
            KozmosColorsDark.primitivesColorsTheme700
        )

    val primitivesColorsTheme800: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsTheme800,
            KozmosColorsDark.primitivesColorsTheme800
        )

    val primitivesColorsTheme900: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsTheme900,
            KozmosColorsDark.primitivesColorsTheme900
        )

    val primitivesColorsTheme1000: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsTheme1000,
            KozmosColorsDark.primitivesColorsTheme1000
        )

    val primitivesColorsThemeVariant10: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsThemeVariant10,
            KozmosColorsDark.primitivesColorsThemeVariant10
        )

    val primitivesColorsThemeVariant1100: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsThemeVariant1100,
            KozmosColorsDark.primitivesColorsThemeVariant1100
        )

    val primitivesColorsThemeVariant1200: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsThemeVariant1200,
            KozmosColorsDark.primitivesColorsThemeVariant1200
        )

    val primitivesColorsThemeVariant1300: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsThemeVariant1300,
            KozmosColorsDark.primitivesColorsThemeVariant1300
        )

    val primitivesColorsThemeVariant1400: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsThemeVariant1400,
            KozmosColorsDark.primitivesColorsThemeVariant1400
        )

    val primitivesColorsThemeVariant1500: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsThemeVariant1500,
            KozmosColorsDark.primitivesColorsThemeVariant1500
        )

    val primitivesColorsThemeVariant1600: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsThemeVariant1600,
            KozmosColorsDark.primitivesColorsThemeVariant1600
        )

    val primitivesColorsThemeVariant1700: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsThemeVariant1700,
            KozmosColorsDark.primitivesColorsThemeVariant1700
        )

    val primitivesColorsThemeVariant1800: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsThemeVariant1800,
            KozmosColorsDark.primitivesColorsThemeVariant1800
        )

    val primitivesColorsThemeVariant1900: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsThemeVariant1900,
            KozmosColorsDark.primitivesColorsThemeVariant1900
        )

    val primitivesColorsThemeVariant11000: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsThemeVariant11000,
            KozmosColorsDark.primitivesColorsThemeVariant11000
        )

    val primitivesColorsThemeVariant20: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsThemeVariant20,
            KozmosColorsDark.primitivesColorsThemeVariant20
        )

    val primitivesColorsThemeVariant2100: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsThemeVariant2100,
            KozmosColorsDark.primitivesColorsThemeVariant2100
        )

    val primitivesColorsThemeVariant2200: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsThemeVariant2200,
            KozmosColorsDark.primitivesColorsThemeVariant2200
        )

    val primitivesColorsThemeVariant2300: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsThemeVariant2300,
            KozmosColorsDark.primitivesColorsThemeVariant2300
        )

    val primitivesColorsThemeVariant2400: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsThemeVariant2400,
            KozmosColorsDark.primitivesColorsThemeVariant2400
        )

    val primitivesColorsThemeVariant2500: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsThemeVariant2500,
            KozmosColorsDark.primitivesColorsThemeVariant2500
        )

    val primitivesColorsThemeVariant2600: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsThemeVariant2600,
            KozmosColorsDark.primitivesColorsThemeVariant2600
        )

    val primitivesColorsThemeVariant2700: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsThemeVariant2700,
            KozmosColorsDark.primitivesColorsThemeVariant2700
        )

    val primitivesColorsThemeVariant2800: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsThemeVariant2800,
            KozmosColorsDark.primitivesColorsThemeVariant2800
        )

    val primitivesColorsThemeVariant2900: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsThemeVariant2900,
            KozmosColorsDark.primitivesColorsThemeVariant2900
        )

    val primitivesColorsThemeVariant21000: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsThemeVariant21000,
            KozmosColorsDark.primitivesColorsThemeVariant21000
        )

    val primitivesColorsEmotionalSuccess0: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsEmotionalSuccess0,
            KozmosColorsDark.primitivesColorsEmotionalSuccess0
        )

    val primitivesColorsEmotionalSuccess100: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsEmotionalSuccess100,
            KozmosColorsDark.primitivesColorsEmotionalSuccess100
        )

    val primitivesColorsEmotionalSuccess200: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsEmotionalSuccess200,
            KozmosColorsDark.primitivesColorsEmotionalSuccess200
        )

    val primitivesColorsEmotionalSuccess300: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsEmotionalSuccess300,
            KozmosColorsDark.primitivesColorsEmotionalSuccess300
        )

    val primitivesColorsEmotionalSuccess400: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsEmotionalSuccess400,
            KozmosColorsDark.primitivesColorsEmotionalSuccess400
        )

    val primitivesColorsEmotionalSuccess500: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsEmotionalSuccess500,
            KozmosColorsDark.primitivesColorsEmotionalSuccess500
        )

    val primitivesColorsEmotionalSuccess600: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsEmotionalSuccess600,
            KozmosColorsDark.primitivesColorsEmotionalSuccess600
        )

    val primitivesColorsEmotionalSuccess700: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsEmotionalSuccess700,
            KozmosColorsDark.primitivesColorsEmotionalSuccess700
        )

    val primitivesColorsEmotionalSuccess800: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsEmotionalSuccess800,
            KozmosColorsDark.primitivesColorsEmotionalSuccess800
        )

    val primitivesColorsEmotionalSuccess900: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsEmotionalSuccess900,
            KozmosColorsDark.primitivesColorsEmotionalSuccess900
        )

    val primitivesColorsEmotionalSuccess1000: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsEmotionalSuccess1000,
            KozmosColorsDark.primitivesColorsEmotionalSuccess1000
        )

    val primitivesColorsEmotionalDanger0: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsEmotionalDanger0,
            KozmosColorsDark.primitivesColorsEmotionalDanger0
        )

    val primitivesColorsEmotionalDanger100: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsEmotionalDanger100,
            KozmosColorsDark.primitivesColorsEmotionalDanger100
        )

    val primitivesColorsEmotionalDanger200: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsEmotionalDanger200,
            KozmosColorsDark.primitivesColorsEmotionalDanger200
        )

    val primitivesColorsEmotionalDanger300: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsEmotionalDanger300,
            KozmosColorsDark.primitivesColorsEmotionalDanger300
        )

    val primitivesColorsEmotionalDanger400: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsEmotionalDanger400,
            KozmosColorsDark.primitivesColorsEmotionalDanger400
        )

    val primitivesColorsEmotionalDanger500: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsEmotionalDanger500,
            KozmosColorsDark.primitivesColorsEmotionalDanger500
        )

    val primitivesColorsEmotionalDanger600: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsEmotionalDanger600,
            KozmosColorsDark.primitivesColorsEmotionalDanger600
        )

    val primitivesColorsEmotionalDanger700: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsEmotionalDanger700,
            KozmosColorsDark.primitivesColorsEmotionalDanger700
        )

    val primitivesColorsEmotionalDanger800: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsEmotionalDanger800,
            KozmosColorsDark.primitivesColorsEmotionalDanger800
        )

    val primitivesColorsEmotionalDanger900: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsEmotionalDanger900,
            KozmosColorsDark.primitivesColorsEmotionalDanger900
        )

    val primitivesColorsEmotionalDanger1000: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsEmotionalDanger1000,
            KozmosColorsDark.primitivesColorsEmotionalDanger1000
        )

    val primitivesColorsEmotionalAlert0: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsEmotionalAlert0,
            KozmosColorsDark.primitivesColorsEmotionalAlert0
        )

    val primitivesColorsEmotionalAlert100: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsEmotionalAlert100,
            KozmosColorsDark.primitivesColorsEmotionalAlert100
        )

    val primitivesColorsEmotionalAlert200: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsEmotionalAlert200,
            KozmosColorsDark.primitivesColorsEmotionalAlert200
        )

    val primitivesColorsEmotionalAlert300: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsEmotionalAlert300,
            KozmosColorsDark.primitivesColorsEmotionalAlert300
        )

    val primitivesColorsEmotionalAlert400: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsEmotionalAlert400,
            KozmosColorsDark.primitivesColorsEmotionalAlert400
        )

    val primitivesColorsEmotionalAlert500: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsEmotionalAlert500,
            KozmosColorsDark.primitivesColorsEmotionalAlert500
        )

    val primitivesColorsEmotionalAlert600: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsEmotionalAlert600,
            KozmosColorsDark.primitivesColorsEmotionalAlert600
        )

    val primitivesColorsEmotionalAlert700: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsEmotionalAlert700,
            KozmosColorsDark.primitivesColorsEmotionalAlert700
        )

    val primitivesColorsEmotionalAlert800: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsEmotionalAlert800,
            KozmosColorsDark.primitivesColorsEmotionalAlert800
        )

    val primitivesColorsEmotionalAlert900: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsEmotionalAlert900,
            KozmosColorsDark.primitivesColorsEmotionalAlert900
        )

    val primitivesColorsEmotionalAlert1000: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsEmotionalAlert1000,
            KozmosColorsDark.primitivesColorsEmotionalAlert1000
        )

    val primitivesColorsEmotionalInfo0: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsEmotionalInfo0,
            KozmosColorsDark.primitivesColorsEmotionalInfo0
        )

    val primitivesColorsEmotionalInfo100: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsEmotionalInfo100,
            KozmosColorsDark.primitivesColorsEmotionalInfo100
        )

    val primitivesColorsEmotionalInfo200: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsEmotionalInfo200,
            KozmosColorsDark.primitivesColorsEmotionalInfo200
        )

    val primitivesColorsEmotionalInfo300: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsEmotionalInfo300,
            KozmosColorsDark.primitivesColorsEmotionalInfo300
        )

    val primitivesColorsEmotionalInfo400: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsEmotionalInfo400,
            KozmosColorsDark.primitivesColorsEmotionalInfo400
        )

    val primitivesColorsEmotionalInfo500: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsEmotionalInfo500,
            KozmosColorsDark.primitivesColorsEmotionalInfo500
        )

    val primitivesColorsEmotionalInfo600: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsEmotionalInfo600,
            KozmosColorsDark.primitivesColorsEmotionalInfo600
        )

    val primitivesColorsEmotionalInfo700: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsEmotionalInfo700,
            KozmosColorsDark.primitivesColorsEmotionalInfo700
        )

    val primitivesColorsEmotionalInfo800: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsEmotionalInfo800,
            KozmosColorsDark.primitivesColorsEmotionalInfo800
        )

    val primitivesColorsEmotionalInfo900: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsEmotionalInfo900,
            KozmosColorsDark.primitivesColorsEmotionalInfo900
        )

    val primitivesColorsEmotionalInfo1000: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsEmotionalInfo1000,
            KozmosColorsDark.primitivesColorsEmotionalInfo1000
        )

    val primitivesColorsTransparent3: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsTransparent3,
            KozmosColorsDark.primitivesColorsTransparent3
        )

    val primitivesColorsTransparent5: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsTransparent5,
            KozmosColorsDark.primitivesColorsTransparent5
        )

    val primitivesColorsTransparent10: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsTransparent10,
            KozmosColorsDark.primitivesColorsTransparent10
        )

    val primitivesColorsTransparent25: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsTransparent25,
            KozmosColorsDark.primitivesColorsTransparent25
        )

    val primitivesColorsTransparent50: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsTransparent50,
            KozmosColorsDark.primitivesColorsTransparent50
        )

    val primitivesColorsTransparent60: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsTransparent60,
            KozmosColorsDark.primitivesColorsTransparent60
        )

    val primitivesColorsTransparent75: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsTransparent75,
            KozmosColorsDark.primitivesColorsTransparent75
        )

    val primitivesColorsTransparent80: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsTransparent80,
            KozmosColorsDark.primitivesColorsTransparent80
        )

    val primitivesColorsTransparent90: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsTransparent90,
            KozmosColorsDark.primitivesColorsTransparent90
        )

    val primitivesColorsTransparent95: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsTransparent95,
            KozmosColorsDark.primitivesColorsTransparent95
        )

    val primitivesColorsTransparentInverted3: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsTransparentInverted3,
            KozmosColorsDark.primitivesColorsTransparentInverted3
        )

    val primitivesColorsTransparentInverted5: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsTransparentInverted5,
            KozmosColorsDark.primitivesColorsTransparentInverted5
        )

    val primitivesColorsTransparentInverted10: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsTransparentInverted10,
            KozmosColorsDark.primitivesColorsTransparentInverted10
        )

    val primitivesColorsTransparentInverted25: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsTransparentInverted25,
            KozmosColorsDark.primitivesColorsTransparentInverted25
        )

    val primitivesColorsTransparentInverted50: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsTransparentInverted50,
            KozmosColorsDark.primitivesColorsTransparentInverted50
        )

    val primitivesColorsTransparentInverted60: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsTransparentInverted60,
            KozmosColorsDark.primitivesColorsTransparentInverted60
        )

    val primitivesColorsTransparentInverted75: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsTransparentInverted75,
            KozmosColorsDark.primitivesColorsTransparentInverted75
        )

    val primitivesColorsTransparentInverted80: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsTransparentInverted80,
            KozmosColorsDark.primitivesColorsTransparentInverted80
        )

    val primitivesColorsTransparentInverted90: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsTransparentInverted90,
            KozmosColorsDark.primitivesColorsTransparentInverted90
        )

    val primitivesColorsTransparentInverted95: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsTransparentInverted95,
            KozmosColorsDark.primitivesColorsTransparentInverted95
        )

    val primitivesColorsBackground0: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsBackground0,
            KozmosColorsDark.primitivesColorsBackground0
        )

    /**
     * Already in use before it was a token: code.js hardcoded #F7F8FA and
     * #F1F2F4 as fallbacks against background/100, because the ramp jumped
     * straight from #FFFFFF to #E3E4E8 and left nothing for a resting hover.
     */
    val primitivesColorsBackground25: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsBackground25,
            KozmosColorsDark.primitivesColorsBackground25
        )

    /**
     * Already in use before it was a token: code.js hardcoded #F7F8FA and
     * #F1F2F4 as fallbacks against background/100, because the ramp jumped
     * straight from #FFFFFF to #E3E4E8 and left nothing for a resting hover.
     */
    val primitivesColorsBackground50: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsBackground50,
            KozmosColorsDark.primitivesColorsBackground50
        )

    val primitivesColorsBackground100: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsBackground100,
            KozmosColorsDark.primitivesColorsBackground100
        )

    val primitivesColorsBackground200: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsBackground200,
            KozmosColorsDark.primitivesColorsBackground200
        )

    val primitivesColorsBackground300: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsBackground300,
            KozmosColorsDark.primitivesColorsBackground300
        )

    val primitivesColorsBackground400: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsBackground400,
            KozmosColorsDark.primitivesColorsBackground400
        )

    val primitivesColorsBackground500: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsBackground500,
            KozmosColorsDark.primitivesColorsBackground500
        )

    val primitivesColorsBackground600: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsBackground600,
            KozmosColorsDark.primitivesColorsBackground600
        )

    val primitivesColorsBackground700: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsBackground700,
            KozmosColorsDark.primitivesColorsBackground700
        )

    val primitivesColorsBackground800: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsBackground800,
            KozmosColorsDark.primitivesColorsBackground800
        )

    val primitivesColorsBackground900: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsBackground900,
            KozmosColorsDark.primitivesColorsBackground900
        )

    val primitivesColorsBackground1000: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsBackground1000,
            KozmosColorsDark.primitivesColorsBackground1000
        )

    val primitivesColorsForeground0: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsForeground0,
            KozmosColorsDark.primitivesColorsForeground0
        )

    val primitivesColorsForeground100: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsForeground100,
            KozmosColorsDark.primitivesColorsForeground100
        )

    val primitivesColorsForeground200: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsForeground200,
            KozmosColorsDark.primitivesColorsForeground200
        )

    val primitivesColorsForeground300: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsForeground300,
            KozmosColorsDark.primitivesColorsForeground300
        )

    val primitivesColorsForeground400: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsForeground400,
            KozmosColorsDark.primitivesColorsForeground400
        )

    val primitivesColorsForeground500: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsForeground500,
            KozmosColorsDark.primitivesColorsForeground500
        )

    val primitivesColorsForeground600: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsForeground600,
            KozmosColorsDark.primitivesColorsForeground600
        )

    val primitivesColorsForeground700: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsForeground700,
            KozmosColorsDark.primitivesColorsForeground700
        )

    val primitivesColorsForeground800: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsForeground800,
            KozmosColorsDark.primitivesColorsForeground800
        )

    val primitivesColorsForeground900: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsForeground900,
            KozmosColorsDark.primitivesColorsForeground900
        )

    val primitivesColorsForeground1000: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesColorsForeground1000,
            KozmosColorsDark.primitivesColorsForeground1000
        )

    val primitivesBorderBevelTop: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesBorderBevelTop,
            KozmosColorsDark.primitivesBorderBevelTop
        )

    val primitivesBorderBevelBottom: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.primitivesBorderBevelBottom,
            KozmosColorsDark.primitivesBorderBevelBottom
        )

    val semanticsSurface0: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.semanticsSurface0,
            KozmosColorsDark.semanticsSurface0
        )

    val semanticsSurface100: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.semanticsSurface100,
            KozmosColorsDark.semanticsSurface100
        )

    val semanticsSurface200: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.semanticsSurface200,
            KozmosColorsDark.semanticsSurface200
        )

    val semanticsSurface300: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.semanticsSurface300,
            KozmosColorsDark.semanticsSurface300
        )

    /**
     * Container edges: cards, popovers, menus, dialogs, drawers, toasts, list
     * rows, the file dropzone. Soft on purpose, about 1.6:1 against the page
     * in both modes, because a container is told apart by its surface and
     * shadow, not its outline. Until 2026-09-03 Figma painted these with
     * foreground/500 and the web with background/200; this alias is now the
     * only place the colour lives.
     */
    val semanticsBorderSubtle: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.semanticsBorderSubtle,
            KozmosColorsDark.semanticsBorderSubtle
        )

    /**
     * Boundaries of things you interact with: inputs, checkboxes, radios,
     * switch, slider and progress tracks, swatches, the toast action. Held to
     * WCAG 1.4.11's 3:1 against the page: 4.2:1 light, 5.7:1 dark.
     * background/400 reads 2.997 and fails by three thousandths, which is why
     * this is foreground/500. The web used background/200 here before
     * 2026-09-03 and did not meet 3:1.
     */
    val semanticsBorderInput: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.semanticsBorderInput,
            KozmosColorsDark.semanticsBorderInput
        )

    /**
     * The quiet field an emotional label sits on — a tag, a counter, a status
     * pill. Paired with onSurface it clears 4.5:1 in both modes; the emotional
     * ramps invert between the two files, so one alias is right in both.
     */
    val semanticsEmotionNeutralSurface: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.semanticsEmotionNeutralSurface,
            KozmosColorsDark.semanticsEmotionNeutralSurface
        )

    /**
     * Ink on the matching surface. Never on the page: on white it is the wrong
     * end of the ramp.
     */
    val semanticsEmotionNeutralOnsurface: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.semanticsEmotionNeutralOnsurface,
            KozmosColorsDark.semanticsEmotionNeutralOnsurface
        )

    /**
     * The emotion as text or a glyph on the page itself — white or either grey
     * a panel, card or sheet paints (background/0, /50, /100). The step
     * differs per emotion because the ramps reach 4.5:1 on background/100 at
     * different places: success and alert 900, informative 800, danger 700,
     * themed 600. Measured on white alone they were one step lighter, and four
     * of six failed on a sheet's grey. The product draws success at 600, which
     * is 2.74:1 even on white.
     */
    val semanticsEmotionNeutralText: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.semanticsEmotionNeutralText,
            KozmosColorsDark.semanticsEmotionNeutralText
        )

    /**
     * The quiet field an emotional label sits on — a tag, a counter, a status
     * pill. Paired with onSurface it clears 4.5:1 in both modes; the emotional
     * ramps invert between the two files, so one alias is right in both.
     */
    val semanticsEmotionThemedSurface: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.semanticsEmotionThemedSurface,
            KozmosColorsDark.semanticsEmotionThemedSurface
        )

    /**
     * Ink on the matching surface. Never on the page: on white it is the wrong
     * end of the ramp.
     */
    val semanticsEmotionThemedOnsurface: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.semanticsEmotionThemedOnsurface,
            KozmosColorsDark.semanticsEmotionThemedOnsurface
        )

    /**
     * The emotion as text or a glyph on the page itself — white or either grey
     * a panel, card or sheet paints (background/0, /50, /100). The step
     * differs per emotion because the ramps reach 4.5:1 on background/100 at
     * different places: success and alert 900, informative 800, danger 700,
     * themed 600. Measured on white alone they were one step lighter, and four
     * of six failed on a sheet's grey. The product draws success at 600, which
     * is 2.74:1 even on white.
     */
    val semanticsEmotionThemedText: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.semanticsEmotionThemedText,
            KozmosColorsDark.semanticsEmotionThemedText
        )

    /**
     * The quiet field an emotional label sits on — a tag, a counter, a status
     * pill. Paired with onSurface it clears 4.5:1 in both modes; the emotional
     * ramps invert between the two files, so one alias is right in both.
     */
    val semanticsEmotionSuccessSurface: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.semanticsEmotionSuccessSurface,
            KozmosColorsDark.semanticsEmotionSuccessSurface
        )

    /**
     * Ink on the matching surface. Never on the page: on white it is the wrong
     * end of the ramp.
     */
    val semanticsEmotionSuccessOnsurface: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.semanticsEmotionSuccessOnsurface,
            KozmosColorsDark.semanticsEmotionSuccessOnsurface
        )

    /**
     * The emotion as text or a glyph on the page itself — white or either grey
     * a panel, card or sheet paints (background/0, /50, /100). The step
     * differs per emotion because the ramps reach 4.5:1 on background/100 at
     * different places: success and alert 900, informative 800, danger 700,
     * themed 600. Measured on white alone they were one step lighter, and four
     * of six failed on a sheet's grey. The product draws success at 600, which
     * is 2.74:1 even on white.
     */
    val semanticsEmotionSuccessText: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.semanticsEmotionSuccessText,
            KozmosColorsDark.semanticsEmotionSuccessText
        )

    /**
     * The quiet field an emotional label sits on — a tag, a counter, a status
     * pill. Paired with onSurface it clears 4.5:1 in both modes; the emotional
     * ramps invert between the two files, so one alias is right in both.
     */
    val semanticsEmotionDangerSurface: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.semanticsEmotionDangerSurface,
            KozmosColorsDark.semanticsEmotionDangerSurface
        )

    /**
     * Ink on the matching surface. Never on the page: on white it is the wrong
     * end of the ramp.
     */
    val semanticsEmotionDangerOnsurface: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.semanticsEmotionDangerOnsurface,
            KozmosColorsDark.semanticsEmotionDangerOnsurface
        )

    /**
     * The emotion as text or a glyph on the page itself — white or either grey
     * a panel, card or sheet paints (background/0, /50, /100). The step
     * differs per emotion because the ramps reach 4.5:1 on background/100 at
     * different places: success and alert 900, informative 800, danger 700,
     * themed 600. Measured on white alone they were one step lighter, and four
     * of six failed on a sheet's grey. The product draws success at 600, which
     * is 2.74:1 even on white.
     */
    val semanticsEmotionDangerText: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.semanticsEmotionDangerText,
            KozmosColorsDark.semanticsEmotionDangerText
        )

    /**
     * The quiet field an emotional label sits on — a tag, a counter, a status
     * pill. Paired with onSurface it clears 4.5:1 in both modes; the emotional
     * ramps invert between the two files, so one alias is right in both.
     */
    val semanticsEmotionAlertSurface: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.semanticsEmotionAlertSurface,
            KozmosColorsDark.semanticsEmotionAlertSurface
        )

    /**
     * Ink on the matching surface. Never on the page: on white it is the wrong
     * end of the ramp.
     */
    val semanticsEmotionAlertOnsurface: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.semanticsEmotionAlertOnsurface,
            KozmosColorsDark.semanticsEmotionAlertOnsurface
        )

    /**
     * The emotion as text or a glyph on the page itself — white or either grey
     * a panel, card or sheet paints (background/0, /50, /100). The step
     * differs per emotion because the ramps reach 4.5:1 on background/100 at
     * different places: success and alert 900, informative 800, danger 700,
     * themed 600. Measured on white alone they were one step lighter, and four
     * of six failed on a sheet's grey. The product draws success at 600, which
     * is 2.74:1 even on white.
     */
    val semanticsEmotionAlertText: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.semanticsEmotionAlertText,
            KozmosColorsDark.semanticsEmotionAlertText
        )

    /**
     * The quiet field an emotional label sits on — a tag, a counter, a status
     * pill. Paired with onSurface it clears 4.5:1 in both modes; the emotional
     * ramps invert between the two files, so one alias is right in both.
     */
    val semanticsEmotionInformativeSurface: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.semanticsEmotionInformativeSurface,
            KozmosColorsDark.semanticsEmotionInformativeSurface
        )

    /**
     * Ink on the matching surface. Never on the page: on white it is the wrong
     * end of the ramp.
     */
    val semanticsEmotionInformativeOnsurface: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.semanticsEmotionInformativeOnsurface,
            KozmosColorsDark.semanticsEmotionInformativeOnsurface
        )

    /**
     * The emotion as text or a glyph on the page itself — white or either grey
     * a panel, card or sheet paints (background/0, /50, /100). The step
     * differs per emotion because the ramps reach 4.5:1 on background/100 at
     * different places: success and alert 900, informative 800, danger 700,
     * themed 600. Measured on white alone they were one step lighter, and four
     * of six failed on a sheet's grey. The product draws success at 600, which
     * is 2.74:1 even on white.
     */
    val semanticsEmotionInformativeText: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.semanticsEmotionInformativeText,
            KozmosColorsDark.semanticsEmotionInformativeText
        )

    val semanticsDiffNew: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.semanticsDiffNew,
            KozmosColorsDark.semanticsDiffNew
        )

    val semanticsDiffUpdated: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.semanticsDiffUpdated,
            KozmosColorsDark.semanticsDiffUpdated
        )

    val semanticsDiffDeleted: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.semanticsDiffDeleted,
            KozmosColorsDark.semanticsDiffDeleted
        )

    val semanticsDiffOverride: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.semanticsDiffOverride,
            KozmosColorsDark.semanticsDiffOverride
        )

    val semanticsDataBlue: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.semanticsDataBlue,
            KozmosColorsDark.semanticsDataBlue
        )

    val semanticsDataPurple: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.semanticsDataPurple,
            KozmosColorsDark.semanticsDataPurple
        )

    val semanticsDataTeal: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.semanticsDataTeal,
            KozmosColorsDark.semanticsDataTeal
        )

    val semanticsDataOrange: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.semanticsDataOrange,
            KozmosColorsDark.semanticsDataOrange
        )

    val semanticsDataRed: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.semanticsDataRed,
            KozmosColorsDark.semanticsDataRed
        )

    val semanticsDataYellow: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.semanticsDataYellow,
            KozmosColorsDark.semanticsDataYellow
        )

    val semanticsOverlayScrim: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.semanticsOverlayScrim,
            KozmosColorsDark.semanticsOverlayScrim
        )

    val semanticsOverlayDim: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.semanticsOverlayDim,
            KozmosColorsDark.semanticsOverlayDim
        )

    /**
     * The taxonomy's yellow quick-access colour.
     */
    val semanticsCategoryAccentYellow: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.semanticsCategoryAccentYellow,
            KozmosColorsDark.semanticsCategoryAccentYellow
        )

    /**
     * The taxonomy's orange quick-access colour.
     */
    val semanticsCategoryAccentOrange: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.semanticsCategoryAccentOrange,
            KozmosColorsDark.semanticsCategoryAccentOrange
        )

    /**
     * The taxonomy's turquoise quick-access colour.
     */
    val semanticsCategoryAccentTurquoise: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.semanticsCategoryAccentTurquoise,
            KozmosColorsDark.semanticsCategoryAccentTurquoise
        )

    /**
     * The taxonomy's red quick-access colour.
     */
    val semanticsCategoryAccentRed: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.semanticsCategoryAccentRed,
            KozmosColorsDark.semanticsCategoryAccentRed
        )

    /**
     * The taxonomy's blue quick-access colour.
     */
    val semanticsCategoryAccentBlue: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.semanticsCategoryAccentBlue,
            KozmosColorsDark.semanticsCategoryAccentBlue
        )

    /**
     * The taxonomy's navy quick-access colour.
     */
    val semanticsCategoryAccentNavy: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.semanticsCategoryAccentNavy,
            KozmosColorsDark.semanticsCategoryAccentNavy
        )

    /**
     * The taxonomy's green quick-access colour.
     */
    val semanticsCategoryAccentGreen: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.semanticsCategoryAccentGreen,
            KozmosColorsDark.semanticsCategoryAccentGreen
        )

    /**
     * The taxonomy's pink quick-access colour.
     */
    val semanticsCategoryAccentPink: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.semanticsCategoryAccentPink,
            KozmosColorsDark.semanticsCategoryAccentPink
        )

    /**
     * A filled pill or counter in the yellow category.
     */
    val semanticsCategoryFillYellow: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.semanticsCategoryFillYellow,
            KozmosColorsDark.semanticsCategoryFillYellow
        )

    /**
     * A filled pill or counter in the orange category.
     */
    val semanticsCategoryFillOrange: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.semanticsCategoryFillOrange,
            KozmosColorsDark.semanticsCategoryFillOrange
        )

    /**
     * A filled pill or counter in the turquoise category.
     */
    val semanticsCategoryFillTurquoise: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.semanticsCategoryFillTurquoise,
            KozmosColorsDark.semanticsCategoryFillTurquoise
        )

    /**
     * A filled pill or counter in the red category.
     */
    val semanticsCategoryFillRed: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.semanticsCategoryFillRed,
            KozmosColorsDark.semanticsCategoryFillRed
        )

    /**
     * A filled pill or counter in the blue category. Darkened 7 % from the
     * accent so white ink reaches 4.57:1; no ink reaches 4.5 on the accent
     * itself.
     */
    val semanticsCategoryFillBlue: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.semanticsCategoryFillBlue,
            KozmosColorsDark.semanticsCategoryFillBlue
        )

    /**
     * A filled pill or counter in the navy category.
     */
    val semanticsCategoryFillNavy: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.semanticsCategoryFillNavy,
            KozmosColorsDark.semanticsCategoryFillNavy
        )

    /**
     * A filled pill or counter in the green category.
     */
    val semanticsCategoryFillGreen: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.semanticsCategoryFillGreen,
            KozmosColorsDark.semanticsCategoryFillGreen
        )

    /**
     * A filled pill or counter in the pink category.
     */
    val semanticsCategoryFillPink: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.semanticsCategoryFillPink,
            KozmosColorsDark.semanticsCategoryFillPink
        )

    /**
     * The ink on the yellow fill: the dark ink.
     */
    val semanticsCategoryOnfillYellow: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.semanticsCategoryOnfillYellow,
            KozmosColorsDark.semanticsCategoryOnfillYellow
        )

    /**
     * The ink on the orange fill: the dark ink.
     */
    val semanticsCategoryOnfillOrange: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.semanticsCategoryOnfillOrange,
            KozmosColorsDark.semanticsCategoryOnfillOrange
        )

    /**
     * The ink on the turquoise fill: the dark ink.
     */
    val semanticsCategoryOnfillTurquoise: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.semanticsCategoryOnfillTurquoise,
            KozmosColorsDark.semanticsCategoryOnfillTurquoise
        )

    /**
     * The ink on the red fill: white.
     */
    val semanticsCategoryOnfillRed: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.semanticsCategoryOnfillRed,
            KozmosColorsDark.semanticsCategoryOnfillRed
        )

    /**
     * The ink on the blue fill: white.
     */
    val semanticsCategoryOnfillBlue: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.semanticsCategoryOnfillBlue,
            KozmosColorsDark.semanticsCategoryOnfillBlue
        )

    /**
     * The ink on the navy fill: white.
     */
    val semanticsCategoryOnfillNavy: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.semanticsCategoryOnfillNavy,
            KozmosColorsDark.semanticsCategoryOnfillNavy
        )

    /**
     * The ink on the green fill: the dark ink.
     */
    val semanticsCategoryOnfillGreen: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.semanticsCategoryOnfillGreen,
            KozmosColorsDark.semanticsCategoryOnfillGreen
        )

    /**
     * The ink on the pink fill: white.
     */
    val semanticsCategoryOnfillPink: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.semanticsCategoryOnfillPink,
            KozmosColorsDark.semanticsCategoryOnfillPink
        )

    val componentsPrimaryButtonsThemedButtonForegroundContentIdle: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsThemedButtonForegroundContentIdle,
            KozmosColorsDark.componentsPrimaryButtonsThemedButtonForegroundContentIdle
        )

    val componentsPrimaryButtonsThemedButtonForegroundContentDisabled: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsThemedButtonForegroundContentDisabled,
            KozmosColorsDark.componentsPrimaryButtonsThemedButtonForegroundContentDisabled
        )

    val componentsPrimaryButtonsThemedButtonForegroundContentHover: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsThemedButtonForegroundContentHover,
            KozmosColorsDark.componentsPrimaryButtonsThemedButtonForegroundContentHover
        )

    val componentsPrimaryButtonsThemedButtonForegroundContentPressed: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsThemedButtonForegroundContentPressed,
            KozmosColorsDark.componentsPrimaryButtonsThemedButtonForegroundContentPressed
        )

    val componentsPrimaryButtonsThemedButtonForegroundContentFocus: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsThemedButtonForegroundContentFocus,
            KozmosColorsDark.componentsPrimaryButtonsThemedButtonForegroundContentFocus
        )

    val componentsPrimaryButtonsThemedButtonBackgroundIdle: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsThemedButtonBackgroundIdle,
            KozmosColorsDark.componentsPrimaryButtonsThemedButtonBackgroundIdle
        )

    val componentsPrimaryButtonsThemedButtonBackgroundDisabled: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsThemedButtonBackgroundDisabled,
            KozmosColorsDark.componentsPrimaryButtonsThemedButtonBackgroundDisabled
        )

    val componentsPrimaryButtonsThemedButtonBackgroundHover: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsThemedButtonBackgroundHover,
            KozmosColorsDark.componentsPrimaryButtonsThemedButtonBackgroundHover
        )

    val componentsPrimaryButtonsThemedButtonBackgroundPressed: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsThemedButtonBackgroundPressed,
            KozmosColorsDark.componentsPrimaryButtonsThemedButtonBackgroundPressed
        )

    val componentsPrimaryButtonsThemedButtonBackgroundFocus: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsThemedButtonBackgroundFocus,
            KozmosColorsDark.componentsPrimaryButtonsThemedButtonBackgroundFocus
        )

    val componentsPrimaryButtonsThemedForegroundDimmedContentIdle: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsThemedForegroundDimmedContentIdle,
            KozmosColorsDark.componentsPrimaryButtonsThemedForegroundDimmedContentIdle
        )

    val componentsPrimaryButtonsThemedForegroundDimmedContentDisabled: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsThemedForegroundDimmedContentDisabled,
            KozmosColorsDark.componentsPrimaryButtonsThemedForegroundDimmedContentDisabled
        )

    val componentsPrimaryButtonsThemedForegroundDimmedContentHover: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsThemedForegroundDimmedContentHover,
            KozmosColorsDark.componentsPrimaryButtonsThemedForegroundDimmedContentHover
        )

    val componentsPrimaryButtonsThemedForegroundDimmedContentPressed: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsThemedForegroundDimmedContentPressed,
            KozmosColorsDark.componentsPrimaryButtonsThemedForegroundDimmedContentPressed
        )

    val componentsPrimaryButtonsThemedForegroundDimmedContentFocus: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsThemedForegroundDimmedContentFocus,
            KozmosColorsDark.componentsPrimaryButtonsThemedForegroundDimmedContentFocus
        )

    val componentsPrimaryButtonsSuccessButtonBackgroundIdle: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsSuccessButtonBackgroundIdle,
            KozmosColorsDark.componentsPrimaryButtonsSuccessButtonBackgroundIdle
        )

    val componentsPrimaryButtonsSuccessButtonBackgroundDisabled: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsSuccessButtonBackgroundDisabled,
            KozmosColorsDark.componentsPrimaryButtonsSuccessButtonBackgroundDisabled
        )

    val componentsPrimaryButtonsSuccessButtonBackgroundHover: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsSuccessButtonBackgroundHover,
            KozmosColorsDark.componentsPrimaryButtonsSuccessButtonBackgroundHover
        )

    val componentsPrimaryButtonsSuccessButtonBackgroundPressed: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsSuccessButtonBackgroundPressed,
            KozmosColorsDark.componentsPrimaryButtonsSuccessButtonBackgroundPressed
        )

    val componentsPrimaryButtonsSuccessButtonBackgroundFocus: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsSuccessButtonBackgroundFocus,
            KozmosColorsDark.componentsPrimaryButtonsSuccessButtonBackgroundFocus
        )

    val componentsPrimaryButtonsSuccessButtonForegroundContentIdle: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsSuccessButtonForegroundContentIdle,
            KozmosColorsDark.componentsPrimaryButtonsSuccessButtonForegroundContentIdle
        )

    val componentsPrimaryButtonsSuccessButtonForegroundContentDisabled: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsSuccessButtonForegroundContentDisabled,
            KozmosColorsDark.componentsPrimaryButtonsSuccessButtonForegroundContentDisabled
        )

    val componentsPrimaryButtonsSuccessButtonForegroundContentHover: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsSuccessButtonForegroundContentHover,
            KozmosColorsDark.componentsPrimaryButtonsSuccessButtonForegroundContentHover
        )

    val componentsPrimaryButtonsSuccessButtonForegroundContentPressed: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsSuccessButtonForegroundContentPressed,
            KozmosColorsDark.componentsPrimaryButtonsSuccessButtonForegroundContentPressed
        )

    val componentsPrimaryButtonsSuccessButtonForegroundContentFocus: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsSuccessButtonForegroundContentFocus,
            KozmosColorsDark.componentsPrimaryButtonsSuccessButtonForegroundContentFocus
        )

    val componentsPrimaryButtonsSuccessForegroundDimmedContentIdle: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsSuccessForegroundDimmedContentIdle,
            KozmosColorsDark.componentsPrimaryButtonsSuccessForegroundDimmedContentIdle
        )

    val componentsPrimaryButtonsSuccessForegroundDimmedContentDisabled: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsSuccessForegroundDimmedContentDisabled,
            KozmosColorsDark.componentsPrimaryButtonsSuccessForegroundDimmedContentDisabled
        )

    val componentsPrimaryButtonsSuccessForegroundDimmedContentHover: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsSuccessForegroundDimmedContentHover,
            KozmosColorsDark.componentsPrimaryButtonsSuccessForegroundDimmedContentHover
        )

    val componentsPrimaryButtonsSuccessForegroundDimmedContentPressed: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsSuccessForegroundDimmedContentPressed,
            KozmosColorsDark.componentsPrimaryButtonsSuccessForegroundDimmedContentPressed
        )

    val componentsPrimaryButtonsSuccessForegroundDimmedContentFocus: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsSuccessForegroundDimmedContentFocus,
            KozmosColorsDark.componentsPrimaryButtonsSuccessForegroundDimmedContentFocus
        )

    val componentsPrimaryButtonsAlertButtonBackgroundIdle: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsAlertButtonBackgroundIdle,
            KozmosColorsDark.componentsPrimaryButtonsAlertButtonBackgroundIdle
        )

    val componentsPrimaryButtonsAlertButtonBackgroundDisabled: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsAlertButtonBackgroundDisabled,
            KozmosColorsDark.componentsPrimaryButtonsAlertButtonBackgroundDisabled
        )

    val componentsPrimaryButtonsAlertButtonBackgroundHover: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsAlertButtonBackgroundHover,
            KozmosColorsDark.componentsPrimaryButtonsAlertButtonBackgroundHover
        )

    val componentsPrimaryButtonsAlertButtonBackgroundPressed: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsAlertButtonBackgroundPressed,
            KozmosColorsDark.componentsPrimaryButtonsAlertButtonBackgroundPressed
        )

    val componentsPrimaryButtonsAlertButtonBackgroundFocus: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsAlertButtonBackgroundFocus,
            KozmosColorsDark.componentsPrimaryButtonsAlertButtonBackgroundFocus
        )

    val componentsPrimaryButtonsAlertButtonForegroundContentIdle: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsAlertButtonForegroundContentIdle,
            KozmosColorsDark.componentsPrimaryButtonsAlertButtonForegroundContentIdle
        )

    val componentsPrimaryButtonsAlertButtonForegroundContentDisabled: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsAlertButtonForegroundContentDisabled,
            KozmosColorsDark.componentsPrimaryButtonsAlertButtonForegroundContentDisabled
        )

    val componentsPrimaryButtonsAlertButtonForegroundContentHover: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsAlertButtonForegroundContentHover,
            KozmosColorsDark.componentsPrimaryButtonsAlertButtonForegroundContentHover
        )

    val componentsPrimaryButtonsAlertButtonForegroundContentPressed: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsAlertButtonForegroundContentPressed,
            KozmosColorsDark.componentsPrimaryButtonsAlertButtonForegroundContentPressed
        )

    val componentsPrimaryButtonsAlertButtonForegroundContentFocus: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsAlertButtonForegroundContentFocus,
            KozmosColorsDark.componentsPrimaryButtonsAlertButtonForegroundContentFocus
        )

    val componentsPrimaryButtonsAlertForegroundDimmedContentIdle: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsAlertForegroundDimmedContentIdle,
            KozmosColorsDark.componentsPrimaryButtonsAlertForegroundDimmedContentIdle
        )

    val componentsPrimaryButtonsAlertForegroundDimmedContentDisabled: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsAlertForegroundDimmedContentDisabled,
            KozmosColorsDark.componentsPrimaryButtonsAlertForegroundDimmedContentDisabled
        )

    val componentsPrimaryButtonsAlertForegroundDimmedContentHover: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsAlertForegroundDimmedContentHover,
            KozmosColorsDark.componentsPrimaryButtonsAlertForegroundDimmedContentHover
        )

    val componentsPrimaryButtonsAlertForegroundDimmedContentPressed: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsAlertForegroundDimmedContentPressed,
            KozmosColorsDark.componentsPrimaryButtonsAlertForegroundDimmedContentPressed
        )

    val componentsPrimaryButtonsAlertForegroundDimmedContentFocus: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsAlertForegroundDimmedContentFocus,
            KozmosColorsDark.componentsPrimaryButtonsAlertForegroundDimmedContentFocus
        )

    val componentsPrimaryButtonsDangerButtonBackgroundIdle: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsDangerButtonBackgroundIdle,
            KozmosColorsDark.componentsPrimaryButtonsDangerButtonBackgroundIdle
        )

    val componentsPrimaryButtonsDangerButtonBackgroundDisabled: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsDangerButtonBackgroundDisabled,
            KozmosColorsDark.componentsPrimaryButtonsDangerButtonBackgroundDisabled
        )

    val componentsPrimaryButtonsDangerButtonBackgroundHover: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsDangerButtonBackgroundHover,
            KozmosColorsDark.componentsPrimaryButtonsDangerButtonBackgroundHover
        )

    val componentsPrimaryButtonsDangerButtonBackgroundPressed: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsDangerButtonBackgroundPressed,
            KozmosColorsDark.componentsPrimaryButtonsDangerButtonBackgroundPressed
        )

    val componentsPrimaryButtonsDangerButtonBackgroundFocus: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsDangerButtonBackgroundFocus,
            KozmosColorsDark.componentsPrimaryButtonsDangerButtonBackgroundFocus
        )

    val componentsPrimaryButtonsDangerButtonForegroundContentIdle: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsDangerButtonForegroundContentIdle,
            KozmosColorsDark.componentsPrimaryButtonsDangerButtonForegroundContentIdle
        )

    val componentsPrimaryButtonsDangerButtonForegroundContentDisabled: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsDangerButtonForegroundContentDisabled,
            KozmosColorsDark.componentsPrimaryButtonsDangerButtonForegroundContentDisabled
        )

    val componentsPrimaryButtonsDangerButtonForegroundContentHover: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsDangerButtonForegroundContentHover,
            KozmosColorsDark.componentsPrimaryButtonsDangerButtonForegroundContentHover
        )

    val componentsPrimaryButtonsDangerButtonForegroundContentPressed: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsDangerButtonForegroundContentPressed,
            KozmosColorsDark.componentsPrimaryButtonsDangerButtonForegroundContentPressed
        )

    val componentsPrimaryButtonsDangerButtonForegroundContentFocus: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsDangerButtonForegroundContentFocus,
            KozmosColorsDark.componentsPrimaryButtonsDangerButtonForegroundContentFocus
        )

    val componentsPrimaryButtonsDangerForegroundDimmedContentIdle: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsDangerForegroundDimmedContentIdle,
            KozmosColorsDark.componentsPrimaryButtonsDangerForegroundDimmedContentIdle
        )

    val componentsPrimaryButtonsDangerForegroundDimmedContentDisabled: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsDangerForegroundDimmedContentDisabled,
            KozmosColorsDark.componentsPrimaryButtonsDangerForegroundDimmedContentDisabled
        )

    val componentsPrimaryButtonsDangerForegroundDimmedContentHover: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsDangerForegroundDimmedContentHover,
            KozmosColorsDark.componentsPrimaryButtonsDangerForegroundDimmedContentHover
        )

    val componentsPrimaryButtonsDangerForegroundDimmedContentPressed: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsDangerForegroundDimmedContentPressed,
            KozmosColorsDark.componentsPrimaryButtonsDangerForegroundDimmedContentPressed
        )

    val componentsPrimaryButtonsDangerForegroundDimmedContentFocus: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsDangerForegroundDimmedContentFocus,
            KozmosColorsDark.componentsPrimaryButtonsDangerForegroundDimmedContentFocus
        )

    val componentsPrimaryButtonsInformativeButtonBackgroundIdle: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsInformativeButtonBackgroundIdle,
            KozmosColorsDark.componentsPrimaryButtonsInformativeButtonBackgroundIdle
        )

    val componentsPrimaryButtonsInformativeButtonBackgroundDisabled: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsInformativeButtonBackgroundDisabled,
            KozmosColorsDark.componentsPrimaryButtonsInformativeButtonBackgroundDisabled
        )

    val componentsPrimaryButtonsInformativeButtonBackgroundHover: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsInformativeButtonBackgroundHover,
            KozmosColorsDark.componentsPrimaryButtonsInformativeButtonBackgroundHover
        )

    val componentsPrimaryButtonsInformativeButtonBackgroundPressed: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsInformativeButtonBackgroundPressed,
            KozmosColorsDark.componentsPrimaryButtonsInformativeButtonBackgroundPressed
        )

    val componentsPrimaryButtonsInformativeButtonBackgroundFocus: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsInformativeButtonBackgroundFocus,
            KozmosColorsDark.componentsPrimaryButtonsInformativeButtonBackgroundFocus
        )

    val componentsPrimaryButtonsInformativeButtonForegroundContentIdle: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsInformativeButtonForegroundContentIdle,
            KozmosColorsDark.componentsPrimaryButtonsInformativeButtonForegroundContentIdle
        )

    val componentsPrimaryButtonsInformativeButtonForegroundContentDisabled: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsInformativeButtonForegroundContentDisabled,
            KozmosColorsDark.componentsPrimaryButtonsInformativeButtonForegroundContentDisabled
        )

    val componentsPrimaryButtonsInformativeButtonForegroundContentHover: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsInformativeButtonForegroundContentHover,
            KozmosColorsDark.componentsPrimaryButtonsInformativeButtonForegroundContentHover
        )

    val componentsPrimaryButtonsInformativeButtonForegroundContentPressed: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsInformativeButtonForegroundContentPressed,
            KozmosColorsDark.componentsPrimaryButtonsInformativeButtonForegroundContentPressed
        )

    val componentsPrimaryButtonsInformativeButtonForegroundContentFocus: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsInformativeButtonForegroundContentFocus,
            KozmosColorsDark.componentsPrimaryButtonsInformativeButtonForegroundContentFocus
        )

    val componentsPrimaryButtonsInformativeForegroundDimmedContentIdle: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsInformativeForegroundDimmedContentIdle,
            KozmosColorsDark.componentsPrimaryButtonsInformativeForegroundDimmedContentIdle
        )

    val componentsPrimaryButtonsInformativeForegroundDimmedContentDisabled: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsInformativeForegroundDimmedContentDisabled,
            KozmosColorsDark.componentsPrimaryButtonsInformativeForegroundDimmedContentDisabled
        )

    val componentsPrimaryButtonsInformativeForegroundDimmedContentHover: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsInformativeForegroundDimmedContentHover,
            KozmosColorsDark.componentsPrimaryButtonsInformativeForegroundDimmedContentHover
        )

    val componentsPrimaryButtonsInformativeForegroundDimmedContentPressed: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsInformativeForegroundDimmedContentPressed,
            KozmosColorsDark.componentsPrimaryButtonsInformativeForegroundDimmedContentPressed
        )

    val componentsPrimaryButtonsInformativeForegroundDimmedContentFocus: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsInformativeForegroundDimmedContentFocus,
            KozmosColorsDark.componentsPrimaryButtonsInformativeForegroundDimmedContentFocus
        )

    val componentsPrimaryButtonsNeutralButtonBackgroundIdle: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsNeutralButtonBackgroundIdle,
            KozmosColorsDark.componentsPrimaryButtonsNeutralButtonBackgroundIdle
        )

    val componentsPrimaryButtonsNeutralButtonBackgroundDisabled: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsNeutralButtonBackgroundDisabled,
            KozmosColorsDark.componentsPrimaryButtonsNeutralButtonBackgroundDisabled
        )

    val componentsPrimaryButtonsNeutralButtonBackgroundHover: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsNeutralButtonBackgroundHover,
            KozmosColorsDark.componentsPrimaryButtonsNeutralButtonBackgroundHover
        )

    val componentsPrimaryButtonsNeutralButtonBackgroundPressed: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsNeutralButtonBackgroundPressed,
            KozmosColorsDark.componentsPrimaryButtonsNeutralButtonBackgroundPressed
        )

    val componentsPrimaryButtonsNeutralButtonBackgroundFocus: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsNeutralButtonBackgroundFocus,
            KozmosColorsDark.componentsPrimaryButtonsNeutralButtonBackgroundFocus
        )

    val componentsPrimaryButtonsNeutralButtonForegroundContentIdle: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsNeutralButtonForegroundContentIdle,
            KozmosColorsDark.componentsPrimaryButtonsNeutralButtonForegroundContentIdle
        )

    val componentsPrimaryButtonsNeutralButtonForegroundContentDisabled: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsNeutralButtonForegroundContentDisabled,
            KozmosColorsDark.componentsPrimaryButtonsNeutralButtonForegroundContentDisabled
        )

    val componentsPrimaryButtonsNeutralButtonForegroundContentHover: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsNeutralButtonForegroundContentHover,
            KozmosColorsDark.componentsPrimaryButtonsNeutralButtonForegroundContentHover
        )

    val componentsPrimaryButtonsNeutralButtonForegroundContentPressed: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsNeutralButtonForegroundContentPressed,
            KozmosColorsDark.componentsPrimaryButtonsNeutralButtonForegroundContentPressed
        )

    val componentsPrimaryButtonsNeutralButtonForegroundContentFocus: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsNeutralButtonForegroundContentFocus,
            KozmosColorsDark.componentsPrimaryButtonsNeutralButtonForegroundContentFocus
        )

    val componentsPrimaryButtonsNeutralForegroundDimmedContentIdle: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsNeutralForegroundDimmedContentIdle,
            KozmosColorsDark.componentsPrimaryButtonsNeutralForegroundDimmedContentIdle
        )

    val componentsPrimaryButtonsNeutralForegroundDimmedContentDisabled: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsNeutralForegroundDimmedContentDisabled,
            KozmosColorsDark.componentsPrimaryButtonsNeutralForegroundDimmedContentDisabled
        )

    val componentsPrimaryButtonsNeutralForegroundDimmedContentHover: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsNeutralForegroundDimmedContentHover,
            KozmosColorsDark.componentsPrimaryButtonsNeutralForegroundDimmedContentHover
        )

    val componentsPrimaryButtonsNeutralForegroundDimmedContentPressed: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsNeutralForegroundDimmedContentPressed,
            KozmosColorsDark.componentsPrimaryButtonsNeutralForegroundDimmedContentPressed
        )

    val componentsPrimaryButtonsNeutralForegroundDimmedContentFocus: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsPrimaryButtonsNeutralForegroundDimmedContentFocus,
            KozmosColorsDark.componentsPrimaryButtonsNeutralForegroundDimmedContentFocus
        )

    val componentsSecondaryButtonsThemedButtonBackgroundIdle: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsThemedButtonBackgroundIdle,
            KozmosColorsDark.componentsSecondaryButtonsThemedButtonBackgroundIdle
        )

    val componentsSecondaryButtonsThemedButtonBackgroundDisabled: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsThemedButtonBackgroundDisabled,
            KozmosColorsDark.componentsSecondaryButtonsThemedButtonBackgroundDisabled
        )

    val componentsSecondaryButtonsThemedButtonBackgroundHover: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsThemedButtonBackgroundHover,
            KozmosColorsDark.componentsSecondaryButtonsThemedButtonBackgroundHover
        )

    val componentsSecondaryButtonsThemedButtonBackgroundPressed: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsThemedButtonBackgroundPressed,
            KozmosColorsDark.componentsSecondaryButtonsThemedButtonBackgroundPressed
        )

    val componentsSecondaryButtonsThemedButtonBackgroundFocus: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsThemedButtonBackgroundFocus,
            KozmosColorsDark.componentsSecondaryButtonsThemedButtonBackgroundFocus
        )

    val componentsSecondaryButtonsThemedButtonForegroundContentIdle: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsThemedButtonForegroundContentIdle,
            KozmosColorsDark.componentsSecondaryButtonsThemedButtonForegroundContentIdle
        )

    val componentsSecondaryButtonsThemedButtonForegroundContentDisabled: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsThemedButtonForegroundContentDisabled,
            KozmosColorsDark.componentsSecondaryButtonsThemedButtonForegroundContentDisabled
        )

    val componentsSecondaryButtonsThemedButtonForegroundContentHover: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsThemedButtonForegroundContentHover,
            KozmosColorsDark.componentsSecondaryButtonsThemedButtonForegroundContentHover
        )

    val componentsSecondaryButtonsThemedButtonForegroundContentPressed: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsThemedButtonForegroundContentPressed,
            KozmosColorsDark.componentsSecondaryButtonsThemedButtonForegroundContentPressed
        )

    val componentsSecondaryButtonsThemedButtonForegroundContentFocus: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsThemedButtonForegroundContentFocus,
            KozmosColorsDark.componentsSecondaryButtonsThemedButtonForegroundContentFocus
        )

    val componentsSecondaryButtonsThemedForegroundDimmedContentIdle: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsThemedForegroundDimmedContentIdle,
            KozmosColorsDark.componentsSecondaryButtonsThemedForegroundDimmedContentIdle
        )

    val componentsSecondaryButtonsThemedForegroundDimmedContentDisabled: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsThemedForegroundDimmedContentDisabled,
            KozmosColorsDark.componentsSecondaryButtonsThemedForegroundDimmedContentDisabled
        )

    val componentsSecondaryButtonsThemedForegroundDimmedContentHover: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsThemedForegroundDimmedContentHover,
            KozmosColorsDark.componentsSecondaryButtonsThemedForegroundDimmedContentHover
        )

    val componentsSecondaryButtonsThemedForegroundDimmedContentPressed: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsThemedForegroundDimmedContentPressed,
            KozmosColorsDark.componentsSecondaryButtonsThemedForegroundDimmedContentPressed
        )

    val componentsSecondaryButtonsThemedForegroundDimmedContentFocus: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsThemedForegroundDimmedContentFocus,
            KozmosColorsDark.componentsSecondaryButtonsThemedForegroundDimmedContentFocus
        )

    val componentsSecondaryButtonsSuccessButtonBackgroundIdle: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsSuccessButtonBackgroundIdle,
            KozmosColorsDark.componentsSecondaryButtonsSuccessButtonBackgroundIdle
        )

    val componentsSecondaryButtonsSuccessButtonBackgroundDisabled: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsSuccessButtonBackgroundDisabled,
            KozmosColorsDark.componentsSecondaryButtonsSuccessButtonBackgroundDisabled
        )

    val componentsSecondaryButtonsSuccessButtonBackgroundHover: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsSuccessButtonBackgroundHover,
            KozmosColorsDark.componentsSecondaryButtonsSuccessButtonBackgroundHover
        )

    val componentsSecondaryButtonsSuccessButtonBackgroundPressed: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsSuccessButtonBackgroundPressed,
            KozmosColorsDark.componentsSecondaryButtonsSuccessButtonBackgroundPressed
        )

    val componentsSecondaryButtonsSuccessButtonBackgroundFocus: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsSuccessButtonBackgroundFocus,
            KozmosColorsDark.componentsSecondaryButtonsSuccessButtonBackgroundFocus
        )

    val componentsSecondaryButtonsSuccessButtonForegroundContentIdle: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsSuccessButtonForegroundContentIdle,
            KozmosColorsDark.componentsSecondaryButtonsSuccessButtonForegroundContentIdle
        )

    val componentsSecondaryButtonsSuccessButtonForegroundContentDisabled: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsSuccessButtonForegroundContentDisabled,
            KozmosColorsDark.componentsSecondaryButtonsSuccessButtonForegroundContentDisabled
        )

    val componentsSecondaryButtonsSuccessButtonForegroundContentHover: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsSuccessButtonForegroundContentHover,
            KozmosColorsDark.componentsSecondaryButtonsSuccessButtonForegroundContentHover
        )

    val componentsSecondaryButtonsSuccessButtonForegroundContentPressed: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsSuccessButtonForegroundContentPressed,
            KozmosColorsDark.componentsSecondaryButtonsSuccessButtonForegroundContentPressed
        )

    val componentsSecondaryButtonsSuccessButtonForegroundContentFocus: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsSuccessButtonForegroundContentFocus,
            KozmosColorsDark.componentsSecondaryButtonsSuccessButtonForegroundContentFocus
        )

    val componentsSecondaryButtonsSuccessForegroundDimmedContentIdle: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsSuccessForegroundDimmedContentIdle,
            KozmosColorsDark.componentsSecondaryButtonsSuccessForegroundDimmedContentIdle
        )

    val componentsSecondaryButtonsSuccessForegroundDimmedContentDisabled: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsSuccessForegroundDimmedContentDisabled,
            KozmosColorsDark.componentsSecondaryButtonsSuccessForegroundDimmedContentDisabled
        )

    val componentsSecondaryButtonsSuccessForegroundDimmedContentHover: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsSuccessForegroundDimmedContentHover,
            KozmosColorsDark.componentsSecondaryButtonsSuccessForegroundDimmedContentHover
        )

    val componentsSecondaryButtonsSuccessForegroundDimmedContentPressed: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsSuccessForegroundDimmedContentPressed,
            KozmosColorsDark.componentsSecondaryButtonsSuccessForegroundDimmedContentPressed
        )

    val componentsSecondaryButtonsSuccessForegroundDimmedContentFocus: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsSuccessForegroundDimmedContentFocus,
            KozmosColorsDark.componentsSecondaryButtonsSuccessForegroundDimmedContentFocus
        )

    val componentsSecondaryButtonsDangerButtonBackgroundIdle: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsDangerButtonBackgroundIdle,
            KozmosColorsDark.componentsSecondaryButtonsDangerButtonBackgroundIdle
        )

    val componentsSecondaryButtonsDangerButtonBackgroundDisabled: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsDangerButtonBackgroundDisabled,
            KozmosColorsDark.componentsSecondaryButtonsDangerButtonBackgroundDisabled
        )

    val componentsSecondaryButtonsDangerButtonBackgroundHover: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsDangerButtonBackgroundHover,
            KozmosColorsDark.componentsSecondaryButtonsDangerButtonBackgroundHover
        )

    val componentsSecondaryButtonsDangerButtonBackgroundPressed: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsDangerButtonBackgroundPressed,
            KozmosColorsDark.componentsSecondaryButtonsDangerButtonBackgroundPressed
        )

    val componentsSecondaryButtonsDangerButtonBackgroundFocus: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsDangerButtonBackgroundFocus,
            KozmosColorsDark.componentsSecondaryButtonsDangerButtonBackgroundFocus
        )

    val componentsSecondaryButtonsDangerButtonForegroundContentIdle: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsDangerButtonForegroundContentIdle,
            KozmosColorsDark.componentsSecondaryButtonsDangerButtonForegroundContentIdle
        )

    val componentsSecondaryButtonsDangerButtonForegroundContentDisabled: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsDangerButtonForegroundContentDisabled,
            KozmosColorsDark.componentsSecondaryButtonsDangerButtonForegroundContentDisabled
        )

    val componentsSecondaryButtonsDangerButtonForegroundContentHover: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsDangerButtonForegroundContentHover,
            KozmosColorsDark.componentsSecondaryButtonsDangerButtonForegroundContentHover
        )

    val componentsSecondaryButtonsDangerButtonForegroundContentPressed: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsDangerButtonForegroundContentPressed,
            KozmosColorsDark.componentsSecondaryButtonsDangerButtonForegroundContentPressed
        )

    val componentsSecondaryButtonsDangerButtonForegroundContentFocus: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsDangerButtonForegroundContentFocus,
            KozmosColorsDark.componentsSecondaryButtonsDangerButtonForegroundContentFocus
        )

    val componentsSecondaryButtonsDangerForegroundDimmedContentIdle: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsDangerForegroundDimmedContentIdle,
            KozmosColorsDark.componentsSecondaryButtonsDangerForegroundDimmedContentIdle
        )

    val componentsSecondaryButtonsDangerForegroundDimmedContentDisabled: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsDangerForegroundDimmedContentDisabled,
            KozmosColorsDark.componentsSecondaryButtonsDangerForegroundDimmedContentDisabled
        )

    val componentsSecondaryButtonsDangerForegroundDimmedContentHover: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsDangerForegroundDimmedContentHover,
            KozmosColorsDark.componentsSecondaryButtonsDangerForegroundDimmedContentHover
        )

    val componentsSecondaryButtonsDangerForegroundDimmedContentPressed: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsDangerForegroundDimmedContentPressed,
            KozmosColorsDark.componentsSecondaryButtonsDangerForegroundDimmedContentPressed
        )

    val componentsSecondaryButtonsDangerForegroundDimmedContentFocus: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsDangerForegroundDimmedContentFocus,
            KozmosColorsDark.componentsSecondaryButtonsDangerForegroundDimmedContentFocus
        )

    val componentsSecondaryButtonsAlertButtonBackgroundIdle: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsAlertButtonBackgroundIdle,
            KozmosColorsDark.componentsSecondaryButtonsAlertButtonBackgroundIdle
        )

    val componentsSecondaryButtonsAlertButtonBackgroundDisabled: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsAlertButtonBackgroundDisabled,
            KozmosColorsDark.componentsSecondaryButtonsAlertButtonBackgroundDisabled
        )

    val componentsSecondaryButtonsAlertButtonBackgroundHover: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsAlertButtonBackgroundHover,
            KozmosColorsDark.componentsSecondaryButtonsAlertButtonBackgroundHover
        )

    val componentsSecondaryButtonsAlertButtonBackgroundPressed: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsAlertButtonBackgroundPressed,
            KozmosColorsDark.componentsSecondaryButtonsAlertButtonBackgroundPressed
        )

    val componentsSecondaryButtonsAlertButtonBackgroundFocus: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsAlertButtonBackgroundFocus,
            KozmosColorsDark.componentsSecondaryButtonsAlertButtonBackgroundFocus
        )

    val componentsSecondaryButtonsAlertButtonForegroundContentIdle: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsAlertButtonForegroundContentIdle,
            KozmosColorsDark.componentsSecondaryButtonsAlertButtonForegroundContentIdle
        )

    val componentsSecondaryButtonsAlertButtonForegroundContentDisabled: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsAlertButtonForegroundContentDisabled,
            KozmosColorsDark.componentsSecondaryButtonsAlertButtonForegroundContentDisabled
        )

    val componentsSecondaryButtonsAlertButtonForegroundContentHover: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsAlertButtonForegroundContentHover,
            KozmosColorsDark.componentsSecondaryButtonsAlertButtonForegroundContentHover
        )

    val componentsSecondaryButtonsAlertButtonForegroundContentPressed: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsAlertButtonForegroundContentPressed,
            KozmosColorsDark.componentsSecondaryButtonsAlertButtonForegroundContentPressed
        )

    val componentsSecondaryButtonsAlertButtonForegroundContentFocus: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsAlertButtonForegroundContentFocus,
            KozmosColorsDark.componentsSecondaryButtonsAlertButtonForegroundContentFocus
        )

    val componentsSecondaryButtonsAlertForegroundDimmedContentIdle: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsAlertForegroundDimmedContentIdle,
            KozmosColorsDark.componentsSecondaryButtonsAlertForegroundDimmedContentIdle
        )

    val componentsSecondaryButtonsAlertForegroundDimmedContentDisabled: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsAlertForegroundDimmedContentDisabled,
            KozmosColorsDark.componentsSecondaryButtonsAlertForegroundDimmedContentDisabled
        )

    val componentsSecondaryButtonsAlertForegroundDimmedContentHover: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsAlertForegroundDimmedContentHover,
            KozmosColorsDark.componentsSecondaryButtonsAlertForegroundDimmedContentHover
        )

    val componentsSecondaryButtonsAlertForegroundDimmedContentPressed: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsAlertForegroundDimmedContentPressed,
            KozmosColorsDark.componentsSecondaryButtonsAlertForegroundDimmedContentPressed
        )

    val componentsSecondaryButtonsAlertForegroundDimmedContentFocus: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsAlertForegroundDimmedContentFocus,
            KozmosColorsDark.componentsSecondaryButtonsAlertForegroundDimmedContentFocus
        )

    val componentsSecondaryButtonsInformativeButtonBackgroundIdle: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsInformativeButtonBackgroundIdle,
            KozmosColorsDark.componentsSecondaryButtonsInformativeButtonBackgroundIdle
        )

    val componentsSecondaryButtonsInformativeButtonBackgroundDisabled: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsInformativeButtonBackgroundDisabled,
            KozmosColorsDark.componentsSecondaryButtonsInformativeButtonBackgroundDisabled
        )

    val componentsSecondaryButtonsInformativeButtonBackgroundHover: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsInformativeButtonBackgroundHover,
            KozmosColorsDark.componentsSecondaryButtonsInformativeButtonBackgroundHover
        )

    val componentsSecondaryButtonsInformativeButtonBackgroundPressed: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsInformativeButtonBackgroundPressed,
            KozmosColorsDark.componentsSecondaryButtonsInformativeButtonBackgroundPressed
        )

    val componentsSecondaryButtonsInformativeButtonBackgroundFocus: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsInformativeButtonBackgroundFocus,
            KozmosColorsDark.componentsSecondaryButtonsInformativeButtonBackgroundFocus
        )

    val componentsSecondaryButtonsInformativeButtonForegroundContentIdle: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsInformativeButtonForegroundContentIdle,
            KozmosColorsDark.componentsSecondaryButtonsInformativeButtonForegroundContentIdle
        )

    val componentsSecondaryButtonsInformativeButtonForegroundContentDisabled: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsInformativeButtonForegroundContentDisabled,
            KozmosColorsDark.componentsSecondaryButtonsInformativeButtonForegroundContentDisabled
        )

    val componentsSecondaryButtonsInformativeButtonForegroundContentHover: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsInformativeButtonForegroundContentHover,
            KozmosColorsDark.componentsSecondaryButtonsInformativeButtonForegroundContentHover
        )

    val componentsSecondaryButtonsInformativeButtonForegroundContentPressed: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsInformativeButtonForegroundContentPressed,
            KozmosColorsDark.componentsSecondaryButtonsInformativeButtonForegroundContentPressed
        )

    val componentsSecondaryButtonsInformativeButtonForegroundContentFocus: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsInformativeButtonForegroundContentFocus,
            KozmosColorsDark.componentsSecondaryButtonsInformativeButtonForegroundContentFocus
        )

    val componentsSecondaryButtonsInformativeForegroundDimmedContentIdle: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsInformativeForegroundDimmedContentIdle,
            KozmosColorsDark.componentsSecondaryButtonsInformativeForegroundDimmedContentIdle
        )

    val componentsSecondaryButtonsInformativeForegroundDimmedContentDisabled: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsInformativeForegroundDimmedContentDisabled,
            KozmosColorsDark.componentsSecondaryButtonsInformativeForegroundDimmedContentDisabled
        )

    val componentsSecondaryButtonsInformativeForegroundDimmedContentHover: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsInformativeForegroundDimmedContentHover,
            KozmosColorsDark.componentsSecondaryButtonsInformativeForegroundDimmedContentHover
        )

    val componentsSecondaryButtonsInformativeForegroundDimmedContentPressed: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsInformativeForegroundDimmedContentPressed,
            KozmosColorsDark.componentsSecondaryButtonsInformativeForegroundDimmedContentPressed
        )

    val componentsSecondaryButtonsInformativeForegroundDimmedContentFocus: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsInformativeForegroundDimmedContentFocus,
            KozmosColorsDark.componentsSecondaryButtonsInformativeForegroundDimmedContentFocus
        )

    val componentsSecondaryButtonsNeutralButtonBackgroundIdle: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsNeutralButtonBackgroundIdle,
            KozmosColorsDark.componentsSecondaryButtonsNeutralButtonBackgroundIdle
        )

    val componentsSecondaryButtonsNeutralButtonBackgroundDisabled: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsNeutralButtonBackgroundDisabled,
            KozmosColorsDark.componentsSecondaryButtonsNeutralButtonBackgroundDisabled
        )

    val componentsSecondaryButtonsNeutralButtonBackgroundHover: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsNeutralButtonBackgroundHover,
            KozmosColorsDark.componentsSecondaryButtonsNeutralButtonBackgroundHover
        )

    val componentsSecondaryButtonsNeutralButtonBackgroundPressed: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsNeutralButtonBackgroundPressed,
            KozmosColorsDark.componentsSecondaryButtonsNeutralButtonBackgroundPressed
        )

    val componentsSecondaryButtonsNeutralButtonBackgroundFocus: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsNeutralButtonBackgroundFocus,
            KozmosColorsDark.componentsSecondaryButtonsNeutralButtonBackgroundFocus
        )

    val componentsSecondaryButtonsNeutralButtonForegroundContentIdle: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsNeutralButtonForegroundContentIdle,
            KozmosColorsDark.componentsSecondaryButtonsNeutralButtonForegroundContentIdle
        )

    val componentsSecondaryButtonsNeutralButtonForegroundContentDisabled: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsNeutralButtonForegroundContentDisabled,
            KozmosColorsDark.componentsSecondaryButtonsNeutralButtonForegroundContentDisabled
        )

    val componentsSecondaryButtonsNeutralButtonForegroundContentHover: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsNeutralButtonForegroundContentHover,
            KozmosColorsDark.componentsSecondaryButtonsNeutralButtonForegroundContentHover
        )

    val componentsSecondaryButtonsNeutralButtonForegroundContentPressed: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsNeutralButtonForegroundContentPressed,
            KozmosColorsDark.componentsSecondaryButtonsNeutralButtonForegroundContentPressed
        )

    val componentsSecondaryButtonsNeutralButtonForegroundContentFocus: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsNeutralButtonForegroundContentFocus,
            KozmosColorsDark.componentsSecondaryButtonsNeutralButtonForegroundContentFocus
        )

    val componentsSecondaryButtonsNeutralForegroundDimmedContentIdle: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsNeutralForegroundDimmedContentIdle,
            KozmosColorsDark.componentsSecondaryButtonsNeutralForegroundDimmedContentIdle
        )

    val componentsSecondaryButtonsNeutralForegroundDimmedContentDisabled: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsNeutralForegroundDimmedContentDisabled,
            KozmosColorsDark.componentsSecondaryButtonsNeutralForegroundDimmedContentDisabled
        )

    val componentsSecondaryButtonsNeutralForegroundDimmedContentHover: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsNeutralForegroundDimmedContentHover,
            KozmosColorsDark.componentsSecondaryButtonsNeutralForegroundDimmedContentHover
        )

    val componentsSecondaryButtonsNeutralForegroundDimmedContentPressed: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsNeutralForegroundDimmedContentPressed,
            KozmosColorsDark.componentsSecondaryButtonsNeutralForegroundDimmedContentPressed
        )

    val componentsSecondaryButtonsNeutralForegroundDimmedContentFocus: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsSecondaryButtonsNeutralForegroundDimmedContentFocus,
            KozmosColorsDark.componentsSecondaryButtonsNeutralForegroundDimmedContentFocus
        )

    val componentsTertiaryButtonsThemedButtonBackgroundIdle: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsThemedButtonBackgroundIdle,
            KozmosColorsDark.componentsTertiaryButtonsThemedButtonBackgroundIdle
        )

    val componentsTertiaryButtonsThemedButtonBackgroundDisabled: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsThemedButtonBackgroundDisabled,
            KozmosColorsDark.componentsTertiaryButtonsThemedButtonBackgroundDisabled
        )

    val componentsTertiaryButtonsThemedButtonBackgroundHover: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsThemedButtonBackgroundHover,
            KozmosColorsDark.componentsTertiaryButtonsThemedButtonBackgroundHover
        )

    val componentsTertiaryButtonsThemedButtonBackgroundPressed: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsThemedButtonBackgroundPressed,
            KozmosColorsDark.componentsTertiaryButtonsThemedButtonBackgroundPressed
        )

    val componentsTertiaryButtonsThemedButtonBackgroundFocus: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsThemedButtonBackgroundFocus,
            KozmosColorsDark.componentsTertiaryButtonsThemedButtonBackgroundFocus
        )

    val componentsTertiaryButtonsThemedButtonForegroundContentIdle: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsThemedButtonForegroundContentIdle,
            KozmosColorsDark.componentsTertiaryButtonsThemedButtonForegroundContentIdle
        )

    val componentsTertiaryButtonsThemedButtonForegroundContentDisabled: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsThemedButtonForegroundContentDisabled,
            KozmosColorsDark.componentsTertiaryButtonsThemedButtonForegroundContentDisabled
        )

    val componentsTertiaryButtonsThemedButtonForegroundContentHover: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsThemedButtonForegroundContentHover,
            KozmosColorsDark.componentsTertiaryButtonsThemedButtonForegroundContentHover
        )

    val componentsTertiaryButtonsThemedButtonForegroundContentPressed: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsThemedButtonForegroundContentPressed,
            KozmosColorsDark.componentsTertiaryButtonsThemedButtonForegroundContentPressed
        )

    val componentsTertiaryButtonsThemedButtonForegroundContentFocus: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsThemedButtonForegroundContentFocus,
            KozmosColorsDark.componentsTertiaryButtonsThemedButtonForegroundContentFocus
        )

    val componentsTertiaryButtonsThemedForegroundDimmedContentIdle: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsThemedForegroundDimmedContentIdle,
            KozmosColorsDark.componentsTertiaryButtonsThemedForegroundDimmedContentIdle
        )

    val componentsTertiaryButtonsThemedForegroundDimmedContentDisabled: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsThemedForegroundDimmedContentDisabled,
            KozmosColorsDark.componentsTertiaryButtonsThemedForegroundDimmedContentDisabled
        )

    val componentsTertiaryButtonsThemedForegroundDimmedContentHover: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsThemedForegroundDimmedContentHover,
            KozmosColorsDark.componentsTertiaryButtonsThemedForegroundDimmedContentHover
        )

    val componentsTertiaryButtonsThemedForegroundDimmedContentPressed: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsThemedForegroundDimmedContentPressed,
            KozmosColorsDark.componentsTertiaryButtonsThemedForegroundDimmedContentPressed
        )

    val componentsTertiaryButtonsThemedForegroundDimmedContentFocus: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsThemedForegroundDimmedContentFocus,
            KozmosColorsDark.componentsTertiaryButtonsThemedForegroundDimmedContentFocus
        )

    val componentsTertiaryButtonsSuccessButtonBackgroundIdle: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsSuccessButtonBackgroundIdle,
            KozmosColorsDark.componentsTertiaryButtonsSuccessButtonBackgroundIdle
        )

    val componentsTertiaryButtonsSuccessButtonBackgroundDisabled: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsSuccessButtonBackgroundDisabled,
            KozmosColorsDark.componentsTertiaryButtonsSuccessButtonBackgroundDisabled
        )

    val componentsTertiaryButtonsSuccessButtonBackgroundHover: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsSuccessButtonBackgroundHover,
            KozmosColorsDark.componentsTertiaryButtonsSuccessButtonBackgroundHover
        )

    val componentsTertiaryButtonsSuccessButtonBackgroundPressed: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsSuccessButtonBackgroundPressed,
            KozmosColorsDark.componentsTertiaryButtonsSuccessButtonBackgroundPressed
        )

    val componentsTertiaryButtonsSuccessButtonBackgroundFocus: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsSuccessButtonBackgroundFocus,
            KozmosColorsDark.componentsTertiaryButtonsSuccessButtonBackgroundFocus
        )

    val componentsTertiaryButtonsSuccessButtonForegroundContentIdle: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsSuccessButtonForegroundContentIdle,
            KozmosColorsDark.componentsTertiaryButtonsSuccessButtonForegroundContentIdle
        )

    val componentsTertiaryButtonsSuccessButtonForegroundContentDisabled: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsSuccessButtonForegroundContentDisabled,
            KozmosColorsDark.componentsTertiaryButtonsSuccessButtonForegroundContentDisabled
        )

    val componentsTertiaryButtonsSuccessButtonForegroundContentHover: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsSuccessButtonForegroundContentHover,
            KozmosColorsDark.componentsTertiaryButtonsSuccessButtonForegroundContentHover
        )

    val componentsTertiaryButtonsSuccessButtonForegroundContentPressed: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsSuccessButtonForegroundContentPressed,
            KozmosColorsDark.componentsTertiaryButtonsSuccessButtonForegroundContentPressed
        )

    val componentsTertiaryButtonsSuccessButtonForegroundContentFocus: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsSuccessButtonForegroundContentFocus,
            KozmosColorsDark.componentsTertiaryButtonsSuccessButtonForegroundContentFocus
        )

    val componentsTertiaryButtonsSuccessForegroundDimmedContentIdle: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsSuccessForegroundDimmedContentIdle,
            KozmosColorsDark.componentsTertiaryButtonsSuccessForegroundDimmedContentIdle
        )

    val componentsTertiaryButtonsSuccessForegroundDimmedContentDisabled: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsSuccessForegroundDimmedContentDisabled,
            KozmosColorsDark.componentsTertiaryButtonsSuccessForegroundDimmedContentDisabled
        )

    val componentsTertiaryButtonsSuccessForegroundDimmedContentHover: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsSuccessForegroundDimmedContentHover,
            KozmosColorsDark.componentsTertiaryButtonsSuccessForegroundDimmedContentHover
        )

    val componentsTertiaryButtonsSuccessForegroundDimmedContentPressed: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsSuccessForegroundDimmedContentPressed,
            KozmosColorsDark.componentsTertiaryButtonsSuccessForegroundDimmedContentPressed
        )

    val componentsTertiaryButtonsSuccessForegroundDimmedContentFocus: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsSuccessForegroundDimmedContentFocus,
            KozmosColorsDark.componentsTertiaryButtonsSuccessForegroundDimmedContentFocus
        )

    val componentsTertiaryButtonsDangerButtonBackgroundIdle: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsDangerButtonBackgroundIdle,
            KozmosColorsDark.componentsTertiaryButtonsDangerButtonBackgroundIdle
        )

    val componentsTertiaryButtonsDangerButtonBackgroundDisabled: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsDangerButtonBackgroundDisabled,
            KozmosColorsDark.componentsTertiaryButtonsDangerButtonBackgroundDisabled
        )

    val componentsTertiaryButtonsDangerButtonBackgroundHover: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsDangerButtonBackgroundHover,
            KozmosColorsDark.componentsTertiaryButtonsDangerButtonBackgroundHover
        )

    val componentsTertiaryButtonsDangerButtonBackgroundPressed: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsDangerButtonBackgroundPressed,
            KozmosColorsDark.componentsTertiaryButtonsDangerButtonBackgroundPressed
        )

    val componentsTertiaryButtonsDangerButtonBackgroundFocus: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsDangerButtonBackgroundFocus,
            KozmosColorsDark.componentsTertiaryButtonsDangerButtonBackgroundFocus
        )

    val componentsTertiaryButtonsDangerButtonForegroundContentIdle: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsDangerButtonForegroundContentIdle,
            KozmosColorsDark.componentsTertiaryButtonsDangerButtonForegroundContentIdle
        )

    val componentsTertiaryButtonsDangerButtonForegroundContentDisabled: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsDangerButtonForegroundContentDisabled,
            KozmosColorsDark.componentsTertiaryButtonsDangerButtonForegroundContentDisabled
        )

    val componentsTertiaryButtonsDangerButtonForegroundContentHover: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsDangerButtonForegroundContentHover,
            KozmosColorsDark.componentsTertiaryButtonsDangerButtonForegroundContentHover
        )

    val componentsTertiaryButtonsDangerButtonForegroundContentPressed: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsDangerButtonForegroundContentPressed,
            KozmosColorsDark.componentsTertiaryButtonsDangerButtonForegroundContentPressed
        )

    val componentsTertiaryButtonsDangerButtonForegroundContentFocus: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsDangerButtonForegroundContentFocus,
            KozmosColorsDark.componentsTertiaryButtonsDangerButtonForegroundContentFocus
        )

    val componentsTertiaryButtonsDangerForegroundDimmedContentIdle: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsDangerForegroundDimmedContentIdle,
            KozmosColorsDark.componentsTertiaryButtonsDangerForegroundDimmedContentIdle
        )

    val componentsTertiaryButtonsDangerForegroundDimmedContentDisabled: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsDangerForegroundDimmedContentDisabled,
            KozmosColorsDark.componentsTertiaryButtonsDangerForegroundDimmedContentDisabled
        )

    val componentsTertiaryButtonsDangerForegroundDimmedContentHover: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsDangerForegroundDimmedContentHover,
            KozmosColorsDark.componentsTertiaryButtonsDangerForegroundDimmedContentHover
        )

    val componentsTertiaryButtonsDangerForegroundDimmedContentPressed: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsDangerForegroundDimmedContentPressed,
            KozmosColorsDark.componentsTertiaryButtonsDangerForegroundDimmedContentPressed
        )

    val componentsTertiaryButtonsDangerForegroundDimmedContentFocus: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsDangerForegroundDimmedContentFocus,
            KozmosColorsDark.componentsTertiaryButtonsDangerForegroundDimmedContentFocus
        )

    val componentsTertiaryButtonsAlertButtonBackgroundIdle: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsAlertButtonBackgroundIdle,
            KozmosColorsDark.componentsTertiaryButtonsAlertButtonBackgroundIdle
        )

    val componentsTertiaryButtonsAlertButtonBackgroundDisabled: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsAlertButtonBackgroundDisabled,
            KozmosColorsDark.componentsTertiaryButtonsAlertButtonBackgroundDisabled
        )

    val componentsTertiaryButtonsAlertButtonBackgroundHover: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsAlertButtonBackgroundHover,
            KozmosColorsDark.componentsTertiaryButtonsAlertButtonBackgroundHover
        )

    val componentsTertiaryButtonsAlertButtonBackgroundPressed: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsAlertButtonBackgroundPressed,
            KozmosColorsDark.componentsTertiaryButtonsAlertButtonBackgroundPressed
        )

    val componentsTertiaryButtonsAlertButtonBackgroundFocus: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsAlertButtonBackgroundFocus,
            KozmosColorsDark.componentsTertiaryButtonsAlertButtonBackgroundFocus
        )

    val componentsTertiaryButtonsAlertButtonForegroundContentIdle: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsAlertButtonForegroundContentIdle,
            KozmosColorsDark.componentsTertiaryButtonsAlertButtonForegroundContentIdle
        )

    val componentsTertiaryButtonsAlertButtonForegroundContentDisabled: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsAlertButtonForegroundContentDisabled,
            KozmosColorsDark.componentsTertiaryButtonsAlertButtonForegroundContentDisabled
        )

    val componentsTertiaryButtonsAlertButtonForegroundContentHover: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsAlertButtonForegroundContentHover,
            KozmosColorsDark.componentsTertiaryButtonsAlertButtonForegroundContentHover
        )

    val componentsTertiaryButtonsAlertButtonForegroundContentPressed: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsAlertButtonForegroundContentPressed,
            KozmosColorsDark.componentsTertiaryButtonsAlertButtonForegroundContentPressed
        )

    val componentsTertiaryButtonsAlertButtonForegroundContentFocus: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsAlertButtonForegroundContentFocus,
            KozmosColorsDark.componentsTertiaryButtonsAlertButtonForegroundContentFocus
        )

    val componentsTertiaryButtonsAlertForegroundDimmedContentIdle: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsAlertForegroundDimmedContentIdle,
            KozmosColorsDark.componentsTertiaryButtonsAlertForegroundDimmedContentIdle
        )

    val componentsTertiaryButtonsAlertForegroundDimmedContentDisabled: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsAlertForegroundDimmedContentDisabled,
            KozmosColorsDark.componentsTertiaryButtonsAlertForegroundDimmedContentDisabled
        )

    val componentsTertiaryButtonsAlertForegroundDimmedContentHover: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsAlertForegroundDimmedContentHover,
            KozmosColorsDark.componentsTertiaryButtonsAlertForegroundDimmedContentHover
        )

    val componentsTertiaryButtonsAlertForegroundDimmedContentPressed: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsAlertForegroundDimmedContentPressed,
            KozmosColorsDark.componentsTertiaryButtonsAlertForegroundDimmedContentPressed
        )

    val componentsTertiaryButtonsAlertForegroundDimmedContentFocus: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsAlertForegroundDimmedContentFocus,
            KozmosColorsDark.componentsTertiaryButtonsAlertForegroundDimmedContentFocus
        )

    val componentsTertiaryButtonsInformativeButtonBackgroundIdle: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsInformativeButtonBackgroundIdle,
            KozmosColorsDark.componentsTertiaryButtonsInformativeButtonBackgroundIdle
        )

    val componentsTertiaryButtonsInformativeButtonBackgroundDisabled: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsInformativeButtonBackgroundDisabled,
            KozmosColorsDark.componentsTertiaryButtonsInformativeButtonBackgroundDisabled
        )

    val componentsTertiaryButtonsInformativeButtonBackgroundHover: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsInformativeButtonBackgroundHover,
            KozmosColorsDark.componentsTertiaryButtonsInformativeButtonBackgroundHover
        )

    val componentsTertiaryButtonsInformativeButtonBackgroundPressed: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsInformativeButtonBackgroundPressed,
            KozmosColorsDark.componentsTertiaryButtonsInformativeButtonBackgroundPressed
        )

    val componentsTertiaryButtonsInformativeButtonBackgroundFocus: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsInformativeButtonBackgroundFocus,
            KozmosColorsDark.componentsTertiaryButtonsInformativeButtonBackgroundFocus
        )

    val componentsTertiaryButtonsInformativeButtonForegroundContentIdle: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsInformativeButtonForegroundContentIdle,
            KozmosColorsDark.componentsTertiaryButtonsInformativeButtonForegroundContentIdle
        )

    val componentsTertiaryButtonsInformativeButtonForegroundContentDisabled: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsInformativeButtonForegroundContentDisabled,
            KozmosColorsDark.componentsTertiaryButtonsInformativeButtonForegroundContentDisabled
        )

    val componentsTertiaryButtonsInformativeButtonForegroundContentHover: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsInformativeButtonForegroundContentHover,
            KozmosColorsDark.componentsTertiaryButtonsInformativeButtonForegroundContentHover
        )

    val componentsTertiaryButtonsInformativeButtonForegroundContentPressed: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsInformativeButtonForegroundContentPressed,
            KozmosColorsDark.componentsTertiaryButtonsInformativeButtonForegroundContentPressed
        )

    val componentsTertiaryButtonsInformativeButtonForegroundContentFocus: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsInformativeButtonForegroundContentFocus,
            KozmosColorsDark.componentsTertiaryButtonsInformativeButtonForegroundContentFocus
        )

    val componentsTertiaryButtonsInformativeForegroundDimmedContentIdle: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsInformativeForegroundDimmedContentIdle,
            KozmosColorsDark.componentsTertiaryButtonsInformativeForegroundDimmedContentIdle
        )

    val componentsTertiaryButtonsInformativeForegroundDimmedContentDisabled: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsInformativeForegroundDimmedContentDisabled,
            KozmosColorsDark.componentsTertiaryButtonsInformativeForegroundDimmedContentDisabled
        )

    val componentsTertiaryButtonsInformativeForegroundDimmedContentHover: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsInformativeForegroundDimmedContentHover,
            KozmosColorsDark.componentsTertiaryButtonsInformativeForegroundDimmedContentHover
        )

    val componentsTertiaryButtonsInformativeForegroundDimmedContentPressed: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsInformativeForegroundDimmedContentPressed,
            KozmosColorsDark.componentsTertiaryButtonsInformativeForegroundDimmedContentPressed
        )

    val componentsTertiaryButtonsInformativeForegroundDimmedContentFocus: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsInformativeForegroundDimmedContentFocus,
            KozmosColorsDark.componentsTertiaryButtonsInformativeForegroundDimmedContentFocus
        )

    val componentsTertiaryButtonsNeutralButtonBackgroundIdle: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsNeutralButtonBackgroundIdle,
            KozmosColorsDark.componentsTertiaryButtonsNeutralButtonBackgroundIdle
        )

    val componentsTertiaryButtonsNeutralButtonBackgroundDisabled: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsNeutralButtonBackgroundDisabled,
            KozmosColorsDark.componentsTertiaryButtonsNeutralButtonBackgroundDisabled
        )

    val componentsTertiaryButtonsNeutralButtonBackgroundHover: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsNeutralButtonBackgroundHover,
            KozmosColorsDark.componentsTertiaryButtonsNeutralButtonBackgroundHover
        )

    val componentsTertiaryButtonsNeutralButtonBackgroundPressed: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsNeutralButtonBackgroundPressed,
            KozmosColorsDark.componentsTertiaryButtonsNeutralButtonBackgroundPressed
        )

    val componentsTertiaryButtonsNeutralButtonBackgroundFocus: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsNeutralButtonBackgroundFocus,
            KozmosColorsDark.componentsTertiaryButtonsNeutralButtonBackgroundFocus
        )

    val componentsTertiaryButtonsNeutralButtonForegroundContentIdle: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsNeutralButtonForegroundContentIdle,
            KozmosColorsDark.componentsTertiaryButtonsNeutralButtonForegroundContentIdle
        )

    val componentsTertiaryButtonsNeutralButtonForegroundContentDisabled: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsNeutralButtonForegroundContentDisabled,
            KozmosColorsDark.componentsTertiaryButtonsNeutralButtonForegroundContentDisabled
        )

    val componentsTertiaryButtonsNeutralButtonForegroundContentHover: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsNeutralButtonForegroundContentHover,
            KozmosColorsDark.componentsTertiaryButtonsNeutralButtonForegroundContentHover
        )

    val componentsTertiaryButtonsNeutralButtonForegroundContentPressed: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsNeutralButtonForegroundContentPressed,
            KozmosColorsDark.componentsTertiaryButtonsNeutralButtonForegroundContentPressed
        )

    val componentsTertiaryButtonsNeutralButtonForegroundContentFocus: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsNeutralButtonForegroundContentFocus,
            KozmosColorsDark.componentsTertiaryButtonsNeutralButtonForegroundContentFocus
        )

    val componentsTertiaryButtonsNeutralForegroundDimmedContentIdle: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsNeutralForegroundDimmedContentIdle,
            KozmosColorsDark.componentsTertiaryButtonsNeutralForegroundDimmedContentIdle
        )

    val componentsTertiaryButtonsNeutralForegroundDimmedContentDisabled: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsNeutralForegroundDimmedContentDisabled,
            KozmosColorsDark.componentsTertiaryButtonsNeutralForegroundDimmedContentDisabled
        )

    val componentsTertiaryButtonsNeutralForegroundDimmedContentHover: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsNeutralForegroundDimmedContentHover,
            KozmosColorsDark.componentsTertiaryButtonsNeutralForegroundDimmedContentHover
        )

    val componentsTertiaryButtonsNeutralForegroundDimmedContentPressed: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsNeutralForegroundDimmedContentPressed,
            KozmosColorsDark.componentsTertiaryButtonsNeutralForegroundDimmedContentPressed
        )

    val componentsTertiaryButtonsNeutralForegroundDimmedContentFocus: Color
        @Composable @ReadOnlyComposable get() = themed(
            KozmosColors.componentsTertiaryButtonsNeutralForegroundDimmedContentFocus,
            KozmosColorsDark.componentsTertiaryButtonsNeutralForegroundDimmedContentFocus
        )
}
