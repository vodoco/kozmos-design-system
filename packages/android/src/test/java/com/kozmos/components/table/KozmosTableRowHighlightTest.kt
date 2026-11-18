package com.kozmos.components.table

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.layout.boundsInRoot
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.dp
import com.kozmos.components.DrawnPixels
import com.kozmos.components.KeptFrames
import com.kozmos.components.drawn
import com.kozmos.components.pixelsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.tokens.KozmosMotion
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import kotlin.math.roundToInt
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * GAP-276 (MAP-32): a row just added to Access Permissions tints in the
 * informative surface and fades, so the eye finds it: held three deliberate
 * durations, faded over a fourth; with animations off it shows and clears at
 * the same mark with no fade. Without a highlight the row is as before.
 */
class KozmosTableRowHighlightTest {
    private val frames = KeptFrames()

    @get:Rule val paparazzi = pixelsPaparazzi(frames)

    private val deliberate = KozmosMotion.semanticsMotionDurationDeliberate.toLong()

    @Test fun theTintHoldsThenFadesOverTheDeliberateDuration() {
        assertEquals(1f, tableRowHighlightAlpha(0, animationsOn = true), 0f)
        assertEquals("held for three deliberate durations", 1f, tableRowHighlightAlpha(3 * deliberate, animationsOn = true), 0f)
        val halfway = tableRowHighlightAlpha(3 * deliberate + deliberate / 2, animationsOn = true)
        assertTrue("fading halfway through the fourth: $halfway", halfway > 0.05f && halfway < 0.95f)
        assertEquals("gone at four", 0f, tableRowHighlightAlpha(4 * deliberate, animationsOn = true), 0f)
    }

    @Test fun withAnimationsOffItShowsAndClearsWithNoFade() {
        assertEquals(1f, tableRowHighlightAlpha(3 * deliberate + deliberate / 2, animationsOn = false), 0f)
        assertEquals(1f, tableRowHighlightAlpha(4 * deliberate - 1, animationsOn = false), 0f)
        assertEquals(0f, tableRowHighlightAlpha(4 * deliberate, animationsOn = false), 0f)
    }

    @Test fun aNewRowIsDrawnOnTheInformativeSurfaceInBothThemes() {
        for (dark in listOf(false, true)) {
            var tint = 0
            var surface = 0
            var canvas = IntSize(1, 1)
            var plain = Rect.Zero
            var added = Rect.Zero
            val drawn = paparazzi.drawn(frames) {
                CompositionLocalProvider(LocalKozmosUseDarkTokens provides dark) {
                    tint = KozmosThemeTokens.semanticsEmotionInformativeSurface.toArgb()
                    surface = KozmosThemeTokens.primitivesColorsBackground0.toArgb()
                    KozmosMaterialTheme {
                        Box(Modifier.fillMaxSize().background(Color(surface)).onGloballyPositioned { canvas = it.size }) {
                            Column(Modifier.padding(16.dp).width(240.dp)) {
                                KozmosTableRow(Modifier.onGloballyPositioned { plain = it.boundsInRoot() }) {
                                    KozmosTableCell(text = "Ada")
                                }
                                KozmosTableRow(
                                    Modifier.onGloballyPositioned { added = it.boundsInRoot() },
                                    highlight = KozmosTableRowHighlight.New
                                ) {
                                    KozmosTableCell(text = "Grace")
                                }
                            }
                        }
                    }
                }
            }
            val scale = drawn.width.toFloat() / canvas.width
            fun at(r: Rect) = drawn.argb(((r.right - 8f) * scale).roundToInt(), ((r.top + 6f) * scale).roundToInt())
            val mode = if (dark) "dark" else "light"
            assertTrue("$mode: the new row is ${DrawnPixels.hex(at(added))}, not the informative surface ${DrawnPixels.hex(tint)}", DrawnPixels.matches(at(added), tint))
            assertTrue("$mode: the plain row is ${DrawnPixels.hex(at(plain))}", DrawnPixels.matches(at(plain), surface))
        }
    }
}
