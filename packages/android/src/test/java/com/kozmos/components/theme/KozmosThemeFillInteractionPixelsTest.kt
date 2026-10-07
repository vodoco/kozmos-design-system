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
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.dp
import com.kozmos.components.DrawnPixels
import com.kozmos.components.KeptFrames
import com.kozmos.components.button.KozmosButton
import com.kozmos.components.button.KozmosButtonEmotion
import com.kozmos.components.drawn
import com.kozmos.components.floatingactionbutton.KozmosFloatingActionButton
import com.kozmos.components.iconbutton.KozmosIconButton
import com.kozmos.components.iconbutton.KozmosIconButtonVariant
import com.kozmos.components.mapcontrolbutton.KozmosMapControlButton
import com.kozmos.components.mapcontrolbutton.KozmosMapControlButtonEmphasis
import com.kozmos.components.pixelsPaparazzi
import com.kozmos.components.splitbutton.KozmosSplitButton
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import kotlinx.coroutines.awaitCancellation
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.yield
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * How decision 59's filled controls answer a keyboard, a quick tap and a wait,
 * read off what is drawn (the 2026-10-07 review of the Compose fills):
 *
 * - focused, a fill draws React's ring: theme 600, 2dp, 2dp outside the
 *   control's shape with the page's colour in the gap, so focus reads against
 *   both the fill and the page. The focus token alone is 1.11:1 from the fill;
 * - a quick tap in scrolling content arrives as a press and its release in one
 *   frame; the pressed fill is still drawn;
 * - a disabled or loading MapControlButton is drawn at half, as Button is;
 * - a MapControlButton turned on from the keyboard keeps its focus colour, and
 *   a disabled or loading control ignores a press a shared source reports;
 * - every filled emotion, and both halves of a SplitButton, press to their own
 *   pressed token.
 *
 * Drawn at twice the density on the map's mid grey, as the other theme-fill
 * tests are; the colours are written out.
 */
class KozmosThemeFillInteractionPixelsTest {
    private val frames = KeptFrames()

    @get:Rule
    val paparazzi = pixelsPaparazzi(frames)

    private val grey = 0xFF808080.toInt()
    private val themeFill = 0xFF135BEC.toInt()
    private val pressedFill = 0xFF0D44C2.toInt()
    private val focusFill = 0xFF1051E8.toInt()
    private fun theme600(dark: Boolean) = if (dark) 0xFF5887F3.toInt() else 0xFF1051E8.toInt()
    private fun page(dark: Boolean) = if (dark) 0xFF000000.toInt() else 0xFFFFFFFF.toInt()
    private fun mode(dark: Boolean) = if (dark) "dark" else "light"

    private fun half(colour: Int, under: Int): Int {
        fun channel(shift: Int) = ((colour shr shift and 0xFF) + (under shr shift and 0xFF) + 1) / 2
        return (0xFF shl 24) or (channel(16) shl 16) or (channel(8) shl 8) or channel(0)
    }

    /** A source that holds [interactions] from the moment it is watched. */
    private class Held(private vararg val held: Interaction) : MutableInteractionSource {
        override val interactions: Flow<Interaction> = flow {
            held.forEach { emit(it) }
            awaitCancellation()
        }
        override suspend fun emit(interaction: Interaction) {}
        override fun tryEmit(interaction: Interaction): Boolean = true
    }

    /** A quick tap in scrolling content: the press and its release back to back. */
    private fun tapped(): MutableInteractionSource {
        val press = PressInteraction.Press(Offset.Zero)
        return Held(press, PressInteraction.Release(press))
    }

    private fun draw(dark: Boolean, content: @Composable () -> Unit): DrawnPixels =
        paparazzi.drawn(frames) {
            val density = LocalDensity.current
            CompositionLocalProvider(
                LocalKozmosUseDarkTokens provides dark,
                LocalDensity provides Density(density.density * 2f, density.fontScale)
            ) {
                KozmosMaterialTheme {
                    Box(
                        Modifier
                            .fillMaxSize()
                            .background(Color(grey))
                            .padding(24.dp)
                    ) { content() }
                }
            }
        }

    private fun DrawnPixels.count(
        colour: Int,
        tolerance: Int = 2,
        outside: Pair<IntRange, IntRange>? = null
    ): Int {
        var found = 0
        for (y in 0 until height) for (x in 0 until width) {
            if (outside != null && x in outside.first && y in outside.second) continue
            if (DrawnPixels.matches(argb(x, y), colour, tolerance)) found++
        }
        return found
    }

