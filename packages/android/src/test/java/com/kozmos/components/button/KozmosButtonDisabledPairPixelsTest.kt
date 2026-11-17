package com.kozmos.components.button

import androidx.compose.foundation.background
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
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kozmos.components.DrawnPixels
import com.kozmos.components.KeptFrames
import com.kozmos.components.drawn
import com.kozmos.components.floatingactionbutton.KozmosFloatingActionButton
import com.kozmos.components.iconbutton.KozmosIconButton
import com.kozmos.components.iconbutton.KozmosIconButtonVariant
import com.kozmos.components.mapcontrolbutton.KozmosMapControlButton
import com.kozmos.components.mapcontrolbutton.KozmosMapControlButtonEmphasis
import com.kozmos.components.mapcontrolbutton.KozmosMapControlButtonPresentation
import com.kozmos.components.pixelsPaparazzi
import com.kozmos.components.splitbutton.KozmosSplitButton
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import androidx.compose.ui.graphics.toArgb
import com.kozmos.tokens.KozmosColors
import com.kozmos.tokens.KozmosColorsDark
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * Decision 197 (GAP-218): a disabled Button-family part is drawn from the
 * disabled pair, Semantics.Disabled, not at half: its label and icon in the
 * pair's foreground (foreground/400: #5D626F light, #A29D90 dark); a filled
 * variant, any emotion's fill, a ghost (the owner, round two: so it never
 * reads as an enabled grey ghost), a FloatingActionButton, both halves of a
 * SplitButton and every MapControlButton on the pair's fill (background/100:
 * #E3E4E8 light, #17191C dark); an outline or link on no fill, the outline's
 * edge in the foreground; glass on its own glass. A disabled IconButton's
 * counter is the pair inverted: the foreground's pill under the fill's digits.
 *
 * Loading is busy, not unavailable (round two): a loading part keeps its
 * variant's own fill, edge and label at full strength, its spinner in the
 * label's colour. Disabled and loading, it draws as disabled.
 *
 * Read off what is drawn, at twice the density on the map's mid grey, as the
 * theme-fill tests are; the colours are written out. Each case asks for at
 * least so many pixels of a colour: the label's glyphs and the icon's strokes
 * have fully covered pixels at this density, and the old half look drew none
 * of these colours.
 */
class KozmosButtonDisabledPairPixelsTest {
    private val frames = KeptFrames()

    @get:Rule
    val paparazzi = pixelsPaparazzi(frames)

    private val grey = 0xFF808080.toInt()
    private fun fill(dark: Boolean) = if (dark) 0xFF17191C.toInt() else 0xFFE3E4E8.toInt()
    private fun ink(dark: Boolean) = if (dark) 0xFFA29D90.toInt() else 0xFF5D626F.toInt()
    private fun mode(dark: Boolean) = if (dark) "dark" else "light"
    private val themes = listOf(false, true)
    private fun themeFill(dark: Boolean) =
        (if (dark) KozmosColorsDark.componentsPrimaryButtonsThemedButtonBackgroundIdle else KozmosColors.componentsPrimaryButtonsThemedButtonBackgroundIdle).toArgb()
    private fun onThemeFill(dark: Boolean) =
        (if (dark) KozmosColorsDark.componentsPrimaryButtonsThemedButtonForegroundContentIdle else KozmosColors.componentsPrimaryButtonsThemedButtonForegroundContentIdle).toArgb()
    private fun outlineInk(dark: Boolean) =
        (if (dark) KozmosColorsDark.componentsSecondaryButtonsThemedButtonForegroundContentIdle else KozmosColors.componentsSecondaryButtonsThemedButtonForegroundContentIdle).toArgb()
    private fun page(dark: Boolean) =
        (if (dark) KozmosColorsDark.primitivesColorsBackground0 else KozmosColors.primitivesColorsBackground0).toArgb()

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

    private fun DrawnPixels.count(colour: Int, tolerance: Int = 3): Int {
        var found = 0
        for (y in 0 until height) for (x in 0 until width) {
            if (DrawnPixels.matches(argb(x, y), colour, tolerance)) found++
        }
        return found
    }

    /** The colour drawn most, the page's grey aside: a part's ground. */
    private fun DrawnPixels.ground(): Int {
        val seen = HashMap<Int, Int>()
        for (y in 0 until height) for (x in 0 until width) {
            val c = argb(x, y) or (0xFF shl 24)
            if (!DrawnPixels.matches(c, grey, 1)) seen[c] = (seen[c] ?: 0) + 1
        }
        return seen.maxByOrNull { it.value }!!.key
    }

