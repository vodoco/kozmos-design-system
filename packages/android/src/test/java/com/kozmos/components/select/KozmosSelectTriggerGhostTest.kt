package com.kozmos.components.select

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
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
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import kotlin.math.roundToInt
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * Decision 151, CLOUD-UI-009: the map's level control is a borderless
 * Select. React's SelectTrigger takes `variant="ghost"`: no edge and no fill
 * at rest, as wide as its value and chevron, the hover fill under a pointer,
 * an error's red edge kept. Compose's KozmosSelectTrigger takes
 * `variant = KozmosSelectTriggerVariant.Ghost`.
 *
 * Read off what is drawn, at twice the density, on a magenta host: a ghost
 * draws neither fill nor edge, so the host shows through both.
 */
@OptIn(ExperimentalMaterial3Api::class)
class KozmosSelectTriggerGhostTest {
    private val frames = KeptFrames()

    @get:Rule val paparazzi = pixelsPaparazzi(frames)

    private val host = 0xFFFF00FF.toInt()

    private data class Field(val widthDp: Float, val heightDp: Float, val fill: Int, val edge: Int)

    private fun field(dark: Boolean, content: @Composable () -> Unit): Field {
        var density = 1f
        var canvas = IntSize(1, 1)
        val tree = paparazzi.readSemantics {
            val base = LocalDensity.current
            CompositionLocalProvider(
                LocalKozmosUseDarkTokens provides dark,
                LocalDensity provides Density(base.density * 2f, base.fontScale)
            ) {
                density = LocalDensity.current.density
                KozmosMaterialTheme {
                    Box(Modifier.fillMaxSize().background(Color(host)).onGloballyPositioned { canvas = it.size }) {
                        Column(Modifier.padding(16.dp).width(320.dp)) { content() }
                    }
                }
            }
        }
        val drawn = DrawnPixels(checkNotNull(frames.last))
        val bounds: Rect = tree.merged
            .filter { it.click != null || it.role == Role.DropdownList }
            .maxBy { it.frame.width * it.frame.height }
            .frame
        val scale = drawn.width.toFloat() / canvas.width
        fun at(x: Float, y: Float) = drawn.argb((x * scale).roundToInt(), (y * scale).roundToInt())
        // Clear of the words and the corners: 5dp under the top, at the middle; the edge half a dp in from the top.
        val fill = at(bounds.left + bounds.width / 2, bounds.top + 5 * density)
        val edge = at(bounds.left + bounds.width / 2, bounds.top + 0.5f * density)
        return Field(bounds.width / density, bounds.height / density, fill, edge)
    }

    private fun level(variant: KozmosSelectTriggerVariant, error: Boolean = false): @Composable () -> Unit = {
        // The Select given the whole row, as a card's level control is.
        KozmosSelect(expanded = false, onExpandedChange = {}, modifier = Modifier.fillMaxWidth(), trigger = {
            KozmosSelectTrigger(value = "Level 1", placeholder = "Level", error = error, variant = variant)
        }) {}
    }

    @Test fun aGhostTriggerDrawsNoFillAndNoEdgeAndHugsItsValueInBothThemes() {
        val wrong = mutableListOf<String>()
        for (dark in listOf(false, true)) {
            val mode = if (dark) "dark" else "light"
            val ghost = field(dark, level(KozmosSelectTriggerVariant.Ghost))
            val room = field(dark, level(KozmosSelectTriggerVariant.Default)).widthDp
            if (!DrawnPixels.matches(ghost.fill, host, 6)) wrong += "$mode: the ghost is filled ${DrawnPixels.hex(ghost.fill)}, not clear"
            if (!DrawnPixels.matches(ghost.edge, host, 6)) wrong += "$mode: the ghost is edged ${DrawnPixels.hex(ghost.edge)}, not clear"
            if (ghost.widthDp > room - 30f) wrong += "$mode: the ghost is ${ghost.widthDp}dp wide in a ${room}dp room: it does not hug \"Level 1\" and its chevron"
            if (ghost.heightDp < 43.5f) wrong += "$mode: the ghost is ${ghost.heightDp}dp high, not the field's 44"
        }
        assertTrue(wrong.joinToString("; "), wrong.isEmpty())
    }

    @Test fun theDefaultTriggerIsTheFieldItWasAndAnErrorGhostKeepsTheRedEdge() {
        val wrong = mutableListOf<String>()
        for (dark in listOf(false, true)) {
            val mode = if (dark) "dark" else "light"
            var background0 = 0
            var danger = 0
            val field = field(dark) {
                background0 = KozmosThemeTokens.primitivesColorsBackground0.toArgb()
                level(KozmosSelectTriggerVariant.Default)()
            }
            if (!DrawnPixels.matches(field.fill, background0, 6)) wrong += "$mode: the default is filled ${DrawnPixels.hex(field.fill)}, not background/0"
            // Its room: the 180dp the doubled density leaves, less the 16 either side.
            if (field.widthDp < 147.5f) wrong += "$mode: the default is ${field.widthDp}dp wide, not its 148dp room"
            val error = field(dark) {
                danger = KozmosThemeTokens.primitivesColorsEmotionalDanger600.toArgb()
                level(KozmosSelectTriggerVariant.Ghost, error = true)()
            }
            if (!DrawnPixels.matches(error.edge, danger, 24)) wrong += "$mode: an error ghost is edged ${DrawnPixels.hex(error.edge)}, not danger/600 ${DrawnPixels.hex(danger)}"
        }
        assertTrue(wrong.joinToString("; "), wrong.isEmpty())
    }

    /** Under a pointer the ghost takes the hover fill (decision 173); focused, the field's theme/600 edge. */
    @Test fun aHoveredGhostTakesTheHoverFillAndAFocusedOneTheThemeEdge() {
        val looks = mutableMapOf<String, KozmosSelectTriggerLook>()
        var hoverFill = Color.Unspecified
        var theme600 = Color.Unspecified
        paparazzi.readSemantics {
            KozmosMaterialTheme {
                hoverFill = KozmosThemeTokens.semanticsHoverFill
                theme600 = KozmosThemeTokens.primitivesColorsTheme600
                val g = KozmosSelectTriggerVariant.Ghost
                looks["rest"] = selectTriggerLook(g, Color.White, Color.Gray, focused = false, hovered = false, enabled = true, error = false)
                looks["hovered"] = selectTriggerLook(g, Color.White, Color.Gray, focused = false, hovered = true, enabled = true, error = false)
                looks["focused"] = selectTriggerLook(g, Color.White, Color.Gray, focused = true, hovered = false, enabled = true, error = false)
                looks["default hovered"] = selectTriggerLook(KozmosSelectTriggerVariant.Default, Color.White, Color.Gray, focused = false, hovered = true, enabled = true, error = false)
            }
        }
        assertEquals(Color.Transparent, looks.getValue("rest").fill)
        assertEquals(hoverFill, looks.getValue("hovered").fill)
        assertEquals(theme600, looks.getValue("focused").edge)
        assertEquals("the default field keeps its fill under a pointer", Color.White, looks.getValue("default hovered").fill)
    }
}
