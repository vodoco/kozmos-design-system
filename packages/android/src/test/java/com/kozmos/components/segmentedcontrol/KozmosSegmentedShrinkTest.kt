package com.kozmos.components.segmentedcontrol

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.requiredWidth
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.dp
import com.kozmos.components.ReadNode
import com.kozmos.components.ReadSemantics
import com.kozmos.components.readSemantics
import com.kozmos.components.readSettledSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import kotlin.math.abs

/**
 * GAP-267, decision 201: options keep 97, 117 or 137dp by size when there is
 * room, and shrink toward their words when the space is short, never past
 * them: no word is cut short or runs into the next option's. Three small
 * options took 3 × 97 + 10 and were cut short in a 296dp column (the
 * opening hours editor's narrow day). Read from the semantics tree: an
 * option's [ReadNode.frame] is where it is laid out, its [ReadNode.bounds]
 * what the track leaves of it, and its text's own width.
 */
class KozmosSegmentedShrinkTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    private val english = listOf("Hours", "Closed", "Always open")
    private val german = listOf("Öffnungszeiten", "Geschlossen", "Immer geöffnet")
    private var density = 1f

    @Composable
    private fun Column(width: Int, labels: List<String>, size: SegmentedControlSize = SegmentedControlSize.Sm, fullWidth: Boolean = false) {
        density = LocalDensity.current.density
        KozmosMaterialTheme {
            // Required: wider than the test's screen, a column is not cut
            // down to it. Laid out, an option's frame is its width whether
            // or not the screen shows all of it.
            Box(Modifier.requiredWidth(width.dp)) {
                KozmosSegmentedControl(options = labels, selectedIndex = 0, onOptionSelected = {}, size = size, fullWidth = fullWidth)
            }
        }
    }

    private fun ReadSemantics.options(labels: List<String>) = labels.map { label ->
        merged.single { it.texts == listOf(label) && it.click != null }
    }

    /** An option's words: its text's laid-out width, with its padding. */
    private fun ReadSemantics.words(label: String, padding: Int): Float {
        val text = unmerged.first { it.texts == listOf(label) && it.textWidth != null }
        return text.textWidth!! + 2 * padding * density
    }

    /** Each option whole (none cut by the track), at least its words, and none over the next. */
    private fun ReadSemantics.assertWordsWhole(labels: List<String>, padding: Int) {
        val options = options(labels)
        options.forEachIndexed { i, option ->
            assertTrue("${labels[i]} is narrower than its words: ${option.frame.width} < ${words(labels[i], padding)}",
                option.frame.width >= words(labels[i], padding) - 1f)
            assertTrue("${labels[i]} is not ellipsised", unmerged.first { it.texts == listOf(labels[i]) && it.textWidth != null }.textLayout?.isLineEllipsized(0) != true)
            if (i + 1 < options.size)
                assertTrue("${labels[i]} runs into ${labels[i + 1]}", option.frame.right <= options[i + 1].frame.left + 0.5f)
        }
    }

    private fun ReadNode.whole() = abs(bounds.left - frame.left) < 0.5f && abs(bounds.right - frame.right) < 0.5f

    @Test fun withRoomOptionsKeepTheirMinimumOrTheirWords() {
        for ((size, minimum, padding) in listOf(
            Triple(SegmentedControlSize.Sm, 97, 12),
            Triple(SegmentedControlSize.Default, 117, 16),
            Triple(SegmentedControlSize.Lg, 137, 20)
        )) {
            for (labels in listOf(english, german)) {
                val tree = paparazzi.readSemantics { Column(640, labels, size) }
                println("measured $size ${labels.first()} 640: options ${tree.options(labels).map { it.frame.width / density }} dp")
                tree.options(labels).forEachIndexed { i, option ->
                    val expected = maxOf(minimum * density, tree.words(labels[i], padding))
                    assertEquals("$size ${labels[i]}", expected, option.frame.width, 1.5f)
                }
                tree.assertWordsWhole(labels, padding)
            }
        }
    }

    @Test fun threeSmallEnglishOptionsFitA296Column() {
        val tree = paparazzi.readSettledSemantics { Column(296, english) }
        val options = tree.options(english)
        val widths = options.map { it.frame.width / density }
        println("measured en 296: options $widths dp, words ${english.map { tree.words(it, 12) / density }} dp")
        // The track's 4dp padding each side (its edge is drawn over it).
        assertTrue("the options take more than the track: $widths", widths.sum() <= 296f - 8f + 0.5f)
        assertTrue("every option is drawn whole: $widths", options.all { it.whole() })
        assertTrue("no option gave up any of its 97: $widths", widths.min() < 97f)
        tree.assertWordsWhole(english, 12)
    }

    @Test fun germanOptionsShrinkToTheirWordsAndTheTrackScrollsPastThem() {
        val tree = paparazzi.readSettledSemantics { Column(296, german) }
        val options = tree.options(german)
        tree.assertWordsWhole(german, 12)
        val words = german.map { tree.words(it, 12) / density }
        println("measured de 296: options ${options.map { it.frame.width / density }} dp, words $words dp")
        if (words.sum() + 8f > 296f) {
            // Wider than the column at their words: each at its words, and
            // the track scrolls, as React's does.
            options.forEachIndexed { i, option -> assertEquals(german[i], words[i], option.frame.width / density, 1f) }
            val track = tree.merged.single { it.selectableGroup != null }
            assertTrue("the track does not scroll", (track.horizontalScrollMax ?: 0f) > 0f)
        } else {
            assertTrue("every option is drawn whole", options.all { it.whole() })
        }
    }

    @Test fun fullWidthOptionsAreNeverNarrowerThanTheirWords() {
        val tree = paparazzi.readSettledSemantics { Column(240, german, fullWidth = true) }
        tree.assertWordsWhole(german, 12)
    }
}