    /** A label the eye can count: an icon and a bold word, both in the content colour. */
    private val label: @Composable () -> Unit = {
        Icon(Icons.Default.Add, contentDescription = null)
        Text("Go", fontWeight = FontWeight.Bold, fontSize = 18.sp)
    }

    private fun button(
        variant: KozmosButtonVariant,
        emotion: KozmosButtonEmotion? = null,
        enabled: Boolean = false,
        isLoading: Boolean = false
    ): @Composable () -> Unit = {
        KozmosButton(onClick = {}, variant = variant, emotion = emotion, enabled = enabled, isLoading = isLoading) { label() }
    }

    /**
     * Each case on the pair's fill: at least 1,000 pixels of the fill and
     * [inkAtLeast] of the foreground, in the light and the dark.
     */
    private fun onTheFill(cases: List<Pair<String, @Composable () -> Unit>>, inkAtLeast: Int = 40) {
        val wrong = mutableListOf<String>()
        for (dark in themes) for ((name, part) in cases) {
            val drawn = draw(dark, part)
            val ground = drawn.count(fill(dark))
            val words = drawn.count(ink(dark))
            println("Decision 197 Android, ${mode(dark)}: $name: $ground pixels of ${DrawnPixels.hex(fill(dark))}, $words of ${DrawnPixels.hex(ink(dark))}")
            if (ground < 1000) wrong += "${mode(dark)}: $name draws $ground pixels of the disabled fill ${DrawnPixels.hex(fill(dark))}"
            if (words < inkAtLeast) wrong += "${mode(dark)}: $name draws $words pixels of the disabled foreground ${DrawnPixels.hex(ink(dark))}"
        }
        assertTrue(wrong.joinToString("\n"), wrong.isEmpty())
    }

    /**
     * Each case on no fill: at least [inkAtLeast] pixels of the foreground,
     * and the fill no more than a hundredth of them (edge anti-aliasing).
     */
    private fun onNoFill(cases: List<Pair<String, @Composable () -> Unit>>, inkAtLeast: Int = 40) {
        val wrong = mutableListOf<String>()
        for (dark in themes) for ((name, part) in cases) {
            val drawn = draw(dark, part)
            val ground = drawn.count(fill(dark))
            val words = drawn.count(ink(dark))
            println("Decision 197 Android, ${mode(dark)}: $name: $words pixels of ${DrawnPixels.hex(ink(dark))}, $ground of ${DrawnPixels.hex(fill(dark))}")
            if (words < inkAtLeast) wrong += "${mode(dark)}: $name draws $words pixels of the disabled foreground ${DrawnPixels.hex(ink(dark))}"
            if (ground * 100 > words) wrong += "${mode(dark)}: $name draws $ground pixels of the disabled fill, and has none"
        }
        assertTrue(wrong.joinToString("\n"), wrong.isEmpty())
    }

    private val filledVariants = listOf(
        KozmosButtonVariant.Default,
        KozmosButtonVariant.Destructive,
        KozmosButtonVariant.Secondary,
        KozmosButtonVariant.Subtle
    )

    // Button

    @Test
    fun aDisabledFilledButtonOfEveryVariantAndEmotionDrawsTheDisabledPair() = onTheFill(
        filledVariants.map { v -> "a disabled $v Button" to button(v) } +
            KozmosButtonEmotion.values().map { e -> "a disabled Default Button, $e" to button(KozmosButtonVariant.Default, e) } +
            KozmosButtonEmotion.values().map { e -> "a disabled Subtle Button, $e" to button(KozmosButtonVariant.Subtle, e) }
    )

    @Test
    fun aDisabledOutlineButtonDrawsItsEdgeAndLabelInTheForegroundOnNoFill() = onNoFill(
        listOf(
            "a disabled Outline Button" to button(KozmosButtonVariant.Outline),
            "a disabled Outline Button, Danger" to button(KozmosButtonVariant.Outline, KozmosButtonEmotion.Danger),
        ),
        // The edge all the way round, as well as the label.
        inkAtLeast = 400
    )

    @Test
    fun aDisabledLinkButtonDrawsTheForegroundOnNoFill() = onNoFill(
        listOf(
            "a disabled Link Button" to button(KozmosButtonVariant.Link),
            "a disabled Link Button, Success" to button(KozmosButtonVariant.Link, KozmosButtonEmotion.Success),
        )
    )

