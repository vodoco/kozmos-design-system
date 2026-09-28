package com.kozmos.components.floorselector

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.unit.DpSize
import androidx.compose.ui.unit.dp
import com.kozmos.components.DrawnPixels
import com.kozmos.components.KeptFrames
import com.kozmos.components.drawn
import com.kozmos.components.pixelsPaparazzi
import com.kozmos.contracts.KozmosFloorPresentation
import com.kozmos.tokens.KozmosColors
import com.kozmos.tokens.KozmosThemeTokens
import com.kozmos.tokens.LocalKozmosUseDarkTokens
import androidx.compose.runtime.CompositionLocalProvider
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

/**
 * Decision 38: the level the visitor is on carries a dot in the theme's
 * primary — on the closed tile only while it shows that level, and on that
 * level in the open column — and the dot and a result count on one level
 * never run into each other. Read from what Paparazzi draws: the frame is
 * scaled (paparazzi-frames-are-scaled), so nothing here counts in dp; it looks
 * for the primary's pixels and the separate shapes they make.
 */
class KozmosFloorSwitcherPixelsTest {
    private val frames = KeptFrames()

    @get:Rule
    val paparazzi = pixelsPaparazzi(frames)

    private val levels = listOf(
        KozmosFloorPresentation(id = "2", label = "Second floor", shortLabel = "2F"),
        KozmosFloorPresentation(id = "1", label = "First floor", shortLabel = "1F"),
        KozmosFloorPresentation(id = "g", label = "Ground floor", shortLabel = "GF")
    )

    /** The light theme's primary, from the token rather than a copy of its hex. */
    private val primary = KozmosColors.primitivesColorsTheme600.toArgb()

    private fun drawn(content: @Composable () -> Unit): DrawnPixels = paparazzi.drawn(frames) {
        CompositionLocalProvider(LocalKozmosUseDarkTokens provides false) {
            MaterialTheme {
                Box(Modifier.background(KozmosThemeTokens.semanticsSurface0).padding(16.dp)) { content() }
            }
        }
    }

    /**
     * The primary's pixels, grouped into the shapes they make — four
     * neighbours apart at most — and the size of each.
     */
    private fun primaryShapes(pixels: DrawnPixels): List<Int> {
        val seen = BooleanArray(pixels.width * pixels.height)
        fun isPrimary(x: Int, y: Int) = DrawnPixels.matches(pixels.argb(x, y), primary, tolerance = 6)
        val shapes = mutableListOf<Int>()
        for (y in 0 until pixels.height) {
            for (x in 0 until pixels.width) {
                if (seen[y * pixels.width + x] || !isPrimary(x, y)) continue
                var size = 0
                val stack = ArrayDeque(listOf(x to y))
                seen[y * pixels.width + x] = true
                while (stack.isNotEmpty()) {
                    val (px, py) = stack.removeLast()
                    size++
                    for ((nx, ny) in listOf(px - 1 to py, px + 1 to py, px to py - 1, px to py + 1)) {
                        if (nx !in 0 until pixels.width || ny !in 0 until pixels.height) continue
                        val index = ny * pixels.width + nx
                        if (!seen[index] && isPrimary(nx, ny)) {
                            seen[index] = true
                            stack.addLast(nx to ny)
                        }
                    }
                }
                shapes += size
            }
        }
        return shapes
    }

    @Test
    fun theTileDrawsTheDotOnlyWhileItShowsTheVisitorsLevel() {
        fun shapes(selected: String, userFloor: String?) = primaryShapes(
            drawn {
                KozmosFloorSelector(
                    floors = levels,
                    selectedFloor = selected,
                    onFloorSelect = {},
                    variant = KozmosFloorSelectorVariant.Collapsible,
                    userFloor = userFloor
                )
            }
        )
        assertEquals("the tile on the visitor's level draws no dot", 1, shapes("g", "g").size)
        assertEquals("the tile marks the visitor's level while showing another", 0, shapes("1", "g").size)
        assertEquals("the tile draws a dot with no visitor's level", 0, shapes("g", null).size)
    }

    @Test
    fun theColumnKeepsTheDotAndTheCountApart() {
        // No level current, so nothing else in the column is the primary: the
        // visitor's dot and the level's count are the only two shapes, and two
        // they stay — run into each other, they would make one.
        val floors = listOf(levels[0].copy(resultCount = 3), levels[1], levels[2])
        val shapes = primaryShapes(
            drawn {
                KozmosFloorSwitcherColumn(
                    floors = floors,
                    selectedFloor = "none",
                    userFloor = "2",
                    userFloorLabel = "your level",
                    resultCountLabel = { "$it results" },
                    levelSize = DpSize(44.dp, 44.dp),
                    onChoose = {}
                )
            }
        )
        // A softened edge can leave a pixel or two of the primary on its own;
        // a mark is bigger than that.
        val marks = shapes.filter { it > 4 }
        assertEquals("the dot and the count are not two shapes: $shapes", 2, marks.size)
    }
}
