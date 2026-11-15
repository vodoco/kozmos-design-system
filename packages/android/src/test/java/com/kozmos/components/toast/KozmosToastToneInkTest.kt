package com.kozmos.components.toast

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.dp
import com.kozmos.components.DrawnPixels
import com.kozmos.components.KeptFrames
import com.kozmos.components.pixelsPaparazzi
import com.kozmos.components.readSemantics
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import kotlin.math.roundToInt
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * A toast's tone is an icon at its start, 24 in and centred on its height,
 * 16 square, in the tone's text colour, as React's (GAP-167): success,
 * informative, alert and danger text for Success, Info, Warning and
 * Critical, with the words 16 after it, 56 in. Neutral draws none, and its
 * words start 24 in, where the icon would be. Read off what is drawn, in
 * light and dark.
 */
class KozmosToastToneInkTest {
    private val frames = KeptFrames()

    @get:Rule val paparazzi = pixelsPaparazzi(frames)

    /** The commonest colour in [box] (in the frame's pixels) that is not [ground], or [ground] if none. */
    private fun DrawnPixels.ink(box: Rect, ground: Int): Int {
        val counts = HashMap<Int, Int>()
        for (y in box.top.roundToInt() until box.bottom.roundToInt()) {
            for (x in box.left.roundToInt() until box.right.roundToInt()) {
                val argb = argb(x, y)
                if (!DrawnPixels.matches(argb, ground, 40)) counts[argb] = (counts[argb] ?: 0) + 1
            }
        }
        return counts.maxByOrNull { it.value }?.key ?: ground
    }

    @Test fun eachToneDrawsItsIconInItsTextColourAndNeutralNone() {
        val wrong = mutableListOf<String>()
        for (dark in listOf(false, true)) for (tone in KozmosToastTone.values()) {
            var expected = 0
            var ground = 0
            var density = 1f
            var canvas = IntSize(1, 1)
            val tree = paparazzi.readSemantics {
                CompositionLocalProvider(LocalKozmosUseDarkTokens provides dark) {
                    KozmosMaterialTheme {
                        density = LocalDensity.current.density
                        ground = KozmosThemeTokens.primitivesColorsBackground0.toArgb()
                        expected = when (tone) {
                            KozmosToastTone.Neutral -> 0
                            KozmosToastTone.Success -> KozmosThemeTokens.semanticsEmotionSuccessText.toArgb()
                            KozmosToastTone.Info -> KozmosThemeTokens.semanticsEmotionInformativeText.toArgb()
                            KozmosToastTone.Warning -> KozmosThemeTokens.semanticsEmotionAlertText.toArgb()
                            KozmosToastTone.Critical -> KozmosThemeTokens.semanticsEmotionDangerText.toArgb()
                        }
                        Box(
                            Modifier.fillMaxSize()
                                .background(Color(ground))
                                .onGloballyPositioned { canvas = it.size }
                        ) {
                            Box(Modifier.padding(16.dp)) {
                                KozmosToast(title = "Location saved", description = "Find it in your saved places.", tone = tone, onDismiss = {})
                            }
                        }
                    }
                }
            }
            val drawn = DrawnPixels(checkNotNull(frames.last))
            val scale = drawn.width.toFloat() / canvas.width
            val toast = tree.merged.single { it.liveRegion != null }.bounds
            val words = tree.unmerged.single { "Location saved" in it.texts }.frame.left - toast.left
            val wordsAt = if (tone == KozmosToastTone.Neutral) 24 else 56
            if (kotlin.math.abs(words - wordsAt * density) > 1f) {
                wrong += "${if (dark) "dark" else "light"} $tone: the words start ${words / density} in, not $wordsAt"
            }
            if (tone == KozmosToastTone.Neutral) continue
            val icon = Rect(
                left = toast.left + 24 * density,
                top = toast.center.y - 8 * density,
                right = toast.left + 40 * density,
                bottom = toast.center.y + 8 * density
            )
            val ink = drawn.ink(Rect(icon.left * scale, icon.top * scale, icon.right * scale, icon.bottom * scale), ground)
            if (!DrawnPixels.matches(ink, expected, 6)) {
                wrong += "${if (dark) "dark" else "light"} $tone: the start is ${DrawnPixels.hex(ink)}, not ${DrawnPixels.hex(expected)}"
            }
        }
        assertTrue(wrong.joinToString("; "), wrong.isEmpty())
    }
}
