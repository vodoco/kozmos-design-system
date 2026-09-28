package com.kozmos.components.adaptivemapshell

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.platform.ViewRootForTest
import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.unit.IntSize
import com.kozmos.components.DrawnPixels
import com.kozmos.components.KeptFrames
import com.kozmos.components.drawn
import com.kozmos.components.pixelsPaparazzi
import com.kozmos.components.poidetailpanel.KozmosPOIDetailPanel
import com.kozmos.components.poidetailpanel.KozmosPOIDetailPanelPresentation
import com.kozmos.components.routepreviewpanel.KozmosRoutePreviewPanel
import com.kozmos.components.surface.KozmosSurfaceStyle
import com.kozmos.contracts.KozmosPOIMediaPresentation
import com.kozmos.contracts.KozmosPOIPresentation
import com.kozmos.contracts.KozmosRouteOptionPresentation
import com.kozmos.contracts.KozmosRoutePreference
import com.kozmos.contracts.KozmosRouteReadiness
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min
import kotlin.math.pow
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * Decision 48 (2026-09-28): on glass, text that is muted elsewhere takes the
 * foreground colour, so it reads at 4.5:1 over any map; the glass itself is
 * as it was. Muted over the glass stories' saturated rooms, the theme's blue
 * and the warning amber, the route preview's "To" and the details card's
 * level line read about 3.7:1 on the web.
 *
 * Each case is drawn twice, with the part and with the panel hosting
 * nothing, and each text found where TalkBack is told it is. The part paints
 * no fill of its own (decision 43), so the empty panel is exactly what lies
 * behind the text. The text's colour is its glyphs' core, the pixel in its
 * box furthest in luminance from the glass behind it; the contrast is its
 * WCAG ratio with the least contrasting pixel of the glass in that box.
 */
class KozmosAdaptiveMapShellGlassTextTest {
    private val frames = KeptFrames()

    @get:Rule
    val paparazzi = pixelsPaparazzi(frames)

    /** The root's size, and every text laid out and where, in root pixels. */
    private var root = IntSize.Zero
    private var texts: Map<String, Rect> = emptyMap()

    private val options = listOf(
        KozmosRouteOptionPresentation(
            id = "quickest", label = "Quickest", durationSeconds = 240.0, durationLabel = "4 min",
            distanceMetres = 150.0, distanceLabel = "150 m", preference = KozmosRoutePreference.Quickest,
            selected = true
        ),
        KozmosRouteOptionPresentation(
            id = "step-free", label = "Step-free", durationSeconds = 360.0, durationLabel = "6 min",
            distanceMetres = 173.0, distanceLabel = "173 m", preference = KozmosRoutePreference.StepFree
        )
    )

    private val description = "Speciality coffee, pastries and breakfast to go."

    @Composable
    private fun Route(blank: String? = null) {
        KozmosRoutePreviewPanel(
            destinationName = "Harbour Coffee Co.",
            options = options,
            status = KozmosRouteReadiness.Ready,
            backLabel = "Back",
            continueLabel = "Start",
            onOptionSelect = {},
            onBack = {},
            onContinue = {},
            destinationLabel = blanked("To", blank),
            optionsCountLabel = "2 route options"
        )
    }

    /** `text`, or as many spaces when it is `blank`: laid out as it is, drawn as nothing. */
    private fun blanked(text: String, blank: String?) = if (text == blank) " ".repeat(text.length) else text

    /**
     * The details card with a photo, whose gallery says its position under
     * the description. The photo's address loads nothing here, so no image
     * is drawn; the position is.
     */
    @Composable
    private fun Details(
        presentation: KozmosPOIDetailPanelPresentation = KozmosPOIDetailPanelPresentation.Sheet,
        blank: String? = null
    ) {
        KozmosPOIDetailPanel(
            poi = KozmosPOIPresentation(
                id = "cafe", name = "Cafe", floorId = "2", floorLabel = blanked("Level 2", blank), description = description,
                media = listOf(KozmosPOIMediaPresentation(id = "front", src = "file:///front.jpg", alt = "The front"))
            ),
            actionLabels = emptyMap(),
            onAction = { _, _ -> },
            onClose = {},
            mediaPositionLabel = { _, _ -> blanked("Image 1 of 1", blank) },
            presentation = presentation
        )
    }

    /** The glass stories' two saturated rooms, as the map's halves. */
    private fun rooms(amberFirst: Boolean): @Composable () -> Unit = {
        Row(Modifier.fillMaxSize()) {
            val blue = KozmosThemeTokens.primitivesColorsTheme600
            val amber = KozmosThemeTokens.primitivesColorsEmotionalAlert800
            Box(Modifier.weight(1f).fillMaxHeight().background(if (amberFirst) amber else blue))
            Box(Modifier.weight(1f).fillMaxHeight().background(if (amberFirst) blue else amber))
        }
    }

