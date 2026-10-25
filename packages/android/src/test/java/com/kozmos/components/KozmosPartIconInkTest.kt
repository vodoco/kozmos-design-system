package com.kozmos.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.dp
import com.kozmos.components.emptystate.KozmosEmptyState
import com.kozmos.components.icon.KozmosIcon
import com.kozmos.components.icon.KozmosIconSize
import com.kozmos.components.routeoptioncard.KozmosRouteOptionCard
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.contracts.KozmosRouteOptionPresentation
import com.kozmos.contracts.KozmosRoutePreference
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import kotlin.math.roundToInt
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * A caller's icon in KozmosEmptyState and KozmosRouteOptionCard is drawn in
 * the part's own colour, as React's icon is `currentColor` in the part's
 * text colour and SwiftUI's now is (#340, KozmosPartIconInkTests):
 *
 * - EmptyState: foreground/400, React's `text-muted-foreground` around its
 *   icon and Figma's icon token (`Colors/foreground/400`);
 * - RouteOptionCard: theme/600, React's `text-primary` and the colour the
 *   card draws its own preference icon in.
 *
 * Compose gave the icon slot no colour: a KozmosIcon, or a Material Icon, at
 * its default colour drew whatever content colour was around the part.
 * Read off what is drawn, at twice the density, in light and dark.
 */
class KozmosPartIconInkTest {
    private val frames = KeptFrames()

    @get:Rule val paparazzi = pixelsPaparazzi(frames)

    /** A caller's icon at its default colour: a KozmosIcon, and Material's own Icon. */
    private val icons: List<Pair<String, @Composable () -> Unit>> = listOf(
        "KozmosIcon" to { KozmosIcon(name = "search", size = KozmosIconSize.Lg, modifier = Modifier.testTag("icon")) },
        "Material Icon" to { Icon(Icons.Default.Search, contentDescription = null, modifier = Modifier.size(24.dp).testTag("icon")) }
    )

    /**
     * The colour most of the icon is drawn in: of the pixels in its box that
     * are not the [ground] it stands on, the commonest.
     */
    private fun DrawnPixels.ink(box: Rect, scale: Float, ground: Int): Int {
        val counts = HashMap<Int, Int>()
        val xs = (box.left * scale).roundToInt() until (box.right * scale).roundToInt()
        val ys = (box.top * scale).roundToInt() until (box.bottom * scale).roundToInt()
        for (y in ys) for (x in xs) {
            val argb = argb(x, y)
            if (!DrawnPixels.matches(argb, ground, 40)) counts[argb] = (counts[argb] ?: 0) + 1
        }
        return counts.maxByOrNull { it.value }?.key ?: ground
    }

    /** Draws [content] at twice the density on [ground], and reads the ink of the node tagged "icon". */
    private fun inkIn(dark: Boolean, ground: @Composable () -> Int, content: @Composable () -> Unit): Pair<Int, Int> {
        var canvas = IntSize(1, 1)
        var groundColour = 0
        val tree = paparazzi.readSemantics {
            val base = LocalDensity.current
            CompositionLocalProvider(
                LocalKozmosUseDarkTokens provides dark,
                LocalDensity provides Density(base.density * 2f, base.fontScale)
            ) {
                KozmosMaterialTheme {
                    groundColour = ground()
                    Box(
                        Modifier.fillMaxSize()
                            .background(androidx.compose.ui.graphics.Color(groundColour))
                            .onGloballyPositioned { canvas = it.size }
                    ) {
                        Box(Modifier.padding(16.dp).width(300.dp)) { content() }
                    }
                }
            }
        }
        val drawn = DrawnPixels(checkNotNull(frames.last))
        val box = tree.unmerged.single { it.tag == "icon" }.frame
        return drawn.ink(box, drawn.width.toFloat() / canvas.width, groundColour) to groundColour
    }

    @Test fun anEmptyStatesIconIsItsMutedColourInBothThemes() {
        val wrong = mutableListOf<String>()
        for (dark in listOf(false, true)) for ((kind, icon) in icons) {
            var expected = 0
            val (ink, ground) = inkIn(dark, ground = { KozmosThemeTokens.primitivesColorsBackground0.toArgb() }) {
                expected = KozmosThemeTokens.primitivesColorsForeground400.toArgb()
                KozmosEmptyState(title = "Keine Treffer", description = "Versuchen Sie es mit einem anderen Wort.", icon = icon)
            }
            if (!DrawnPixels.matches(ink, expected, 6)) {
                wrong += "${if (dark) "dark" else "light"} $kind: the icon is ${DrawnPixels.hex(ink)}, not foreground/400 ${DrawnPixels.hex(expected)} (on ${DrawnPixels.hex(ground)})"
            }
        }
        assertTrue(wrong.joinToString("; "), wrong.isEmpty())
    }

    @Test fun aRouteOptionsIconIsTheThemeInBothThemes() {
        val wrong = mutableListOf<String>()
        for (dark in listOf(false, true)) for ((kind, icon) in icons) {
            var expected = 0
            val (ink, ground) = inkIn(dark, ground = { KozmosThemeTokens.primitivesColorsBackground0.toArgb() }) {
                expected = KozmosThemeTokens.primitivesColorsTheme600.toArgb()
                KozmosRouteOptionCard(
                    option = KozmosRouteOptionPresentation(
                        id = "stepfree", label = "Stufenlos", durationSeconds = 300.0, durationLabel = "5 Min.",
                        distanceMetres = 200.0, distanceLabel = "200 m", preference = KozmosRoutePreference.StepFree
                    ),
                    onSelect = {},
                    icon = icon
                )
            }
            if (!DrawnPixels.matches(ink, expected, 6)) {
                wrong += "${if (dark) "dark" else "light"} $kind: the icon is ${DrawnPixels.hex(ink)}, not theme/600 ${DrawnPixels.hex(expected)} (on ${DrawnPixels.hex(ground)})"
            }
        }
        assertTrue(wrong.joinToString("; "), wrong.isEmpty())
    }
}
