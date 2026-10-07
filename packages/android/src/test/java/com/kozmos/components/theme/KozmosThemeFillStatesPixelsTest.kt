package com.kozmos.components.theme

import androidx.compose.foundation.background
import androidx.compose.foundation.interaction.FocusInteraction
import androidx.compose.foundation.interaction.Interaction
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.PressInteraction
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.NearMe
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.dp
import com.kozmos.components.DrawnPixels
import com.kozmos.components.KeptFrames
import com.kozmos.components.button.KozmosButton
import com.kozmos.components.checkbox.KozmosCheckbox
import com.kozmos.components.drawn
import com.kozmos.components.floatingactionbutton.KozmosFloatingActionButton
import com.kozmos.components.iconbutton.KozmosIconButton
import com.kozmos.components.iconbutton.KozmosIconButtonVariant
import com.kozmos.components.mapcontrolbutton.KozmosMapControlButton
import com.kozmos.components.mapcontrolbutton.KozmosMapControlButtonEmphasis
import com.kozmos.components.pixelsPaparazzi
import com.kozmos.components.switch.KozmosSwitch
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import kotlinx.coroutines.awaitCancellation
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * Decision 59's theme fill as it answers, read off what is drawn in the light
 * and the dark:
 *
 * - held down, a filled control is the pressed token, #0D44C2, and focused the
 *   focus token, #1051E8, in both themes. Material's white ripple lightened
 *   #135BEC to about #2F6FEE instead, so a press drew a paler blue than the
 *   tokens' darker one;
 * - disabled or loading, a filled control keeps its fill and its foreground,
 *   the whole control at half strength, as React draws `disabled:opacity-50`.
 *   Material drew its own grey.
 *
 * The control's interaction source is held from the moment it is watched, as
 * a finger resting on it or focus resting in it. The colours are written out:
 * they are what the decision and the tokens say. Paparazzi scales its frames
 * down (paparazzi-frames-are-scaled), so the parts are drawn at twice the
 * density on the map's mid grey and found by their colour, never by dp.
 */
class KozmosThemeFillStatesPixelsTest {
    private val frames = KeptFrames()

    @get:Rule
    val paparazzi = pixelsPaparazzi(frames)

    private val grey = 0xFF808080.toInt()
    private val themeFill = 0xFF135BEC.toInt()
    private val pressedFill = 0xFF0D44C2.toInt()
    private val focusFill = 0xFF1051E8.toInt()
    private fun mode(dark: Boolean) = if (dark) "dark" else "light"

    /** Half of [colour] over half of [under]: a part at 50% on it. */
    private fun half(colour: Int, under: Int): Int {
        fun channel(shift: Int) = ((colour shr shift and 0xFF) + (under shr shift and 0xFF) + 1) / 2
        return (0xFF shl 24) or (channel(16) shl 16) or (channel(8) shl 8) or channel(0)
    }

    /** An interaction source that holds [interaction] from the moment it is watched. */
    private class Held(private val interaction: Interaction) : MutableInteractionSource {
        override val interactions: Flow<Interaction> = flow {
            emit(interaction)
            awaitCancellation()
        }
        override suspend fun emit(interaction: Interaction) {}
        override fun tryEmit(interaction: Interaction): Boolean = true
    }

    private fun draw(dark: Boolean, content: @Composable () -> Unit): DrawnPixels =
        paparazzi.drawn(frames) {
            val density = LocalDensity.current
            CompositionLocalProvider(
                LocalKozmosUseDarkTokens provides dark,
                LocalDensity provides Density(density.density * 2f, density.fontScale)
            ) {
                MaterialTheme(colorScheme = if (dark) darkColorScheme() else lightColorScheme()) {
                    Box(
                        Modifier
                            .fillMaxSize()
                            .background(Color(grey))
                            .padding(8.dp)
                    ) { content() }
                }
            }
        }

    private fun DrawnPixels.count(colour: Int, tolerance: Int): Int {
        var found = 0
        for (y in 0 until height) for (x in 0 until width) if (DrawnPixels.matches(argb(x, y), colour, tolerance)) found++
        return found
    }

    /** The filled controls, each drawn with [source] as its interaction source. */
    private val filled: List<Pair<String, @Composable (MutableInteractionSource) -> Unit>> = listOf(
        "a filled Button" to { source -> KozmosButton(onClick = {}, interactionSource = source) { Text("Go") } },
        "a default IconButton" to { source ->
            KozmosIconButton(
                icon = Icons.Default.Add,
                onClick = {},
                contentDescription = "Add",
                variant = KozmosIconButtonVariant.Default,
                interactionSource = source
            )
        },
        "a FloatingActionButton" to { source -> KozmosFloatingActionButton(onClick = {}, interactionSource = source) },
        "a filled MapControlButton on" to { source ->
            KozmosMapControlButton(
                label = "Focus",
                onClick = {},
                icon = { Icon(Icons.Default.NearMe, contentDescription = null) },
                emphasis = KozmosMapControlButtonEmphasis.Filled,
                pressed = true,
                interactionSource = source
            )
        },
    )

