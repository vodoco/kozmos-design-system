package com.kozmos.components.pagination

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.wrapContentWidth
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.layout.boundsInRoot
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import app.cash.paparazzi.DeviceConfig
import app.cash.paparazzi.Paparazzi
import com.kozmos.components.KeptFrames
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.tokens.KozmosThemeTokens
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import kotlin.math.abs

/**
 * Pagination wraps as React's row does, `flex flex-row flex-wrap
 * justify-center items-center gap-1`, and as #392's KozmosPaginationRowLayout
 * wraps SwiftUI's: each part keeps its own width, a part that would pass the
 * end of a line starts the next, each line is centred, each part sits on its
 * line's middle, and lines are 4dp apart. Compose's was a Row, which cannot
 * wrap: with 44dp links, Code Connect's Basic composition is wider than a
 * 360dp phone's 328dp line, and the Row squeezed Next from 74.3 to 56dp; at
 * 379dp the Ellipsis composition's Next was 3dp wide, its word broken over
 * four lines.
 *
 * Each composition is laid out with no width to fit and on lines of 328, 361
 * and 379dp (a 360, a 393 and a 411dp phone, less 16dp each side), in both
 * directions; right to left, a line reads from the right. A part's box is
 * what it lays out, its 4dp each side included.
 */
class KozmosPaginationWrapTest {
    // Wider than Paparazzi's default Nexus 5 (360dp), at its density, so the
    // 361 and 379dp lines fit on the screen. Nothing is recorded.
    @get:Rule val paparazzi = Paparazzi(
        deviceConfig = DeviceConfig.NEXUS_5.copy(screenWidth = 1500),
        snapshotHandler = KeptFrames().handler
    )

    private val lineWidths = listOf(328, 361, 379)

    private class Part(val name: String, val draw: @Composable (Modifier) -> Unit)

    private val compositions: Map<String, List<Part>> = mapOf(
        "Basic" to listOf(
            Part("Previous") { KozmosPaginationPrevious(onClick = {}, modifier = it) },
            Part("1") { KozmosPaginationLink(text = "1", onClick = {}, modifier = it) },
            Part("2") { KozmosPaginationLink(text = "2", isActive = true, onClick = {}, modifier = it) },
            Part("3") { KozmosPaginationLink(text = "3", onClick = {}, modifier = it) },
            Part("Next") { KozmosPaginationNext(onClick = {}, modifier = it) }
        ),
        "Ellipsis" to listOf(
            Part("Previous") { KozmosPaginationPrevious(onClick = {}, modifier = it) },
            Part("1") { KozmosPaginationLink(text = "1", onClick = {}, modifier = it) },
            Part("2") { KozmosPaginationLink(text = "2", isActive = true, onClick = {}, modifier = it) },
            Part("3") { KozmosPaginationLink(text = "3", onClick = {}, modifier = it) },
            Part("…") { KozmosPaginationEllipsis(modifier = it) },
            Part("10") { KozmosPaginationLink(text = "10", onClick = {}, modifier = it) },
            Part("Next") { KozmosPaginationNext(onClick = {}, modifier = it) }
        ),
        // A caller's own part, as Code Connect's Compact composition passes it.
        "Compact" to listOf(
            Part("Previous") { KozmosPaginationPrevious(onClick = {}, modifier = it) },
            Part("2/10") {
                Text("2 / 10", modifier = it, color = KozmosThemeTokens.primitivesColorsForeground500,
                    style = MaterialTheme.typography.bodyMedium)
            },
            Part("Next") { KozmosPaginationNext(onClick = {}, modifier = it) }
        )
    )

    /** Each part's box and the pagination's, in pixels, laid out on a [line] dp wide line, or with no width to fit. */
    private fun layOut(parts: List<Part>, line: Int?, rtl: Boolean): Triple<Map<String, Rect>, Rect, Float> {
        val boxes = mutableMapOf<String, Rect>()
        var pagination = Rect.Zero
        var density = 1f
        paparazzi.snapshot {
            density = LocalDensity.current.density
            CompositionLocalProvider(LocalLayoutDirection provides if (rtl) LayoutDirection.Rtl else LayoutDirection.Ltr) {
                KozmosMaterialTheme {
                    // The outer box lets the line be narrower than the screen:
                    // the root holds its content to the screen's whole width.
                    Box {
                        Box(if (line == null) Modifier.wrapContentWidth(Alignment.Start, unbounded = true) else Modifier.width(line.dp)) {
                            KozmosPagination(modifier = Modifier.onGloballyPositioned { pagination = it.boundsInRoot() }) {
                                parts.forEach { part -> part.draw(Modifier.onGloballyPositioned { boxes[part.name] = it.boundsInRoot() }) }
                            }
                        }
                    }
                }
            }
        }
        return Triple(boxes, pagination, density)
    }

