package com.kozmos.components.poiresultcard

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.LayoutDirection
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
import kotlin.math.roundToInt
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

    /** The tab shares the card's top-start corner, not a padded pill above its content. */
    @Test
    fun everyTabIsInsideTheTopStartCornerWithSpaceBeforeTheTitle() {
        val wrong = mutableListOf<String>()
        for (direction in listOf(LayoutDirection.Ltr, LayoutDirection.Rtl)) {
            for ((label, value, numbered) in listOf(
                Triple("2", result(), true),
                Triple("2", result(selected = true), true),
                Triple("Featured", result(featured = true), true),
                Triple("Featured", result(featured = true, selected = true), true),
                Triple("Alternative", result(badge = "Alternative"), false)
            )) {
                var density = 1f
                val read = paparazzi.readSemantics {
                    density = LocalDensity.current.density
                    CompositionLocalProvider(LocalLayoutDirection provides direction) {
                        Box(Modifier.padding(16.dp).width(240.dp)) {
                            MaterialTheme {
                                KozmosPOIResultCard(poi = poi, result = value, onSelect = {}, numbered = numbered)
                            }
                        }
                    }
                }
                val card = read.merged.first { it.description?.contains("Burger King") == true }.bounds
                val words = read.unmerged.single { it.texts == listOf(label) }.bounds
                val title = read.unmerged.single { it.texts == listOf("Burger King") }.bounds
                val top = (words.top - card.top) / density
                val start = if (direction == LayoutDirection.Ltr) {
                    (words.left - card.left) / density
                } else {
                    (card.right - words.right) / density
                }
                val expectedStart = if (label == "Featured") 20f else 6f // 6 inset + 10 star + 4 gap
                val case = "$direction $label selected=${value.selected}"
                if (top !in 0f..2f) wrong += "$case: tab text starts $top dp below the card, not inside its 16dp corner"
                if (abs(start - expectedStart) > 1f) wrong += "$case: logical text inset is $start dp, expected $expectedStart"
                if (words.height / density > 14.5f) wrong += "$case: tab line is ${words.height / density} dp, expected 14"
                if ((title.top - card.top) / density < 24f) wrong += "$case: title overlaps the tab's 16dp height and 8dp clearance"
            }
        }
        assertTrue(wrong.joinToString("; "), wrong.isEmpty())
    }

    /** Pixel evidence: the outer curve belongs to the card; only the bottom-end corner bends inward. */
    @Test
    fun filledTabsShareTheOuterCurveAndOnlyRoundTheirInnerCornerInBothDirections() {
        val wrong = mutableListOf<String>()
        for (direction in listOf(LayoutDirection.Ltr, LayoutDirection.Rtl)) {
            for (featured in listOf(false, true)) {
                var density = 1f
                var canvasWidth = 1
                var canvasHeight = 1
                val value = result(featured = featured, selected = !featured)
                val label = if (featured) "Featured" else "2"
                val fill = swatch(false) {
                    if (featured) KozmosThemeTokens.semanticsEmotionAlertFill else KozmosThemeTokens.primitivesColorsTheme600
                }
                val background = swatch(false) { KozmosThemeTokens.primitivesColorsBackground0 }
                val read = paparazzi.readSemantics {
                    density = LocalDensity.current.density
                    CompositionLocalProvider(LocalLayoutDirection provides direction, LocalKozmosUseDarkTokens provides false) {
                        Box(Modifier.fillMaxSize().background(Color.Magenta).onGloballyPositioned {
                            canvasWidth = it.size.width
                            canvasHeight = it.size.height
                        }) {
                            Box(Modifier.padding(16.dp).width(240.dp)) {
                                MaterialTheme {
                                    KozmosPOIResultCard(poi = poi, result = value, onSelect = {}, numbered = true)
                                }
                            }
                        }
                    }
                }
                val drawn = DrawnPixels(checkNotNull(frames.last))
                val card = read.merged.first { it.description?.contains("Burger King") == true }.bounds
                val words = read.unmerged.single { it.texts == listOf(label) }.bounds
                val end = if (direction == LayoutDirection.Ltr) words.right + 6 * density else words.left - 6 * density
                // Paparazzi's image may be downscaled from the layout's physical pixels.
                fun pixel(x: Float, y: Float): Int = drawn.argb(
                    (x * drawn.width / canvasWidth).roundToInt(),
                    (y * drawn.height / canvasHeight).roundToInt()
                )
                fun pixelFromEnd(inset: Float, top: Float): Int {
                    val x = if (direction == LayoutDirection.Ltr) end - inset * density else end + inset * density
                    return pixel(x, card.top + top * density)
                }
                val startX = if (direction == LayoutDirection.Ltr) card.left + 3 * density else card.right - 3 * density
                val case = "$direction $label"
                if (!DrawnPixels.matches(pixelFromEnd(2f, 3f), fill, 8)) wrong += "$case: top-end is not a square filled corner"
                if (!DrawnPixels.matches(pixel(startX, card.top + 13 * density), fill, 8)) {
                    wrong += "$case: bottom-start is not flush with the card's outer curve"
                }
                if (!DrawnPixels.matches(pixelFromEnd(1f, 15f), background, 8)) wrong += "$case: bottom-end has no inward rounded corner"
                if (!DrawnPixels.matches(pixelFromEnd(3f, 18f), background, 8)) wrong += "$case: tab extends below its 16dp height"
                val outsideX = if (direction == LayoutDirection.Ltr) card.left + density else card.right - density
                if (!DrawnPixels.matches(pixel(outsideX, card.top + density), 0xFFFF00FF.toInt(), 8)) {
                    wrong += "$case: tab paints outside the parent's rounded corner"
                }
            }
        }
        assertTrue(wrong.joinToString("; "), wrong.isEmpty())
    }

    @Test
    fun largerTextKeepsTheTabAndTitleApartWithoutShrinkingTheWords() {
        var density = 1f
        val read = paparazzi.readSemantics {
            density = LocalDensity.current.density
            CompositionLocalProvider(LocalDensity provides Density(density, fontScale = 2f)) {
                Box(Modifier.padding(16.dp).width(240.dp)) {
                    MaterialTheme {
                        KozmosPOIResultCard(poi = poi, result = result(featured = true), onSelect = {})
                    }
                }
            }
        }
        val tab = read.unmerged.single { it.texts == listOf("Featured") }.bounds
        val title = read.unmerged.single { it.texts == listOf("Burger King") }.bounds
        assertTrue("The tab must preserve its scaled 28dp line, not clip or shrink it: $tab", tab.height / density >= 27.5f)
        // Android's SP conversion can be nonlinear. Check the measured words,
        // not an assumed 16 * fontScale box: no text may eat into the gap.
        assertTrue("The enlarged tab needs 8dp before the title: tab=$tab title=$title", (title.top - tab.bottom) / density >= 8f)
    }

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
            // Featured's colour as the released card drew it, and as it is now.
            val alert = swatch(dark) { KozmosThemeTokens.componentsPrimaryButtonsAlertButtonBackgroundIdle }
            val amber = swatch(dark) { KozmosThemeTokens.semanticsEmotionAlertFill }
            val badge = scene(dark) { KozmosPOIResultCard(poi = poi, result = result(badge = "Alternative"), onSelect = {}) }
            val badgeMuted = pixelsOf(badge, muted)
            val badgeAlert = pixelsOf(badge, alert) + pixelsOf(badge, amber)
            println("GAP-054 Android, $theme: the badge draws $badgeMuted muted pixels and $badgeAlert in Featured's ${DrawnPixels.hex(alert)} or ${DrawnPixels.hex(amber)}")
            if (badgeAlert > 0) wrong += "$theme: the badge paints $badgeAlert pixels in Featured's colour"
            if (badgeMuted < 50) wrong += "$theme: the badge's tab is not the muted fill ($badgeMuted pixels)"
        }
        assertTrue(wrong.joinToString("; "), wrong.isEmpty())
    }

    /**
     * Featured is the SDK's bright amber (Olcay, 2026-09-29): its tab and, at
     * rest, the card's edge. Selected, the edge is the theme's, as every
     * selected card's is: a native card has no ring to say it with.
     */
    @Test
    fun featuredIsTheAmberTabAndEdgeAndSelectionKeepsTheThemesEdge() {
        val wrong = mutableListOf<String>()
        for (dark in listOf(false, true)) {
            val theme = if (dark) "dark" else "light"
            val amber = swatch(dark) { KozmosThemeTokens.semanticsEmotionAlertFill }
            val themed = swatch(dark) { KozmosThemeTokens.primitivesColorsTheme500 }
            val rest = scene(dark) { KozmosPOIResultCard(poi = poi, result = result(featured = true), onSelect = {}) }
            val selected = scene(dark) {
                KozmosPOIResultCard(poi = poi, result = result(featured = true, selected = true), onSelect = {})
            }
            val (restAmber, selectedAmber) = pixelsOf(rest, amber) to pixelsOf(selected, amber)
            val selectedThemed = pixelsOf(selected, themed)
            println("GAP-054 Android, $theme: amber pixels, featured at rest $restAmber, selected $selectedAmber; theme edge when selected $selectedThemed")
            // The tab alone is a few hundred pixels; its edge adds a thousand more.
            if (restAmber < selectedAmber + 300) wrong += "$theme: a featured card's edge is not its amber ($restAmber at rest, $selectedAmber selected)"
            if (selectedAmber < 50) wrong += "$theme: the Featured tab is not the amber ($selectedAmber pixels)"
            if (selectedThemed < 300) wrong += "$theme: a selected featured card lost the theme's edge ($selectedThemed pixels)"
            val edges = listOf(
                Triple("featured", false, true) to amber,
                Triple("featured and selected", true, true) to themed,
                Triple("plain", false, false) to swatch(dark) { KozmosThemeTokens.semanticsBorderSubtle }
            )
            for ((case, want) in edges) {
                val got = swatch(dark) { kozmosPOIResultCardEdge(selected = case.second, featured = case.third) }
                if (got != want) wrong += "$theme ${case.first}: the edge is ${DrawnPixels.hex(got)}, not ${DrawnPixels.hex(want)}"
            }
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
