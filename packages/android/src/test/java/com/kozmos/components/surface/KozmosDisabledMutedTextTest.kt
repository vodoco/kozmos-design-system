package com.kozmos.components.surface

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.platform.ViewRootForTest
import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.dp
import com.kozmos.components.DrawnPixels
import com.kozmos.components.KeptFrames
import com.kozmos.components.daterangepicker.KozmosDateRangePicker
import com.kozmos.components.daterangepicker.KozmosDateRangeValue
import com.kozmos.components.drawn
import com.kozmos.components.label.KozmosLabel
import com.kozmos.components.listbox.KozmosListbox
import com.kozmos.components.listbox.KozmosListboxOption
import com.kozmos.components.pixelsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import java.time.LocalDate
import kotlin.math.abs
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * A disabled part's muted sub-text is never darker than its own disabled text.
 * Disabled text is foreground/500; the muted colour became foreground/400,
 * one step darker, so a disabled listbox option's description and a disabled
 * label's optional text stood out from the dimmed words beside them. React
 * keeps a disabled row's words one colour: owned-selection.css draws a
 * disabled option `text-muted-foreground opacity-60`, the colour its
 * description already has. A disabled date range's "to" was one too; the
 * range is now one text in the dates' colour, held to it below.
 *
 * Each part is drawn disabled, in light and in dark, on the page at twice the
 * density; each text's colour is the darkest pixel in light (the lightest in
 * dark) inside the box TalkBack is told it is in, and the sub-text may be no
 * nearer the ink than the disabled text, within 3 a channel.
 */
class KozmosDisabledMutedTextTest {
    private val frames = KeptFrames()

    @get:Rule
    val paparazzi = pixelsPaparazzi(frames)

    private var root = IntSize.Zero
    private var texts: List<Pair<String, Rect>> = emptyList()

    private fun SemanticsNode.texts(into: MutableList<Pair<String, Rect>> = mutableListOf()): List<Pair<String, Rect>> {
        config.getOrNull(SemanticsProperties.Text)?.let { text -> into += text.joinToString { it.text } to boundsInRoot }
        children.forEach { it.texts(into) }
        return into
    }

    private fun drawn(dark: Boolean, content: @Composable () -> Unit): DrawnPixels = paparazzi.drawn(frames) {
        val view = LocalView.current
        val density = LocalDensity.current
        CompositionLocalProvider(
            LocalKozmosUseDarkTokens provides dark,
            LocalDensity provides Density(density.density * 2f, density.fontScale)
        ) {
            KozmosMaterialTheme {
                Box(
                    Modifier
                        .fillMaxSize()
                        .background(KozmosThemeTokens.primitivesColorsBackground0)
                        .onGloballyPositioned {
                            root = it.size
                            texts = (view as ViewRootForTest).semanticsOwner.unmergedRootSemanticsNode.texts()
                        }
                        .padding(16.dp)
                ) { content() }
            }
        }
    }

    /** The pixel inside [box] (root pixels) furthest from the page: the text's ink. */
    private fun ink(drawn: DrawnPixels, box: Rect, dark: Boolean): Int? {
        val scale = drawn.width.toFloat() / root.width
        var found: Int? = null
        var furthest = -1
        val page = if (dark) 0 else 3 * 255
        val xs = (box.left * scale).toInt().coerceAtLeast(0)..(box.right * scale).toInt().coerceAtMost(drawn.width - 1)
        val ys = (box.top * scale).toInt().coerceAtLeast(0)..(box.bottom * scale).toInt().coerceAtMost(drawn.height - 1)
        for (y in ys) for (x in xs) {
            val argb = drawn.argb(x, y)
            if (argb ushr 24 <= 240) continue
            val distance = abs(DrawnPixels.lightness(argb) - page)
            if (distance > furthest) { furthest = distance; found = argb }
        }
        return found
    }

    private class Case(
        val name: String,
        val content: @Composable () -> Unit,
        /** The disabled text's box and the sub-text's, from the laid-out texts. */
        val boxes: (List<Pair<String, Rect>>) -> Pair<Rect?, Rect?>
    )

    private fun box(texts: List<Pair<String, Rect>>, text: String) = texts.firstOrNull { it.first == text }?.second

