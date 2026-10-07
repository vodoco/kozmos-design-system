package com.kozmos.components.theme

import android.content.res.Configuration
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.selection.LocalTextSelectionColors
import androidx.compose.foundation.text.selection.TextSelectionColors
import androidx.compose.material3.ColorScheme
import androidx.compose.material3.DrawerValue
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.rememberDrawerState
import androidx.compose.material3.surfaceColorAtElevation
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.kozmos.components.DrawnPixels
import com.kozmos.components.KeptFrames
import com.kozmos.components.LiveSemantics
import com.kozmos.components.checkbox.KozmosCheckbox
import com.kozmos.components.datepicker.KozmosDatePicker
import com.kozmos.components.drawer.KozmosDrawer
import com.kozmos.components.drawn
import com.kozmos.components.live
import com.kozmos.components.pixelsPaparazzi
import com.kozmos.components.themeprovider.KozmosThemeProvider
import com.kozmos.tokens.KozmosThemeTokens
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * Material's colour roles inside `KozmosThemeProvider` are Kozmos's, in both
 * themes (owner ruling, 2026-10-07). The provider passed Material's stock
 * `lightColorScheme()` and `darkColorScheme()`, so whatever a component left
 * to Material drew Material's baseline: purple text-selection handles and
 * highlights in every field, the date and time pickers' purple focus border
 * and label, a purple-tinted surface under menus, sheets and drawers, and
 * labels in `#1C1B1F` / `#E6E1E5` where Kozmos's ink is foreground/100.
 *
 * The roles are read from the provider itself, then what reaches the screen
 * is read off the pixels: a date field focused and at rest, a checkbox's
 * label, and an open drawer's sheet. The colours are written out, light then
 * dark, with the token each one is.
 */
class KozmosMaterialSchemeTest {
    private val frames = KeptFrames()

    @get:Rule
    val paparazzi = pixelsPaparazzi(frames)

    private fun mode(dark: Boolean) = if (dark) "dark" else "light"

    // Kozmos's colours, light then dark.
    private fun theme600(dark: Boolean) = if (dark) 0xFF5887F3.toInt() else 0xFF1051E8.toInt()
    private fun page(dark: Boolean) = if (dark) 0xFF000000.toInt() else 0xFFFFFFFF.toInt()
    private fun foreground100(dark: Boolean) = if (dark) 0xFFE8E6E3.toInt() else 0xFF17191C.toInt()
    private fun foreground400(dark: Boolean) = if (dark) 0xFFA29D90.toInt() else 0xFF5D626F.toInt()
    private fun borderInput(dark: Boolean) = if (dark) 0xFF8B8474.toInt() else 0xFF747B8B.toInt()

    // Material 3's baseline, which Kozmos must never draw: primary, outline,
    // onSurfaceVariant and onSurface, light then dark.
    private fun materialPrimary(dark: Boolean) = if (dark) 0xFFD0BCFF.toInt() else 0xFF6750A4.toInt()
    private fun materialOutline(dark: Boolean) = if (dark) 0xFF938F99.toInt() else 0xFF79747E.toInt()
    private fun materialOnSurfaceVariant(dark: Boolean) = if (dark) 0xFFCAC4D0.toInt() else 0xFF49454F.toInt()
    private fun materialOnSurface(dark: Boolean) = if (dark) 0xFFE6E1E5.toInt() else 0xFF1C1B1F.toInt()

    /** One Material role: the Kozmos token it is, and that token's colour in each theme. */
    private class Role(val name: String, val token: String, val light: Long, val dark: Long, val read: (ColorScheme) -> Color)

