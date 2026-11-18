package com.kozmos.components.listbox

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
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
import com.kozmos.tokens.KozmosColors
import kotlin.math.roundToInt
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * GAP-260: a product moves the active option (a search field driving the
 * list), and the row is drawn with the hover fill, as React's; an option
 * shows words at its end. Decision 215 (GAP-282): an option's leading
 * Avatar, its image or its initials. Each is drawn only where given.
 */
class KozmosListboxOptionSlotsTest {
    private val frames = KeptFrames()

    @get:Rule val paparazzi = pixelsPaparazzi(frames)

    private val host = 0xFFFF00FF.toInt()
    private val options = listOf(
        KozmosListboxOption("name", "Name", trailing = "Text"),
        KozmosListboxOption("floor", "Floor", trailing = "Number"),
        KozmosListboxOption("open", "Opening hours")
    )

    /** The list's rows' middle-left fill, each 4dp in from the row's start. */
    private fun rowFills(activeValue: String?, selected: List<String> = emptyList()): List<Int> {
        var canvas = IntSize(1, 1)
        var list = Rect.Zero
        val pixels = paparazzi.drawn(frames) {
            KozmosMaterialTheme {
                Box(Modifier.fillMaxSize().background(Color(host)).onGloballyPositioned { canvas = it.size }) {
                    KozmosListbox(
                        options = options,
                        selectedValues = selected,
                        activeValue = activeValue,
                        embedded = true,
                        modifier = Modifier.padding(16.dp).width(240.dp).onGloballyPositioned { list = it.boundsInRoot() }
                    )
                }
            }
        }
        val scale = pixels.width.toFloat() / canvas.width
        // Embedded: three 44dp rows, 4dp apart, from the list top.
        val density = list.width / 240f
        return (0 until 3).map { row ->
            val y = ((list.top + (row * 48 + 22) * density) * scale).roundToInt()
            val x = ((list.left + 6 * density) * scale).roundToInt()
            pixels.argb(x, y)
        }
    }

    @Test fun theActiveRowIsDrawnWithTheHoverFill() {
        val fills = rowFills(activeValue = "floor")
        val hover = KozmosColors.semanticsHoverFill.toArgb()
        assertTrue("the active row drew ${DrawnPixels.hex(fills[1])}", DrawnPixels.matches(fills[1], hover))
        assertTrue("an inactive row drew ${DrawnPixels.hex(fills[0])}", DrawnPixels.matches(fills[0], host))
        assertTrue("an inactive row drew ${DrawnPixels.hex(fills[2])}", DrawnPixels.matches(fills[2], host))
    }

    @Test fun noActiveValueDrawsNoActiveRow() {
        assertTrue(rowFills(activeValue = null).all { DrawnPixels.matches(it, host) })
    }

    @Test fun theChosenRowKeepsItsOwnFill() {
        val fills = rowFills(activeValue = "floor", selected = listOf("floor"))
        val chosen = KozmosColors.primitivesColorsBackground100.toArgb()
        assertTrue("the chosen row drew ${DrawnPixels.hex(fills[1])}", DrawnPixels.matches(fills[1], chosen))
    }

    @Test fun initialsAreTheLabelsFirstLetters() {
        assertEquals("PC", optionInitials("Pointr Cloud"))
        assertEquals("A", optionInitials("  acme "))
        assertEquals("İA", optionInitials("İstanbul Airport"))
    }
}
