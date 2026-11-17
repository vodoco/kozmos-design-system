package com.kozmos.components.togglebutton

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.state.ToggleableState
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.dp
import com.kozmos.components.DrawnPixels
import com.kozmos.components.KeptFrames
import com.kozmos.components.LiveSemantics
import com.kozmos.components.drawn
import com.kozmos.components.live
import com.kozmos.components.pixelsPaparazzi
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.providers.KozmosAnalyticsEvent
import com.kozmos.providers.LocalKozmosAnalytics
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * Decisions 188 and 190 (17 Nov 2026): a toggle standing for several
 * features that differ is given Compose's own mixed state, Indeterminate,
 * which TalkBack says as "Partially checked", in either variant; a click
 * turns it on and reports pressed; once edited it offers "Reset to multiple
 * values", which hands focus back and makes it mixed again.
 */
class KozmosToggleButtonMixedTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    private fun LiveSemantics.toggle() = read().merged.single { "Bold" in it.texts }
    private fun LiveSemantics.reset() = read().merged.singleOrNull { "Reset to multiple values" in it.texts }

    @Test fun aMixedToggleIsIndeterminateInEitherVariant() {
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme {
                Column {
                    KozmosToggleButton(checked = true, onCheckedChange = {}, label = "Bold", mixed = true)
                    KozmosToggleButton(
                        checked = false, onCheckedChange = {}, label = "Italic", mixed = true,
                        variant = KozmosToggleButtonVariant.Outline
                    )
                }
            }
        }
        for (label in listOf("Bold", "Italic")) {
            val node = tree.merged.single { label in it.texts }
            assertEquals("$label's state", ToggleableState.Indeterminate, node.toggleState)
            assertNull("$label: Compose's own words, \"Partially checked\"", node.stateDescription)
        }
    }

    @Test fun aClickTurnsAMixedToggleOnAndTheResetBringsItBack() {
        val events = mutableListOf<KozmosAnalyticsEvent>()
        paparazzi.live(content = {
            // Pressed on some of the features: a click still turns it on.
            var edit by remember { mutableStateOf<Boolean?>(null) }
            CompositionLocalProvider(LocalKozmosAnalytics provides { events += it }) {
                KozmosMaterialTheme {
                    KozmosToggleButton(
                        checked = edit ?: true,
                        onCheckedChange = { edit = it },
                        label = "Bold",
                        mixed = edit == null,
                        onResetMixed = { edit = null }
                    )
                }
            }
        }) {
            frames(2)
            assertEquals(ToggleableState.Indeterminate, toggle().toggleState)
            assertNull("no reset while mixed", reset())
            assertTrue(checkNotNull(toggle().click)())
            frames(3)
            assertEquals(ToggleableState.On, toggle().toggleState)
            assertEquals(mapOf("pressed" to "true"), events.single().properties)

            val reset = checkNotNull(reset()) { "the reset is offered once edited" }
            assertEquals(Role.Button, reset.role)
            reset.click!!.invoke()
            frames(3)
            assertEquals(ToggleableState.Indeterminate, toggle().toggleState)
            assertEquals("focus is back on the toggle", true, toggle().focused)
            assertNull(reset())
        }
    }
}

/**
 * Decision 190's look, read off what is drawn: a dashed edge in the theme
 * fill round the muted fill, background/100, and a dash before the label.
 * On a mid grey that is none of its colours, at twice the density.
 */
class KozmosToggleButtonMixedPixelsTest {
    private val frames = KeptFrames()

    @get:Rule val paparazzi = pixelsPaparazzi(frames)

    private val host = 0xFF808080.toInt()
    private val theme500 = 0xFF135BEC.toInt()
    private fun background100(dark: Boolean) = if (dark) 0xFF17191C.toInt() else 0xFFE3E4E8.toInt()

    private fun draw(dark: Boolean, mixed: Boolean, variant: KozmosToggleButtonVariant): DrawnPixels =
        paparazzi.drawn(frames) {
            val density = LocalDensity.current
            CompositionLocalProvider(
                LocalKozmosUseDarkTokens provides dark,
                LocalDensity provides Density(density.density * 2f, density.fontScale)
            ) {
                KozmosMaterialTheme {
                    Box(Modifier.fillMaxSize().background(Color(host)).padding(8.dp)) {
                        KozmosToggleButton(checked = false, onCheckedChange = {}, label = "Bold", mixed = mixed, variant = variant)
                    }
                }
            }
        }

    private fun DrawnPixels.bounds(colour: Int, xs: IntRange, ys: IntRange): Pair<IntRange, IntRange>? {
        var left = Int.MAX_VALUE; var top = Int.MAX_VALUE; var right = -1; var bottom = -1
        for (y in ys) for (x in xs) if (DrawnPixels.matches(argb(x, y), colour)) {
            left = minOf(left, x); right = maxOf(right, x); top = minOf(top, y); bottom = maxOf(bottom, y)
        }
        return if (right < 0) null else (left..right) to (top..bottom)
    }

    @Test fun aMixedToggleIsADashedThemeEdgeOnTheMutedFill() {
        for (dark in listOf(false, true)) for (variant in KozmosToggleButtonVariant.values()) {
            val name = "${if (dark) "dark" else "light"} $variant"
            val drawn = draw(dark, mixed = true, variant = variant)
            val all = 0 until drawn.width
            val (fillX, fillY) = checkNotNull(drawn.bounds(background100(dark), all, 0 until drawn.height)) {
                "$name: no muted fill"
            }
            val (edgeX, edgeY) = checkNotNull(drawn.bounds(theme500, all, 0 until drawn.height)) { "$name: no theme edge" }
            assertTrue("$name: the edge rings the fill", edgeX.first <= fillX.first && edgeX.last >= fillX.last && edgeY.first <= fillY.first && edgeY.last >= fillY.last)
            // Dashed: along the top edge's row the theme fill comes and goes.
            val row = edgeY.first
            var runs = 0
            var inside = false
            for (x in edgeX) {
                val on = DrawnPixels.matches(drawn.argb(x, row), theme500, 40)
                if (on && !inside) runs++
                inside = on
            }
            assertTrue("$name: the edge is dashed ($runs dashes along the top)", runs >= 4)
            // A dash before the label: the first ink inside the fill, from
            // its start, is a short level line, not a letter.
            val ink = if (dark) 0xFFFFFFFF.toInt() else 0xFF000000.toInt()
            val inner = (fillX.first + 2)..(fillX.last - 2)
            val innerY = (fillY.first + 2)..(fillY.last - 2)
            val firstInk = inner.first { x -> innerY.any { y -> DrawnPixels.matches(drawn.argb(x, y), ink, 40) } }
            var dashEnd = firstInk
            while (innerY.any { y -> DrawnPixels.matches(drawn.argb(dashEnd + 1, y), ink, 40) }) dashEnd++
            val (_, dashY) = checkNotNull(drawn.bounds(ink, firstInk..dashEnd, innerY))
            val tall = dashY.last - dashY.first + 1
            assertTrue("$name: the first ink is a dash, $tall tall in ${fillY.last - fillY.first + 1}", tall * 8 <= fillY.last - fillY.first + 1)
        }
    }

    @Test fun aToggleAtRestDrawsNoThemeEdge() {
        val drawn = draw(dark = false, mixed = false, variant = KozmosToggleButtonVariant.Default)
        assertNull(drawn.bounds(theme500, 0 until drawn.width, 0 until drawn.height))
    }
}
