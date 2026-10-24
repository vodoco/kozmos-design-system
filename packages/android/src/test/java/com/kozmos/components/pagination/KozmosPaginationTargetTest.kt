package com.kozmos.components.pagination

import androidx.compose.foundation.LocalIndication
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.dp
import com.kozmos.components.Press
import com.kozmos.components.UnpaintedIndication
import com.kozmos.components.edgesOfSquare
import com.kozmos.components.live
import com.kozmos.components.press
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

/**
 * Pagination's targets are React's touch size. A page link is Button's icon
 * size, `h-icon-control w-icon-control`, and Previous and Next its `sm`, as
 * tall as the links (decision 82): 44 in touch, as #392 makes SwiftUI's.
 * Compose's were 36dp, the link a 36dp square. The words, the chevrons and
 * the active page's edge and tint keep their sizes and colours; the
 * ellipsis, which takes no press, keeps React's 36 (`h-9 w-9`).
 *
 * Presses 1dp inside each edge of a 44dp square on a link's centre, off its
 * digit, and 1dp inside the top and bottom of a 44dp row on Previous and
 * Next, off the word: by a pointer Compose does not widen ([Press.Pointer]),
 * so they reach a control only where its own box does, and by a finger.
 */
class KozmosPaginationTargetTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    private var density = 1f

    @Composable
    private fun Pages(pressed: MutableList<String>) {
        density = LocalDensity.current.density
        KozmosMaterialTheme {
            CompositionLocalProvider(LocalIndication provides UnpaintedIndication) {
                // Code Connect's Basic composition, 345dp with 44dp links: on
                // this 393dp screen it fits on its line. Compose's row does not
                // wrap, so a row too wide for its line squeezes its last part.
                Box(Modifier.padding(16.dp)) {
                    KozmosPagination {
                        KozmosPaginationPrevious(onClick = { pressed += "Previous" })
                        KozmosPaginationLink(text = "1", onClick = { pressed += "1" })
                        KozmosPaginationLink(text = "2", isActive = true, onClick = { pressed += "2" })
                        KozmosPaginationLink(text = "3", onClick = { pressed += "3" })
                        KozmosPaginationNext(onClick = { pressed += "Next" })
                    }
                }
            }
        }
    }

    private fun Rect.widthDp() = width / density
    private fun Rect.heightDp() = height / density

    @Test fun theLinksAre44dpSquaresAndPreviousAndNext44dpTall() {
        val measured = mutableMapOf<String, String>()
        val expected = mutableMapOf<String, String>()
        paparazzi.live(content = { Pages(mutableListOf()) }) {
            for (page in listOf("1", "2", "3")) {
                val link = read().saying(page).frame
                measured["page $page"] = "%.1f×%.1f".format(link.widthDp(), link.heightDp())
                expected["page $page"] = "44.0×44.0"
            }
            for (word in listOf("Previous", "Next")) {
                measured["$word's height"] = "%.1f".format(read().saying(word).frame.heightDp())
                expected["$word's height"] = "44.0"
            }
        }
        println("Pagination Android, the targets: $measured")
        assertEquals(expected, measured)
    }

    @Test fun aPressAnywhereInATargetReachesIt() {
        val reached = mutableMapOf<String, List<String>>()
        val expected = mutableMapOf<String, List<String>>()
        for (how in Press.values()) {
            val pressed = mutableListOf<String>()
            paparazzi.live(durationMillis = 8000, content = { Pages(pressed) }) {
                for (page in listOf("1", "2", "3")) {
                    for ((edge, point) in edgesOfSquare(read().saying(page).frame, 44f, density)) {
                        pressed.clear()
                        press(point, how)
                        reached["$how, page $page's $edge"] = pressed.toList()
                        expected["$how, page $page's $edge"] = listOf(page)
                    }
                }
                for (word in listOf("Previous", "Next")) {
                    val control = read().saying(word).frame
                    val reach = 21f * density
                    for ((edge, y) in listOf("top" to control.center.y - reach, "bottom" to control.center.y + reach)) {
                        pressed.clear()
                        press(Offset(control.center.x, y), how)
                        reached["$how, $word's $edge"] = pressed.toList()
                        expected["$how, $word's $edge"] = listOf(word)
                    }
                }
            }
        }
        println("Pagination Android, what each press reached: $reached")
        assertEquals("what each press reached", expected, reached)
    }
}
