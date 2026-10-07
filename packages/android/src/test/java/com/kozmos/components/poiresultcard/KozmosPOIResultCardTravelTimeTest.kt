package com.kozmos.components.poiresultcard

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.kozmos.components.DrawnPixels
import com.kozmos.components.KeptFrames
import com.kozmos.components.drawn
import com.kozmos.components.pixelsPaparazzi
import com.kozmos.components.poiresultlist.KozmosPOIResultList
import com.kozmos.components.poiresultlist.KozmosPOIResultListItem
import com.kozmos.components.readSemantics
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.contracts.KozmosPOIPresentation
import com.kozmos.contracts.KozmosPOIResultPresentation
import com.kozmos.contracts.KozmosTravelEstimatePresentation
import com.kozmos.contracts.KozmosTravelTimeBand
import com.kozmos.contracts.KozmosTravelTimeTone
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min
import kotlin.math.pow
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * Decision 50 (Olcay, 2026-09-28; GAP-088): a result list shows the walk as a
 * band. Nearby is drawn in the success emotion's Text role, the other bands in
 * the card's text colour, and a result given no band keeps the exact minutes,
 * as the details card always does.
 */
class KozmosPOIResultCardTravelTimeTest {
    private val frames = KeptFrames()

    @get:Rule
    val paparazzi = pixelsPaparazzi(frames)

    private val poi = KozmosPOIPresentation(id = "gate-12", name = "Gate 12", floorLabel = "Level 1")

    private fun result(band: KozmosTravelTimeBand?, selected: Boolean = false) = KozmosPOIResultPresentation(
        poiId = "gate-12",
        resultIndex = 0,
        selected = selected,
        travelEstimate = KozmosTravelEstimatePresentation(durationSeconds = 45.0, durationLabel = "1 min", band = band)
    )

    @Composable
    private fun Card(
        band: KozmosTravelTimeBand?,
        labels: Map<KozmosTravelTimeBand, String> = emptyMap(),
        selected: Boolean = false
    ) {
        KozmosMaterialTheme {
            KozmosPOIResultCard(poi = poi, result = result(band, selected), onSelect = {}, travelTimeBandLabels = labels)
        }
    }

    /** The texts the card lays out, and the name TalkBack is given for it. */
    private fun read(content: @Composable () -> Unit): Pair<List<String>, String> {
        val semantics = paparazzi.readSemantics(content)
        // The row's own text is what it says, not what it draws.
        val texts = semantics.unmerged.filter { it.click == null }.flatMap { it.texts }
        val name = semantics.merged.mapNotNull { it.words }.first { "Gate 12" in it }
        return texts to name
    }

    // region what the card says

    @Test
    fun aWalkUnderAMinuteReadsNearbyAndTalkBackHearsNearby() {
        val (texts, name) = read { Card(KozmosTravelTimeBand.Nearby) }
        assertTrue(texts.toString(), "Nearby" in texts)
        assertTrue(texts.toString(), "1 min" !in texts)
        // The word is the signal, so the tone is never carried by colour alone.
        assertTrue(name, "Nearby" in name)
        assertTrue(name, "1 min" !in name)
    }

    @Test
    fun eachBandReadsItsEnglishWordsUntilTheProductGivesItsOwn() {
        assertEquals(
            listOf("Nearby", "1–2 min", "2–5 min", "5–10 min", "More than 10 min"),
            KozmosTravelTimeBand.values().map { band ->
                read { Card(band) }.first.single { it != "Gate 12" && it != "Level 1" }
            }
        )
        val french = mapOf(KozmosTravelTimeBand.Nearby to "À proximité")
        assertTrue("À proximité" in read { Card(KozmosTravelTimeBand.Nearby, french) }.first)
        assertTrue("2–5 min" in read { Card(KozmosTravelTimeBand.TwoToFiveMinutes, french) }.first)
    }

    @Test
    fun withoutABandTheCardKeepsTheExactMinutes() {
        // The guard: every product that has not adopted bands draws as it did.
        val (texts, name) = read { Card(null) }
        assertTrue(texts.toString(), "1 min" in texts)
        assertTrue(name, "1 min" in name)
    }

