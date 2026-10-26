package com.kozmos.components.emptystate

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.dp
import com.kozmos.components.DrawnPixels
import com.kozmos.components.KeptFrames
import com.kozmos.components.ReadSemantics
import com.kozmos.components.icon.KozmosIcon
import com.kozmos.components.icon.KozmosIconSize
import com.kozmos.components.pixelsPaparazzi
import com.kozmos.components.readSemantics
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import kotlin.math.abs
import kotlin.math.roundToInt
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * React's EmptyState and Figma's draw the title in foreground/0
 * (`text-foreground`; `Colors/foreground/0`), as React does a progress label,
 * and the description in the muted colour,
 * foreground/400 (`text-muted-foreground`; `Colors/foreground/400`), and set
 * the icon in a circle: `w-16 h-16 rounded-pill bg-muted`, 64 across (40
 * compact) of background/100, 16 (8 compact) above the title; a progress
 * value's words are muted too. Compose drew the title and the progress label
 * in foreground/100, the description and the progress value in
 * foreground/300, and the icon on the page, with no circle.
 * Read off what is drawn, at twice the density, in light and dark.
 */
class KozmosEmptyStateParityTest {
    private val frames = KeptFrames()

    @get:Rule val paparazzi = pixelsPaparazzi(frames)

    private class Drawn(val pixels: DrawnPixels, val tree: ReadSemantics, val scale: Float, val density: Float, val page: Int) {
        fun at(x: Float, y: Float) = pixels.argb((x * scale).roundToInt(), (y * scale).roundToInt())
    }

    private fun draw(dark: Boolean, content: @Composable () -> Unit): Drawn {
        var canvas = IntSize(1, 1)
        var density = 1f
        var page = 0
        val tree = paparazzi.readSemantics {
            val base = LocalDensity.current
            CompositionLocalProvider(
                LocalKozmosUseDarkTokens provides dark,
                LocalDensity provides Density(base.density * 2f, base.fontScale)
            ) {
                density = LocalDensity.current.density
                KozmosMaterialTheme {
                    page = KozmosThemeTokens.primitivesColorsBackground0.toArgb()
                    Box(Modifier.fillMaxSize().background(Color(page)).onGloballyPositioned { canvas = it.size }) {
                        Box(Modifier.padding(16.dp).width(320.dp)) { content() }
                    }
                }
            }
        }
        val pixels = DrawnPixels(checkNotNull(frames.last))
        return Drawn(pixels, tree, pixels.width.toFloat() / canvas.width, density, page)
    }

    /** The colour most of the node saying [words] is drawn in: the commonest of its pixels that are not the page. */
    private fun Drawn.inkOf(words: String): Int {
        val box = tree.unmerged.single { it.texts == listOf(words) }.frame
        val counts = HashMap<Int, Int>()
        for (y in (box.top * scale).roundToInt() until (box.bottom * scale).roundToInt()) {
            for (x in (box.left * scale).roundToInt() until (box.right * scale).roundToInt()) {
                val argb = pixels.argb(x, y)
                if (!DrawnPixels.matches(argb, page, 40)) counts[argb] = (counts[argb] ?: 0) + 1
            }
        }
        return counts.maxByOrNull { it.value }?.key ?: page
    }

    @Test fun theDescriptionIsTheMutedForeground400InBothThemes() {
        val wrong = mutableListOf<String>()
        for (dark in listOf(false, true)) {
            var expected = 0
            val drawn = draw(dark) {
                expected = KozmosThemeTokens.primitivesColorsForeground400.toArgb()
                KozmosEmptyState(title = "Keine Treffer", description = "Versuchen Sie es mit einem anderen Wort.")
            }
            val ink = drawn.inkOf("Versuchen Sie es mit einem anderen Wort.")
            if (!DrawnPixels.matches(ink, expected, 6)) {
                wrong += "${if (dark) "dark" else "light"}: the description is ${DrawnPixels.hex(ink)}, not foreground/400 ${DrawnPixels.hex(expected)}"
            }
        }
        assertTrue(wrong.joinToString("; "), wrong.isEmpty())
    }

