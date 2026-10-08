package com.kozmos.components.themeprovider

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.text.selection.LocalTextSelectionColors
import androidx.compose.foundation.text.selection.TextSelectionColors
import androidx.compose.material3.ColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.KozmosTypography
import com.kozmos.tokens.LocalKozmosUseDarkTokens

enum class KozmosThemeMode {
    LIGHT, DARK, SYSTEM
}

class KozmosThemeManager(initialMode: KozmosThemeMode = KozmosThemeMode.SYSTEM) {
    var mode by mutableStateOf(initialMode)

    fun setThemeMode(newMode: KozmosThemeMode) {
        mode = newMode
    }
}

val LocalThemeManager = compositionLocalOf<KozmosThemeManager> {
    error("No KozmosThemeManager provided")
}

@Composable
fun KozmosThemeProvider(
    content: @Composable () -> Unit
) {
    val themeManager = remember { KozmosThemeManager() }
    val isSystemDark = isSystemInDarkTheme()

    val useDarkTheme = when (themeManager.mode) {
        KozmosThemeMode.SYSTEM -> isSystemDark
        KozmosThemeMode.LIGHT -> false
        KozmosThemeMode.DARK -> true
    }

    CompositionLocalProvider(
        LocalThemeManager provides themeManager,
        LocalKozmosUseDarkTokens provides useDarkTheme
    ) {
        KozmosMaterialTheme(
            // The theme carried colours only, so the font family was whatever
            // Material defaulted to. It is the same font today; the difference
            // is that it is now a decision with an address.
            typography = KozmosTypography.typography(),
            content = content
        )
    }
}

/**
 * Material's theme in Kozmos's colours, for the theme the composition reads
 * (`LocalKozmosUseDarkTokens`, else the system's): `KozmosThemeProvider` draws
 * its content in it, and a test that draws a part in one theme draws it in
 * this, so it draws what an app does.
 *
 * Whatever a component leaves to Material reads these roles: a field's focus
 * border, label and cursor, a menu's, sheet's or drawer's surface, a label's
 * ink, a divider. The stock `lightColorScheme()` and `darkColorScheme()` drew
 * Material's baseline there, purple and purple-tinted greys (owner ruling,
 * 2026-10-07).
 *
 * Selected text is highlighted in theme 600 at 40% with theme 600 handles, as
 * Material derives them from `primary`, but said here rather than left to
 * that derivation. Foreground/100 on the highlight over the page reads 9.01:1
 * in light (on `#9FB9F6`) and 9.52:1 in dark (on `#233661`).
 */
@Composable
internal fun KozmosMaterialTheme(
    typography: Typography = MaterialTheme.typography,
    content: @Composable () -> Unit
) {
    val handle = KozmosThemeTokens.primitivesColorsTheme600
    val selection = remember(handle) {
        TextSelectionColors(handleColor = handle, backgroundColor = handle.copy(alpha = 0.4f))
    }
    MaterialTheme(colorScheme = kozmosColorScheme(), typography = typography) {
        CompositionLocalProvider(LocalTextSelectionColors provides selection, content = content)
    }
}

/**
 * Every Material 3 colour role as a Kozmos token, as React's Tailwind roles
 * name them where it has one (`primary`, `background`, `foreground`, `muted`,
 * `border`, `input`, `destructive`), and from the theme ramp where Material
 * has a role React does not. Each pair reads at 4.5:1 or more in both themes;
 * the lowest is `onSurfaceVariant` on `surfaceVariant` in dark, 4.81:1.
 *
 * - `primary` is theme 600, the theme as text, an edge or a ring on a
 *   surface (React's `primary` and `ring`); `onPrimary` is React's
 *   `primary-foreground`, white in light and black in dark. Theme 500, the
 *   fill (decision 59), stays the parts' own: no Material role carries it.
 * - `secondary` and `tertiary` are theme 700 and 800 with the same
 *   foreground, and the containers theme 100 and 200 under 900 and 1000:
 *   the theme ramp throughout, so no Material role is purple. The ramp turns
 *   over with the theme, so each is the same step in dark.
 * - `inversePrimary` is theme 400, which is the other theme's 600: the
 *   theme as it reads on `inverseSurface`, foreground/100.
 * - `surface` and `background` are background/0, and `surfaceTint` is the
 *   surface itself, so a lifted surface (a menu, a sheet, a drawer) is never
 *   tinted; `surfaceVariant` is surface/200. `onSurface` and `onBackground`
 *   are foreground/100, the ink Kozmos's labels and headings use;
 *   `onSurfaceVariant` is React's `muted-foreground`, foreground/400.
 * - `outline` is the input border (React's `input`), `outlineVariant` the
 *   subtle border (React's `border`).
 * - `error` and `onError` are React's `destructive` and its foreground;
 *   `errorContainer` and `onErrorContainer` the danger emotion's surface
 *   and its ink.
 * - `scrim` is Kozmos's scrim; Material's sheets and drawers replace its
 *   alpha with their own 32%.
 *
 * Built over the stock scheme for the theme, so a role a later Material adds
 * starts in the right theme; map it here when Material is upgraded.
 */
@Composable
@ReadOnlyComposable
internal fun kozmosColorScheme(): ColorScheme {
    val stock = if (KozmosThemeTokens.isDark) darkColorScheme() else lightColorScheme()
    return stock.copy(
        primary = KozmosThemeTokens.primitivesColorsTheme600,
        onPrimary = KozmosThemeTokens.primitivesColorsForeground1000,
        primaryContainer = KozmosThemeTokens.semanticsEmotionThemedSurface,
        onPrimaryContainer = KozmosThemeTokens.semanticsEmotionThemedOnsurface,
        inversePrimary = KozmosThemeTokens.primitivesColorsTheme400,
        secondary = KozmosThemeTokens.primitivesColorsTheme700,
        onSecondary = KozmosThemeTokens.primitivesColorsForeground1000,
        secondaryContainer = KozmosThemeTokens.primitivesColorsTheme100,
        onSecondaryContainer = KozmosThemeTokens.primitivesColorsTheme900,
        tertiary = KozmosThemeTokens.primitivesColorsTheme800,
        onTertiary = KozmosThemeTokens.primitivesColorsForeground1000,
        tertiaryContainer = KozmosThemeTokens.primitivesColorsTheme200,
        onTertiaryContainer = KozmosThemeTokens.primitivesColorsTheme1000,
        background = KozmosThemeTokens.primitivesColorsBackground0,
        onBackground = KozmosThemeTokens.primitivesColorsForeground100,
        surface = KozmosThemeTokens.primitivesColorsBackground0,
        onSurface = KozmosThemeTokens.primitivesColorsForeground100,
        surfaceVariant = KozmosThemeTokens.semanticsSurface200,
        onSurfaceVariant = KozmosThemeTokens.primitivesColorsForeground400,
        surfaceTint = KozmosThemeTokens.primitivesColorsBackground0,
        inverseSurface = KozmosThemeTokens.primitivesColorsForeground100,
        inverseOnSurface = KozmosThemeTokens.primitivesColorsBackground0,
        error = KozmosThemeTokens.primitivesColorsEmotionalDanger600,
        onError = KozmosThemeTokens.primitivesColorsForeground1000,
        errorContainer = KozmosThemeTokens.semanticsEmotionDangerSurface,
        onErrorContainer = KozmosThemeTokens.semanticsEmotionDangerOnsurface,
        outline = KozmosThemeTokens.semanticsBorderInput,
        outlineVariant = KozmosThemeTokens.semanticsBorderSubtle,
        scrim = KozmosThemeTokens.semanticsOverlayScrim
    )
}
