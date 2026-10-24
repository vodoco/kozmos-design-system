package com.kozmos.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.layout.boundsInRoot
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.dp
import com.kozmos.components.datepicker.KozmosDatePicker
import com.kozmos.components.input.KozmosInputStatus
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.components.timepicker.KozmosTimePicker
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import java.time.LocalDate
import java.time.LocalTime
import kotlin.math.abs
import kotlin.math.roundToInt
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * React's DatePicker and TimePicker are a field in its FieldWrapper: the
 * label above, the field, the helper text under it, with status, disabled
 * and read-only. Compose's were Material's OutlinedTextField, their label
 * floating inside the outline, with no status, helper, disabled or
 * read-only of their own. Now each is a Kozmos field, as DateRangePicker's
 * already were.
 */
class KozmosPickerFieldsTest {
    private val frames = KeptFrames()

    @get:Rule val paparazzi = pixelsPaparazzi(frames)

    private val day = LocalDate.of(2026, 5, 25)
    private val time = LocalTime.of(9, 30)

    @Test fun eachPickersFieldIsAKozmosFieldWithItsLabelAboveIt() {
        val wrong = mutableListOf<String>()
        val pickers: List<Pair<String, @Composable (Modifier) -> Unit>> = listOf(
            "date" to { modifier -> KozmosDatePicker(date = day, onDateSelected = {}, modifier = modifier, label = "Datum") },
            "time" to { modifier -> KozmosTimePicker(time = time, onTimeSelected = {}, modifier = modifier, label = "Zeit") }
        )
        for ((name, picker) in pickers) {
            var density = 1f
            var whole = Rect.Zero
            val tree = paparazzi.readSemantics {
                density = LocalDensity.current.density
                KozmosMaterialTheme {
                    Column(Modifier.width(320.dp)) { picker(Modifier.onGloballyPositioned { whole = it.boundsInRoot() }) }
                }
            }
            // The field: the largest node a tap opens the picker on. Above it,
            // inside the picker, a line of the label: at least 16dp.
            val field = tree.merged.filter { it.click != null }.maxBy { it.frame.width * it.frame.height }.frame
            val above = (field.top - whole.top) / density
            if (above < 16f) wrong += "$name: ${"%.1f".format(above)}dp of the picker above its field, so no label there"
            if (abs(field.height / density - 44f) > 0.5f) wrong += "$name: the field is ${field.height / density}dp high, not 44"
        }
        assertTrue(wrong.joinToString("; "), wrong.isEmpty())
    }

    /** Draws [content] on a magenta host, and reads the edge and the fill of its one field. */
    private fun drawnField(dark: Boolean, label: String, content: @Composable () -> Unit): Triple<Int, Int, ReadSemantics> {
        var canvas = IntSize(1, 1)
        var density = 1f
        val tree = paparazzi.readSemantics {
            val base = LocalDensity.current
            CompositionLocalProvider(
                LocalKozmosUseDarkTokens provides dark,
                // Twice the density, so a 1dp edge is pixels wide.
                LocalDensity provides Density(base.density * 2f, base.fontScale)
            ) {
                density = LocalDensity.current.density
                KozmosMaterialTheme {
                    Box(Modifier.fillMaxSize().background(Color.Magenta).onGloballyPositioned { canvas = it.size }) {
                        Column(Modifier.padding(16.dp).width(320.dp)) { content() }
                    }
                }
            }
        }
        val drawn = DrawnPixels(checkNotNull(frames.last))
        val field = tree.merged.single { it.description == label }.frame
        val scale = drawn.width.toFloat() / canvas.width
        fun at(x: Float, y: Float) = drawn.argb((x * scale).roundToInt(), (y * scale).roundToInt())
        val edge = at(field.center.x, field.top + 0.5f * density)
        val fill = at(field.left + field.width / 2, field.top + 6 * density)
        return Triple(edge, fill, tree)
    }

    @Test fun statusEdgesTheFieldAndTheHelperTextIsUnderItInBothThemes() {
        val wrong = mutableListOf<String>()
        for (dark in listOf(false, true)) {
            var danger = 0
            val (edge, _, tree) = drawnField(dark, "Datum") {
                danger = KozmosThemeTokens.primitivesColorsEmotionalDanger600.toArgb()
                KozmosDatePicker(
                    date = null,
                    onDateSelected = {},
                    label = "Datum",
                    status = KozmosInputStatus.Error,
                    helperText = "Bitte ein Datum wählen"
                )
            }
            val mode = if (dark) "dark" else "light"
            if (!DrawnPixels.matches(edge, danger, 24)) wrong += "$mode: the edge is ${DrawnPixels.hex(edge)}, not danger/600 ${DrawnPixels.hex(danger)}"
            val field = tree.merged.single { it.description == "Datum" }.frame
            val helper = tree.unmerged.firstOrNull { it.texts == listOf("Bitte ein Datum wählen") }?.frame
            if (helper == null || helper.top < field.bottom) wrong += "$mode: the helper text is not under the field ($helper)"
        }
        assertTrue(wrong.joinToString("; "), wrong.isEmpty())
    }

