package com.kozmos.components.colorpicker

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import kotlin.math.abs

/**
 * The open colour picker's format row — the format menu, the value boxes,
 * the opacity box and its "%" — at a phone's widths and at large text.
 *
 * Until these tests the row was a Row of boxes a fixed 36dp tall, which
 * could not wrap. At font scale 1 it is about 260dp and fits every width
 * here. From font scale 1.3 every box cut its text top and bottom, at every
 * width; at 2 and 343dp or narrower the "%" was squeezed to 0dp, and at
 * 320dp the opacity value broke over three lines. React's format grid,
 * `repeat(auto-fit, minmax(3.5rem, 1fr))`, never overflows or clips, and
 * #296 made SwiftUI wrap as it does.
 *
 * Now a box is at least 36dp and grows with its text, and where the parts do
 * not fit on one line at their text's width the row wraps into equal
 * columns, at least 56dp (96 for HEX) and at least as wide as the widest
 * part, the opacity box and its "%" sharing one. Where they fit, the row is
 * laid out as the Row laid it out.
 *
 * Read off the laid-out tree (`FormatRowReading`): a part's box is its
 * layout node's outermost bounds, its text the node's own, and whether the
 * text is cut or broken comes from the layout result its semantics give
 * TalkBack. Theme cannot move a part, so each case is read in both, and
 * right to left is read from the inline start, so it must match left to
 * right.
 */
class KozmosColorPickerFormatRowTest {
    @get:Rule val paparazzi = formatRowPaparazzi()

    private val widths = listOf(320f, 343f, 359f, 390f, 430f)
    private val largeText = listOf(1.3f, 1.5f, 2f)

    /** The default colour, and one whose channels are all three digits wide. */
    private val values = listOf("#135BEC", "#FFEEDD")

    private fun words(format: KozmosColorPickerFormat, value: String): List<String> = when (value to format) {
        "#135BEC" to KozmosColorPickerFormat.Hsl -> listOf("HSL", "220", "85", "50")
        "#135BEC" to KozmosColorPickerFormat.Rgb -> listOf("RGB", "19", "91", "236")
        "#135BEC" to KozmosColorPickerFormat.Hex -> listOf("HEX", "#135BEC")
        "#FFEEDD" to KozmosColorPickerFormat.Hsl -> listOf("HSL", "30", "100", "93")
        "#FFEEDD" to KozmosColorPickerFormat.Rgb -> listOf("RGB", "255", "238", "221")
        "#FFEEDD" to KozmosColorPickerFormat.Hex -> listOf("HEX", "#FFEEDD")
        else -> error("no words for $value $format")
    } + listOf("100", "%")

    private class Case(val row: FormatRow, val value: String, val dark: Boolean) {
        override fun toString(): String = "${row.format} ${value}${if (dark) " dark" else ""} at ${row.width}dp, " +
            "font scale ${row.fontScale}, ${if (row.rtl) "right to left" else "left to right"}"
    }

    /** Every width, format, direction, theme and colour at [fontScale]. */
    private fun cases(fontScale: Float): List<Case> =
        values.flatMap { value ->
            KozmosColorPickerFormat.values().flatMap { format ->
                widths.flatMap { width ->
                    listOf(false, true).flatMap { rtl ->
                        listOf(false, true).map { dark ->
                            Case(paparazzi.formatRow(width, fontScale, rtl, format, dark = dark, value = value), value, dark)
                        }
                    }
                }
            }
        }

    /** The row's 6dp gap, in the whole pixels it is laid out in. */
    private val FormatRow.gap: Float get() = rounded(6f)

    /** A part's index is a value box's that keeps a 44dp floor: RGB's and HSL's channels. */
    private fun FormatRow.isChannel(index: Int): Boolean =
        format != KozmosColorPickerFormat.Hex && index in 1..3

    /** How wide a part is at its text's width: the text, the box's 8dp each side, a channel 44dp at least. */
    private fun FormatRow.natural(index: Int): Float {
        val part = parts[index]
        if (part.words == "%") return part.textOneLineWidth
        val boxed = part.textOneLineWidth + 2 * rounded(8f)
        return if (isChannel(index)) maxOf(boxed, 44f) else boxed
    }

    private fun FormatRow.fitsOnOneLine(): Boolean =
        parts.indices.sumOf { natural(it).toDouble() } + gap * (parts.size - 1) <= innerEnd - innerStart + 0.01

    private fun near(expected: Float, actual: Float, within: Float = 0.01f) = abs(expected - actual) <= within

