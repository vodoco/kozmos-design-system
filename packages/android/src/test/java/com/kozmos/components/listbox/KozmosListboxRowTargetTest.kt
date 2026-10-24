package com.kozmos.components.listbox

import androidx.compose.foundation.LocalIndication
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.dp
import com.kozmos.components.Press
import com.kozmos.components.UnpaintedIndication
import com.kozmos.components.live
import com.kozmos.components.press
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import kotlin.math.abs

/**
 * A list row is at least 44dp tall (decision 115, 21 Oct): React's
 * `.kozmos-option` is the density's control height, 44 in touch, and #392
 * makes SwiftUI's rows 44. Compose's were 35dp, 8 above and below a 19dp
 * line. The row's words stay on its middle line, as React's `items-center`
 * keeps them; a row with a description, 51.3dp, is as tall as before. The
 * words, the check and the fills keep their sizes and colours. Combobox's
 * and MultiSelect's lists are this list.
 *
 * Presses 1dp inside the top and bottom of a 44dp row on a row's middle
 * line, and 1dp inside its start and end, off its words and its check: by a
 * pointer Compose does not widen ([Press.Pointer]), so they reach a row only
 * where its own box does, and by a finger.
 */
class KozmosListboxRowTargetTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    private var density = 1f

    private val options = listOf(
        KozmosListboxOption("a", "Gate A"),
        KozmosListboxOption("b", "Gate B"),
        KozmosListboxOption("c", "Gate C", description = "Level 2"),
        KozmosListboxOption("d", "Gate D")
    )

    @Composable
    private fun Rows(chosen: MutableList<String>) {
        density = LocalDensity.current.density
        KozmosMaterialTheme {
            CompositionLocalProvider(LocalIndication provides UnpaintedIndication) {
                Box(Modifier.padding(24.dp).width(320.dp)) {
                    KozmosListbox(
                        options = options,
                        selectedValues = listOf("b"),
                        onSelectionChange = { _, option -> chosen += option.value }
                    )
                }
            }
        }
    }

    @Test fun aRowIs44dpTallWithItsWordsOnItsMiddleLine() {
        val measured = mutableMapOf<String, String>()
        val expected = mutableMapOf<String, String>()
        paparazzi.live(content = { Rows(mutableListOf()) }) {
            for (option in options) {
                val row = read().merged.single { option.label in it.texts && it.click != null }.frame
                val words = read().unmerged.single { it.texts == listOf(option.label) }.frame
                measured["${option.label}'s row's height"] = "%.1f".format(row.height / density)
                // A row with a description is 51.3dp, as before.
                expected["${option.label}'s row's height"] = if (option.description == null) "44.0" else "51.3"
                if (option.description == null) {
                    // Within a pixel: the row's middle may fall between two.
                    val off = words.center.y - row.center.y
                    measured["${option.label}'s words"] = if (abs(off) <= 1f) "on the row's middle line" else "%.1fdp from the row's middle line".format(off / density)
                    expected["${option.label}'s words"] = "on the row's middle line"
                }
            }
        }
        println("Listbox Android, the rows: $measured")
        assertEquals(expected, measured)
    }

    @Test fun aPressAnywhereInARowReachesIt() {
        val reached = mutableMapOf<String, List<String>>()
        val expected = mutableMapOf<String, List<String>>()
        for (how in Press.values()) {
            val chosen = mutableListOf<String>()
            paparazzi.live(durationMillis = 6000, content = { Rows(chosen) }) {
                // The chosen row, which draws its check at the end, and one that does not.
                for (option in listOf(options[1], options[3])) {
                    val row = read().merged.single { option.label in it.texts && it.click != null }.frame
                    val reach = 21f * density
                    val inset = 1f * density
                    for ((edge, point) in listOf(
                        "top" to Offset(row.center.x, row.center.y - reach),
                        "bottom" to Offset(row.center.x, row.center.y + reach),
                        "left" to Offset(row.left + inset, row.center.y),
                        "right" to Offset(row.right - inset, row.center.y)
                    )) {
                        chosen.clear()
                        press(point, how)
                        reached["$how, ${option.label}'s $edge"] = chosen.toList()
                        expected["$how, ${option.label}'s $edge"] = listOf(option.value)
                    }
                }
            }
        }
        println("Listbox Android, what each press reached: $reached")
        assertEquals("what each press reached", expected, reached)
    }
}
