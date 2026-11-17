package com.kozmos.components.switch

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
 * Decisions 188 and 189 (17 Nov 2026): a switch standing for several
 * features whose settings differ. TalkBack is given Compose's mixed state,
 * Indeterminate, with "Multiple values" as the state it says in place of on
 * or off (a switch is never "partially checked"); a click turns it on and
 * reports on; once edited it offers "Reset to multiple values", which hands
 * focus back to the switch and makes it mixed again.
 */
class KozmosSwitchMixedTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    private fun LiveSemantics.switch() = read().merged.single { it.role == Role.Switch }
    private fun LiveSemantics.reset() = read().merged.singleOrNull { "Reset to multiple values" in it.texts }

    @Test fun aMixedSwitchSaysMultipleValuesAsItsStateDisabledAndInErrorToo() {
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme {
                Column {
                    KozmosSwitch(checked = false, onCheckedChange = {}, label = "Step-free", mixed = true)
                    KozmosSwitch(checked = false, onCheckedChange = {}, label = "Lifts", mixed = true, enabled = false)
                    KozmosSwitch(checked = false, onCheckedChange = {}, label = "Ramps", mixed = true, error = true)
                    KozmosSwitch(
                        checked = false, onCheckedChange = {}, label = "Stairs", mixed = true,
                        mixedLabel = "Valeurs multiples", showStateLabel = true
                    )
                }
            }
        }
        for ((label, said) in listOf(
            "Step-free" to "Multiple values", "Lifts" to "Multiple values",
            "Ramps" to "Multiple values", "Stairs" to "Valeurs multiples"
        )) {
            val node = tree.merged.single { label in it.texts }
            assertEquals("$label's role", Role.Switch, node.role)
            assertEquals("$label's state", ToggleableState.Indeterminate, node.toggleState)
            assertEquals("$label's said state", said, node.stateDescription)
        }
        // The state label's drawn words are not said again.
        assertTrue(tree.merged.none { "Valeurs multiples" in it.texts })
    }

    @Test fun aClickTurnsAMixedSwitchOnAndTheResetBringsItBack() {
        val events = mutableListOf<KozmosAnalyticsEvent>()
        paparazzi.live(content = {
            // Some of the features are on: a click still turns it on.
            var edit by remember { mutableStateOf<Boolean?>(null) }
            CompositionLocalProvider(LocalKozmosAnalytics provides { events += it }) {
                KozmosMaterialTheme {
                    KozmosSwitch(
                        checked = edit ?: true,
                        onCheckedChange = { edit = it },
                        label = "Step-free",
                        mixed = edit == null,
                        onResetMixed = { edit = null }
                    )
                }
            }
        }) {
            frames(2)
            assertEquals(ToggleableState.Indeterminate, switch().toggleState)
            assertNull("no reset while mixed", reset())
            assertTrue(checkNotNull(switch().click)())
            frames(3)
            assertEquals(ToggleableState.On, switch().toggleState)
            assertNull(switch().stateDescription?.takeIf { it == "Multiple values" })
            assertEquals(listOf("switch_toggled"), events.map { it.eventName })
            assertEquals(mapOf("checked" to "true"), events.single().properties)

            val reset = checkNotNull(reset()) { "the reset is offered once edited" }
            assertEquals(Role.Button, reset.role)
            reset.click!!.invoke()
            frames(3)
            assertEquals(ToggleableState.Indeterminate, switch().toggleState)
            assertEquals("Multiple values", switch().stateDescription)
            assertEquals("focus is back on the switch", true, switch().focused)
            assertNull(reset())
        }
    }

    @Test fun noResetWhileDisabledAndItTakesTheResetsWords() {
        for (enabled in listOf(true, false)) {
            val tree = paparazzi.readSemantics {
                KozmosMaterialTheme {
                    KozmosSwitch(
                        checked = true, onCheckedChange = {}, label = "Step-free", enabled = enabled,
                        onResetMixed = {}, resetMixedLabel = "Revenir aux valeurs multiples"
                    )
                }
            }
            assertEquals("enabled=$enabled", enabled, tree.merged.any { "Revenir aux valeurs multiples" in it.texts })
        }
    }
}

/**
 * Decision 189's look, read off what is drawn: the track filled with the
 * theme fill as when on, no thumb, and a short white dash in its middle. The
 * switch sits on a mid grey that is none of its colours, drawn at twice the
 * density and found by colour, never by dp (Paparazzi scales its frames).
 */
class KozmosSwitchMixedPixelsTest {
    private val frames = KeptFrames()

    @get:Rule val paparazzi = pixelsPaparazzi(frames)

    private val host = 0xFF808080.toInt()
    private val theme500 = 0xFF135BEC.toInt()
    private val white = 0xFFFFFFFF.toInt()

    private fun draw(dark: Boolean, mixed: Boolean): DrawnPixels = paparazzi.drawn(frames) {
        val density = LocalDensity.current
        CompositionLocalProvider(
            LocalKozmosUseDarkTokens provides dark,
            LocalDensity provides Density(density.density * 2f, density.fontScale)
        ) {
            KozmosMaterialTheme {
                Box(Modifier.fillMaxSize().background(Color(host)).padding(8.dp)) {
                    KozmosSwitch(checked = !mixed, onCheckedChange = {}, mixed = mixed)
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

    private val IntRange.size: Int get() = last - first + 1

    @Test fun aMixedTrackIsTheThemeFillWithACentredWhiteDashAndNoThumb() {
        for (dark in listOf(false, true)) {
            val mode = if (dark) "dark" else "light"
            val drawn = draw(dark, mixed = true)
            val (trackX, trackY) = checkNotNull(drawn.bounds(theme500, 0 until drawn.width, 0 until drawn.height)) {
                "$mode: no theme fill drawn"
            }
            val (dashX, dashY) = checkNotNull(drawn.bounds(white, trackX, trackY)) { "$mode: no white in the track" }
            // A dash: about 9.3 of the track's 44 across, and thin; a thumb
            // would be 20 across and 20 tall.
            assertTrue("$mode: the white is a dash, ${dashX.size} wide in ${trackX.size}", dashX.size * 44 in (6 * trackX.size)..(12 * trackX.size))
            assertTrue("$mode: the white is thin, ${dashY.size} tall in ${trackY.size}", dashY.size * 24 <= 4 * trackY.size)
            val trackMiddle = (trackX.first + trackX.last) / 2.0
            val dashMiddle = (dashX.first + dashX.last) / 2.0
            assertTrue("$mode: the dash is centred ($dashMiddle in $trackMiddle)", kotlin.math.abs(trackMiddle - dashMiddle) <= 1.5)
            val trackMiddleY = (trackY.first + trackY.last) / 2.0
            val dashMiddleY = (dashY.first + dashY.last) / 2.0
            assertTrue("$mode: the dash is on the middle line", kotlin.math.abs(trackMiddleY - dashMiddleY) <= 1.5)
        }
    }

    @Test fun anOnTrackStillDrawsItsWhiteThumb() {
        val drawn = draw(dark = false, mixed = false)
        val (trackX, trackY) = checkNotNull(drawn.bounds(theme500, 0 until drawn.width, 0 until drawn.height))
        val (thumbX, thumbY) = checkNotNull(drawn.bounds(white, trackX, trackY))
        assertTrue("the thumb is a disc: ${thumbX.size} by ${thumbY.size}", thumbY.size * 24 >= 16 * trackY.size)
    }
}