    // Round two: a disabled ghost takes the fill, so it never reads as an
    // enabled grey ghost.
    @Test
    fun aDisabledGhostButtonTakesTheDisabledFillBehindItsLabel() = onTheFill(
        listOf(
            "a disabled Ghost Button" to button(KozmosButtonVariant.Ghost),
            "a disabled Ghost Button, Success" to button(KozmosButtonVariant.Ghost, KozmosButtonEmotion.Success),
            "a disabled Ghost Button, Neutral" to button(KozmosButtonVariant.Ghost, KozmosButtonEmotion.Neutral),
        )
    )

    // Disabled and loading draws as disabled.
    @Test
    fun aDisabledAndLoadingButtonDrawsAsDisabled() {
        onTheFill(
            listOf(
                "a disabled, loading Default Button" to button(KozmosButtonVariant.Default, isLoading = true),
                "a disabled, loading Ghost Button" to button(KozmosButtonVariant.Ghost, isLoading = true),
            )
        )
        onNoFill(listOf("a disabled, loading Outline Button" to button(KozmosButtonVariant.Outline, isLoading = true)), inkAtLeast = 400)
    }

    /**
     * Loading is busy, not unavailable: each case keeps [ground] (at least
     * 1,000 pixels) and draws [ink] (at least [inkAtLeast]), and neither of
     * the disabled pair's colours, beyond a hundredth of them.
     */
    private fun keepsItsOwnColours(
        cases: List<Triple<String, (Boolean) -> Pair<Int, Int>, @Composable () -> Unit>>,
        inkAtLeast: Int = 40
    ) {
        val wrong = mutableListOf<String>()
        for (dark in themes) for ((name, colours, part) in cases) {
            val (groundColour, inkColour) = colours(dark)
            val drawn = draw(dark, part)
            val ground = drawn.count(groundColour)
            val words = drawn.count(inkColour)
            val pair = drawn.count(fill(dark)) + drawn.count(ink(dark))
            println("Decision 197 Android, ${mode(dark)}: $name: $ground pixels of ${DrawnPixels.hex(groundColour)}, $words of ${DrawnPixels.hex(inkColour)}, $pair of the disabled pair")
            if (ground < 1000) wrong += "${mode(dark)}: $name draws $ground pixels of its own ground ${DrawnPixels.hex(groundColour)}"
            if (words < inkAtLeast) wrong += "${mode(dark)}: $name draws $words pixels of its own ink ${DrawnPixels.hex(inkColour)}"
            if (pair * 100 > ground) wrong += "${mode(dark)}: $name draws $pair pixels of the disabled pair"
        }
        assertTrue(wrong.joinToString("\n"), wrong.isEmpty())
    }

    @Test
    fun aLoadingButtonKeepsItsVariantsOwnColours() = keepsItsOwnColours(
        listOf(
            Triple("a loading Default Button", { d: Boolean -> themeFill(d) to onThemeFill(d) }, button(KozmosButtonVariant.Default, enabled = true, isLoading = true)),
            // The outline's ground is the page's grey; its edge and label its ink.
            Triple("a loading Outline Button", { d: Boolean -> outlineInk(d) to outlineInk(d) }, button(KozmosButtonVariant.Outline, enabled = true, isLoading = true)),
        )
    )

    @Test
    fun aDisabledGlassButtonKeepsItsGlassAndTakesTheForeground() {
        val wrong = mutableListOf<String>()
        for (dark in themes) {
            val glass = draw(dark, button(KozmosButtonVariant.Glass, enabled = true)).ground()
            for ((name, part) in listOf(
                "a disabled Glass Button" to button(KozmosButtonVariant.Glass),
            )) {
                val drawn = draw(dark, part)
                val ground = drawn.count(glass, tolerance = 1)
                val words = drawn.count(ink(dark))
                println("Decision 197 Android, ${mode(dark)}: $name: $ground pixels of the glass ${DrawnPixels.hex(glass)}, $words of ${DrawnPixels.hex(ink(dark))}")
                if (ground < 1000) wrong += "${mode(dark)}: $name draws $ground pixels of the enabled glass ${DrawnPixels.hex(glass)}"
                if (words < 40) wrong += "${mode(dark)}: $name draws $words pixels of the disabled foreground ${DrawnPixels.hex(ink(dark))}"
            }
        }
        assertTrue(wrong.joinToString("\n"), wrong.isEmpty())
    }

    // IconButton

    private fun iconButton(variant: KozmosIconButtonVariant, enabled: Boolean = false, isLoading: Boolean = false): @Composable () -> Unit = {
        KozmosIconButton(
            icon = Icons.Default.Add,
            onClick = {},
            contentDescription = "Add",
            variant = variant,
            enabled = enabled,
            isLoading = isLoading
        )
    }