    /**
     * Laid out as the Row laid it out: one line from the inline start, each
     * part 6dp after the last and as wide as its text, the HEX value filling
     * what is left, every box the same height, the "%" centred on them, and
     * each box's text 6dp under its top.
     */
    private fun oneLineProblems(case: Case, boxHeight: Float?): List<String> {
        val row = case.row
        val problems = mutableListOf<String>()
        if (row.lines.size != 1) problems += "${row.lines.size} lines"
        if (!near(row.innerStart, row.parts.first().start)) problems += "starts at ${row.parts.first().start}"
        row.parts.zipWithNext().forEach { (a, b) ->
            if (!near(a.end + row.gap, b.start)) problems += "\"${b.words}\" is ${b.start - a.end}dp after \"${a.words}\""
        }
        row.parts.forEachIndexed { index, part ->
            val fills = row.format == KozmosColorPickerFormat.Hex && index == 1
            if (!fills && !near(row.natural(index), part.width)) problems += "\"${part.words}\" is ${part.width}dp, its text's width is ${row.natural(index)}"
        }
        val last = row.parts.last()
        if (row.format == KozmosColorPickerFormat.Hex && !near(row.innerEnd, last.end)) problems += "HEX ends at ${last.end}, not ${row.innerEnd}"
        val boxes = row.parts.filter { it.words != "%" }
        if (boxes.any { !near(boxes.first().top, it.top) || !near(boxes.first().height, it.height) }) problems += "boxes differ in height"
        if (boxHeight != null && !near(row.rounded(boxHeight), boxes.first().height)) problems += "boxes are ${boxes.first().height}dp, not $boxHeight"
        if (!near(boxes.first().middle, last.middle, 0.6f / row.px)) problems += "\"%\" is not centred on the boxes"
        boxes.forEach { if (!near(it.top + row.rounded(6f), it.textTop)) problems += "\"${it.words}\" text is ${it.textTop - it.top}dp under its top" }
        return problems.map { "$case: $it" }
    }

    /** Every part holds its text on one line, uncut, at least as wide as it, inside the panel. */
    private fun holdingProblems(case: Case): List<String> {
        val row = case.row
        val problems = mutableListOf<String>()
        row.parts.forEachIndexed { index, part ->
            val name = "\"${part.words}\""
            if (part.lines != 1) problems += "$name breaks over ${part.lines} lines"
            if (part.overflows) problems += "$name is cut: ${part.linesHeight}dp of text in ${part.textHeight}"
            if (part.width + 0.01f < row.natural(index)) problems += "$name is squeezed to ${part.width}dp; its text needs ${row.natural(index)}"
            if (part.start < row.innerStart - 0.01f || part.end > row.innerEnd + 0.01f) problems += "$name is ${part.start}–${part.end}, outside the panel's ${row.innerStart}–${row.innerEnd}"
            if (part.top <= row.above || part.bottom >= row.below) problems += "$name is ${part.top}–${part.bottom}, over the slider or the palette field"
            if (part.words != "%" && part.height + 0.01f < maxOf(row.rounded(36f), part.linesHeight + 2 * row.rounded(6f))) {
                problems += "$name box is ${part.height}dp for ${part.linesHeight}dp of text"
            }
        }
        row.lines.forEach { line ->
            line.zipWithNext().forEach { (a, b) -> if (a.end > b.start + 0.01f) problems += "\"${a.words}\" overlaps \"${b.words}\"" }
        }
        return problems.map { "$case: $it" }
    }

    /**
     * Wrapped as React's grid wraps: as many equal columns to a line as fit
     * at the widest part's width (56dp at least, 96 for HEX), lines from the
     * inline start, the parts in reading order, the opacity box and its "%"
     * sharing a column.
     */
    private fun columnProblems(case: Case): List<String> {
        val row = case.row
        val problems = mutableListOf<String>()
        // A column holds a box, and the opacity box's "%" with it.
        val cells = row.parts.indices.filter { row.parts[it].words != "%" }.map { index ->
            val natural = row.natural(index) + if (index == row.parts.size - 2) row.gap + row.natural(index + 1) else 0f
            index to natural
        }
        val minimum = if (row.format == KozmosColorPickerFormat.Hex) 96f else 56f
        val floor = maxOf(row.rounded(minimum), cells.maxOf { it.second })
        val inner = row.innerEnd - row.innerStart
        val perLine = ((inner + row.gap + 0.01f) / (floor + row.gap)).toInt().coerceIn(1, cells.size)
        val column = (inner - row.gap * (perLine - 1)) / perLine
        val expected = cells.chunked(perLine).map { line -> line.map { (index, _) -> row.parts[index].words } }
        val laidOut = row.lines.map { line -> line.filter { it.words != "%" }.map { it.words } }
        if (laidOut != expected) problems += "lines $laidOut, expected $expected"
        row.lines.forEach { line ->
            if (!near(row.innerStart, line.first().start, 1f / row.px)) problems += "a line starts at ${line.first().start}"
            val boxes = line.filter { it.words != "%" }
            boxes.forEachIndexed { at, box ->
                val cellEnd = if (box === row.parts[row.parts.size - 2]) row.parts.last().end else box.end
                if (!near(column, cellEnd - box.start, 1f / row.px)) problems += "\"${box.words}\" takes ${cellEnd - box.start}dp, not a ${column}dp column"
                if (!near(row.innerStart + at * (column + row.gap), box.start, 1f / row.px)) problems += "\"${box.words}\" starts at ${box.start}"
            }
        }
        val opacity = row.parts[row.parts.size - 2]
        val percent = row.parts.last()
        if (!near(opacity.end + row.gap, percent.start) || !near(opacity.middle, percent.middle, 0.6f / row.px)) {
            problems += "\"%\" is not beside the opacity box: ${percent.start} after ${opacity.end}"
        }
        return problems.map { "$case: $it" }
    }