    private fun DrawnPixels.boundsOf(colour: Int): Pair<IntRange, IntRange>? {
        var left = Int.MAX_VALUE
        var top = Int.MAX_VALUE
        var right = -1
        var bottom = -1
        for (y in 0 until height) for (x in 0 until width) {
            if (DrawnPixels.matches(argb(x, y), colour)) {
                left = minOf(left, x); right = maxOf(right, x)
                top = minOf(top, y); bottom = maxOf(bottom, y)
            }
        }
        return if (right < 0) null else (left..right) to (top..bottom)
    }

    private val mapControl: @Composable (MutableInteractionSource) -> Unit = { source ->
        KozmosMapControlButton(
            label = "Focus",
            onClick = {},
            icon = { Icon(Icons.Default.NearMe, contentDescription = null) },
            emphasis = KozmosMapControlButtonEmphasis.Filled,
            pressed = true,
            interactionSource = source
        )
    }

    /** Each filled control, with [source] where a test drives it. */
    private val controls: List<Pair<String, @Composable (MutableInteractionSource) -> Unit>> = listOf(
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
        "a SplitButton's main half" to { source ->
            KozmosSplitButton(label = "Share", onMainClick = {}, menuItems = emptyList(), mainInteractionSource = source)
        },
        "a SplitButton's menu half" to { source ->
            KozmosSplitButton(label = "Share", onMainClick = {}, menuItems = emptyList(), menuInteractionSource = source)
        },
        "a filled MapControlButton on" to mapControl,
    )

    // 1. Focus draws React's ring.

    @Test
    fun aFocusedFillDrawsTheRingOutsideItWithThePageInTheGap() {
        val wrong = mutableListOf<String>()
        for (dark in listOf(false, true)) {
            for ((name, part) in controls) {
                val idle = draw(dark) { part(MutableInteractionSource()) }.boundsOf(themeFill)
                if (idle == null) {
                    wrong += "${mode(dark)}: $name draws no #135BEC at rest"
                    continue
                }
                val focused = draw(dark) { part(Held(FocusInteraction.Focus())) }
                val ring = focused.count(theme600(dark), outside = idle)
                val gap = focused.count(page(dark), outside = idle)
                println("Decision 59 Android, ${mode(dark)}: focused, $name: $ring ring pixels and $gap gap pixels outside it")
                if (ring < 100) wrong += "${mode(dark)}: focused, $name draws no ${DrawnPixels.hex(theme600(dark))} ring outside it ($ring pixels)"
                if (gap < 100) wrong += "${mode(dark)}: focused, $name draws no ${DrawnPixels.hex(page(dark))} gap outside it ($gap pixels)"
            }
        }
        assertTrue(wrong.joinToString("\n"), wrong.isEmpty())
    }

    // 2. A quick tap is drawn pressed. One frame a test: under the old ripple a
    // press took layoutlib's renderer down for every later frame.

    /** A SplitButton's other half stays at rest: one tap, one half. */
    private fun quickTap(index: Int, otherHalfAtRest: Boolean = false) {
        val (name, part) = controls[index]
        val drawn = draw(false) { part(tapped()) }
        val at = drawn.count(pressedFill)
        val idle = drawn.count(themeFill)
        println("Decision 59 Android, light: tapped, $name: $at pixels of #0D44C2, $idle of #135BEC")
        assertTrue(
            "tapped, $name draws only $at pixels of #0D44C2 and $idle of #135BEC",
            at >= 100 && (otherHalfAtRest || idle == 0)
        )
    }

    @Test fun aQuickTapOnAButtonIsDrawnPressed() = quickTap(0)
    @Test fun aQuickTapOnAnIconButtonIsDrawnPressed() = quickTap(1)
    @Test fun aQuickTapOnAFloatingActionButtonIsDrawnPressed() = quickTap(2)
    @Test fun aQuickTapOnASplitButtonIsDrawnPressed() = quickTap(3, otherHalfAtRest = true)
    @Test fun aQuickTapOnAMapControlButtonIsDrawnPressed() = quickTap(5)

    // 4. A disabled or loading MapControlButton is drawn at half.