    @Test
    fun aDisabledFilledIconButtonDrawsTheDisabledPair() = onTheFill(
        listOf(KozmosIconButtonVariant.Default, KozmosIconButtonVariant.Destructive, KozmosIconButtonVariant.Secondary)
            .map { v -> "a disabled $v IconButton" to iconButton(v) },
        inkAtLeast = 20
    )

    @Test
    fun aDisabledGhostIconButtonTakesTheDisabledFill() = onTheFill(
        listOf(
            "a disabled Ghost IconButton" to iconButton(KozmosIconButtonVariant.Ghost),
            "a disabled, loading Ghost IconButton" to iconButton(KozmosIconButtonVariant.Ghost, isLoading = true),
        ),
        inkAtLeast = 20
    )

    @Test
    fun aDisabledOutlineOrLinkIconButtonDrawsTheForegroundOnNoFill() = onNoFill(
        listOf(KozmosIconButtonVariant.Outline, KozmosIconButtonVariant.Link)
            .map { v -> "a disabled $v IconButton" to iconButton(v) },
        inkAtLeast = 20
    )

    @Test
    fun aDisabledOutlineIconButtonDrawsItsEdgeInTheForeground() = onNoFill(
        listOf("a disabled Outline IconButton" to iconButton(KozmosIconButtonVariant.Outline)),
        // The ring all the way round, as well as the icon.
        inkAtLeast = 300
    )

    @Test
    fun aLoadingIconButtonKeepsItsVariantsOwnColours() = keepsItsOwnColours(
        listOf(Triple("a loading Default IconButton", { d: Boolean -> themeFill(d) to onThemeFill(d) }, iconButton(KozmosIconButtonVariant.Default, enabled = true, isLoading = true))),
        inkAtLeast = 20
    )

    /**
     * A disabled IconButton's counter is the pair inverted: a pill of the
     * foreground under digits of the fill (4.80:1 light, 6.51:1 dark). On
     * an outline IconButton, over the page's grey, the fill is drawn only by
     * the digits, and the theme fill, the enabled counter's, not at all.
     */
    @Test
    fun aDisabledIconButtonsCounterIsThePairInverted() {
        val wrong = mutableListOf<String>()
        for (dark in themes) {
            val ring = draw(dark, iconButton(KozmosIconButtonVariant.Outline)).count(ink(dark))
            val drawn = draw(dark) {
                KozmosIconButton(
                    icon = Icons.Default.Add, onClick = {}, contentDescription = "Help",
                    variant = KozmosIconButtonVariant.Outline, enabled = false, counter = 3
                )
            }
            val pill = drawn.count(ink(dark)) - ring
            val digits = drawn.count(fill(dark))
            val brand = drawn.count(themeFill(dark))
            println("Decision 197 Android, ${mode(dark)}: a disabled IconButton's counter: $pill pixels of the pill ${DrawnPixels.hex(ink(dark))}, $digits of the digits ${DrawnPixels.hex(fill(dark))}, $brand of the theme fill")
            if (pill < 1000) wrong += "${mode(dark)}: a disabled IconButton's counter draws $pill pixels of the disabled foreground"
            if (digits < 20) wrong += "${mode(dark)}: a disabled IconButton's counter draws $digits pixels of the disabled fill for its digits"
            if (brand * 100 > pill) wrong += "${mode(dark)}: a disabled IconButton's counter still draws $brand pixels of the theme fill"
        }
        assertTrue(wrong.joinToString("\n"), wrong.isEmpty())
    }

    @Test
    fun aDisabledGlassIconButtonKeepsItsGlassAndTakesTheForeground() {
        val wrong = mutableListOf<String>()
        for (dark in themes) {
            val glass = draw(dark, iconButton(KozmosIconButtonVariant.Glass, enabled = true)).ground()
            val drawn = draw(dark, iconButton(KozmosIconButtonVariant.Glass))
            val ground = drawn.count(glass, tolerance = 1)
            val words = drawn.count(ink(dark))
            println("Decision 197 Android, ${mode(dark)}: a disabled Glass IconButton: $ground pixels of the glass ${DrawnPixels.hex(glass)}, $words of ${DrawnPixels.hex(ink(dark))}")
            if (ground < 1000) wrong += "${mode(dark)}: a disabled Glass IconButton draws $ground pixels of the enabled glass"
            if (words < 20) wrong += "${mode(dark)}: a disabled Glass IconButton draws $words pixels of the disabled foreground"
        }
        assertTrue(wrong.joinToString("\n"), wrong.isEmpty())
    }

