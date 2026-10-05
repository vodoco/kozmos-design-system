package com.kozmos.components.navigation

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.vector.VectorPath
import androidx.compose.ui.layout.boundsInRoot
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.kozmos.components.DrawnPixels
import com.kozmos.components.KeptFrames
import com.kozmos.components.directionstep.DirectionType
import com.kozmos.components.directionstep.icon
import com.kozmos.components.drawn
import com.kozmos.components.pixelsPaparazzi
import com.kozmos.tokens.KozmosColors
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import com.kozmos.utils.KozmosNavigationGlyphs
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * What the direction marks draw, read back from Paparazzi's frame: the
 * Express artwork is filled in the tint, exit keeps entry's door, and nothing
 * mirrors right to left. Points are read off the artwork on its 24 grid,
 * apart from the code that draws it.
 */
class KozmosDirectionGlyphPixelsTest {
    private val frames = KeptFrames()
    @get:Rule val paparazzi = pixelsPaparazzi(frames)

    private val tint = KozmosColors.primitivesColorsTheme500.toArgb()

    /** A mark as the parts draw it, an `Icon` in the tint, and where its 24 grid landed in the frame. */
    private class Mark(val pixels: DrawnPixels, val left: Float, val top: Float, val unit: Float) {
        fun at(x: Float, y: Float): Int = pixels.argb((left + x * unit).toInt(), (top + y * unit).toInt())
        fun inked(x: Float, y: Float): Boolean = at(x, y) ushr 24 > 240 && DrawnPixels.lightness(at(x, y)) < 600
        fun clear(x: Float, y: Float): Boolean = DrawnPixels.lightness(at(x, y)) > 740
    }

    private fun draw(
        vector: ImageVector,
        size: Dp = 96.dp,
        direction: LayoutDirection = LayoutDirection.Ltr,
        modifier: Modifier = Modifier,
    ): Mark {
        var bounds = Rect.Zero
        var rootWidth = 0
        val pixels = paparazzi.drawn(frames) {
            CompositionLocalProvider(LocalLayoutDirection provides direction, LocalKozmosUseDarkTokens provides false) {
                MaterialTheme {
                    val view = LocalView.current
                    Box(Modifier.fillMaxSize().background(Color.White), contentAlignment = Alignment.Center) {
                        Icon(vector, contentDescription = null, tint = Color(tint), modifier = modifier.size(size)
                            .onGloballyPositioned { bounds = it.boundsInRoot(); rootWidth = view.width })
                    }
                }
            }
        }
        assertTrue("the mark was not laid out", rootWidth > 0 && bounds.width > 0f)
        val camera = pixels.width.toFloat() / rootWidth
        return Mark(pixels, bounds.left * camera, bounds.top * camera, bounds.width * camera / 24f)
    }

    /** The same artwork as an outline stroked 2 on the grid: what a filled mark must not look like. */
    private fun outlineOf(vector: ImageVector): ImageVector = ImageVector.Builder(
        name = "${vector.name}Outline", defaultWidth = 24.dp, defaultHeight = 24.dp, viewportWidth = 24f, viewportHeight = 24f
    ).apply {
        for (path in vector.root.filterIsInstance<VectorPath>()) {
            addPath(pathData = path.pathData, fill = null, stroke = SolidColor(Color.Black), strokeLineWidth = 2f)
        }
    }.build()

    /** A point on an Express glyph's 24 grid. */
    private data class GridPoint(val type: DirectionType, val artwork: ImageVector, val x: Float, val y: Float)

    /**
     * A point deep in a solid part of each Express mark, more than two units
     * from every edge, which a fill inks and an outline never reaches.
     */
    private val solidPoints = listOf(
        GridPoint(DirectionType.LiftUp, KozmosNavigationGlyphs.ElevatorUp, 3.25f, 10.25f),
        GridPoint(DirectionType.LiftDown, KozmosNavigationGlyphs.ElevatorDown, 3.25f, 3.25f),
        GridPoint(DirectionType.EscalatorUp, KozmosNavigationGlyphs.EscalatorUp, 6.45f, 19.05f),
        GridPoint(DirectionType.EscalatorDown, KozmosNavigationGlyphs.EscalatorDown, 6.25f, 8.25f),
        GridPoint(DirectionType.StairsUp, KozmosNavigationGlyphs.StairsUp, 10.85f, 3.45f),
        GridPoint(DirectionType.StairsDown, KozmosNavigationGlyphs.StairsDown, 20.45f, 10.85f),
        GridPoint(DirectionType.RampUp, KozmosNavigationGlyphs.RampUp, 19.05f, 17.45f),
        GridPoint(DirectionType.RampDown, KozmosNavigationGlyphs.RampDown, 4.85f, 17.45f),
        GridPoint(DirectionType.Enter, KozmosNavigationGlyphs.RouteEnter, 11.25f, 12.05f),
        GridPoint(DirectionType.Exit, KozmosNavigationGlyphs.RouteExit, 5.25f, 11.85f),
        GridPoint(DirectionType.Left, KozmosNavigationGlyphs.HardLeft, 3.65f, 11.25f),
        GridPoint(DirectionType.Right, KozmosNavigationGlyphs.HardRight, 20.25f, 11.25f),
        GridPoint(DirectionType.TurnBack, KozmosNavigationGlyphs.TurnBack, 16.05f, 17.25f),
        GridPoint(DirectionType.Walking, KozmosNavigationGlyphs.FollowTheLine, 8.56f, 3.06f),
        GridPoint(DirectionType.Destination, KozmosNavigationGlyphs.Arriving, 4.65f, 17.45f),
    )

