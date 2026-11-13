package com.kozmos.components.rating

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.layout.boundsInRoot
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.kozmos.components.DrawnPixels
import com.kozmos.components.KeptFrames
import com.kozmos.components.drawn
import com.kozmos.components.pixelsPaparazzi
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.tokens.KozmosThemeTokens
import kotlin.math.roundToInt
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * Decision 181: a read-only star rating shows a score to the nearest half —
 * the doubled value rounded half up — draws the half as the filled star
 * clipped to its start half over the empty star, and TalkBack hears the
 * rounded value.
 */
class KozmosRatingHalvesTest {
    @Test fun aScoreRoundsToTheNearestHalfUpOnItsDouble() {
        assertEquals(4.5f, kozmosRatingRoundedToHalf(4.3f))
        assertEquals(4f, kozmosRatingRoundedToHalf(4.2f))
        assertEquals(4.5f, kozmosRatingRoundedToHalf(4.25f))
        assertEquals(3f, kozmosRatingRoundedToHalf(2.75f))
        assertEquals(0.5f, kozmosRatingRoundedToHalf(0.4f))
    }

    @Test fun theLabelSaysTheRoundedScore() {
        assertEquals("Rated 4.5 out of 5 stars", kozmosRatingScoreLabel(4.5f, 5))
        assertEquals("Rated 4 out of 5 stars", kozmosRatingScoreLabel(4f, 5))
        assertEquals("Not rated", kozmosRatingScoreLabel(0f, 5))
    }
}

class KozmosRatingHalvesSemanticsTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    @Test fun talkBackHearsTheRoundedScore() {
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosRating(rating = 4.3f)
                KozmosRating(rating = 4.2f)
            }
        }
        tree.named("Rated 4.5 out of 5 stars")
        tree.named("Rated 4 out of 5 stars")
    }
}

class KozmosRatingHalvesPixelsTest {
    private val frames = KeptFrames()

    @get:Rule val paparazzi = pixelsPaparazzi(frames)

    /** Yellow pixels in the star's left half and in its right half. */
    private fun yellowByHalf(direction: LayoutDirection): Pair<Int, Int> {
        var canvas = IntSize(1, 1)
        var star = Rect.Zero
        var yellow = 0
        val drawn = paparazzi.drawn(frames) {
            CompositionLocalProvider(LocalLayoutDirection provides direction) {
                KozmosMaterialTheme {
                    yellow = KozmosThemeTokens.semanticsDataYellow.toArgb()
                    Box(
                        Modifier.fillMaxSize()
                            .background(KozmosThemeTokens.primitivesColorsBackground0)
                            .onGloballyPositioned { canvas = it.size }
                    ) {
                        KozmosRating(
                            rating = 0.5f,
                            max = 1,
                            modifier = Modifier.padding(16.dp).onGloballyPositioned { star = it.boundsInRoot() }
                        )
                    }
                }
            }
        }
        val scale = drawn.width.toFloat() / canvas.width
        val middle = star.center.x
        var left = 0
        var right = 0
        for (y in (star.top * scale).roundToInt() until (star.bottom * scale).roundToInt())
            for (x in (star.left * scale).roundToInt() until (star.right * scale).roundToInt()) {
                if (!DrawnPixels.matches(drawn.argb(x, y), yellow, 24)) continue
                // A pixel's width either side of the middle is left out: the
                // clip's own edge is antialiased.
                val at = x / scale
                if (at < middle - 1) left++ else if (at > middle + 1) right++
            }
        return left to right
    }

    @Test fun theHalfIsTheLeftHalfLeftToRight() {
        val (left, right) = yellowByHalf(LayoutDirection.Ltr)
        assertTrue("the left half is filled ($left yellow pixels)", left > 50)
        assertEquals("and the right half is not", 0, right)
    }

    @Test fun theHalfIsTheRightHalfRightToLeft() {
        val (left, right) = yellowByHalf(LayoutDirection.Rtl)
        assertTrue("the right half is filled ($right yellow pixels)", right > 50)
        assertEquals("and the left half is not", 0, left)
    }
}