    @Test
    fun aDisabledOrLoadingMapControlButtonIsDrawnAtHalf() {
        val wrong = mutableListOf<String>()
        for (dark in listOf(false, true)) {
            val cases: List<Triple<String, Int, @Composable () -> Unit>> = listOf(
                Triple("a disabled filled MapControlButton", half(themeFill, grey), @Composable {
                    KozmosMapControlButton(
                        label = "Focus", onClick = {}, icon = { Icon(Icons.Default.NearMe, contentDescription = null) },
                        emphasis = KozmosMapControlButtonEmphasis.Filled, pressed = true, enabled = false
                    )
                }),
                Triple("a loading filled MapControlButton", half(themeFill, grey), @Composable {
                    KozmosMapControlButton(
                        label = "Focus", onClick = {}, icon = { Icon(Icons.Default.NearMe, contentDescription = null) },
                        emphasis = KozmosMapControlButtonEmphasis.Filled, pressed = true, isLoading = true
                    )
                }),
                Triple("a disabled MapControlButton on the page's surface", half(page(dark), grey), @Composable {
                    KozmosMapControlButton(
                        label = "Zoom in", onClick = {}, icon = { Icon(Icons.Default.Add, contentDescription = null) },
                        enabled = false
                    )
                }),
            )
            for ((name, expected, part) in cases) {
                val at = draw(dark, part).count(expected, tolerance = 3)
                println("Decision 59 Android, ${mode(dark)}: $name: $at pixels of ${DrawnPixels.hex(expected)}")
                if (at < 100) wrong += "${mode(dark)}: $name is not drawn at half (${DrawnPixels.hex(expected)}, $at pixels)"
            }
        }
        assertTrue(wrong.joinToString("\n"), wrong.isEmpty())
    }

    // 5. Turned on from the keyboard it keeps the focus it was given; disabled
    // or waiting it ignores a press a shared source reports.

    @Test
    fun aMapControlButtonTurnedOnFromTheKeyboardKeepsItsFocusColour() {
        val wrong = mutableListOf<String>()
        for (dark in listOf(false, true)) {
            val drawn = draw(dark) {
                // A real source: what it says is heard only by who is listening.
                val source = remember { MutableInteractionSource() }
                var on by remember { mutableStateOf(false) }
                LaunchedEffect(Unit) {
                    // Let the control start listening, then focus it, then
                    // turn it on, as Tab then Enter would.
                    repeat(3) { yield() }
                    source.emit(FocusInteraction.Focus())
                    on = true
                }
                KozmosMapControlButton(
                    label = "Focus",
                    onClick = {},
                    icon = { Icon(Icons.Default.NearMe, contentDescription = null) },
                    emphasis = KozmosMapControlButtonEmphasis.Filled,
                    pressed = on,
                    interactionSource = source
                )
            }
            val focus = drawn.count(focusFill)
            val idle = drawn.count(themeFill)
            println("Decision 59 Android, ${mode(dark)}: turned on while focused: $focus pixels of #1051E8, $idle of #135BEC")
            // A stray edge pixel or two of the rest colour is anti-aliasing (one
            // drew on CI's Linux renderer and none on a Mac); the unfixed control
            // drew thousands of it and none of the state's.
            if (focus < 100 || idle * 100 > focus) {
                wrong += "${mode(dark)}: turned on while focused, the MapControlButton draws $focus pixels of #1051E8 and $idle of #135BEC"
            }
        }
        assertTrue(wrong.joinToString("\n"), wrong.isEmpty())
    }

    private fun ignoresASharedPress(name: String, part: @Composable (MutableInteractionSource) -> Unit) {
        val drawn = draw(false) { part(Held(PressInteraction.Press(Offset.Zero))) }
        val idle = drawn.count(half(themeFill, grey), tolerance = 3)
        val pressed = drawn.count(half(pressedFill, grey), tolerance = 3)
        println("Decision 59 Android, light: $name with a shared press: $idle pixels of the fill at half, $pressed of the pressed fill at half")
        assertTrue("$name with a shared press draws $idle pixels of the fill at half and $pressed of the pressed fill at half", idle >= 100 && pressed == 0)
    }

    @Test fun aDisabledButtonIgnoresASharedPress() = ignoresASharedPress("a disabled Button") { source ->
        KozmosButton(onClick = {}, enabled = false, interactionSource = source) { Text("Go") }
    }

