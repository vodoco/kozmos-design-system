package com.kozmos.components.mapcontrolbutton

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.NearMe
import androidx.compose.material.icons.outlined.NearMe
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.platform.ViewRootForTest
import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.unit.dp
import com.kozmos.components.DrawnPixels
import com.kozmos.components.KeptFrames
import com.kozmos.components.drawn
import com.kozmos.components.pixelsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * Decision 40 (Olcay, 2026-09-28), drawn: the map controls wear the SDK's
 * Tracking Indicator (Figma ce7phRJR1sCkH6zT8EMH8I, 434:31572) — a 48 square,
 * the page's own surface with no edge, and its words two equal lines in the
 * toggle's tone.
 *
 * Paparazzi keeps the frame and the composition's semantics are read in the
 * same pass, so where a control lies is known in the frame. Paparazzi scales
 * its frames down, so a point is found through the frame's own scale, never
 * from dp and density alone. Each control sits on the map's grey.
 */
class KozmosMapControlSurfaceTest {
    private val frames = KeptFrames()

    @get:Rule
    val paparazzi = pixelsPaparazzi(frames)

    private class Part(val description: String?, val texts: List<String>, val bounds: Rect)

    /** What was drawn, where each part lay in it, and how dp and the frame relate. */
    private class Board(val pixels: DrawnPixels, val parts: List<Part>, val scale: Float, val density: Float) {
        fun named(description: String): Rect = parts.first { it.description == description }.bounds
        fun text(text: String): Rect = parts.first { text in it.texts }.bounds

        /** The drawn colour at a point in the root's pixels. */
        fun at(x: Float, y: Float): Int = pixels.argb(
            (x * scale).toInt().coerceIn(0, pixels.width - 1),
            (y * scale).toInt().coerceIn(0, pixels.height - 1)
        )

        /** The darkest colour drawn in a region of the root's pixels. */
        fun darkest(region: Rect): Int {
            var best = 0xFFFFFFFF.toInt()
            for (y in (region.top * scale).toInt() until (region.bottom * scale).toInt()) {
                for (x in (region.left * scale).toInt() until (region.right * scale).toInt()) {
                    val argb = pixels.argb(x, y)
                    if (DrawnPixels.lightness(argb) < DrawnPixels.lightness(best)) best = argb
                }
            }
            return best
        }
    }

    private fun SemanticsNode.all(): List<SemanticsNode> = listOf(this) + children.flatMap { it.all() }

    private fun onTheMap(content: @Composable () -> Unit): Board {
        var parts: List<Part> = emptyList()
        var root = Rect.Zero
        var density = 1f
        val pixels = paparazzi.drawn(frames) {
            val view = LocalView.current
            density = LocalDensity.current.density
            CompositionLocalProvider(LocalKozmosUseDarkTokens provides false) {
                Box(
                    Modifier
                        .fillMaxSize()
                        .background(KozmosThemeTokens.primitivesColorsBackground100)
                        .padding(48.dp)
                        .onGloballyPositioned {
                            val owner = (view as ViewRootForTest).semanticsOwner
                            root = owner.rootSemanticsNode.boundsInRoot
                            parts = (owner.rootSemanticsNode.all() + owner.unmergedRootSemanticsNode.all()).map {
                                Part(
                                    it.config.getOrNull(SemanticsProperties.ContentDescription)?.joinToString(),
                                    it.config.getOrNull(SemanticsProperties.Text)?.map { text -> text.text }.orEmpty(),
                                    it.boundsInRoot
                                )
                            }
                        }
                ) { KozmosMaterialTheme { content() } }
            }
        }
        return Board(pixels, parts, pixels.width / root.width, density)
    }

    /** A token as it is drawn, read back from a swatch. */
    private fun swatch(color: @Composable () -> Color): Int {
        val drawn = paparazzi.drawn(frames) {
            CompositionLocalProvider(LocalKozmosUseDarkTokens provides false) {
                Box(Modifier.fillMaxSize().background(color()))
            }
        }
        return drawn.argb(drawn.width / 2, drawn.height / 2)
    }

    @Test
    fun theSurfaceIsTheSDKs48SquareOfThePagesOwnSurfaceWithNoEdge() {
        val surface = swatch { KozmosThemeTokens.primitivesColorsBackground0 }
        val board = onTheMap {
            KozmosMapControlButton(
                label = "Surface",
                onClick = {},
                icon = { Icon(Icons.Default.Add, contentDescription = null) }
            )
        }
        val control = board.named("Surface")
        assertEquals("the control is ${control.width / board.density}dp wide", 48f, control.width / board.density, 0.5f)
        assertEquals("the control is ${control.height / board.density}dp tall", 48f, control.height / board.density, 0.5f)

        // Opaque: away from the mark, the page's own surface. It was 90% of it.
        val inside = board.at(control.left + 6 * board.density, control.center.y)
        assertTrue(
            "the surface drew ${DrawnPixels.hex(inside)}, not the page's ${DrawnPixels.hex(surface)}",
            DrawnPixels.matches(inside, surface, tolerance = 1)
        )
        // No edge: one frame pixel inside the side, still the surface.
        val edge = board.at(control.left + 1f / board.scale, control.center.y)
        assertTrue(
            "an edge is drawn: ${DrawnPixels.hex(edge)} where the surface is ${DrawnPixels.hex(surface)}",
            DrawnPixels.matches(edge, surface, tolerance = 2)
        )
    }

    @Test
    fun theWordsAndTheMarkAreTheTogglesTone() {
        val grey = swatch { KozmosThemeTokens.primitivesColorsForeground400 }
        val navy = swatch { KozmosThemeTokens.primitivesColorsTheme1000 }
        val blue = swatch { KozmosThemeTokens.primitivesColorsTheme600 }
        for ((pressed, words, mark) in listOf(Triple(false, grey, grey), Triple(true, navy, blue))) {
            val state = if (pressed) "On" else "Off"
            val board = onTheMap {
                KozmosMapControlButton(
                    label = "Focus",
                    onClick = {},
                    icon = {
                        Icon(if (pressed) Icons.Filled.NearMe else Icons.Outlined.NearMe, contentDescription = null)
                    },
                    stateLabel = state,
                    presentation = KozmosMapControlButtonPresentation.Labelled,
                    labelPlacement = KozmosMapControlButtonLabelPlacement.Stacked,
                    pressed = pressed
                )
            }
            val control = board.named("Focus, $state")
            assertEquals("pressed $pressed: the control is tall", 48f, control.height / board.density, 0.5f)

            val inWords = board.darkest(board.text(state))
            assertTrue(
                "pressed $pressed: the words drew ${DrawnPixels.hex(inWords)}, not ${DrawnPixels.hex(words)}",
                DrawnPixels.matches(inWords, words, tolerance = 18)
            )
            val d = board.density
            val inMark = board.darkest(Rect(control.left + 12 * d, control.top + 12 * d, control.left + 36 * d, control.top + 36 * d))
            assertTrue(
                "pressed $pressed: the mark drew ${DrawnPixels.hex(inMark)}, not ${DrawnPixels.hex(mark)}",
                DrawnPixels.matches(inMark, mark, tolerance = 18)
            )
        }
    }
}
