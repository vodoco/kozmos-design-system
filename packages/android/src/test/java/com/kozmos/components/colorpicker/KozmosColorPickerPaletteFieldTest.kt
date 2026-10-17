package com.kozmos.components.colorpicker

import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import kotlin.math.abs

/**
 * The open colour picker's palette field, the box under the format row that
 * names the palette, at a phone's widths and at large text.
 *
 * Until these tests the field was a Row a fixed 40dp tall, its label free to
 * wrap and laid out before the caret. At font scale 1 the label fits on one
 * line at every width here. At 1.5 on a 320dp picker, and at 2 up to 359dp,
 * the label broke over two lines and the fixed height cut the second off:
 * at 2 and 320dp the field showed "Kozmos Design" of "Kozmos Design System
 * 2.0". Laid out first, the label took the caret's room, so the caret was
 * 0dp wide there, and 17dp at 2 and 390dp. From 1.3 the field did not grow
 * with its label at all.
 *
 * React's palette field is a <select> 2.25rem tall: it grows with the text
 * and keeps it on one line, and SwiftUI's is at least 40pt with its label on
 * one line. Now the field is at least 40dp and 8dp taller than its label
 * above and below, the label stays on one line and ends in an ellipsis where
 * it does not fit, and the caret is laid out first, 20dp at the end, with
 * at least 8dp before it. Where the label fits, the field is laid out as it
 * was.
 *
 * Read off the laid-out tree (`PaletteFieldReading`): the field is the
 * bordered layout node round the label, the caret its last child, and the
 * label's lines come from the layout result its semantics give TalkBack.
 * Theme cannot move a part, so each case is read in both, and right to left
 * is read from the inline start, so it must match left to right.
 */
class KozmosColorPickerPaletteFieldTest {
    @get:Rule val paparazzi = paletteFieldPaparazzi()

    private val label = "Kozmos Design System 2.0"
    private val widths = listOf(320f, 343f, 359f, 390f, 430f)
    private val fontScales = listOf(1f, 1.3f, 1.5f, 2f)

    /** Every width, direction and theme at each of [scales]. */
    private fun fields(scales: List<Float> = fontScales): List<PaletteField> =
        scales.flatMap { fontScale ->
            widths.flatMap { width ->
                listOf(false, true).flatMap { rtl ->
                    listOf(false, true).map { dark -> paparazzi.paletteField(width, fontScale, rtl, dark, paletteLabel = label) }
                }
            }
        }

    private fun near(expected: Float, actual: Float, within: Float = 0.01f) = abs(expected - actual) <= within

    /** What the label may take: the field less its 12dp padding each side, the caret and the 8dp before it. */
    private val PaletteField.room: Float get() = box.width - 2 * rounded(12f) - rounded(20f) - rounded(8f)

    private fun assertNoProblems(problems: List<String>) =
        assertTrue("${problems.size} problems:\n" + problems.joinToString("\n"), problems.isEmpty())

    /**
     * A guard, passing before the fix and after: at font scale 1 the field
     * is laid out as it was. It spans the panel's content, 40dp tall; the
     * label is on one line at its own width, 12dp in from the inline start,
     * centred; the caret is 20dp, 12dp in from the inline end, centred.
     */
    @Test
    fun atFontScaleOneTheFieldIsLaidOutAsItWas() {
        val problems = fields(listOf(1f)).flatMap { field ->
            val box = field.box
            listOfNotNull(
                "the field is ${box.width}dp at ${box.start}, not the panel's ${field.panelInner.width} at ${field.panelInner.start}"
                    .takeUnless { near(field.panelInner.start, box.start) && near(field.panelInner.width, box.width) },
                "the field is ${box.height}dp tall, not 40".takeUnless { near(40f, box.height) },
                "the label is at ${field.text.start}, not ${box.start + 12}".takeUnless { near(box.start + 12f, field.text.start) },
                "the label is ${field.text.width}dp, its text is ${field.textOneLineWidth}"
                    .takeUnless { near(field.textOneLineWidth, field.text.width) },
                "the label is ${field.text.top - box.top}dp under the field's top, not 10.55"
                    .takeUnless { near(10.55f, field.text.top - box.top) },
                "the label shows \"${field.shown}\"".takeUnless { field.shown == label && field.lines == 1 && !field.cut },
                "the caret is ${field.caret}, not 20dp at ${box.end - 32}, 10.18 under the field's top"
                    .takeUnless {
                        near(20f, field.caret.width) && near(20f, field.caret.height) &&
                            near(box.end - 32f, field.caret.start) && near(10.18f, field.caret.top - box.top)
                    }
            ).map { "$field: $it" }
        }
        assertNoProblems(problems)
    }