    private fun SemanticsNode.textNodes(into: MutableMap<String, Rect> = mutableMapOf()): Map<String, Rect> {
        config.getOrNull(SemanticsProperties.Text)?.let { text -> into[text.joinToString { it.text }] = boundsInRoot }
        children.forEach { it.textNodes(into) }
        return into
    }

    /** Draws the shell over the rooms, its sheet at medium, reading where every text is as it goes. */
    private fun shell(
        dark: Boolean,
        amberFirst: Boolean,
        surface: KozmosSurfaceStyle = KozmosSurfaceStyle.Glass,
        panel: @Composable () -> Unit
    ): DrawnPixels = paparazzi.drawn(frames) {
        val view = LocalView.current
        CompositionLocalProvider(LocalKozmosUseDarkTokens provides dark) {
            Box(
                Modifier.fillMaxSize().onGloballyPositioned {
                    root = it.size
                    texts = (view as ViewRootForTest).semanticsOwner.unmergedRootSemanticsNode.textNodes()
                }
            ) {
                MaterialTheme {
                    KozmosAdaptiveMapShell(
                        map = rooms(amberFirst),
                        panel = panel,
                        panelSurface = surface,
                        panelDetent = KozmosMapPanelDetent.Medium
                    )
                }
            }
        }
    }

    private fun luminance(argb: Int): Double {
        fun channel(v: Int): Double {
            val c = v / 255.0
            return if (c <= 0.04045) c / 12.92 else ((c + 0.055) / 1.055).pow(2.4)
        }
        return 0.2126 * channel(argb shr 16 and 0xFF) + 0.7152 * channel(argb shr 8 and 0xFF) + 0.0722 * channel(argb and 0xFF)
    }