    private val cases = listOf(
        Case("Listbox's disabled option and its description", {
            KozmosListbox(options = listOf(KozmosListboxOption("gate", "Gate 12", "Terminal 2", disabled = true)))
        }) { box(it, "Gate 12") to box(it, "Terminal 2") },
        Case("Label disabled, and its optional text", {
            KozmosLabel(text = "Name", optionalText = "Optional", enabled = false)
        }) { box(it, "Name") to box(it, "Optional") }
    )

    @Test
    fun aDisabledPartsMutedSubTextIsNeverDarkerThanItsDisabledText() {
        val wrong = mutableListOf<String>()
        for (dark in listOf(false, true)) {
            val theme = if (dark) "dark" else "light"
            for (case in cases) {
                val drawn = drawn(dark, case.content)
                val (disabledBox, subBox) = case.boxes(texts)
                if (disabledBox == null || subBox == null) {
                    wrong += "${case.name}, $theme: not laid out (${texts.map { it.first }})"
                    continue
                }
                val disabled = ink(drawn, disabledBox, dark)
                val sub = ink(drawn, subBox, dark)
                if (disabled == null || sub == null) {
                    wrong += "${case.name}, $theme: nothing drawn"
                    continue
                }
                // Distance from the page: more is nearer the ink.
                val page = if (dark) 0 else 3 * 255
                val disabledDepth = abs(DrawnPixels.lightness(disabled) - page)
                val subDepth = abs(DrawnPixels.lightness(sub) - page)
                println("Disabled muted Android, ${case.name}, $theme: disabled text ${DrawnPixels.hex(disabled)}, sub-text ${DrawnPixels.hex(sub)}")
                if (subDepth > disabledDepth + 9) {
                    wrong += "${case.name}, $theme: the sub-text ${DrawnPixels.hex(sub)} stands out more than the disabled text ${DrawnPixels.hex(disabled)}"
                }
            }
        }
        assertTrue(wrong.joinToString("; "), wrong.isEmpty())
    }

    /**
     * The date range's preview is one text, the range joined by a dash, in
     * the dates' colour: foreground/0, and disabled foreground/500, as its
     * disabled dates are. The muted "to" that stood between the dates is
     * gone, so no word in it is muted. Its colour is the pixel furthest from
     * the page inside the box TalkBack is told it is in, held to the token
     * within 10 a channel; foreground/400 is 23 to 28 a channel from 500.
     */
    @Test
    fun aDateRangesSummaryIsTheDatesColourEnabledAndDisabled() {
        val wrong = mutableListOf<String>()
        for (dark in listOf(false, true)) {
            for (enabled in listOf(true, false)) {
                var token = 0
                val drawn = drawn(dark) {
                    token = if (enabled) {
                        KozmosThemeTokens.primitivesColorsForeground0.toArgb()
                    } else {
                        KozmosThemeTokens.primitivesColorsForeground500.toArgb()
                    }
                    KozmosDateRangePicker(
                        value = KozmosDateRangeValue(LocalDate.of(2026, 1, 25), LocalDate.of(2026, 1, 29)),
                        onValueChange = {},
                        enabled = enabled,
                        expanded = true
                    )
                }
                val name = "DateRangePicker${if (enabled) "" else " disabled"}'s summary, ${if (dark) "dark" else "light"}"
                val step = if (enabled) "foreground/0" else "foreground/500"
                val box = texts.firstOrNull { it.first.contains(" \u2013 ") }?.second
                if (box == null) {
                    wrong += "$name: not laid out (${texts.map { it.first }})"
                    continue
                }
                val ink = ink(drawn, box, dark)
                println("Disabled muted Android, $name: ${ink?.let(DrawnPixels::hex) ?: "nothing"}, $step ${DrawnPixels.hex(token)}")
                if (ink == null || !DrawnPixels.matches(ink, token, tolerance = 10)) {
                    wrong += "$name: drew ${ink?.let(DrawnPixels::hex) ?: "nothing"}, not $step ${DrawnPixels.hex(token)}"
                }
            }
        }
        assertTrue(wrong.joinToString("; "), wrong.isEmpty())
    }
}
