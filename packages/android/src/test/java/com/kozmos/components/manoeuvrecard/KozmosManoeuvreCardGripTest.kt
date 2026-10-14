package com.kozmos.components.manoeuvrecard

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.layout.boundsInRoot
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
import com.kozmos.components.directionstep.DirectionType
import com.kozmos.components.drawn
import com.kozmos.components.pixelsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import kotlin.math.abs
import kotlin.math.pow
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * GAP-140, decision 74: the card's grip sits near its bottom edge, its
 * bottom 4dp above the card's, as an iOS sheet's grabber does, where it sat
 * centred in its target about 25 above it; its target stays 48dp or more,
 * growing upward. On the theme appearance it is the guidance foreground at
 * 62%, quieter than the instruction and still 3:1 or more on the theme fill
 * (60% read 2.99:1); on the background appearance it keeps background/300.
 * Read off the drawing, open and closed, in both themes: the card's bounds
 * from its layout, the bar from the pixels in the card's middle column above
 * its bottom edge. Paparazzi scales its frames down, so a length is found
 * from the frame's width against the root's, never from dp and density alone.
 */
class KozmosManoeuvreCardGripTest {
    private val frames = KeptFrames()

    @get:Rule
    val paparazzi = pixelsPaparazzi(frames)

    private class Grip(
        /** From the bar's bottom edge to the card's, in dp. */
        val bottomDp: Float,
        val heightDp: Float,
        /** The bar's colour at its middle, as drawn over the card. */
        val bar: Int,
        /** The card's own colour just below the bar. */
        val fill: Int,
        /** The open card's Hide target, in dp; null closed, where it has no semantics. */
        val targetHeightDp: Float?,
        val barInTarget: Boolean
    )

    private fun SemanticsNode.flatten(): List<SemanticsNode> = listOf(this) + children.flatMap { it.flatten() }

    private val colours = mutableMapOf<String, Int>()

    private fun grip(appearance: KozmosManoeuvreAppearance, expanded: Boolean, dark: Boolean): Grip {
        var card = Rect.Zero
        var target: Rect? = null
        var rootWidth = 0
        var density = 1f
        val pixels = paparazzi.drawn(frames) {
            val view = LocalView.current
            CompositionLocalProvider(LocalKozmosUseDarkTokens provides dark) {
                colours["theme"] = KozmosThemeTokens.componentsPrimaryButtonsThemedButtonBackgroundIdle.toArgb()
                colours["foreground"] = KozmosThemeTokens.componentsPrimaryButtonsThemedButtonForegroundContentIdle.toArgb()
                colours["background300"] = KozmosThemeTokens.primitivesColorsBackground300.toArgb()
                // A grey host, so the card's own edge is the card's.
                Box(Modifier.fillMaxSize().background(Color(0xFF7F7F7F)).onGloballyPositioned { rootWidth = it.size.width }) {
                    density = LocalDensity.current.density
                    KozmosMaterialTheme {
                        Box(
                            Modifier.padding(24.dp).width(320.dp).onGloballyPositioned {
                                card = it.boundsInRoot()
                                target = (view as ViewRootForTest).semanticsOwner.unmergedRootSemanticsNode.flatten()
                                    .firstOrNull { node ->
                                        node.config.getOrNull(SemanticsProperties.ContentDescription) == listOf("Hide itinerary")
                                    }?.boundsInRoot
                            }
                        ) {
                            KozmosManoeuvreCard(DirectionType.Straight, "Continue ahead", expanded, {}, appearance) {
                                Box(Modifier.fillMaxWidth().height(40.dp))
                            }
                        }
                    }
                }
            }
        }
        val scale = pixels.width.toFloat() / rootWidth
        val perDp = scale * density
        val x = ((card.left + card.right) / 2 * scale).toInt()
        val bottom = card.bottom * scale
        // 2dp up: clear of a background card's 1dp edge, below the bar.
        val start = (bottom - 2 * perDp).toInt()
        val fill = pixels.argb(x, start)
        fun diff(argb: Int) = listOf(16, 8, 0).sumOf { abs((argb shr it and 0xFF) - (fill shr it and 0xFF)) }
        val rows = (start downTo (bottom - 40 * perDp).toInt()).toList()
        val most = rows.maxOf { diff(pixels.argb(x, it)) }
        check(most > 30) { "no bar within 40dp of the card's bottom edge" }
        // A row is the bar's when it is at least half way to the bar's colour:
        // an edge row drawn half covered counts once, at either end.
        val barRows = rows.filter { diff(pixels.argb(x, it)) * 2 >= most }.toSet()
        val lowest = barRows.max()
        var top = lowest
        while (top - 1 in barRows) top--
        val barBottom = lowest + 1
        return Grip(
            bottomDp = (bottom - barBottom) / perDp,
            heightDp = (barBottom - top) / perDp,
            bar = pixels.argb(x, (top + lowest) / 2),
            fill = fill,
            targetHeightDp = target?.let { it.height / density },
            barInTarget = target?.let { it.top * scale <= top && it.bottom * scale >= barBottom - 1 } ?: false
        )
    }