    private fun contrast(a: Int, b: Int): Double {
        val (la, lb) = luminance(a) to luminance(b)
        return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)
    }

    private class Read(val ratio: Double, val core: Int, val behind: Int)

    /** The contrast of the text in `box` (root pixels) with the glass behind it. */
    private fun read(drawn: DrawnPixels, empty: DrawnPixels, box: Rect): Read {
        val scale = drawn.width.toFloat() / root.width
        val xs = (box.left * scale).toInt().coerceAtLeast(0)..(box.right * scale).toInt().coerceAtMost(drawn.width - 1)
        val ys = (box.top * scale).toInt().coerceAtLeast(0)..(box.bottom * scale).toInt().coerceAtMost(drawn.height - 1)
        var core = 0
        var furthest = -1.0
        for (y in ys) for (x in xs) {
            val distance = abs(luminance(drawn.argb(x, y)) - luminance(empty.argb(x, y)))
            if (distance > furthest) { furthest = distance; core = drawn.argb(x, y) }
        }
        var lowest = Double.MAX_VALUE
        var behind = 0
        for (y in ys) for (x in xs) {
            val ratio = contrast(core, empty.argb(x, y))
            if (ratio < lowest) { lowest = ratio; behind = empty.argb(x, y) }
        }
        return Read(lowest, core, behind)
    }

    /**
     * The route preview's "To" and its count of options, and the details
     * card's level line, its description, muted on Android, and its
     * gallery's position: at 4.5:1 or more over either room, light and dark.
     */
    @Test
    fun onAGlassSheetTheHostedPartsMutedTextReadsAtFourAndAHalfToOne() {
        val low = mutableListOf<String>()
        val route: @Composable () -> Unit = { Route() }
        val details: @Composable () -> Unit = { Details() }
        for (dark in listOf(false, true)) {
            for (amberFirst in listOf(false, true)) {
                val theme = if (dark) "dark" else "light"
                val room = if (amberFirst) "amber" else "blue"
                for ((part, lines) in listOf(
                    route to listOf("TO", "2 route options"),
                    details to listOf("Level 2", description, "Image 1 of 1")
                )) {
                    val drawn = shell(dark, amberFirst, panel = part)
                    val found = texts
                    val empty = shell(dark, amberFirst) { Box(Modifier.fillMaxSize()) }
                    for (line in lines) {
                        val box = found[line]
                        if (box == null) {
                            low += "$theme, $room: \"$line\" is not laid out"
                            continue
                        }
                        val at = read(drawn, empty, box)
                        println("Decision 48 Android, \"$line\" on glass over $room, $theme: ${"%.2f".format(at.ratio)}:1, text ${DrawnPixels.hex(at.core)} over ${DrawnPixels.hex(at.behind)}")
                        if (at.ratio < 4.5) low += "\"$line\", $theme, $room: ${"%.2f".format(at.ratio)}:1, text ${DrawnPixels.hex(at.core)} over ${DrawnPixels.hex(at.behind)}"
                    }
                }
            }
        }
        assertTrue("below 4.5:1 on glass: ${low.joinToString("; ")}", low.isEmpty())
    }

    /**
     * Which of `lines`, drawn by `part` on a sheet of `surface`, are nearer
     * the ink than the muted colour: each line's glyphs' core against a
     * swatch of the muted token and one of the foreground. Each line is read
     * against the part drawn again with that line blanked, so a card's own
     * fill, which the empty panel lacks, is not taken for its text. A line
     * is the text TalkBack is told and the text it is made from.
     */
    private fun inkedLines(
        dark: Boolean,
        surface: KozmosSurfaceStyle,
        part: (String?) -> @Composable () -> Unit,
        lines: List<Pair<String, String>>,
        place: String
    ): List<String> {
        fun swatch(colour: @Composable () -> androidx.compose.ui.graphics.Color): Int {
            val drawn = paparazzi.drawn(frames) {
                CompositionLocalProvider(LocalKozmosUseDarkTokens provides dark) {
                    Box(Modifier.fillMaxSize().background(colour()))
                }
            }
            return drawn.argb(drawn.width / 2, drawn.height / 2)
        }
        val muted = swatch { KozmosThemeTokens.primitivesColorsForeground500 }
        val ink = swatch { KozmosThemeTokens.primitivesColorsForeground100 }
        val drawn = shell(dark, amberFirst = false, surface = surface, panel = part(null))
        val found = texts
        val theme = if (dark) "dark" else "light"
        val wrong = mutableListOf<String>()
        for ((line, source) in lines) {
            val box = found[line]
            if (box == null) {
                wrong += "$theme: \"$line\" $place is not laid out"
                continue
            }
            val without = shell(dark, amberFirst = false, surface = surface, panel = part(source))
            val core = read(drawn, without, box).core
            println("Decision 48 Android, \"$line\" $place, $theme: ${DrawnPixels.hex(core)}, muted ${DrawnPixels.hex(muted)}, ink ${DrawnPixels.hex(ink)}")
            if (abs(luminance(core) - luminance(muted)) >= abs(luminance(core) - luminance(ink))) {
                wrong += "$theme: \"$line\" $place drew ${DrawnPixels.hex(core)}, nearer the ink ${DrawnPixels.hex(ink)} than the muted ${DrawnPixels.hex(muted)}"
            }
        }
        return wrong
    }

    /**
     * The guard: only glass turns muted text to ink. On a solid sheet "To",
     * the details card's level line and its gallery's position keep the
     * theme's muted colour: each one's glyphs' core is nearer a swatch of
     * the muted token than one of the foreground, light and dark.
     */
    @Test
    fun onASolidSheetTheMutedTextKeepsItsMutedColour() {
        val route = { blank: String? -> @Composable { Route(blank) } }
        val details = { blank: String? -> @Composable { Details(blank = blank) } }
        val wrong = mutableListOf<String>()
        for (dark in listOf(false, true)) {
            wrong += inkedLines(dark, KozmosSurfaceStyle.Solid, route, listOf("TO" to "To"), "on a solid sheet")
            wrong += inkedLines(dark, KozmosSurfaceStyle.Solid, details, bodyLines, "on a solid sheet")
        }
        assertTrue(wrong.joinToString("; "), wrong.isEmpty())
    }

    /** The details card's lines that are muted elsewhere, as TalkBack is told them and as they are made. */
    private val bodyLines = listOf("Level 2" to "Level 2", "Image 1 of 1" to "Image 1 of 1")

    /**
     * And on a glass sheet, the details card's bordered panel presentation
     * is a card of its own that its text sits on: its level line and its
     * gallery's position keep the muted colour, light and dark.
     */
    @Test
    fun inTheBorderedCardOnAGlassSheetTheMutedTextKeepsItsMutedColour() {
        val bordered = { blank: String? -> @Composable { Details(KozmosPOIDetailPanelPresentation.Panel, blank) } }
        val wrong = mutableListOf<String>()
        for (dark in listOf(false, true)) {
            wrong += inkedLines(dark, KozmosSurfaceStyle.Glass, bordered, bodyLines, "in the bordered card on a glass sheet")
        }
        assertTrue(wrong.joinToString("; "), wrong.isEmpty())
    }
}