    @Test fun aLoadingIconButtonIgnoresASharedPress() = ignoresASharedPress("a loading IconButton") { source ->
        KozmosIconButton(
            icon = Icons.Default.Add, onClick = {}, contentDescription = "Add",
            variant = KozmosIconButtonVariant.Default, isLoading = true, interactionSource = source
        )
    }

    @Test fun aDisabledMapControlButtonIgnoresASharedPress() = ignoresASharedPress("a disabled filled MapControlButton") { source ->
        KozmosMapControlButton(
            label = "Focus", onClick = {}, icon = { Icon(Icons.Default.NearMe, contentDescription = null) },
            emphasis = KozmosMapControlButtonEmphasis.Filled, pressed = true, enabled = false, interactionSource = source
        )
    }

    // 6. Every filled emotion, and both SplitButton halves, press to their own
    // token. Light and dark are written out: the emotions turn over.

    private val emotions: List<Triple<KozmosButtonEmotion, Pair<Int, Int>, Pair<Int, Int>>> = listOf(
        // emotion, (light idle, light pressed), (dark idle, dark pressed)
        Triple(KozmosButtonEmotion.Danger, 0xFFB01736.toInt() to 0xFF8C132B.toInt(), 0xFFEE7E95.toInt() to 0xFFF3A2B3.toInt()),
        Triple(KozmosButtonEmotion.Neutral, 0xFFC7CAD1.toInt() to 0xFFE3E4E8.toInt(), 0xFF464A53.toInt() to 0xFF2E3138.toInt()),
        Triple(KozmosButtonEmotion.Success, 0xFF197F4C.toInt() to 0xFF0F4C2D.toInt(), 0xFF76E4AD.toInt() to 0xFFA0ECC6.toInt()),
        Triple(KozmosButtonEmotion.Informative, 0xFF2379A4.toInt() to 0xFF1C6082.toInt(), 0xFF87C6E5.toInt() to 0xFFA9D6EC.toInt()),
        Triple(KozmosButtonEmotion.Alert, 0xFFA06B04.toInt() to 0xFF472F02.toInt(), 0xFFFCD281.toInt() to 0xFFFDE0A8.toInt()),
    )

    @Test
    fun everyFilledEmotionPressesToItsOwnPressedToken() {
        val wrong = mutableListOf<String>()
        for (dark in listOf(false, true)) {
            for ((emotion, light, night) in emotions) {
                val (idle, pressed) = if (dark) night else light
                val drawn = draw(dark) {
                    KozmosButton(onClick = {}, emotion = emotion, interactionSource = Held(PressInteraction.Press(Offset.Zero))) { Text("Go") }
                }
                val at = drawn.count(pressed)
                val rest = drawn.count(idle)
                println("Decision 59 Android, ${mode(dark)}: pressed $emotion: $at pixels of ${DrawnPixels.hex(pressed)}, $rest of ${DrawnPixels.hex(idle)}")
                // A stray edge pixel of the rest colour is anti-aliasing: CI's Linux
                // renderer drew 1 beside 21,800 pressed; the unfixed Button drew
                // ~21,800 of the rest colour and none pressed.
                if (at < 100 || rest * 100 > at) {
                    wrong += "${mode(dark)}: pressed, the $emotion Button draws $at pixels of ${DrawnPixels.hex(pressed)} and $rest of ${DrawnPixels.hex(idle)}"
                }
            }
        }
        assertTrue(wrong.joinToString("\n"), wrong.isEmpty())
    }

    @Test
    fun eachSplitButtonHalfPressesToThePressedToken() {
        val wrong = mutableListOf<String>()
        for (dark in listOf(false, true)) {
            for ((name, part) in controls.subList(3, 5)) {
                val drawn = draw(dark) { part(Held(PressInteraction.Press(Offset.Zero))) }
                val at = drawn.count(pressedFill)
                val other = drawn.count(themeFill)
                println("Decision 59 Android, ${mode(dark)}: pressed, $name: $at pixels of #0D44C2, the other half $other of #135BEC")
                // The other half stays at rest: one press, one half.
                if (at < 100 || other < 100) wrong += "${mode(dark)}: pressed, $name draws $at pixels of #0D44C2 and the other half $other of #135BEC"
            }
        }
        assertTrue(wrong.joinToString("\n"), wrong.isEmpty())
    }
}