    @Test
    fun theListGivesEveryResultTheProductsWords() {
        // The card holds the words, so the list must hand them on, or a
        // translated product reads "Nearby" in English in every list.
        val texts = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosPOIResultList(
                    items = listOf(KozmosPOIResultListItem(poi, result(KozmosTravelTimeBand.Nearby))),
                    resultCountLabel = "1 result",
                    onSelect = {},
                    travelTimeBandLabels = mapOf(KozmosTravelTimeBand.Nearby to "À proximité")
                )
            }
        }.unmerged.flatMap { it.texts }
        assertTrue(texts.toString(), "À proximité" in texts)
        assertTrue(texts.toString(), "Nearby" !in texts)
    }

    // region what the card draws, light and dark

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

    private fun distance(a: Int, b: Int): Int =
        listOf(16, 8, 0).sumOf { shift -> abs((a shr shift and 0xFF) - (b shr shift and 0xFF)) }

    /** The card, 16dp in, on the page's own colour, in the theme asked for. */
    private fun scene(dark: Boolean, content: @Composable () -> Unit): DrawnPixels = paparazzi.drawn(frames) {
        CompositionLocalProvider(LocalKozmosUseDarkTokens provides dark) {
            Box(Modifier.fillMaxSize().background(KozmosThemeTokens.primitivesColorsBackground0)) {
                Box(Modifier.padding(16.dp)) { content() }
            }
        }
    }

    private fun swatch(dark: Boolean, colour: @Composable () -> Color): Int {
        val drawn = paparazzi.drawn(frames) {
            CompositionLocalProvider(LocalKozmosUseDarkTokens provides dark) {
                Box(Modifier.fillMaxSize().background(colour()))
            }
        }
        return drawn.argb(drawn.width / 2, drawn.height / 2)
    }

    private class Read(val ratio: Double, val core: Int, val behind: Int, val pixels: Int)

    /**
     * The travel time's glyphs: the pixels the words draw and the same card
     * with them as spaces does not. Their core is the pixel furthest in
     * luminance from what lies behind it, and their contrast its WCAG ratio
     * with the least contrasting pixel behind them. Null if nothing differs.
     */
    private fun glyphs(drawn: DrawnPixels, blanked: DrawnPixels): Read? {
        val found = mutableListOf<Pair<Int, Int>>()
        for (y in 0 until drawn.height) for (x in 0 until drawn.width) {
            val (a, b) = drawn.argb(x, y) to blanked.argb(x, y)
            if (distance(a, b) > 24) found += a to b
        }
        val core = found.maxByOrNull { (a, b) -> abs(luminance(a) - luminance(b)) } ?: return null
        val worst = found.minBy { (_, b) -> contrast(core.first, b) }
        return Read(contrast(core.first, worst.second), core.first, worst.second, found.size)
    }

    /**
     * Nearby draws in the success colour and reads at 4.5:1 or more on the
     * card, at rest and selected, light and dark; 5–10 min draws in the
     * card's text colour. A drawn colour is the swatch it is nearer to.
     */
    @Test
    fun nearbyDrawsInTheSuccessColourAtFourAndAHalfToOneAndTheOtherBandsInTheTextColour() {
        val wrong = mutableListOf<String>()
        for (dark in listOf(false, true)) {
            val theme = if (dark) "dark" else "light"
            val success = swatch(dark) { KozmosThemeTokens.semanticsEmotionSuccessText }
            val ink = swatch(dark) { KozmosThemeTokens.primitivesColorsForeground100 }
            for ((band, selected) in listOf(
                KozmosTravelTimeBand.Nearby to false,
                KozmosTravelTimeBand.Nearby to true,
                KozmosTravelTimeBand.FiveToTenMinutes to false
            )) {
                val name = "${band.value} ${if (selected) "selected" else "at rest"}, $theme"
                val spaces = " ".repeat(englishTravelTimeBandLabel(band).length)
                val drawn = scene(dark) { Card(band, selected = selected) }
                val blanked = scene(dark) { Card(band, mapOf(band to spaces), selected) }
                val at = glyphs(drawn, blanked)
                if (at == null) {
                    wrong += "$name: the travel time was not drawn"
                    continue
                }
                val nearer = if (distance(at.core, success) < distance(at.core, ink)) "success" else "ink"
                val said = "$name: ${"%.2f".format(at.ratio)}:1, text ${DrawnPixels.hex(at.core)} over ${DrawnPixels.hex(at.behind)}, " +
                    "nearer the $nearer ${DrawnPixels.hex(if (nearer == "success") success else ink)}, ${at.pixels} pixels"
                println("Decision 50 Android: $said")
                if (at.ratio < 4.5) wrong += "$said: under 4.5:1"
                if (nearer != (if (band.tone == KozmosTravelTimeTone.Success) "success" else "ink")) wrong += "$said: the wrong colour"
            }
        }
        assertTrue(wrong.joinToString("; "), wrong.isEmpty())
    }
}
