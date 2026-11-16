package com.kozmos.components.tabs

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.kozmos.components.DrawnPixels
import com.kozmos.components.KeptFrames
import com.kozmos.components.drawn
import com.kozmos.components.pixelsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.tokens.KozmosDimensions
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import kotlin.math.abs

/**
 * GAP-254, decision 182: a tab list that fits its width is drawn as it was
 * before lists could scroll: two or three short tabs in 301dp, which fit. Compared pixel for pixel with the list as it
 * was built until then, a `Row` padded 4dp at its ends and as tall as its
 * tallest tab, in the light and the dark, left to right and right to left,
 * with words alone and with icons. The raised segment's shadow included:
 * a list that fits clips nothing. And a list that scrolls draws nothing past
 * its track, though its scroll container reaches past the track's ends.
 */
class KozmosTabsTrackPixelsTest {
    private val frames = KeptFrames()

    @get:Rule
    val paparazzi = pixelsPaparazzi(frames)

    /** The list as it was until decision 182. */
    @Composable
    private fun RowList(content: @Composable RowScope.() -> Unit) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .selectableGroup()
                .background(
                    KozmosThemeTokens.primitivesColorsBackground100,
                    RoundedCornerShape(KozmosDimensions.semanticsRadiusControl)
                )
                .padding(horizontal = KozmosDimensions.primitivesLayoutSpacing50)
                .height(IntrinsicSize.Min),
            verticalAlignment = Alignment.CenterVertically
        ) {
            CompositionLocalProvider(LocalTabsFillTrack provides true) { content() }
        }
    }

    private fun draw(dark: Boolean, rtl: Boolean, icons: Boolean, count: Int, reference: Boolean): DrawnPixels =
        paparazzi.drawn(frames) {
            CompositionLocalProvider(
                LocalKozmosUseDarkTokens provides dark,
                LocalLayoutDirection provides if (rtl) LayoutDirection.Rtl else LayoutDirection.Ltr
            ) {
                KozmosMaterialTheme {
                    Box(Modifier.fillMaxSize().background(Color(0xFF808080)).padding(8.dp)) {
                        // 301dp: 879px of room at this density, which two tabs share
                        // with a pixel left over, as a Row shares it out.
                        Box(Modifier.width(301.dp)) {
                            val tabs: @Composable RowScope.() -> Unit = {
                                for ((value, title) in listOf("hours" to "Hours", "access" to "Access", "reviews" to "Reviews").take(count)) {
                                    KozmosTabsTrigger(
                                        value = value,
                                        title = title,
                                        selectedValue = "access",
                                        onValueChange = {},
                                        icon = if (icons) { { Icon(Icons.Filled.Home, contentDescription = null) } } else null
                                    )
                                }
                            }
                            if (reference) RowList(tabs) else KozmosTabsList(content = tabs)
                        }
                    }
                }
            }
        }

    @Test
    fun aListThatFitsIsDrawnAsTheRowWas() {
        val problems = mutableListOf<String>()
        for (dark in listOf(false, true)) for (rtl in listOf(false, true)) for (icons in listOf(false, true)) for (count in listOf(2, 3)) {
            val list = draw(dark, rtl, icons, count, reference = false)
            val row = draw(dark, rtl, icons, count, reference = true)
            var differing = 0
            for (y in 0 until minOf(list.height, row.height)) for (x in 0 until minOf(list.width, row.width)) {
                if (list.argb(x, y) != row.argb(x, y)) differing++
            }
            if (differing > 0 || list.width != row.width || list.height != row.height) {
                problems += "${if (dark) "dark" else "light"}, ${if (rtl) "rtl" else "ltr"}, ${if (icons) "icons" else "words"}, $count tabs: $differing pixels differ"
            }
        }
        assertTrue(problems.joinToString("\n"), problems.isEmpty())
    }

    @Test
    fun aListThatScrollsDrawsNothingPastItsTrack() {
        val host = 0xFF808080.toInt()
        val problems = mutableListOf<String>()
        for (dark in listOf(false, true)) for (rtl in listOf(false, true)) {
            val drawn = paparazzi.drawn(frames) {
                CompositionLocalProvider(
                    LocalKozmosUseDarkTokens provides dark,
                    LocalLayoutDirection provides if (rtl) LayoutDirection.Rtl else LayoutDirection.Ltr
                ) {
                    KozmosMaterialTheme {
                        Box(Modifier.fillMaxSize().background(Color(host)).padding(40.dp)) {
                            Box(Modifier.width(240.dp)) {
                                KozmosTabsList {
                                    for (title in listOf("Everything", "POI", "Interior asset", "Structural", "Virtual")) {
                                        KozmosTabsTrigger(
                                            value = title,
                                            title = title,
                                            selectedValue = "Interior asset",
                                            onValueChange = {},
                                            icon = { Icon(Icons.Filled.Home, contentDescription = null) }
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
            // The track: the box of everything not the host's grey.
            var left = Int.MAX_VALUE; var right = -1; var top = Int.MAX_VALUE; var bottom = -1
            for (y in 0 until drawn.height) for (x in 0 until drawn.width) {
                if (!DrawnPixels.matches(drawn.argb(x, y), host, 2)) {
                    left = minOf(left, x); right = maxOf(right, x); top = minOf(top, y); bottom = maxOf(bottom, y)
                }
            }
            // 240dp at the frame's scale: the track is that wide, no wider.
            val expected = 240f * 3f * drawn.width / 1080f
            if (right < 0 || abs((right - left + 1) - expected) > 3f) {
                problems += "${if (dark) "dark" else "light"}, ${if (rtl) "rtl" else "ltr"}: drawn ${left}..$right, ${right - left + 1} wide, not the track's ${expected.toInt()}"
            }
            if (bottom - top + 1 > expected) {
                problems += "${if (dark) "dark" else "light"}, ${if (rtl) "rtl" else "ltr"}: drawn $top..$bottom, taller than a tab list"
            }
        }
        assertTrue(problems.joinToString("\n"), problems.isEmpty())
    }
}