    @Test fun theExpressMarksAreFilledNotOutlined() {
        // Every direction but straight on, a level change and transition is Express artwork: fifteen.
        val material = setOf(DirectionType.Straight, DirectionType.LevelUp, DirectionType.LevelDown, DirectionType.Transition)
        assertEquals("an Express mark has no point", DirectionType.entries.toSet() - material, solidPoints.map { it.type }.toSet())
        for ((type, artwork, x, y) in solidPoints) {
            // The control: an outline of the Express artwork leaves the point clear.
            val outline = draw(outlineOf(artwork))
            assertTrue("${artwork.name}: ($x, $y) does not tell a fill from an outline", outline.clear(x, y))
            for (size in listOf(24.dp, 96.dp)) {
                val mark = draw(type.icon(), size)
                assertTrue("$type at $size: ($x, $y) inside the artwork is not solid tint, ${DrawnPixels.hex(mark.at(x, y))}",
                    DrawnPixels.matches(mark.at(x, y), tint, tolerance = 8))
            }
        }
        // A figure in the lift's car, and the destination pin's eye, are
        // cut-outs: the fill rule keeps them clear.
        for ((type, x, y) in listOf(Triple(DirectionType.LiftUp, 6.45f, 15.85f), Triple(DirectionType.LiftDown, 6.45f, 8.85f),
            Triple(DirectionType.Destination, 12.05f, 7.85f))) {
            for (size in listOf(24.dp, 96.dp)) {
                assertTrue("$type at $size: the cut-out at ($x, $y) is filled in", draw(type.icon(), size).clear(x, y))
            }
        }
    }

    /**
     * Exit departs from the Express file on purpose: its door is Entrance's,
     * on the right, and its arrow leaves it, pointing left.
     */
    @Test fun exitKeepsEntrysDoorOnTheRight() {
        val enter = draw(DirectionType.Enter.icon())
        val exit = draw(DirectionType.Exit.icon())
        for ((name, mark) in listOf("enter" to enter, "exit" to exit)) {
            for ((x, y) in listOf(21.1f to 12f, 16f to 2.9f, 16f to 21.1f)) {
                assertTrue("$name: the door at ($x, $y) is not inked", mark.inked(x, y))
            }
            assertTrue("$name: the doorway is drawn on", mark.clear(17.5f, 12f))
        }
        // Right of the arrows, x ≥ 15.5 on the grid, the two are one drawing.
        assertEquals(enter.left, exit.left)
        var differing = 0
        for (py in enter.top.toInt() until (enter.top + 24 * enter.unit).toInt()) {
            for (px in (enter.left + 15.5f * enter.unit).toInt() until (enter.left + 24 * enter.unit).toInt()) {
                if (enter.pixels.argb(px, py) != exit.pixels.argb(px, py)) differing++
            }
        }
        assertEquals("exit's door is not entry's", 0, differing)
        assertTrue("entry's arrowhead is not by the door", enter.inked(10.5f, 9f))
        assertTrue("exit's arrow points into the door", exit.clear(10.5f, 9f))
        assertTrue("exit's arrowhead is not at the far end", exit.inked(6f, 9f))
        assertTrue("entry's arrow has a head at the far end", enter.clear(6f, 9f))
    }

    /**
     * Physical directions never mirror, read in pixels. The control: every
     * mark that is not its own mirror image would be caught if it flipped.
     */
    @Test fun noDirectionMirrorsRightToLeftInPixels() {
        val ownMirrorImages = setOf(DirectionType.Straight, DirectionType.Destination, DirectionType.LiftUp,
            DirectionType.LiftDown, DirectionType.LevelUp, DirectionType.LevelDown)
        fun differing(a: Mark, b: Mark): Int {
            var count = 0
            for (py in a.top.toInt() until (a.top + 24 * a.unit).toInt()) {
                for (px in a.left.toInt() until (a.left + 24 * a.unit).toInt()) if (a.pixels.argb(px, py) != b.pixels.argb(px, py)) count++
            }
            return count
        }
        for (type in DirectionType.entries) {
            val ltr = draw(type.icon())
            val rtl = draw(type.icon(), direction = LayoutDirection.Rtl)
            assertEquals("$type mirrors right to left", 0, differing(ltr, rtl))
            if (type !in ownMirrorImages) {
                val mirrored = draw(type.icon(), modifier = Modifier.graphicsLayer(scaleX = -1f))
                assertFalse("a mirrored $type would pass unseen", differing(ltr, mirrored) < 50)
            }
        }
    }
}