    /** The parts in lines, top to bottom: a part whose middle is above the line's foot is on it. */
    private fun lines(boxes: Map<String, Rect>, rtl: Boolean): List<List<Pair<String, Rect>>> {
        val lines = mutableListOf<MutableList<Pair<String, Rect>>>()
        for (part in boxes.toList().sortedBy { it.second.top }) {
            val line = lines.lastOrNull()
            if (line != null && part.second.center.y < line.maxOf { it.second.bottom }) line += part else lines += mutableListOf(part)
        }
        return lines.map { line -> if (rtl) line.sortedByDescending { it.second.left } else line.sortedBy { it.second.left } }
    }

    private fun words(lines: List<List<Pair<String, Rect>>>) = lines.joinToString(" | ") { line -> line.joinToString(" ") { it.first } }

    private val expectedLines = mapOf(
        "Basic" to mapOf(328 to "Previous 1 2 3 | Next", 361 to "Previous 1 2 3 Next", 379 to "Previous 1 2 3 Next"),
        "Ellipsis" to mapOf(328 to "Previous 1 2 3 … | 10 Next", 361 to "Previous 1 2 3 … 10 | Next", 379 to "Previous 1 2 3 … 10 | Next"),
        "Compact" to mapOf(328 to "Previous 2/10 Next", 361 to "Previous 2/10 Next", 379 to "Previous 2/10 Next")
    )

    @Test fun eachPartKeepsItsWidthAndSitsOnTheMiddleOfACentredLine() {
        val found = mutableMapOf<String, String>()
        val expected = mutableMapOf<String, String>()
        val layouts = mutableListOf<String>()
        for (rtl in listOf(false, true)) {
            val direction = if (rtl) "right to left" else "left to right"
            for ((name, parts) in compositions) {
                val (natural, _, density) = layOut(parts, line = null, rtl = rtl)
                for (width in lineWidths) {
                    val case = "$name on a ${width}dp line, $direction"
                    val (boxes, pagination, _) = layOut(parts, width, rtl)
                    val laidLines = lines(boxes, rtl)
                    layouts += "$case: ${words(laidLines)}"
                    found["$case: the lines"] = words(laidLines)
                    expected["$case: the lines"] = expectedLines.getValue(name).getValue(width)
                    for (part in parts) {
                        val box = boxes.getValue(part.name)
                        val own = natural.getValue(part.name).width
                        found["$case: ${part.name}'s width"] = if (abs(box.width - own) <= 1f) "its own" else "%.1fdp, where its own is %.1f".format(box.width / density, own / density)
                        expected["$case: ${part.name}'s width"] = "its own"
                    }
                    laidLines.forEachIndexed { index, line ->
                        val top = line.minOf { it.second.top }
                        val bottom = line.maxOf { it.second.bottom }
                        val off = line.filter { abs(it.second.center.y - (top + bottom) / 2) > 1f }.map { it.first }
                        found["$case: line ${index + 1}'s parts off its middle"] = off.toString()
                        expected["$case: line ${index + 1}'s parts off its middle"] = "[]"
                        val before = line.minOf { it.second.left } - pagination.left
                        val after = pagination.right - line.maxOf { it.second.right }
                        found["$case: line ${index + 1} centred"] = if (abs(before - after) <= 1f) "yes" else "%.1fdp before, %.1fdp after".format(before / density, after / density)
                        expected["$case: line ${index + 1} centred"] = "yes"
                        if (index > 0) {
                            val gap = top - laidLines[index - 1].maxOf { it.second.bottom }
                            found["$case: between lines ${index} and ${index + 1}"] = "%.1f".format(gap / density)
                            expected["$case: between lines ${index} and ${index + 1}"] = "4.0"
                        }
                    }
                }
            }
        }
        println("Pagination Android, the lines:\n" + layouts.joinToString("\n"))
        val wrong = expected.keys.filter { found[it] != expected[it] }.map { "$it: ${found[it]} (expected ${expected[it]})" }
        assertEquals("the parts of the lines that are wrong", emptyList<String>(), wrong)
    }
}
