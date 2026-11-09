package com.kozmos.components.input

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Star
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.ClipboardManager
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.state.ToggleableState
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.unit.dp
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.foundation.layout.fillMaxSize
import com.kozmos.components.DrawnPixels
import com.kozmos.components.KeptFrames
import com.kozmos.components.drawn
import com.kozmos.components.pixelsPaparazzi
import com.kozmos.components.readSettledSemantics
import com.kozmos.components.live
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * GAP-154, decision 137: Input's `action`, a button inside the field's end,
 * as React's has been since 0.15.0 (#434). A copy copies the field's value,
 * from a read-only field too, and says so in a polite live region; a toggle
 * is a toggle with its own name, on while pressed, and pressed draws the
 * theme fill in decision 164's shape: 4 in from the 44 button's edges, 36
 * across (decision 165).
 */
class KozmosInputActionTest {
    private val frames = KeptFrames()
    @get:Rule val paparazzi = pixelsPaparazzi(frames)

    private class Clipboard : ClipboardManager {
        var kept: AnnotatedString? = null
        override fun getText() = kept
        override fun setText(annotatedString: AnnotatedString) { kept = annotatedString }
    }

    /**
     * Pressed in a live composition, so the state the press writes is sent on
     * at a frame: a click on what readSettledSemantics returned writes it
     * outside one and stalls Compose's shared main dispatcher for every later
     * test (the hazard `live` documents).
     */
    @Test fun copyCopiesAReadOnlyFieldsValueAndSaysSo() {
        val clipboard = Clipboard()
        var copied: String? = null
        paparazzi.live(content = {
            CompositionLocalProvider(LocalClipboardManager provides clipboard) {
                KozmosMaterialTheme {
                    KozmosInput(value = "FID-0042", onValueChange = {}, label = "Feature ID", readOnly = true,
                        action = KozmosInputAction.Copy(onCopy = { copied = it }))
                }
            }
        }) {
            frames(2)
            val copy = read().named("Copy")
            assertTrue("a read-only field's copy is disabled", copy.enabled)
            val polite = { read().merged.single { it.liveRegion == LiveRegionMode.Polite } }
            assertNull("it says something before a copy", polite().description)
            assertTrue(copy.click!!.invoke())
            frames(3)
            assertEquals("FID-0042", clipboard.kept?.text)
            assertEquals("FID-0042", copied)
            assertEquals("the live region does not say it copied", "Copied", polite().description)
        }
    }

    @Test fun copyTakesItsName() {
        val named = paparazzi.readSettledSemantics {
            KozmosMaterialTheme {
                KozmosInput(value = "x", onValueChange = {}, action = KozmosInputAction.Copy(label = "Kopieren"))
            }
        }
        assertTrue(named.names().contains("Kopieren"))
    }

    @Test fun aDisabledFieldsActionIsDisabled() {
        val disabled = paparazzi.readSettledSemantics {
            KozmosMaterialTheme {
                KozmosInput(value = "x", onValueChange = {}, enabled = false, action = KozmosInputAction.Copy())
            }
        }
        assertFalse(disabled.named("Copy").enabled)
    }

    @Test fun theToggleIsNamedOffAndPressesWhenActivated() {
        var pressed = false
        val tree = paparazzi.readSettledSemantics {
            KozmosMaterialTheme {
                KozmosInput(value = "Lobby", onValueChange = {}, label = "Name",
                    action = KozmosInputAction.Toggle("Featured", Icons.Default.Star, false) { pressed = it })
            }
        }
        val toggle = tree.named("Featured")
        assertEquals(ToggleableState.Off, toggle.toggleableState)
        assertTrue(toggle.click!!.invoke())
        assertTrue("activating it asked for nothing", pressed)
    }

    @Test fun aPressedToggleIsOn() {
        val on = paparazzi.readSettledSemantics {
            KozmosMaterialTheme {
                KozmosInput(value = "Lobby", onValueChange = {},
                    action = KozmosInputAction.Toggle("Featured", Icons.Default.Star, true) {})
            }
        }
        assertEquals(ToggleableState.On, on.named("Featured").toggleableState)
    }

    @Test fun pressedDrawsTheThemeFillInsideTheButton() = pressedFill(pressed = true)

    @Test fun anUnpressedToggleDrawsNoFill() = pressedFill(pressed = false)

    private fun pressedFill(pressed: Boolean) {
        var density = 1f
        var canvas = 0
        val drawn = paparazzi.drawn(frames) {
            density = LocalDensity.current.density
            CompositionLocalProvider(LocalKozmosUseDarkTokens provides false) {
                KozmosMaterialTheme {
                    Box(Modifier.fillMaxSize().onGloballyPositioned { canvas = it.size.width }) {
                        Box(Modifier.padding(16.dp).width(300.dp)) {
                            KozmosInput(value = "Lobby", onValueChange = {},
                                action = KozmosInputAction.Toggle("Featured", Icons.Default.Star, pressed) {})
                        }
                    }
                }
            }
        }
        // Drawn pixels per dp: Paparazzi scales the frame it keeps.
        val perDp = drawn.width.toFloat() / canvas * density
        // The theme fill, #135BEC.
        val fill = (0 until drawn.width).flatMap { x ->
            (0 until drawn.height).mapNotNull { y -> if (DrawnPixels.matches(drawn.argb(x, y), 0xFF135BEC.toInt(), 6)) x to y else null }
        }
        if (!pressed) {
            assertTrue("an unpressed toggle draws a fill", fill.isEmpty())
            return
        }
        assertTrue("no theme fill drawn", fill.isNotEmpty())
        val width = (fill.maxOf { it.first } - fill.minOf { it.first } + 1) / perDp
        val height = (fill.maxOf { it.second } - fill.minOf { it.second } + 1) / perDp
        assertEquals("36 across", 36f, width, 1.5f)
        assertEquals("36 tall", 36f, height, 1.5f)
        // The field ends at 316; the button is its last 44, the fill 4 in.
        assertEquals("4 in from the button's end", 4f, 316f - (fill.maxOf { it.first } + 1) / perDp, 1.5f)
    }
}