    private val roles = listOf(
        Role("primary", "primitivesColorsTheme600", 0xFF1051E8, 0xFF5887F3) { it.primary },
        Role("onPrimary", "primitivesColorsForeground1000", 0xFFFFFFFF, 0xFF000000) { it.onPrimary },
        Role("primaryContainer", "semanticsEmotionThemedSurface", 0xFFCAD9FC, 0xFF082975) { it.primaryContainer },
        Role("onPrimaryContainer", "semanticsEmotionThemedOnsurface", 0xFF082975, 0xFFCAD9FC) { it.onPrimaryContainer },
        Role("inversePrimary", "primitivesColorsTheme400", 0xFF5887F3, 0xFF1051E8) { it.inversePrimary },
        Role("secondary", "primitivesColorsTheme700", 0xFF0D44C2, 0xFF7EA2F6) { it.secondary },
        Role("onSecondary", "primitivesColorsForeground1000", 0xFFFFFFFF, 0xFF000000) { it.onSecondary },
        Role("secondaryContainer", "primitivesColorsTheme100", 0xFFCAD9FC, 0xFF082975) { it.secondaryContainer },
        Role("onSecondaryContainer", "primitivesColorsTheme900", 0xFF082975, 0xFFCAD9FC) { it.onSecondaryContainer },
        Role("tertiary", "primitivesColorsTheme800", 0xFF0B369C, 0xFFA4BEF9) { it.tertiary },
        Role("onTertiary", "primitivesColorsForeground1000", 0xFFFFFFFF, 0xFF000000) { it.onTertiary },
        Role("tertiaryContainer", "primitivesColorsTheme200", 0xFFA4BEF9, 0xFF0B369C) { it.tertiaryContainer },
        Role("onTertiaryContainer", "primitivesColorsTheme1000", 0xFF051C4F, 0xFFF1F5FE) { it.onTertiaryContainer },
        Role("background", "primitivesColorsBackground0", 0xFFFFFFFF, 0xFF000000) { it.background },
        Role("onBackground", "primitivesColorsForeground100", 0xFF17191C, 0xFFE8E6E3) { it.onBackground },
        Role("surface", "primitivesColorsBackground0", 0xFFFFFFFF, 0xFF000000) { it.surface },
        Role("onSurface", "primitivesColorsForeground100", 0xFF17191C, 0xFFE8E6E3) { it.onSurface },
        Role("surfaceVariant", "semanticsSurface200", 0xFFE9ECEF, 0xFF2E3138) { it.surfaceVariant },
        Role("onSurfaceVariant", "primitivesColorsForeground400", 0xFF5D626F, 0xFFA29D90) { it.onSurfaceVariant },
        Role("surfaceTint", "primitivesColorsBackground0", 0xFFFFFFFF, 0xFF000000) { it.surfaceTint },
        Role("inverseSurface", "primitivesColorsForeground100", 0xFF17191C, 0xFFE8E6E3) { it.inverseSurface },
        Role("inverseOnSurface", "primitivesColorsBackground0", 0xFFFFFFFF, 0xFF000000) { it.inverseOnSurface },
        Role("error", "primitivesColorsEmotionalDanger600", 0xFFD41C42, 0xFFE95A77) { it.error },
        Role("onError", "primitivesColorsForeground1000", 0xFFFFFFFF, 0xFF000000) { it.onError },
        Role("errorContainer", "semanticsEmotionDangerSurface", 0xFFF8C6D0, 0xFF670E20) { it.errorContainer },
        Role("onErrorContainer", "semanticsEmotionDangerOnsurface", 0xFF670E20, 0xFFF8C6D0) { it.onErrorContainer },
        Role("outline", "semanticsBorderInput", 0xFF747B8B, 0xFF8B8474) { it.outline },
        Role("outlineVariant", "semanticsBorderSubtle", 0xFFC7CAD1, 0xFF2E3138) { it.outlineVariant },
        Role("scrim", "semanticsOverlayScrim", 0x80000000, 0x80000000) { it.scrim }
    )

    /**
     * [content] inside `KozmosThemeProvider`, the system set to [dark]: the
     * provider follows the system unless an app picks a mode, so this is the
     * theme a device in dark mode gets.
     */
    @Composable
    private fun InTheProvider(dark: Boolean, content: @Composable () -> Unit) {
        val configuration = Configuration(LocalConfiguration.current).apply {
            uiMode = (uiMode and Configuration.UI_MODE_NIGHT_MASK.inv()) or
                if (dark) Configuration.UI_MODE_NIGHT_YES else Configuration.UI_MODE_NIGHT_NO
        }
        CompositionLocalProvider(LocalConfiguration provides configuration) {
            KozmosThemeProvider(content)
        }
    }

    /** [content] at twice the density on the page, inside the provider. */
    @Composable
    private fun OnThePage(dark: Boolean, content: @Composable () -> Unit) {
        val density = LocalDensity.current
        CompositionLocalProvider(LocalDensity provides Density(density.density * 2f, density.fontScale)) {
            InTheProvider(dark) {
                Box(
                    Modifier
                        .fillMaxSize()
                        .background(KozmosThemeTokens.primitivesColorsBackground0)
                        .padding(16.dp)
                ) { content() }
            }
        }
    }

    /** What is drawn once [script] has run against [content] and the frames after it have settled. */
    private fun drawnAfter(content: @Composable () -> Unit, script: suspend LiveSemantics.() -> Unit): DrawnPixels {
        frames.last = null
        paparazzi.live(durationMillis = 1000, content = content, script = script)
        return DrawnPixels(checkNotNull(frames.last) { "nothing was drawn" })
    }

