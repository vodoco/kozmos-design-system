package com.kozmos.components

import android.content.ContextWrapper
import android.content.res.Configuration
import android.content.res.Resources
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.Role
import com.kozmos.components.datepicker.KozmosDatePicker
import com.kozmos.components.daterangepicker.KozmosDateRangePicker
import com.kozmos.components.daterangepicker.KozmosDateRangeValue
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.components.timepicker.KozmosTimePicker
import com.kozmos.components.timepicker.LocalKozmosClockIs24Hour
import java.time.LocalDate
import java.time.LocalTime
import java.util.Locale
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * GAP-183: React's pickers are native inputs, which write a date and a time
 * the way the reader's locale does. Compose's wrote them in fixed patterns,
 * US order in every locale: "MMM dd, yyyy" in DatePicker, "MMM d, yyyy" in
 * DateRangePicker (Locale.US), and "hh:mm a" in TimePicker, whose dialog was
 * always 12-hour. DateRangePicker also wrote fixed English of its own: "Select
 * date" in an empty field, and "Start", "to" and "End" in its preview.
 *
 * Each picker is drawn here in the app's locale, en-US and de-DE, as a
 * product sets it: the configuration the composition reads.
 */
class KozmosPickerLocaleTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    @Composable
    private fun InLocale(locale: Locale, content: @Composable () -> Unit) {
        val base = LocalContext.current
        val configuration = Configuration(base.resources.configuration).apply { setLocale(locale) }
        // As the app's context is in that locale. Layoutlib's context makes
        // no configuration context, so its resources are made here.
        @Suppress("DEPRECATION")
        val resources = Resources(base.assets, base.resources.displayMetrics, configuration)
        val context = object : ContextWrapper(base) {
            override fun getResources(): Resources = resources
        }
        CompositionLocalProvider(LocalContext provides context, LocalConfiguration provides configuration) {
            KozmosMaterialTheme { content() }
        }
    }

    /** ICU and java.time set a narrow no-break space before AM and PM; a reader sees a space. */
    private fun String.spaced() = replace(' ', ' ').replace(' ', ' ')

    private val day = LocalDate.of(2026, 5, 25)
    private val lastDay = LocalDate.of(2026, 5, 30)

    @Test fun aDateIsWrittenInTheLocalesOwnMediumStyle() {
        val shown = listOf(Locale.US, Locale.GERMANY).associateWith { locale ->
            paparazzi.readSemantics {
                InLocale(locale) { KozmosDatePicker(date = day, onDateSelected = {}, label = "Datum") }
            }.merged.filter { it.role == Role.Button }.flatMap { it.texts }
        }
        assertEquals(mapOf(Locale.US to listOf("May 25, 2026"), Locale.GERMANY to listOf("25.05.2026")), shown)
    }

    @Test fun aTimeIsWrittenInTheLocalesStyleOnTheDevicesClock() {
        // The device's 24-hour setting, which layoutlib cannot report: a US
        // phone on a 24-hour clock, a German one on a 12-hour clock.
        val shown = listOf(
            Locale.US to false, Locale.US to true, Locale.GERMANY to true, Locale.GERMANY to false
        ).map { (locale, is24Hour) ->
            paparazzi.readSemantics {
                InLocale(locale) {
                    CompositionLocalProvider(LocalKozmosClockIs24Hour provides is24Hour) {
                        KozmosTimePicker(time = LocalTime.of(21, 30), onTimeSelected = {}, label = "Zeit")
                    }
                }
            }.merged.filter { it.role == Role.Button }.flatMap { it.texts }.single().spaced()
        }
        assertEquals(listOf("9:30 PM", "21:30", "21:30", "9:30 PM"), shown)
    }

    @Test fun aRangesDatesAreWrittenInTheLocalesShortStyle() {
        val shown = listOf(Locale.US, Locale.GERMANY).associateWith { locale ->
            paparazzi.readSemantics {
                InLocale(locale) {
                    KozmosDateRangePicker(value = KozmosDateRangeValue(day, lastDay), onValueChange = {})
                }
            }.merged.filter { it.role == Role.Button }.flatMap { it.texts }
        }
        assertEquals(
            mapOf(Locale.US to listOf("5/25/26", "5/30/26"), Locale.GERMANY to listOf("25.05.26", "30.05.26")),
            shown
        )
    }

    @Test fun anEmptyRangeWritesNoEnglishOfItsOwnAndEachFieldIsNamedByItsLabel() {
        val tree = paparazzi.readSemantics {
            InLocale(Locale.GERMANY) {
                KozmosDateRangePicker(
                    value = KozmosDateRangeValue(),
                    onValueChange = {},
                    startLabel = "Anreise",
                    endLabel = "Abreise",
                    expanded = true
                )
            }
        }
        val words = tree.unmerged.flatMap { it.texts } + tree.unmerged.mapNotNull { it.description }
        assertTrue("words: $words", words.none { it in listOf("Select date", "Start", "to", "End") })
        // Each field is one control, named by the product's label.
        assertEquals(
            listOf("Anreise", "Abreise"),
            tree.merged.filter { it.role == Role.Button && it.click != null }.map { it.description }
        )
    }

    @Test fun theRangePreviewJoinsItsDatesWithADash() {
        val tree = paparazzi.readSemantics {
            InLocale(Locale.GERMANY) {
                KozmosDateRangePicker(
                    value = KozmosDateRangeValue(day, null),
                    onValueChange = {},
                    startLabel = "Anreise",
                    endLabel = "Abreise",
                    expanded = true
                )
            }
        }
        // The fields say their dates; the preview says the range, a missing
        // date by its field's label.
        val preview = tree.unmerged.flatMap { it.texts }.filter { it.contains("–") }
        assertEquals(listOf("25.05.26 – Abreise"), preview)
    }
}