    /**
     * The colour [helper] is drawn in, and the swatches of foreground/400 and
     * foreground/500 in the same theme. Drawn on the page, background/0, at
     * twice the density, so a stroke covers whole pixels; the colour is the
     * opaque pixel furthest from the page inside the box TalkBack is told the
     * helper is in: where the text is solid, never an edge.
     */
    private fun helperInk(dark: Boolean, helper: String, content: @Composable () -> Unit): Triple<Int?, Int, Int> {
        var canvas = IntSize(1, 1)
        var muted = 0
        var disabled = 0
        val tree = paparazzi.readSemantics {
            val base = LocalDensity.current
            CompositionLocalProvider(
                LocalKozmosUseDarkTokens provides dark,
                LocalDensity provides Density(base.density * 2f, base.fontScale)
            ) {
                muted = KozmosThemeTokens.primitivesColorsForeground400.toArgb()
                disabled = KozmosThemeTokens.primitivesColorsForeground500.toArgb()
                KozmosMaterialTheme {
                    Box(
                        Modifier
                            .fillMaxSize()
                            .background(KozmosThemeTokens.primitivesColorsBackground0)
                            .onGloballyPositioned { canvas = it.size }
                    ) {
                        Column(Modifier.padding(16.dp).width(320.dp)) { content() }
                    }
                }
            }
        }
        val drawn = DrawnPixels(checkNotNull(frames.last))
        val box = tree.unmerged.firstOrNull { it.texts == listOf(helper) }?.frame ?: return Triple(null, muted, disabled)
        val scale = drawn.width.toFloat() / canvas.width
        // Light, the darkest pixel; dark, on black, the lightest.
        fun depth(argb: Int) = DrawnPixels.lightness(argb).let { if (dark) it else 765 - it }
        var found: Int? = null
        for (y in (box.top * scale).toInt().coerceAtLeast(0)..(box.bottom * scale).toInt().coerceAtMost(drawn.height - 1)) {
            for (x in (box.left * scale).toInt().coerceAtLeast(0)..(box.right * scale).toInt().coerceAtMost(drawn.width - 1)) {
                val argb = drawn.argb(x, y)
                if (argb ushr 24 <= 240) continue
                if (found == null || depth(argb) > depth(found)) found = argb
            }
        }
        return Triple(found, muted, disabled)
    }

    /**
     * The helper text is the muted colour, foreground/400, as React draws a
     * field's helper (`text-muted-foreground`) and KozmosFieldWrapper draws
     * its own; it was foreground/500, #747B8B in light, 4.24:1 on white.
     * Disabled, it is the disabled text's foreground/500, never darker than
     * the dimmed words beside it. Each is held to its token within 10 a
     * channel, in both themes: foreground/500 is 23 to 28 a channel from 400.
     */
    @Test fun theHelperTextIsTheMutedColourAndDisabledTheDisabledTextsInBothThemes() {
        val wrong = mutableListOf<String>()
        val helper = "Bitte ein Datum wählen"
        for (dark in listOf(false, true)) {
            for (enabled in listOf(true, false)) {
                val pickers: List<Pair<String, @Composable () -> Unit>> = listOf(
                    "KozmosDatePicker" to {
                        KozmosDatePicker(date = day, onDateSelected = {}, label = "Datum", helperText = helper, enabled = enabled)
                    },
                    "KozmosTimePicker" to {
                        KozmosTimePicker(time = time, onTimeSelected = {}, label = "Zeit", helperText = helper, enabled = enabled)
                    }
                )
                for ((name, picker) in pickers) {
                    val (ink, muted, disabled) = helperInk(dark, helper, picker)
                    val expected = if (enabled) muted else disabled
                    val step = if (enabled) "foreground/400" else "foreground/500"
                    val mode = (if (dark) "dark" else "light") + if (enabled) "" else ", disabled"
                    println("Picker helper, $name, $mode: ${ink?.let(DrawnPixels::hex) ?: "nothing"}, $step ${DrawnPixels.hex(expected)}")
                    if (ink == null || !DrawnPixels.matches(ink, expected, tolerance = 10)) {
                        wrong += "$name, $mode: the helper drew ${ink?.let(DrawnPixels::hex) ?: "nothing"}, not $step ${DrawnPixels.hex(expected)}"
                    }
                }
            }
        }
        assertTrue(wrong.joinToString("; "), wrong.isEmpty())
    }

    @Test fun readOnlyItShowsItsValueAndOpensNothingDisabledItIsReadAsDisabled() {
        var background100 = 0
        val (_, readOnlyFill, readOnly) = drawnField(dark = false, label = "Zeit") {
            background100 = KozmosThemeTokens.primitivesColorsBackground100.toArgb()
            KozmosTimePicker(time = time, onTimeSelected = {}, label = "Zeit", readOnly = true)
        }
        val shown = readOnly.merged.single { it.description == "Zeit" }
        assertEquals(
            "read-only: opens, enabled, shows its time",
            Triple(false, true, true),
            Triple(shown.click != null, shown.enabled, shown.texts.isNotEmpty())
        )
        assertTrue("read-only fill ${DrawnPixels.hex(readOnlyFill)}", DrawnPixels.matches(readOnlyFill, background100, 6))
        val (_, _, disabled) = drawnField(dark = false, label = "Zeit") {
            KozmosTimePicker(time = time, onTimeSelected = {}, label = "Zeit", enabled = false)
        }
        assertEquals("disabled: enabled", false, disabled.merged.single { it.description == "Zeit" }.enabled)
    }
}
