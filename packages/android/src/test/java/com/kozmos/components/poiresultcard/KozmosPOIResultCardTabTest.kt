package com.kozmos.components.poiresultcard

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
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
import com.kozmos.contracts.KozmosPOIPresentation
import com.kozmos.contracts.KozmosPOIResultBadgePresentation
import com.kozmos.contracts.KozmosPOIResultPresentation
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import kotlin.math.abs
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * Olcay, 2026-09-29: quick access numbers its results as the map numbers their
 * pins, and the product turns numbering on per list. One tab per card:
 * Featured, then the number, then the badge. A number is quiet at rest and
 * filled with the primary colour when selected; a badge is quiet, with no
 * Featured star or colour (GAP-054).
 */
class KozmosPOIResultCardTabTest {
    private val frames = KeptFrames()

    @get:Rule
    val paparazzi = pixelsPaparazzi(frames)

    private val poi = KozmosPOIPresentation(id = "burger-king", name = "Burger King", floorLabel = "Level 1")

    private fun result(featured: Boolean = false, selected: Boolean = false, badge: String? = null) =
        KozmosPOIResultPresentation(
            poiId = "burger-king",
            resultIndex = 2,
            selected = selected,
            featured = featured,
            badge = badge?.let { KozmosPOIResultBadgePresentation(label = it) }
        )

    /** What TalkBack is told the result is called. */
    private fun name(content: @Composable () -> Unit): String =
        paparazzi.readSemantics { MaterialTheme { content() } }
            .merged.mapNotNull { it.description }.first { "Burger King" in it }

    /** Every word laid out, read or not. */
    private fun texts(content: @Composable () -> Unit): List<String> =
        paparazzi.readSemantics { MaterialTheme { content() } }.unmerged.flatMap { it.texts }

    /** The words TalkBack reads as the result: its merged node's. */
    private fun heard(content: @Composable () -> Unit): List<String> =
        paparazzi.readSemantics { MaterialTheme { content() } }
            .merged.first { it.description?.contains("Burger King") == true }.texts

    // region which tab, and what is heard

    @Test
    fun aNumberShowsOnlyWhenTheProductNumbersTheList() {
        // An upgrade changes nothing: without `numbered` there is no tab.
        assertNull(kozmosPOIResultTab(result(), numbered = false, featuredLabel = "Featured"))
        assertEquals(
            KozmosPOIResultTab.Number("2"),
            kozmosPOIResultTab(result(), numbered = true, featuredLabel = "Featured")
        )
        val plain = name { KozmosPOIResultCard(poi = poi, result = result(), onSelect = {}) }
        assertTrue(plain, plain.startsWith("Burger King"))
    }

    @Test
    fun featuredWinsOverTheNumberAndTheNumberOverTheBadge() {
        // A featured result's pin shows its logo, so its card shows Featured.
        assertEquals(
            KozmosPOIResultTab.Featured("Featured"),
            kozmosPOIResultTab(result(featured = true), numbered = true, featuredLabel = "Featured")
        )
        // The list's numbers match the pins, so the number takes the badge's place.
        assertEquals(
            KozmosPOIResultTab.Number("2"),
            kozmosPOIResultTab(result(badge = "Alternative"), numbered = true, featuredLabel = "Featured")
        )
        assertEquals(
            KozmosPOIResultTab.Badge("Alternative"),
            kozmosPOIResultTab(result(badge = "Alternative"), numbered = false, featuredLabel = "Featured")
        )
        val shown = texts {
            KozmosPOIResultCard(poi = poi, result = result(badge = "Alternative"), onSelect = {}, numbered = true)
        }
        assertTrue(shown.toString(), "Alternative" !in shown)
    }

    @Test
    fun theNumberLeadsWhatTalkBackSaysAndItsTabIsNotReadTwice() {
        val numbered = name { KozmosPOIResultCard(poi = poi, result = result(), onSelect = {}, numbered = true) }
        assertTrue(numbered, numbered.startsWith("2, Burger King"))
        // The tab that draws it is left out of what TalkBack reads, so "2"
        // is not read again; it is still drawn.
        val card: @Composable () -> Unit = {
            KozmosPOIResultCard(poi = poi, result = result(), onSelect = {}, numbered = true)
        }
        assertTrue(heard(card).toString(), "2" !in heard(card))
        assertTrue(texts(card).toString(), "2" in texts(card))
        // Featured shows no number, so none is heard.
        val featured = name {
            KozmosPOIResultCard(poi = poi, result = result(featured = true), onSelect = {}, numbered = true)
        }
        assertTrue(featured, !featured.startsWith("2,"))
        // A badge stays read, as it always was.
        val badge = heard { KozmosPOIResultCard(poi = poi, result = result(badge = "Alternative"), onSelect = {}) }
        assertTrue(badge.toString(), "Alternative" in badge)
        // The product's own words, number and all.
        val own = name {
            KozmosPOIResultCard(
                poi = poi,
                result = result(),
                onSelect = {},
                selectionLabel = "Résultat 2 : Burger King",
                numbered = true
            )
        }
        assertEquals("Résultat 2 : Burger King", own)
    }

    @Test
    fun theListNumbersEveryCardItDraws() {
        val items = listOf(KozmosPOIResultListItem(poi, result()))
        val off = name { KozmosPOIResultList(items = items, resultCountLabel = "1 result", onSelect = {}) }
        assertTrue(off, off.startsWith("Burger King"))
        val on = name {
            KozmosPOIResultList(items = items, resultCountLabel = "1 result", onSelect = {}, numbered = true)
        }
        assertTrue(on, on.startsWith("2, Burger King"))
    }