    /**
     * What TalkBack reads, and in what order: the parts' words, the menu
     * alone taking a press and alone named, "Color format", as React's select
     * is (`aria-label`); the values are their words alone.
     */
    private fun readingProblems(case: Case): List<String> {
        val row = case.row
        val expected = words(row.format, case.value)
        val problems = mutableListOf<String>()
        if (row.parts.map { it.words } != expected) problems += "composed ${row.parts.map { it.words }}"
        val read = row.lines.flatten().map { it.words }
        if (read != expected) problems += "read by place as $read"
        if (row.spoken.map { it.words } != expected) problems += "TalkBack is given ${row.spoken.map { it.words }}"
        if (row.spoken.map { it.clickable } != expected.indices.map { it == 0 }) problems += "presses ${row.spoken.map { it.clickable }}"
        val named = expected.indices.map { if (it == 0) "Color format" else null }
        if (row.spoken.map { it.description } != named) problems += "descriptions ${row.spoken.map { it.description }}"
        return problems.map { "$case: $it" }
    }

    /**
     * At font scale 1 every part fits on one line at every width here, and
     * the row is laid out as the Row laid it out: boxes 36dp, 6dp apart from
     * the inline start, each as wide as its text. A guard: it passes before
     * and after the change.
     */
    @Test
    fun atFontScaleOneTheRowIsLaidOutAsItWas() {
        val cases = cases(1f)
        val problems = cases.flatMap { case ->
            (if (case.row.fitsOnOneLine()) emptyList() else listOf("$case: does not fit on one line")) +
                oneLineProblems(case, boxHeight = 36f) + holdingProblems(case) + readingProblems(case)
        }
        assertTrue(problems.joinToString("\n"), problems.isEmpty())
        // As measured on main before the change: the default HSL row is
        // 42.18 + 3 × 44 + 42.18 + a 12.73dp "%", with five 6.18dp gaps.
        val hsl = cases.first { it.value == "#135BEC" && it.row.format == KozmosColorPickerFormat.Hsl }.row
        assertEquals(listOf(42.18f, 44f, 44f, 44f, 42.18f, 12.73f), hsl.parts.map { Math.round(it.width * 100) / 100f })
        assertEquals(260f, hsl.parts.last().end - hsl.parts.first().start, 0.01f)
    }

    /**
     * From font scale 1.3 every box holds its text: on one line, uncut, never
     * narrower than it, the "%" included, and inside the panel. Before, the
     * 36dp boxes cut their text at every width, and at font scale 2 and
     * 320dp the opacity value broke over three lines beside a 0dp "%".
     */
    @Test
    fun atLargeTextEveryBoxHoldsItsTextOnOneLine() {
        val problems = largeText.flatMap { scale -> cases(scale).flatMap(::holdingProblems) }
        assertTrue(problems.joinToString("\n"), problems.isEmpty())
    }

    /**
     * Where the parts fit on one line at their text's width the row keeps
     * the Row's layout, its boxes grown with the text; where they do not, it
     * wraps into equal columns from the inline start, as React does.
     */
    @Test
    fun whereTheRowDoesNotFitItWrapsIntoEqualColumns() {
        val all = largeText.flatMap(::cases)
        val problems = all.flatMap { case ->
            if (case.row.fitsOnOneLine()) oneLineProblems(case, boxHeight = null) else columnProblems(case)
        }
        assertTrue(problems.joinToString("\n"), problems.isEmpty())
        // At font scale 2 on a 320dp picker: three columns of 94.55dp for
        // HSL, the opacity box and its "%" starting the second line; HEX's
        // value takes two columns' room, so two.
        fun lines(format: KozmosColorPickerFormat) = all.first {
            it.value == "#135BEC" && it.row.format == format && it.row.fontScale == 2f && it.row.width < 321f && !it.row.rtl
        }.row.lines.map { line -> line.map { it.words } }
        assertEquals(listOf(listOf("HSL", "220", "85"), listOf("50", "100", "%")), lines(KozmosColorPickerFormat.Hsl))
        assertEquals(listOf(listOf("HEX", "#135BEC"), listOf("100", "%")), lines(KozmosColorPickerFormat.Hex))
        // Where it wrapped, it wrapped somewhere: the test is not passing on
        // rows that all fit.
        assertTrue(all.count { !it.row.fitsOnOneLine() } > 0)
    }

    /**
     * TalkBack is given the same words, in reading order, with the format
     * menu the one part that takes a press, whether the row is one line or
     * wrapped, in either direction.
     */
    @Test
    fun theRowIsReadInTheOrderItIsComposed() {
        val problems = listOf(1f, 2f).flatMap { scale -> cases(scale).flatMap(::readingProblems) }
        assertTrue(problems.joinToString("\n"), problems.isEmpty())
    }
}
