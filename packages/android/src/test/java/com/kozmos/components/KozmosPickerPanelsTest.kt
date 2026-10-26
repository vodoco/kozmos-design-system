package com.kozmos.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.material3.rememberDatePickerState
import androidx.compose.material3.rememberDateRangePickerState
import androidx.compose.material3.rememberTimePickerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.unit.dp
import com.kozmos.components.datepicker.KozmosDatePickerContent
import com.kozmos.components.daterangepicker.KozmosDateRangePickerContent
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.components.timepicker.KozmosTimePickerContent
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import java.time.LocalDate
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * Decision 106: Material 3's date, range and time pickers replace the
 * framework's dialogs, so Kozmos's theme colours them. The framework's
 * DatePickerDialog and TimePickerDialog took the Activity's theme, which
 * Kozmos does not set. Each dialog's content is drawn here as the dialog
 * draws it, on the dialog's container colour, in light and dark: its
 * selection is theme/600, Kozmos's primary, and nothing is Material's
 * baseline purple.
 *
 * Paparazzi draws only the root window, never a Dialog's, so the content is
 * drawn without its dialog.
 */
@OptIn(ExperimentalMaterial3Api::class)
class KozmosPickerPanelsTest {
    private val frames = KeptFrames()

    @get:Rule val paparazzi = pixelsPaparazzi(frames)

    private val day = LocalDate.of(2026, 5, 25)

    private fun DrawnPixels.count(colour: Int, tolerance: Int): Int {
        var found = 0
        for (y in 0 until height) for (x in 0 until width) if (DrawnPixels.matches(argb(x, y), colour, tolerance)) found++
        return found
    }

    /** Draws [content] on the dialogs' container, and counts Kozmos's theme/600 and Material's purples. */
    private fun colours(dark: Boolean, content: @Composable () -> Unit): String? {
        var theme600 = 0
        val drawn = paparazzi.drawn(frames) {
            CompositionLocalProvider(LocalKozmosUseDarkTokens provides dark) {
                KozmosMaterialTheme {
                    theme600 = KozmosThemeTokens.primitivesColorsTheme600.toArgb()
                    // The dialogs' container: Material's surface, which the date
                    // picker dialog's colours default to.
                    Box(Modifier.fillMaxSize().background(MaterialTheme.colorScheme.surface)) { content() }
                }
            }
        }
        val stock = if (dark) darkColorScheme() else lightColorScheme()
        val purples = listOf(stock.primary, stock.primaryContainer, stock.secondaryContainer).map { it.toArgb() }
        val ours = drawn.count(theme600, 12)
        val theirs = purples.sumOf { drawn.count(it, 6) }
        val mode = if (dark) "dark" else "light"
        // Material's colours may be up to 1% of Kozmos's: renderers differ at edges.
        return if (ours > 100 && theirs * 100 <= ours) null
        else "$mode: $ours pixels of theme/600 ${DrawnPixels.hex(theme600)}, $theirs of Material's baseline purples"
    }

    @Test fun theDatePickerIsInKozmossColoursInBothThemes() {
        val wrong = listOf(false, true).mapNotNull { dark ->
            colours(dark) {
                KozmosDatePickerContent(rememberDatePickerState(initialSelectedDateMillis = day.toPickerMillis()))
            }
        }
        assertTrue(wrong.joinToString("; "), wrong.isEmpty())
    }

    @Test fun theRangePickerIsInKozmossColoursInBothThemes() {
        val wrong = listOf(false, true).mapNotNull { dark ->
            colours(dark) {
                KozmosDateRangePickerContent(
                    rememberDateRangePickerState(
                        initialSelectedStartDateMillis = day.toPickerMillis(),
                        initialSelectedEndDateMillis = day.plusDays(5).toPickerMillis()
                    ),
                    Modifier.height(600.dp)
                )
            }
        }
        assertTrue(wrong.joinToString("; "), wrong.isEmpty())
    }

    @Test fun theTimePickerIsInKozmossColoursInBothThemes() {
        val wrong = listOf(false, true).mapNotNull { dark ->
            colours(dark) {
                Box(Modifier.width(360.dp)) {
                    KozmosTimePickerContent(rememberTimePickerState(initialHour = 21, initialMinute = 30, is24Hour = true))
                }
            }
        }
        assertTrue(wrong.joinToString("; "), wrong.isEmpty())
    }
}
