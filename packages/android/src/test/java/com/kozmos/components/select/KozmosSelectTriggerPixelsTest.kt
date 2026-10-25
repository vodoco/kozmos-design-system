package com.kozmos.components.select

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.dp
import com.kozmos.components.DrawnPixels
import com.kozmos.components.KeptFrames
import com.kozmos.components.pixelsPaparazzi
import com.kozmos.components.readSemantics
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.docsnippets.ThemeSelect
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import kotlin.math.abs
import kotlin.math.roundToInt
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * Figma's Select is its Text-Input with a caret: a 44-high field, the
 * control radius, the input border on background/0, the placeholder in
 * foreground/400, and a 16px chevron-down at its end in the same colour.
 * React's SelectTrigger is the same field. Error edges it in danger/600;
 * disabled fills it background/100. Compose had no closed field: the Select
 * page drew a read-only KozmosInput, with the read-only fill and no caret.
 *
 * Read off what is drawn, at twice the density, as KozmosThemeFillPixelsTest
 * reads the fills.
 */
@OptIn(ExperimentalMaterial3Api::class)
class KozmosSelectTriggerPixelsTest {
    private val frames = KeptFrames()

    @get:Rule val paparazzi = pixelsPaparazzi(frames)

    private val host = 0xFFFF00FF.toInt()

    /** What a field drew: its colours at the points that say what it is. */
    private data class Field(
        val heightDp: Float,
        val fill: Int,
        val edge: Int,
        /** How much of the caret's 16dp box at the end is drawn in [caretColour]. */
        val caretShare: Float,
        val caretColour: Int
    )

    /** Draws [content] at twice the density, and reads the one field in it: the node that opens the menu. */
    private fun field(dark: Boolean, content: @Composable () -> Unit): Field {
        var density = 1f
        var canvas = IntSize(1, 1)
        var caret = 0
        val tree = paparazzi.readSemantics {
            val base = LocalDensity.current
            CompositionLocalProvider(
                LocalKozmosUseDarkTokens provides dark,
                LocalDensity provides Density(base.density * 2f, base.fontScale)
            ) {
                density = LocalDensity.current.density
                caret = KozmosThemeTokens.primitivesColorsForeground400.toArgb()
                KozmosMaterialTheme {
                    Box(Modifier.fillMaxSize().background(Color(host)).onGloballyPositioned { canvas = it.size }) {
                        Column(Modifier.padding(16.dp).width(320.dp)) { content() }
                    }
                }
            }
        }
        val drawn = DrawnPixels(checkNotNull(frames.last))
        // The field: the largest node that opens the menu, or says it is a
        // drop-down list (a disabled one opens nothing).
        val bounds: Rect = tree.merged
            .filter { it.click != null || it.role == Role.DropdownList }
            .maxBy { it.frame.width * it.frame.height }
            .frame
        val scale = drawn.width.toFloat() / canvas.width
        fun at(x: Float, y: Float) = drawn.argb((x * scale).roundToInt(), (y * scale).roundToInt())
        val dp = density
        // Inside the field, clear of its words and its caret: 5dp under the top, a third of the way along.
        val fill = at(bounds.left + bounds.width / 3, bounds.top + 5 * dp)
        // The edge, half a dp in from the top, at the middle.
        val edge = at(bounds.left + bounds.width / 2, bounds.top + 0.5f * dp)
        // The caret's box: 16dp, 12dp in from the end, centred.
        var inCaret = 0
        var all = 0
        val left = bounds.right - (12 + 16) * dp
        val top = bounds.center.y - 8 * dp
        for (i in 0 until (16 * dp * scale).toInt()) for (j in 0 until (16 * dp * scale).toInt()) {
            all++
            val argb = drawn.argb(((left) * scale).roundToInt() + i, ((top) * scale).roundToInt() + j)
            if (DrawnPixels.matches(argb, caret, 40)) inCaret++
        }
        return Field(bounds.height / dp, fill, edge, inCaret.toFloat() / all, caret)
    }

    private fun near(a: Int, b: Int, tolerance: Int = 6) = DrawnPixels.matches(a, b, tolerance)

    @Test fun theSelectPagesFieldDrawsAsFigmasSelectInBothThemes() {
        val wrong = mutableListOf<String>()
        for (dark in listOf(false, true)) {
            var background0 = 0
            var borderInput = 0
            val drawn = field(dark) {
                background0 = KozmosThemeTokens.primitivesColorsBackground0.toArgb()
                borderInput = KozmosThemeTokens.semanticsBorderInput.toArgb()
                ThemeSelect(theme = "light", onThemeChange = {})
            }
            val mode = if (dark) "dark" else "light"
            if (abs(drawn.heightDp - 44f) > 0.5f) wrong += "$mode: the field is ${drawn.heightDp}dp high, not 44"
            if (!near(drawn.fill, background0)) wrong += "$mode: the field is filled ${DrawnPixels.hex(drawn.fill)}, not background/0 ${DrawnPixels.hex(background0)}"
            if (!near(drawn.edge, borderInput, 24)) wrong += "$mode: the edge is ${DrawnPixels.hex(drawn.edge)}, not the input border ${DrawnPixels.hex(borderInput)}"
            if (drawn.caretShare < 0.05f) wrong += "$mode: no caret at the end (${"%.1f".format(drawn.caretShare * 100)}% of its box in ${DrawnPixels.hex(drawn.caretColour)})"
        }
        assertTrue(wrong.joinToString("; "), wrong.isEmpty())
    }

    @Test fun anErrorTriggerIsEdgedInDangerAndADisabledOneHasTheDisabledFill() {
        val wrong = mutableListOf<String>()
        for (dark in listOf(false, true)) {
            var danger = 0
            var background100 = 0
            val mode = if (dark) "dark" else "light"
            val error = field(dark) {
                danger = KozmosThemeTokens.primitivesColorsEmotionalDanger600.toArgb()
                KozmosSelect(expanded = false, onExpandedChange = {}, trigger = {
                    KozmosSelectTrigger(value = null, placeholder = "Thema", error = true)
                }) {}
            }
            if (!near(error.edge, danger, 24)) wrong += "$mode error: the edge is ${DrawnPixels.hex(error.edge)}, not danger/600 ${DrawnPixels.hex(danger)}"
            val disabled = field(dark) {
                background100 = KozmosThemeTokens.primitivesColorsBackground100.toArgb()
                KozmosSelect(expanded = false, onExpandedChange = {}, trigger = {
                    KozmosSelectTrigger(value = null, placeholder = "Thema", enabled = false)
                }) {}
            }
            if (!near(disabled.fill, background100)) wrong += "$mode disabled: the field is filled ${DrawnPixels.hex(disabled.fill)}, not background/100 ${DrawnPixels.hex(background100)}"
        }
        assertTrue(wrong.joinToString("; "), wrong.isEmpty())
    }
}