    private fun DrawnPixels.count(colour: Int, tolerance: Int): Int {
        var found = 0
        for (y in 0 until height) for (x in 0 until width) if (DrawnPixels.matches(argb(x, y), colour, tolerance)) found++
        return found
    }

    private fun hex(argb: Long) = "#%08X".format(argb)
    private fun hex(colour: Color) = "#%08X".format(colour.toArgb().toLong() and 0xFFFFFFFFL)

    // The roles.

    /** What the provider hands its content in the [dark] or light theme. */
    private class Provided(
        val scheme: ColorScheme,
        val selection: TextSelectionColors,
        val lifted: List<Pair<Dp, Color>>,
        val tokensDark: Boolean
    )

    private fun provided(dark: Boolean): Provided {
        var read: Provided? = null
        paparazzi.drawn(frames) {
            InTheProvider(dark) {
                read = Provided(
                    scheme = MaterialTheme.colorScheme,
                    selection = LocalTextSelectionColors.current,
                    // A bottom sheet's surface is lifted 1dp, a menu's 3dp, a
                    // dialog's 6dp: Material tints each with surfaceTint by
                    // its height.
                    lifted = listOf(1.dp, 3.dp, 6.dp).map { it to MaterialTheme.colorScheme.surfaceColorAtElevation(it) },
                    tokensDark = KozmosThemeTokens.isDark
                )
            }
        }
        return checkNotNull(read) { "the provider's content was never composed" }.also {
            assertEquals("the provider reads the ${mode(dark)} tokens", dark, it.tokensDark)
        }
    }

    @Test
    fun materialsRolesAreKozmosTokensInLight() = rolesIn(dark = false)

    @Test
    fun materialsRolesAreKozmosTokensInDark() = rolesIn(dark = true)

    private fun rolesIn(dark: Boolean) {
        val scheme = provided(dark).scheme
        val wrong = roles.mapNotNull { role ->
            val expected = if (dark) role.dark else role.light
            val actual = role.read(scheme)
            if ((actual.toArgb().toLong() and 0xFFFFFFFFL) == expected) null
            else "${role.name} is ${hex(actual)}, not ${role.token} ${hex(expected)}"
        }
        assertEquals("Material's roles in ${mode(dark)}", emptyList<String>(), wrong)
    }

    @Test
    fun aLiftedSurfaceIsUntintedInLight() = liftedSurfacesIn(dark = false)

    @Test
    fun aLiftedSurfaceIsUntintedInDark() = liftedSurfacesIn(dark = true)

    private fun liftedSurfacesIn(dark: Boolean) {
        val surface = page(dark).toLong() and 0xFFFFFFFFL
        val tinted = provided(dark).lifted
            .filter { (_, colour) -> (colour.toArgb().toLong() and 0xFFFFFFFFL) != surface }
            .map { (height, colour) -> "at $height the surface is ${hex(colour)}" }
        assertEquals("a lifted surface is background/0 ${hex(surface)} in ${mode(dark)}, untinted", emptyList<String>(), tinted)
    }

    @Test
    fun textSelectionIsTheme600InLight() = selectionIn(dark = false)

    @Test
    fun textSelectionIsTheme600InDark() = selectionIn(dark = true)

    private fun selectionIn(dark: Boolean) {
        // Selected text, foreground/100 on the highlight over the page, reads
        // 9.01:1 in light (on #9FB9F6) and 9.52:1 in dark (on #233661).
        val colours = provided(dark).selection
        val handle = theme600(dark).toLong() and 0xFFFFFFFFL
        val highlight = Color(theme600(dark)).copy(alpha = 0.4f).toArgb().toLong() and 0xFFFFFFFFL
        assertEquals("the selection handle in ${mode(dark)} is theme 600", hex(handle), hex(colours.handleColor))
        assertEquals("the selection highlight in ${mode(dark)} is theme 600 at 40%", hex(highlight), hex(colours.backgroundColor))
    }

    // A date field: the pickers' OutlinedTextField sets no colours of its own.

    @Test
    fun aFocusedDateFieldDrawsTheme600InLight() = focusedDateFieldIn(dark = false)

    @Test
    fun aFocusedDateFieldDrawsTheme600InDark() = focusedDateFieldIn(dark = true)

