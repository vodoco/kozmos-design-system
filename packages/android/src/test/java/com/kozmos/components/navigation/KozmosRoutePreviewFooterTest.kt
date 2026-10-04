package com.kozmos.components.navigation

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.width
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.layout.boundsInRoot
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.dp
import com.kozmos.components.DrawnPixels
import com.kozmos.components.KeptFrames
import com.kozmos.components.drawn
import com.kozmos.components.pixelsPaparazzi
import com.kozmos.components.routepreviewpanel.KozmosRoutePreviewPanel
import com.kozmos.contracts.KozmosRouteOptionPresentation
import com.kozmos.contracts.KozmosRoutePreference
import com.kozmos.contracts.KozmosRouteReadiness
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

/**
 * P7, with D7: the route preview's footer draws Back, a 44dp icon button,
 * beside Continue, a labelled Button, and the two are drawn the same height
 * on the same line, as on the web and iOS. Continue was drawn 48 tall.
 */
class KozmosRoutePreviewFooterTest {
    private val frames = KeptFrames()
    @get:Rule val paparazzi = pixelsPaparazzi(frames)

    private val options = listOf(
        KozmosRouteOptionPresentation(
            id = "quickest", label = "Quickest", durationSeconds = 240.0, durationLabel = "4 min",
            distanceMetres = 150.0, distanceLabel = "150 m", preference = KozmosRoutePreference.Quickest,
            selected = true
        )
    )

    @Test fun backAndContinueAreDrawnAlike() {
        var root = Rect.Zero
        var panel = Rect.Zero
        var density = 1f
        var fill = 0
        var page = 0
        val pixels = paparazzi.drawn(frames) {
            density = LocalDensity.current.density
            CompositionLocalProvider(LocalKozmosUseDarkTokens provides false) {
                fill = KozmosThemeTokens.componentsPrimaryButtonsThemedButtonBackgroundIdle.toArgb()
                page = KozmosThemeTokens.primitivesColorsBackground0.toArgb()
                MaterialTheme {
                    Box(Modifier.fillMaxSize().onGloballyPositioned { root = it.boundsInRoot() }) {
                        Box(Modifier.width(360.dp).onGloballyPositioned { panel = it.boundsInRoot() }) {
                            KozmosRoutePreviewPanel(
                                destinationName = "Gate 12", options = options, status = KozmosRouteReadiness.Ready,
                                backLabel = "Back", continueLabel = "Continue",
                                onOptionSelect = {}, onBack = {}, onContinue = {}
                            )
                        }
                    }
                }
            }
        }
        val camera = pixels.width / root.width
        val px = { dp: Float -> (dp * density * camera).toInt() }
        val left = (panel.left * camera).toInt()
        // The footer: its 16dp of padding round a 48dp row, at the panel's foot, short of the divider over it.
        val bottom = (panel.bottom * camera).toInt() - 1
        val footer = (bottom - px(78f))..bottom

        /** The rows of [columns] in the footer where [drawn] holds, top and bottom. */
        fun extent(columns: IntRange, drawn: (Int) -> Boolean): IntRange? {
            var first = Int.MAX_VALUE
            var last = -1
            for (x in columns) for (y in footer) if (drawn(pixels.argb(x, y))) {
                first = minOf(first, y)
                last = maxOf(last, y)
            }
            return if (last < 0) null else first..last
        }
        // Back is the outlined circle from 16 to 60: everything in its columns that is not the page.
        val back = checkNotNull(extent(left + px(17f)..left + px(59f)) { !DrawnPixels.matches(it, page, tolerance = 6) }) { "no Back drawn" }
        // Continue is the theme fill after it.
        val next = checkNotNull(extent(left + px(80f)..left + px(340f)) { DrawnPixels.matches(it, fill) }) { "no Continue drawn" }
        val height = { rows: IntRange -> (rows.last - rows.first + 1) / camera / density }
        assertEquals("Back is not drawn 44dp tall", 44f, height(back), 1f)
        assertEquals("Continue is not drawn 44dp tall", 44f, height(next), 1f)
        assertEquals("Continue's top is not Back's: $next and $back", back.first.toFloat(), next.first.toFloat(), 1.5f)
        assertEquals("Continue's foot is not Back's: $next and $back", back.last.toFloat(), next.last.toFloat(), 1.5f)
    }
}