    // FloatingActionButton and SplitButton

    @Test
    fun aDisabledFloatingActionButtonDrawsTheDisabledPair() = onTheFill(
        listOf("a disabled FloatingActionButton" to @Composable { KozmosFloatingActionButton(onClick = {}, enabled = false) }),
        inkAtLeast = 20
    )

    @Test
    fun bothHalvesOfADisabledSplitButtonDrawTheDisabledPair() {
        val wrong = mutableListOf<String>()
        for (dark in themes) {
            val drawn = draw(dark) {
                KozmosSplitButton(label = "Share", onMainClick = {}, menuItems = emptyList(), enabled = false)
            }
            // Each half on its own: the main half's left and the menu half's
            // right end, each on the fill, the seam between them unchanged.
            var left = Int.MAX_VALUE
            var right = -1
            for (y in 0 until drawn.height) for (x in 0 until drawn.width) {
                if (DrawnPixels.matches(drawn.argb(x, y), fill(dark), 3)) {
                    left = minOf(left, x); right = maxOf(right, x)
                }
            }
            val words = drawn.count(ink(dark))
            println("Decision 197 Android, ${mode(dark)}: a disabled SplitButton: the fill from x=$left to x=$right, $words pixels of ${DrawnPixels.hex(ink(dark))}")
            if (right < 0) {
                wrong += "${mode(dark)}: a disabled SplitButton draws no disabled fill ${DrawnPixels.hex(fill(dark))}"
                continue
            }
            // The fill reaches past the main half into the menu half: both
            // halves are on it, not only one.
            var halves = 0
            var inFill = false
            val row = (0 until drawn.height).maxByOrNull { y ->
                (left..right).count { x -> DrawnPixels.matches(drawn.argb(x, y), fill(dark), 3) }
            }!!
            for (x in left..right) {
                val on = DrawnPixels.matches(drawn.argb(x, row), fill(dark), 3)
                if (on && !inFill) halves++
                inFill = on
            }
            if (halves < 2) wrong += "${mode(dark)}: a disabled SplitButton draws the disabled fill in $halves run(s) along its middle, not under both halves"
            if (words < 40) wrong += "${mode(dark)}: a disabled SplitButton draws $words pixels of the disabled foreground"
        }
        assertTrue(wrong.joinToString("\n"), wrong.isEmpty())
    }

    // MapControlButton: its surface is its fill, on or off, tinted or filled.

    private fun mapControl(
        pressed: Boolean?,
        emphasis: KozmosMapControlButtonEmphasis = KozmosMapControlButtonEmphasis.Tinted,
        enabled: Boolean = false,
        isLoading: Boolean = false
    ): @Composable () -> Unit = {
        KozmosMapControlButton(
            label = "Focus",
            onClick = {},
            icon = { Icon(Icons.Default.NearMe, contentDescription = null) },
            stateLabel = if (pressed == null) null else if (pressed) "On" else "Off",
            presentation = KozmosMapControlButtonPresentation.Labelled,
            emphasis = emphasis,
            pressed = pressed,
            enabled = enabled,
            isLoading = isLoading
        )
    }

    @Test
    fun aDisabledMapControlButtonDrawsTheDisabledPairOnOrOffTintedOrFilled() = onTheFill(
        listOf(
            "a disabled MapControlButton, not a toggle" to mapControl(null),
            "a disabled MapControlButton, off" to mapControl(false),
            "a disabled MapControlButton, on" to mapControl(true),
            "a disabled filled MapControlButton, on" to mapControl(true, KozmosMapControlButtonEmphasis.Filled),
            "a disabled, loading MapControlButton, on" to mapControl(true, isLoading = true),
        )
    )

    @Test
    fun aLoadingMapControlButtonKeepsItsOwnSurface() = keepsItsOwnColours(
        listOf(
            // On the page's surface, the words navy (theme 1000) on.
            Triple("a loading MapControlButton, on", { d: Boolean ->
                page(d) to (if (d) KozmosColorsDark.primitivesColorsTheme1000 else KozmosColors.primitivesColorsTheme1000).toArgb()
            }, mapControl(true, enabled = true, isLoading = true)),
            Triple("a loading filled MapControlButton, on", { d: Boolean -> themeFill(d) to onThemeFill(d) },
                mapControl(true, KozmosMapControlButtonEmphasis.Filled, enabled = true, isLoading = true)),
        )
    )
}