    private fun focusedDateFieldIn(dark: Boolean) {
        val drawn = drawnAfter(
            content = { OnThePage(dark) { KozmosDatePicker(date = null, onDateSelected = {}, label = "Date") } }
        ) {
            // The text field, first; the clickable overlay over it comes after.
            val field = read().unmerged.first { it.requestFocus != null }
            assertTrue("the date field takes focus", field.requestFocus!!.invoke())
            frames(4)
            assertEquals("the date field is focused", true, read().unmerged.first { it.requestFocus != null }.focused)
        }
        val purple = drawn.count(materialPrimary(dark), tolerance = 12)
        val ring = drawn.count(theme600(dark), tolerance = 3)
        // A stray anti-aliased pixel is not the colour drawn: renderers differ
        // at edges (CI's Linux drew one where a Mac drew none), so Material's
        // colour may be up to 1% of Kozmos's. The stock scheme drew thousands
        // of it and none of Kozmos's.
        assertTrue(
            "a focused date field's border and label in ${mode(dark)}: $ring pixels of theme 600 ${DrawnPixels.hex(theme600(dark))}, " +
                "$purple of Material's primary ${DrawnPixels.hex(materialPrimary(dark))}",
            ring > 200 && purple * 100 <= ring
        )
    }

    @Test
    fun aDateFieldAtRestDrawsKozmosGreysInLight() = dateFieldAtRestIn(dark = false)

    @Test
    fun aDateFieldAtRestDrawsKozmosGreysInDark() = dateFieldAtRestIn(dark = true)

    private fun dateFieldAtRestIn(dark: Boolean) {
        val drawn = paparazzi.drawn(frames) {
            OnThePage(dark) { KozmosDatePicker(date = null, onDateSelected = {}, label = "Date") }
        }
        val materialEdge = drawn.count(materialOutline(dark), tolerance = 2)
        val materialMuted = drawn.count(materialOnSurfaceVariant(dark), tolerance = 2)
        val edge = drawn.count(borderInput(dark), tolerance = 2)
        val muted = drawn.count(foreground400(dark), tolerance = 2)
        // Material's colours may be up to 1% of Kozmos's: edge anti-aliasing.
        assertTrue(
            "a resting date field's edge in ${mode(dark)}: $edge pixels of the input border ${DrawnPixels.hex(borderInput(dark))}, " +
                "$materialEdge of Material's outline ${DrawnPixels.hex(materialOutline(dark))}",
            edge > 200 && materialEdge * 100 <= edge
        )
        assertTrue(
            "a resting date field's label and icon in ${mode(dark)}: $muted pixels of foreground/400 ${DrawnPixels.hex(foreground400(dark))}, " +
                "$materialMuted of Material's onSurfaceVariant ${DrawnPixels.hex(materialOnSurfaceVariant(dark))}",
            muted > 20 && materialMuted * 100 <= muted
        )
    }

    // A checkbox's label is Material's onSurface.

    @Test
    fun aCheckboxLabelIsForeground100InLight() = checkboxLabelIn(dark = false)

    @Test
    fun aCheckboxLabelIsForeground100InDark() = checkboxLabelIn(dark = true)

    private fun checkboxLabelIn(dark: Boolean) {
        val drawn = paparazzi.drawn(frames) {
            OnThePage(dark) { KozmosCheckbox(checked = false, onCheckedChange = {}, label = "Keep me posted") }
        }
        val material = drawn.count(materialOnSurface(dark), tolerance = 1)
        val ink = drawn.count(foreground100(dark), tolerance = 1)
        // Material's ink may be up to 1% of Kozmos's: edge anti-aliasing.
        assertTrue(
            "a checkbox label in ${mode(dark)}: $ink pixels of foreground/100 ${DrawnPixels.hex(foreground100(dark))}, " +
                "$material of Material's onSurface ${DrawnPixels.hex(materialOnSurface(dark))}",
            ink > 20 && material * 100 <= ink
        )
    }

    // An open drawer's sheet is the page, not Material's tinted surface.

    @Test
    fun anOpenDrawersSheetIsThePageInLight() = drawerSheetIn(dark = false)

    @Test
    fun anOpenDrawersSheetIsThePageInDark() = drawerSheetIn(dark = true)

    private fun drawerSheetIn(dark: Boolean) {
        val drawn = paparazzi.drawn(frames) {
            InTheProvider(dark) {
                KozmosDrawer(
                    drawerContent = { Text("Levels", Modifier.padding(16.dp)) },
                    drawerState = rememberDrawerState(DrawerValue.Open)
                ) {
                    Box(Modifier.fillMaxSize().background(KozmosThemeTokens.primitivesColorsBackground0))
                }
            }
        }
        // Low on the sheet's start side, clear of its words and its corners.
        val x = drawn.width / 10
        val y = drawn.height * 7 / 10
        val sheet = drawn.argb(x, y)
        assertTrue(
            "the open drawer's sheet at ($x, $y) is background/0 ${DrawnPixels.hex(page(dark))} in ${mode(dark)}, not ${DrawnPixels.hex(sheet)}",
            DrawnPixels.matches(sheet, page(dark), tolerance = 1)
        )
    }
}
