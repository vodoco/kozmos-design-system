package com.kozmos.components.button

import androidx.compose.foundation.background
import androidx.compose.foundation.interaction.FocusInteraction
import androidx.compose.foundation.interaction.Interaction
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.PressInteraction
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.dp
import com.kozmos.components.DrawnPixels
import com.kozmos.components.KeptFrames
import com.kozmos.components.card.KozmosCard
import com.kozmos.components.card.KozmosCardHeader
import com.kozmos.components.card.KozmosCardHeaderTone
import com.kozmos.components.card.KozmosCardTitle
import com.kozmos.components.drawn
import com.kozmos.components.pixelsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import kotlinx.coroutines.awaitCancellation
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * The subtle Button (GAP-200, decision 135) and CardHeader's subtle strip
 * (CLOUD-UI-001), read off what is drawn in the light and the dark: the
 * subtle Button is theme 0 at rest, theme 100 focused and theme 200 held
 * down, never the theme fill; its destructive tone (decision 139) is danger
 * 0; and the strip is theme 0. The colours are written out: they are what the
 * decisions and the tokens say, and the ramp turns over in the dark. Drawn at
 * twice the density on the map's mid grey and found by their colour, as
 * KozmosThemeFillStatesPixelsTest reads the theme fill.
 */
class KozmosSubtleFillPixelsTest {
    private val frames = KeptFrames()

    @get:Rule
    val paparazzi = pixelsPaparazzi(frames)

    private val grey = 0xFF808080.toInt()
    private val themeFill = 0xFF135BEC.toInt()
    private fun mode(dark: Boolean) = if (dark) "dark" else "light"
    private fun theme0(dark: Boolean) = if (dark) 0xFF051C4F.toInt() else 0xFFF1F5FE.toInt()
    private fun theme100(dark: Boolean) = if (dark) 0xFF082975.toInt() else 0xFFCAD9FC.toInt()
    private fun theme200(dark: Boolean) = if (dark) 0xFF0B369C.toInt() else 0xFFA4BEF9.toInt()
    private fun danger0(dark: Boolean) = if (dark) 0xFF430915.toInt() else 0xFFFCEAEE.toInt()

    /** An interaction source that holds [interaction] from the moment it is watched. */
    private class Held(private val interaction: Interaction) : MutableInteractionSource {
        override val interactions: Flow<Interaction> = flow {
            emit(interaction)
            awaitCancellation()
        }
        override suspend fun emit(interaction: Interaction) {}
        override fun tryEmit(interaction: Interaction): Boolean = true
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
                            .padding(8.dp)
                    ) { content() }
                }
            }
        }

    private fun DrawnPixels.count(colour: Int, tolerance: Int = 2): Int {
        var found = 0
        for (y in 0 until height) for (x in 0 until width) if (DrawnPixels.matches(argb(x, y), colour, tolerance)) found++
        return found
    }

    /** [part] draws [expected] over at least 100 pixels and never the theme fill. */
    private fun drawsOnly(dark: Boolean, what: String, expected: Int, part: @Composable () -> Unit): List<String> {
        val drawn = draw(dark, part)
        val at = drawn.count(expected)
        val fill = drawn.count(themeFill)
        println("GAP-200 Android, ${mode(dark)}: $what: $at pixels of ${DrawnPixels.hex(expected)}, $fill of #135BEC")
        val wrong = mutableListOf<String>()
        if (at < 100) wrong += "${mode(dark)}: $what draws only $at pixels of ${DrawnPixels.hex(expected)}"
        if (fill > 0) wrong += "${mode(dark)}: $what draws $fill pixels of the theme fill"
        return wrong
    }

    @Test
    fun theSubtleButtonIsThemeZeroAtRest() {
        val wrong = mutableListOf<String>()
        for (dark in listOf(false, true)) {
            wrong += drawsOnly(dark, "a subtle Button", theme0(dark)) {
                KozmosButton(onClick = {}, variant = KozmosButtonVariant.Subtle) { Text("Add additional field") }
            }
        }
        assertTrue(wrong.joinToString("\n"), wrong.isEmpty())
    }

    @Test
    fun aFocusedSubtleButtonIsThemeOneHundred() {
        val wrong = mutableListOf<String>()
        for (dark in listOf(false, true)) {
            wrong += drawsOnly(dark, "a focused subtle Button", theme100(dark)) {
                KozmosButton(onClick = {}, variant = KozmosButtonVariant.Subtle, interactionSource = Held(FocusInteraction.Focus())) {
                    Text("Add additional field")
                }
            }
        }
        assertTrue(wrong.joinToString("\n"), wrong.isEmpty())
    }

    private fun pressed(dark: Boolean) {
        val wrong = drawsOnly(dark, "a pressed subtle Button", theme200(dark)) {
            KozmosButton(
                onClick = {},
                variant = KozmosButtonVariant.Subtle,
                interactionSource = Held(PressInteraction.Press(Offset.Zero))
            ) { Text("Add additional field") }
        }
        assertTrue(wrong.joinToString("\n"), wrong.isEmpty())
    }

    @Test fun aPressedSubtleButtonIsThemeTwoHundredInTheLight() = pressed(dark = false)
    @Test fun aPressedSubtleButtonIsThemeTwoHundredInTheDark() = pressed(dark = true)

    @Test
    fun theDestructiveSubtleButtonIsDangerZero() {
        val wrong = mutableListOf<String>()
        for (dark in listOf(false, true)) {
            wrong += drawsOnly(dark, "a destructive subtle Button", danger0(dark)) {
                KozmosButton(onClick = {}, variant = KozmosButtonVariant.Subtle, emotion = KozmosButtonEmotion.Danger) {
                    Text("Delete feature")
                }
            }
        }
        assertTrue(wrong.joinToString("\n"), wrong.isEmpty())
    }

    @Test
    fun theSubtleCardHeaderIsThemeZero() {
        val wrong = mutableListOf<String>()
        for (dark in listOf(false, true)) {
            wrong += drawsOnly(dark, "a subtle CardHeader", theme0(dark)) {
                KozmosCard(Modifier.width(240.dp)) {
                    KozmosCardHeader(tone = KozmosCardHeaderTone.Subtle) { KozmosCardTitle(title = "Add beacon") }
                }
            }
        }
        assertTrue(wrong.joinToString("\n"), wrong.isEmpty())
    }
}
