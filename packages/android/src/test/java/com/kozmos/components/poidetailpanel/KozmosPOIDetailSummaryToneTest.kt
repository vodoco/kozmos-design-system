package com.kozmos.components.poidetailpanel

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.width
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.luminance
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.platform.ViewRootForTest
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.unit.dp
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.contracts.KozmosPOIDetailSummary
import com.kozmos.contracts.KozmosPOIDetailSummaryKind
import com.kozmos.contracts.KozmosPOIDetailTone
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * The details card's summary row draws a fact's value, and its icon, in the
 * fact's tone. That is text, so each tone reads at 4.5:1 on the two surfaces
 * the row sits on — the card's own white (background/0), and the sheet's grey
 * (background/100) in the map shell's panel — in light and in dark. The roles
 * are the web summary's (`text-success-text`, `text-warning-text`,
 * `text-destructive-text`, `text-primary`): the emotion's text role, and the
 * theme's 600 for brand. SwiftUI's KozmosPOIDetailSummaryToneTests hold its
 * row to the same.
 *
 * The colour is the one each value's text is laid out with, read from the
 * composition, so it is what is drawn, not a copy of the mapping.
 */
class KozmosPOIDetailSummaryToneTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    private val tones: List<KozmosPOIDetailTone?> = listOf(null) + KozmosPOIDetailTone.entries

    private class Read(val drawn: Map<KozmosPOIDetailTone?, Color>, val roles: Map<KozmosPOIDetailTone?, Color>, val surfaces: Map<String, Color>)

    private fun SemanticsNode.flatten(): List<SemanticsNode> = listOf(this) + children.flatMap { it.flatten() }

    private fun valueOf(tone: KozmosPOIDetailTone?) = "Value ${tone?.value ?: "none"}"

    /** Each tone's value as laid out, and the roles and surfaces as they resolve, in one theme. */
    private fun read(dark: Boolean): Read {
        var read: Read? = null
        paparazzi.snapshot {
            val view = LocalView.current
            CompositionLocalProvider(LocalKozmosUseDarkTokens provides dark) {
                MaterialTheme {
                    val roles = mapOf(
                        null to KozmosThemeTokens.primitivesColorsForeground100,
                        KozmosPOIDetailTone.Neutral to KozmosThemeTokens.primitivesColorsForeground100,
                        KozmosPOIDetailTone.Success to KozmosThemeTokens.semanticsEmotionSuccessText,
                        KozmosPOIDetailTone.Warning to KozmosThemeTokens.semanticsEmotionAlertText,
                        KozmosPOIDetailTone.Danger to KozmosThemeTokens.semanticsEmotionDangerText,
                        KozmosPOIDetailTone.Brand to KozmosThemeTokens.primitivesColorsTheme600
                    )
                    val surfaces = mapOf(
                        "card" to KozmosThemeTokens.primitivesColorsBackground0,
                        "sheet" to KozmosThemeTokens.primitivesColorsBackground100
                    )
                    Box(
                        Modifier
                            .fillMaxSize()
                            .onGloballyPositioned {
                                val nodes = (view as ViewRootForTest).semanticsOwner.unmergedRootSemanticsNode.flatten()
                                val drawn = tones.associateWith { tone ->
                                    val text = nodes.single { node ->
                                        node.config.getOrNull(SemanticsProperties.Text)?.any { it.text == valueOf(tone) } == true
                                    }
                                    val layouts = mutableListOf<TextLayoutResult>()
                                    text.config[SemanticsActions.GetTextLayoutResult].action?.invoke(layouts)
                                    layouts.single().layoutInput.style.color
                                }
                                read = Read(drawn, roles, surfaces)
                            }
                    ) {
                        Column(Modifier.width(320.dp)) {
                            tones.forEach { tone ->
                                POIDetailSummaryRow(
                                    listOf(
                                        KozmosPOIDetailSummary(
                                            id = "fact",
                                            kind = KozmosPOIDetailSummaryKind.Property,
                                            label = "Fact",
                                            value = valueOf(tone),
                                            tone = tone
                                        )
                                    )
                                )
                            }
                        }
                    }
                }
            }
        }
        return checkNotNull(read) { "the summary was never laid out" }
    }

    private fun contrast(a: Color, b: Color): Double {
        val (la, lb) = a.luminance().toDouble() to b.luminance().toDouble()
        return (maxOf(la, lb) + 0.05) / (minOf(la, lb) + 0.05)
    }

    private fun Color.hex() = "#%06X".format(
        ((red * 255).toInt() shl 16) or ((green * 255).toInt() shl 8) or (blue * 255).toInt()
    )

    private fun name(tone: KozmosPOIDetailTone?) = tone?.value ?: "none"

    /** Each tone's value is laid out in the role the web's summary names for it. */
    @Test
    fun eachToneTakesTheWebSummarysTextRole() {
        for (dark in listOf(false, true)) {
            val read = read(dark)
            val theme = if (dark) "dark" else "light"
            for (tone in tones) {
                val drawn = read.drawn.getValue(tone)
                val role = read.roles.getValue(tone)
                assertEquals("$theme ${name(tone)}: ${drawn.hex()}, not the web's role ${role.hex()}", role, drawn)
            }
        }
    }

    /** Every tone's value at 4.5:1 on the card and on the sheet, in light and in dark. */
    @Test
    fun eachToneReadsAt4_5To1OnTheCardAndTheSheetInLightAndDark() {
        val failures = mutableListOf<String>()
        var measured = 0
        for (dark in listOf(false, true)) {
            val read = read(dark)
            val theme = if (dark) "dark" else "light"
            for ((surface, ground) in read.surfaces) {
                for (tone in tones) {
                    val ratio = contrast(read.drawn.getValue(tone), ground)
                    measured++
                    if (ratio < 4.5) failures += "$theme ${name(tone)} on the $surface reads at ${"%.2f".format(ratio)}:1"
                }
            }
        }
        assertEquals(24, measured)
        assertTrue(failures.joinToString("\n"), failures.isEmpty())
    }
}
