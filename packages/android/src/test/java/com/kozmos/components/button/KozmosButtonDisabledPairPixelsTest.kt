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
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * Decision 197 (GAP-218): a disabled or loading Button-family part is drawn
 * from the disabled pair, Semantics.Disabled, not at half: its label, icon
 * and spinner in the pair's foreground (foreground/400: #5D626F light,
 * #A29D90 dark); a filled variant, any emotion's fill, a FloatingActionButton,
 * both halves of a SplitButton and every MapControlButton on the pair's fill
 * (background/100: #E3E4E8 light, #17191C dark); an outline, ghost or link on
 * no fill, the outline's edge in the foreground; glass on its own glass.
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
    fun aLoadingFilledButtonDrawsTheDisabledPair() = onTheFill(
        filledVariants.map { v -> "a loading $v Button" to button(v, enabled = true, isLoading = true) } +
            listOf("a loading Default Button, Danger" to button(KozmosButtonVariant.Default, KozmosButtonEmotion.Danger, enabled = true, isLoading = true))
    )

    @Test
    fun aDisabledOrLoadingOutlineButtonDrawsItsEdgeAndLabelInTheForegroundOnNoFill() = onNoFill(
        listOf(
            "a disabled Outline Button" to button(KozmosButtonVariant.Outline),
            "a disabled Outline Button, Danger" to button(KozmosButtonVariant.Outline, KozmosButtonEmotion.Danger),
            "a loading Outline Button" to button(KozmosButtonVariant.Outline, enabled = true, isLoading = true),
        ),
        // The edge all the way round, as well as the label.
        inkAtLeast = 400
    )

    @Test
    fun aDisabledOrLoadingGhostOrLinkButtonDrawsTheForegroundOnNoFill() = onNoFill(
        listOf(
            "a disabled Ghost Button" to button(KozmosButtonVariant.Ghost),
            "a disabled Ghost Button, Success" to button(KozmosButtonVariant.Ghost, KozmosButtonEmotion.Success),
            "a disabled Link Button" to button(KozmosButtonVariant.Link),
            "a loading Ghost Button" to button(KozmosButtonVariant.Ghost, enabled = true, isLoading = true),
        )
    )

    @Test
    fun aDisabledGlassButtonKeepsItsGlassAndTakesTheForeground() {
        val wrong = mutableListOf<String>()
        for (dark in themes) {
            val glass = draw(dark, button(KozmosButtonVariant.Glass, enabled = true)).ground()
            for ((name, part) in listOf(
                "a disabled Glass Button" to button(KozmosButtonVariant.Glass),
                "a loading Glass Button" to button(KozmosButtonVariant.Glass, enabled = true, isLoading = true),
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
    fun aDisabledOrLoadingFilledIconButtonDrawsTheDisabledPair() = onTheFill(
        listOf(KozmosIconButtonVariant.Default, KozmosIconButtonVariant.Destructive, KozmosIconButtonVariant.Secondary)
            .map { v -> "a disabled $v IconButton" to iconButton(v) } +
            listOf("a loading Default IconButton" to iconButton(KozmosIconButtonVariant.Default, enabled = true, isLoading = true)),
        // A spinner's arc, or the icon alone.
        inkAtLeast = 20
    )

    @Test
    fun aDisabledOutlineGhostOrLinkIconButtonDrawsTheForegroundOnNoFill() = onNoFill(
        listOf(KozmosIconButtonVariant.Outline, KozmosIconButtonVariant.Ghost, KozmosIconButtonVariant.Link)
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
    fun aDisabledOrLoadingMapControlButtonDrawsTheDisabledPairOnOrOffTintedOrFilled() = onTheFill(
        listOf(
            "a disabled MapControlButton, not a toggle" to mapControl(null),
            "a disabled MapControlButton, off" to mapControl(false),
            "a disabled MapControlButton, on" to mapControl(true),
            "a disabled filled MapControlButton, on" to mapControl(true, KozmosMapControlButtonEmphasis.Filled),
            "a loading MapControlButton, on" to mapControl(true, enabled = true, isLoading = true),
            "a loading filled MapControlButton, on" to mapControl(true, KozmosMapControlButtonEmphasis.Filled, enabled = true, isLoading = true),
        )
    )
}