    @Test fun theTitleAndAProgressLabelAreForeground0InBothThemes() {
        val wrong = mutableListOf<String>()
        for (dark in listOf(false, true)) {
            var expected = 0
            val drawn = draw(dark) {
                expected = KozmosThemeTokens.primitivesColorsForeground0.toArgb()
                KozmosEmptyState(
                    title = "Wird geladen",
                    progress = KozmosEmptyStateProgress(0.4f, "Der Assistent wird geladen", valueText = "40 %")
                )
            }
            for ((part, words) in listOf("title" to "Wird geladen", "progress label" to "Der Assistent wird geladen")) {
                val ink = drawn.inkOf(words)
                if (!DrawnPixels.matches(ink, expected, 6)) {
                    wrong += "${if (dark) "dark" else "light"}: the $part is ${DrawnPixels.hex(ink)}, not foreground/0 ${DrawnPixels.hex(expected)}"
                }
            }
        }
        assertTrue(wrong.joinToString("; "), wrong.isEmpty())
    }

    @Test fun theProgressValueIsTheMutedForeground400InBothThemes() {
        val wrong = mutableListOf<String>()
        for (dark in listOf(false, true)) {
            var expected = 0
            val drawn = draw(dark) {
                expected = KozmosThemeTokens.primitivesColorsForeground400.toArgb()
                KozmosEmptyState(
                    title = "Wird geladen",
                    progress = KozmosEmptyStateProgress(0.4f, "Der Assistent wird geladen", valueText = "40 %")
                )
            }
            val ink = drawn.inkOf("40 %")
            if (!DrawnPixels.matches(ink, expected, 6)) {
                wrong += "${if (dark) "dark" else "light"}: the progress value is ${DrawnPixels.hex(ink)}, not foreground/400 ${DrawnPixels.hex(expected)}"
            }
        }
        assertTrue(wrong.joinToString("; "), wrong.isEmpty())
    }

    @Test fun theIconSitsInACircleOfBackground100At64AndCompact40InBothThemes() {
        val wrong = mutableListOf<String>()
        for (dark in listOf(false, true)) {
            for ((size, across, gap) in listOf(
                Triple(KozmosEmptyStateSize.Default, 64f, 16f),
                Triple(KozmosEmptyStateSize.Compact, 40f, 8f)
            )) {
                var fill = 0
                val drawn = draw(dark) {
                    fill = KozmosThemeTokens.primitivesColorsBackground100.toArgb()
                    KozmosEmptyState(
                        title = "Keine Treffer",
                        size = size,
                        icon = { KozmosIcon(name = "search", size = KozmosIconSize.Lg, modifier = Modifier.testTag("icon")) }
                    )
                }
                val case = "${if (dark) "dark" else "light"} $size"
                val dp = drawn.density
                val icon = drawn.tree.unmerged.single { it.tag == "icon" }.frame
                val r = across / 2
                val cx = icon.center.x
                val cy = icon.center.y
                // Inside the circle, past the 24dp glyph: the circle's fill.
                for ((side, name) in listOf(-1 to "start", 1 to "end")) {
                    val inside = drawn.at(cx + side * (r - 4) * dp, cy)
                    if (!DrawnPixels.matches(inside, fill, 6)) wrong += "$case: ${r - 4}dp to the $name of the icon's centre is ${DrawnPixels.hex(inside)}, not background/100 ${DrawnPixels.hex(fill)}"
                    val outside = drawn.at(cx + side * (r + 4) * dp, cy)
                    if (!DrawnPixels.matches(outside, drawn.page, 6)) wrong += "$case: ${r + 4}dp to the $name of the icon's centre is ${DrawnPixels.hex(outside)}, not the page"
                }
                // Round: the corner of its square is the page.
                val corner = drawn.at(cx - r * 0.85f * dp, cy - r * 0.85f * dp)
                if (!DrawnPixels.matches(corner, drawn.page, 6)) wrong += "$case: the circle's square corner is ${DrawnPixels.hex(corner)}, not the page"
                // The title starts the gap below the circle.
                val title = drawn.tree.unmerged.single { it.texts == listOf("Keine Treffer") }.frame
                val below = (title.top - (cy + r * dp)) / dp
                if (abs(below - gap) > 1f) wrong += "$case: the title is ${"%.1f".format(below)}dp below the circle, not $gap"
            }
        }
        assertTrue(wrong.joinToString("; "), wrong.isEmpty())
    }
}