    private fun heldFill(dark: Boolean, name: String, part: @Composable (MutableInteractionSource) -> Unit, interaction: Interaction, expected: Int, what: String): List<String> {
        val wrong = mutableListOf<String>()
        val drawn = draw(dark) { part(Held(interaction)) }
        val at = drawn.count(expected, 2)
        val idle = drawn.count(themeFill, 2)
        println("Decision 59 Android, ${mode(dark)}: $what $name: $at pixels of ${DrawnPixels.hex(expected)}, $idle of #135BEC")
        if (at < 100) wrong += "${mode(dark)}: $what $name draws only $at pixels of ${DrawnPixels.hex(expected)}"
        if (idle > 0) wrong += "${mode(dark)}: $what $name still draws $idle pixels of #135BEC"
        return wrong
    }

    @Test
    fun aFocusedFillIsTheFocusToken() {
        val wrong = mutableListOf<String>()
        for (dark in listOf(false, true)) {
            for ((name, part) in filled) wrong += heldFill(dark, name, part, FocusInteraction.Focus(), focusFill, "focused,")
        }
        assertTrue(wrong.joinToString("\n"), wrong.isEmpty())
    }

    /**
     * One press a test: when the fills were Material's controls, a held press
     * made Material's ripple host, which took layoutlib's renderer down for
     * every later frame of the same session. The fills draw no ripple now.
     */
    private fun pressed(dark: Boolean, index: Int) {
        val (name, part) = filled[index]
        val wrong = heldFill(dark, name, part, PressInteraction.Press(Offset.Zero), pressedFill, "pressed,")
        assertTrue(wrong.joinToString("\n"), wrong.isEmpty())
    }

    @Test fun aPressedButtonIsThePressedTokenInTheLight() = pressed(dark = false, index = 0)
    @Test fun aPressedButtonIsThePressedTokenInTheDark() = pressed(dark = true, index = 0)
    @Test fun aPressedIconButtonIsThePressedTokenInTheLight() = pressed(dark = false, index = 1)
    @Test fun aPressedIconButtonIsThePressedTokenInTheDark() = pressed(dark = true, index = 1)
    @Test fun aPressedFloatingActionButtonIsThePressedTokenInTheLight() = pressed(dark = false, index = 2)
    @Test fun aPressedFloatingActionButtonIsThePressedTokenInTheDark() = pressed(dark = true, index = 2)
    @Test fun aPressedMapControlButtonIsThePressedTokenInTheLight() = pressed(dark = false, index = 3)
    @Test fun aPressedMapControlButtonIsThePressedTokenInTheDark() = pressed(dark = true, index = 3)

    /** Disabled or waiting, each filled control as it is drawn. */
    private val inert: List<Pair<String, @Composable () -> Unit>> = listOf(
        "a disabled Button" to { KozmosButton(onClick = {}, enabled = false) { Text("Go") } },
        "a loading Button" to { KozmosButton(onClick = {}, isLoading = true) { Text("Go") } },
        "a disabled default IconButton" to {
            KozmosIconButton(icon = Icons.Default.Add, onClick = {}, contentDescription = "Add", variant = KozmosIconButtonVariant.Default, enabled = false)
        },
        "a loading default IconButton" to {
            KozmosIconButton(icon = Icons.Default.Add, onClick = {}, contentDescription = "Add", variant = KozmosIconButtonVariant.Default, isLoading = true)
        },
        "a checked disabled Checkbox" to { KozmosCheckbox(checked = true, onCheckedChange = {}, enabled = false) },
        "a checked disabled Switch" to { KozmosSwitch(checked = true, onCheckedChange = {}, enabled = false) },
    )

    /**
     * The fill at half over the grey, and its white mark at half over the
     * grey too: the whole control at 50%, as React's opacity draws it, so
     * the mark is not a half-white over a half-blue.
     */
    @Test
    fun aDisabledOrLoadingFillIsTheFillAtHalf() {
        val fillAtHalf = half(themeFill, grey)
        val markAtHalf = half(0xFFFFFFFF.toInt(), grey)
        val wrong = mutableListOf<String>()
        for (dark in listOf(false, true)) {
            for ((name, part) in inert) {
                val drawn = draw(dark, part)
                val fill = drawn.count(fillAtHalf, 3)
                val mark = drawn.count(markAtHalf, 3)
                println(
                    "Decision 59 Android, ${mode(dark)}: $name: $fill pixels of ${DrawnPixels.hex(fillAtHalf)}, " +
                        "$mark of ${DrawnPixels.hex(markAtHalf)}"
                )
                if (fill < 100) wrong += "${mode(dark)}: $name draws only $fill pixels of the fill at half, ${DrawnPixels.hex(fillAtHalf)}"
                if (mark < 3) wrong += "${mode(dark)}: $name draws no white mark at half, ${DrawnPixels.hex(markAtHalf)} ($mark pixels)"
            }
        }
        assertTrue(wrong.joinToString("\n"), wrong.isEmpty())
    }
}