    /** WCAG's contrast ratio between two opaque colours. */
    private fun contrast(a: Int, b: Int): Double {
        fun luminance(argb: Int): Double {
            fun channel(shift: Int): Double {
                val c = (argb shr shift and 0xFF) / 255.0
                return if (c <= 0.03928) c / 12.92 else ((c + 0.055) / 1.055).pow(2.4)
            }
            return 0.2126 * channel(16) + 0.7152 * channel(8) + 0.0722 * channel(0)
        }
        val (light, darker) = luminance(a).let { la -> luminance(b).let { lb -> maxOf(la, lb) to minOf(la, lb) } }
        return (light + 0.05) / (darker + 0.05)
    }

    private fun cases() = KozmosManoeuvreAppearance.values().flatMap { appearance ->
        listOf(false, true).flatMap { expanded -> listOf(false, true).map { dark -> Triple(appearance, expanded, dark) } }
    }

    @Test
    fun theGripSitsFourAboveTheCardsBottomEdge() {
        for ((appearance, expanded, dark) in cases()) {
            val grip = grip(appearance, expanded, dark)
            val case = "$appearance, ${if (expanded) "open" else "closed"}, ${if (dark) "dark" else "light"}"
            println("GAP-140 Android, $case: the bar's bottom ${"%.2f".format(grip.bottomDp)}dp above the card's, ${"%.2f".format(grip.heightDp)}dp tall")
            assertTrue("$case: the bar's bottom is ${grip.bottomDp}dp above the card's, not 4", abs(grip.bottomDp - 4f) <= 1f)
            assertTrue("$case: the bar is ${grip.heightDp}dp tall, not 5", abs(grip.heightDp - 5f) <= 1.5f)
        }
    }

    @Test
    fun theOpenCardsTargetStaysFortyEightAndHoldsTheBar() {
        for ((appearance, expanded, dark) in cases().filter { it.second }) {
            val grip = grip(appearance, expanded, dark)
            val height = checkNotNull(grip.targetHeightDp) { "$appearance: no Hide target" }
            assertTrue("$appearance, dark=$dark: Hide's target is ${height}dp tall", height >= 48f - 0.01f)
            assertTrue("$appearance, dark=$dark: the bar is drawn outside Hide's target", grip.barInTarget)
        }
    }

    @Test
    fun onTheThemeFillTheGripIsQuieterAndStillThreeToOne() {
        for (expanded in listOf(false, true)) for (dark in listOf(false, true)) {
            val grip = grip(KozmosManoeuvreAppearance.Theme, expanded, dark)
            val case = "${if (expanded) "open" else "closed"}, ${if (dark) "dark" else "light"}"
            val ratio = contrast(grip.bar, grip.fill)
            println("GAP-140 Android, theme $case: the bar ${DrawnPixels.hex(grip.bar)} on ${DrawnPixels.hex(grip.fill)}, ${"%.2f".format(ratio)}:1")
            assertTrue("$case: the card's fill is ${DrawnPixels.hex(grip.fill)}, not the theme fill", DrawnPixels.matches(grip.fill, colours.getValue("theme"), 3))
            assertFalse(
                "$case: the bar is the full guidance foreground ${DrawnPixels.hex(grip.bar)}, as loud as the instruction",
                DrawnPixels.matches(grip.bar, colours.getValue("foreground"), 8)
            )
            assertTrue("$case: the bar reads $ratio:1 on the theme fill, under 3:1", ratio >= 3.0)
        }
    }

    @Test
    fun onTheBackgroundTheGripKeepsItsColour() {
        for (expanded in listOf(false, true)) for (dark in listOf(false, true)) {
            val grip = grip(KozmosManoeuvreAppearance.Background, expanded, dark)
            assertTrue(
                "${if (expanded) "open" else "closed"}, dark=$dark: the bar is ${DrawnPixels.hex(grip.bar)}, not background/300 ${DrawnPixels.hex(colours.getValue("background300"))}",
                DrawnPixels.matches(grip.bar, colours.getValue("background300"), 3)
            )
        }
    }
}