    // region how each tab is drawn, light and dark

    private fun distance(a: Int, b: Int): Int =
        listOf(16, 8, 0).sumOf { shift -> abs((a shr shift and 0xFF) - (b shr shift and 0xFF)) }

    private fun scene(dark: Boolean, content: @Composable () -> Unit): DrawnPixels = paparazzi.drawn(frames) {
        CompositionLocalProvider(LocalKozmosUseDarkTokens provides dark) {
            Box(Modifier.fillMaxSize().background(KozmosThemeTokens.primitivesColorsBackground0)) {
                Box(Modifier.padding(16.dp)) { MaterialTheme { content() } }
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

    /** How many of the scene's pixels are [colour], give or take antialiasing. */
    private fun pixelsOf(drawn: DrawnPixels, colour: Int): Int {
        var count = 0
        for (y in 0 until drawn.height) for (x in 0 until drawn.width) {
            if (distance(drawn.argb(x, y), colour) <= 6) count++
        }
        return count
    }

    /**
     * GAP-054, drawn, through the card's released parameters only: a badge's
     * tab fills with the muted colour and nothing is painted in Featured's
     * alert colour, light and dark. The card that painted a badge as Featured
     * fails it.
     */
    @Test
    fun aBadgeIsDrawnQuietNotInFeaturedsColour() {
        val wrong = mutableListOf<String>()
        for (dark in listOf(false, true)) {
            val theme = if (dark) "dark" else "light"
            val muted = swatch(dark) { KozmosThemeTokens.primitivesColorsBackground100 }
            val alert = swatch(dark) { KozmosThemeTokens.componentsPrimaryButtonsAlertButtonBackgroundIdle }
            val badge = scene(dark) { KozmosPOIResultCard(poi = poi, result = result(badge = "Alternative"), onSelect = {}) }
            val badgeMuted = pixelsOf(badge, muted)
            val badgeAlert = pixelsOf(badge, alert)
            println("GAP-054 Android, $theme: the badge draws $badgeMuted muted pixels and $badgeAlert in Featured's ${DrawnPixels.hex(alert)}")
            if (badgeAlert > 0) wrong += "$theme: the badge paints $badgeAlert pixels in Featured's colour"
            if (badgeMuted < 50) wrong += "$theme: the badge's tab is not the muted fill ($badgeMuted pixels)"
        }
        assertTrue(wrong.joinToString("; "), wrong.isEmpty())
    }

    /** A selected number fills with the primary colour; at rest it does not. */
    @Test
    fun onlyASelectedNumberFillsWithThePrimaryColour() {
        val wrong = mutableListOf<String>()
        for (dark in listOf(false, true)) {
            val theme = if (dark) "dark" else "light"
            val primary = swatch(dark) { KozmosThemeTokens.primitivesColorsTheme600 }
            val rest = scene(dark) { KozmosPOIResultCard(poi = poi, result = result(), onSelect = {}, numbered = true) }
            val selected = scene(dark) {
                KozmosPOIResultCard(poi = poi, result = result(selected = true), onSelect = {}, numbered = true)
            }
            val (restPrimary, selectedPrimary) = pixelsOf(rest, primary) to pixelsOf(selected, primary)
            println("GAP-054 Android, $theme: primary pixels, number at rest $restPrimary, selected $selectedPrimary")
            if (restPrimary > 0) wrong += "$theme: a number at rest is painted in the primary colour ($restPrimary pixels)"
            if (selectedPrimary < 50) wrong += "$theme: a selected number is not filled with the primary colour ($selectedPrimary pixels)"
        }
        assertTrue(wrong.joinToString("; "), wrong.isEmpty())
    }

    /** Each tab's words read at 4.5:1 or more on its fill, in both themes. */
    @Test
    fun eachTabsWordsReadAtFourAndAHalfToOne() {
        val wrong = mutableListOf<String>()
        fun luminance(argb: Int): Double {
            fun channel(v: Int): Double {
                val c = v / 255.0
                return if (c <= 0.04045) c / 12.92 else Math.pow((c + 0.055) / 1.055, 2.4)
            }
            return 0.2126 * channel(argb shr 16 and 0xFF) + 0.7152 * channel(argb shr 8 and 0xFF) + 0.0722 * channel(argb and 0xFF)
        }
        for (dark in listOf(false, true)) {
            val theme = if (dark) "dark" else "light"
            for ((name, tab, selected) in listOf(
                Triple("featured", KozmosPOIResultTab.Featured("Featured"), false),
                Triple("number at rest", KozmosPOIResultTab.Number("2"), false),
                Triple("number selected", KozmosPOIResultTab.Number("2"), true),
                Triple("badge", KozmosPOIResultTab.Badge("Alternative"), false)
            )) {
                val fill = swatch(dark) { kozmosPOIResultTabPaint(tab, selected).fill }
                val ink = swatch(dark) { kozmosPOIResultTabPaint(tab, selected).ink }
                val (a, b) = luminance(fill) to luminance(ink)
                val ratio = (maxOf(a, b) + 0.05) / (minOf(a, b) + 0.05)
                println("GAP-054 Android, $theme: $name ${"%.2f".format(ratio)}:1")
                if (ratio < 4.5) wrong += "$theme $name: ${"%.2f".format(ratio)}:1, under 4.5:1"
            }
        }
        assertTrue(wrong.joinToString("; "), wrong.isEmpty())
    }
}