    /**
     * At every font scale the label is on one line, uncut, and the field
     * grows with it: at least 40dp, and 8dp taller than the label above and
     * below, the label centred.
     */
    @Test
    fun atLargeTextTheFieldGrowsWithItsLabel() {
        val problems = fields().flatMap { field ->
            val box = field.box
            val text = field.text
            val expected = maxOf(40f, text.height + 2 * field.rounded(8f))
            val pixel = 1f / field.px
            listOfNotNull(
                "the label is ${field.lines} lines".takeUnless { field.lines == 1 },
                "the label is cut: ${field.linesHeight}dp of lines in ${text.height}, \"${field.shown}\" shown".takeUnless { !field.cut },
                "the field is ${box.height}dp tall for a ${text.height}dp label, not $expected"
                    .takeUnless { near(expected, box.height, pixel) },
                "the label is ${text.top - box.top}dp under the field's top and ${box.bottom - text.bottom} over its bottom"
                    .takeUnless { abs((text.top - box.top) - (box.bottom - text.bottom)) <= pixel + 0.01f },
                "the label is outside the field".takeUnless {
                    text.top >= box.top - 0.01f && text.bottom <= box.bottom + 0.01f && text.start >= box.start && text.end <= box.end
                }
            ).map { "$field: $it" }
        }
        assertNoProblems(problems)
    }

    /**
     * At every font scale the caret keeps its 20dp at the field's inline
     * end, 12dp in, centred on the field, with at least 8dp between it and
     * the label.
     */
    @Test
    fun theCaretKeepsItsPlaceAtTheEnd() {
        val problems = fields().flatMap { field ->
            val box = field.box
            val caret = field.caret
            listOfNotNull(
                "the caret is ${caret.width} × ${caret.height}dp".takeUnless { near(20f, caret.width) && near(20f, caret.height) },
                "the caret ends at ${caret.end}, not ${box.end - 12}".takeUnless { near(box.end - 12f, caret.end) },
                "the caret is not centred on the field".takeUnless { abs(caret.middle - box.middle) <= 1f / field.px + 0.01f },
                "the label ends ${caret.start - field.text.end}dp before the caret"
                    .takeUnless { caret.start - field.text.end >= field.rounded(8f) - 0.01f }
            ).map { "$field: $it" }
        }
        assertNoProblems(problems)
    }

    /**
     * Where the label fits beside the caret it is shown whole, at its own
     * width; where it does not it fills its room and ends in an ellipsis.
     * TalkBack reads it whole either way.
     */
    @Test
    fun aLabelThatDoesNotFitEndsInAnEllipsis() {
        val all = fields()
        val problems = all.flatMap { field ->
            val fits = field.textOneLineWidth <= field.room + 0.01f
            listOfNotNull(
                if (fits) {
                    "it fits in ${field.room}dp but shows \"${field.shown}\" at ${field.text.width}dp"
                        .takeUnless { field.shown == label && !field.ellipsized && near(field.textOneLineWidth, field.text.width) }
                } else {
                    "it is ${field.textOneLineWidth}dp for ${field.room} and shows \"${field.shown}\" at ${field.text.width}dp"
                        .takeUnless {
                            field.ellipsized && field.shown.endsWith("…") && label.startsWith(field.shown.dropLast(1)) &&
                                field.shown.length > 1 && field.text.width <= field.room + 0.01f
                        }
                },
                "TalkBack reads \"${field.spoken}\"".takeUnless { field.spoken == label }
            ).map { "$field: $it" }
        }
        // Both kinds are read: the label does not fit beside the caret at 1.5
        // up to 343dp, and at 2 up to 390dp.
        val ellipsized = all.filter { it.textOneLineWidth > it.room + 0.01f }.map { it.fontScale to Math.round(it.width) }.toSet()
        assertNoProblems(
            problems + listOfNotNull(
                "the label does not fit at $ellipsized".takeUnless {
                    ellipsized == setOf(1.5f to 320, 1.5f to 343, 2f to 320, 2f to 343, 2f to 359, 2f to 390)
                }
            )
        )
    }
}
