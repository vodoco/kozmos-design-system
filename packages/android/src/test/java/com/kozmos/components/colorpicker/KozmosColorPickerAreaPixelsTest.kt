package com.kozmos.components.colorpicker

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.kozmos.components.DrawnPixels
import com.kozmos.components.KeptFrames
import com.kozmos.components.drawn
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * The colour picker's saturation and lightness square is drawn physically,
 * as React draws it: white at the left, the hue at the right, black at the
 * bottom, in either reading direction. The handle shows the value on that
 * square, so it must sit over the colour the value is, right to left too.
 * Until this test the gradient stayed physical right to left while the
 * handle's `TopStart` alignment and `offset` mirrored, so a full-saturation
 * red sat its handle over the white end.
 *
 * The picker is drawn open with #FF0000 (hue 0, saturation 100, lightness
 * 50) and no presets, so the only reds drawn are the field's swatch and the
 * square. Paparazzi scales its frames down (paparazzi-frames-are-scaled), so
 * a dp is measured off the frame's own width, and the parts are found by
 * their colour. The screen is cut to 1400px tall so the frame is scaled less.
 */
class KozmosColorPickerAreaPixelsTest {
    private val frames = KeptFrames()

    @get:Rule
    val paparazzi = Paparazzi(
        deviceConfig = DeviceConfig.PIXEL_5.copy(screenHeight = 1400),
        snapshotHandler = frames.handler
    )

    private val host = 0xFF808080.toInt()

    private class Square(
        /** The square's left and right edges, in frame pixels. */
        val minX: Int,
        val maxX: Int,
        /** The handle's centre, in frame pixels. */
        val handleX: Int,
        /** A dp, in frame pixels. */
        val dp: Double,
        /** The square a quarter of the way down, at its left and right ends. */
        val leftEnd: Int,
        val rightEnd: Int,
        /** The square just above the handle: the colour the handle points at. */
        val atHandle: Int,
        val rtl: Boolean
    ) {
        val across: Double get() = (handleX - minX).toDouble() / (maxX - minX)

        override fun toString(): String =
            "${if (rtl) "right to left" else "left to right"}: square x $minX–$maxX px (1dp = ${"%.2f".format(dp)} px), " +
                "handle centre x $handleX (${"%.0f".format(across * 100)}% across), " +
                "left end ${DrawnPixels.hex(leftEnd)}, right end ${DrawnPixels.hex(rightEnd)}, " +
                "above the handle ${DrawnPixels.hex(atHandle)}"
    }

    /** How much redder than its other channels a pixel is. */
    private fun redness(argb: Int): Int =
        (argb shr 16 and 0xFF) - maxOf(argb shr 8 and 0xFF, argb and 0xFF)

    private fun isWhite(argb: Int, above: Int): Boolean =
        listOf(16, 8, 0).all { shift -> (argb shr shift and 0xFF) > above }

    private fun square(value: String = "#FF0000", rtl: Boolean): Square {
        var screenWidthDp = 0
        val drawn = paparazzi.drawn(frames) {
            screenWidthDp = LocalConfiguration.current.screenWidthDp
            CompositionLocalProvider(
                LocalKozmosUseDarkTokens provides false,
                LocalLayoutDirection provides if (rtl) LayoutDirection.Rtl else LayoutDirection.Ltr
            ) {
                KozmosMaterialTheme {
                    Box(
                        Modifier
                            .fillMaxSize()
                            .background(Color(host))
                            .padding(16.dp)
                    ) {
                        KozmosColorPicker(
                            value = value,
                            onValueChange = {},
                            presets = emptyList(),
                            defaultExpanded = true
                        )
                    }
                }
            }
        }
        val dp = drawn.width.toDouble() / screenWidthDp
        // The square is the one tall run of red rows: the swatch is 32dp,
        // and the square's bottom third is too dark to count as red.
        val redRows = (0 until drawn.height).filter { y ->
            (0 until drawn.width).any { x ->
                val p = drawn.argb(x, y)
                p ushr 24 > 240 && redness(p) > 80
            }
        }
        val runs = mutableListOf<IntRange>()
        for (y in redRows) {
            val last = runs.lastOrNull()
            if (last != null && y == last.last + 1) runs[runs.size - 1] = last.first..y else runs += y..y
        }
        val band = checkNotNull(runs.firstOrNull { it.last - it.first > 60 * dp }) { "no square among $runs" }
        // A quarter of the way down the square its lightest pixel is under
        // 210 a channel and the panel round it is white, so the run of darker
        // pixels round the middle of the drawing is the square.
        val rowY = band.first + (36 * dp).toInt()
        var minX = drawn.width / 2
        var maxX = drawn.width / 2
        while (minX > 0 && !isWhite(drawn.argb(minX - 1, rowY), 230)) minX--
        while (maxX < drawn.width - 1 && !isWhite(drawn.argb(maxX + 1, rowY), 230)) maxX++
        // At lightness 50 the handle is mid-square, where the black is half
        // drawn and only the handle is white.
        val handleRows = (band.first + (48 * dp).toInt())..(band.first + (96 * dp).toInt())
        val handleXs = ((minX + 2)..(maxX - 2)).filter { x -> handleRows.any { y -> isWhite(drawn.argb(x, y), 245) } }
        check(handleXs.isNotEmpty()) { "no handle" }
        val handleYs = handleRows.filter { y -> handleXs.any { x -> isWhite(drawn.argb(x, y), 245) } }
        val handleX = (handleXs.first() + handleXs.last()) / 2
        return Square(
            minX = minX,
            maxX = maxX,
            handleX = handleX,
            dp = dp,
            leftEnd = drawn.argb(minX + (4 * dp).toInt(), rowY),
            rightEnd = drawn.argb(maxX - (4 * dp).toInt(), rowY),
            atHandle = drawn.argb(handleX, handleYs.first() - (4 * dp).toInt()),
            rtl = rtl
        )
    }

    /** The hue is at the right and white at the left in both directions. */
    @Test
    fun theSquareRunsWhiteToTheHueLeftToRightInBothDirections() {
        val problems = listOf(false, true).mapNotNull { rtl ->
            val s = square(rtl = rtl)
            s.takeUnless { redness(it.leftEnd) < 60 && redness(it.rightEnd) > 120 }?.toString()
        }
        assertTrue(problems.joinToString("\n"), problems.isEmpty())
    }

    /**
     * Full saturation puts the handle at the square's right edge, over the
     * hue, in both directions: the colour beside it is the red it shows.
     */
    @Test
    fun aFullySaturatedHandleSitsOverTheHueInBothDirections() {
        val problems = listOf(false, true).mapNotNull { rtl ->
            val s = square(rtl = rtl)
            s.takeUnless { kotlin.math.abs(it.handleX - (it.maxX - 9 * it.dp)) <= 2 * it.dp && redness(it.atHandle) > 80 }
                ?.toString()
        }
        assertTrue(problems.joinToString("\n"), problems.isEmpty())
    }

    /**
     * No saturation puts the handle at the square's left edge, over the
     * white, in both directions. #808080 is hue 0, saturation 0.
     */
    @Test
    fun anUnsaturatedHandleSitsOverTheWhiteInBothDirections() {
        val problems = listOf(false, true).mapNotNull { rtl ->
            val s = square(value = "#808080", rtl = rtl)
            s.takeUnless { kotlin.math.abs(it.handleX - (it.minX + 9 * it.dp)) <= 2 * it.dp && redness(it.atHandle) < 30 }
                ?.toString()
        }
        assertTrue(problems.joinToString("\n"), problems.isEmpty())
    }
}
