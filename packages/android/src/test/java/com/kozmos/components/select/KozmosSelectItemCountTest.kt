package com.kozmos.components.select

import android.content.res.Configuration
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.kozmos.components.ReadSemantics
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import java.util.Locale
import kotlin.math.abs

/**
 * GAP-164: an option can carry a count, the neutral Counter at the row's
 * end, outside its label. TalkBack reads the option as one stop named by its
 * label, a comma and a space, and its count, in the count's drawn form, the
 * current locale's grouping (decision 5b); an option with no count is read
 * as it always was. The counts form one column (decision 1).
 */
class KozmosSelectItemCountTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    private fun draw(count: Int?, rtl: Boolean = false, locale: Locale = Locale.US): ReadSemantics = paparazzi.readSemantics {
        val configuration = Configuration(LocalConfiguration.current).apply { setLocale(locale) }
        CompositionLocalProvider(
            LocalLayoutDirection provides if (rtl) LayoutDirection.Rtl else LayoutDirection.Ltr,
            LocalConfiguration provides configuration
        ) {
            KozmosMaterialTheme {
                Column(Modifier.width(280.dp)) {
                    KozmosSelectItem(value = "cafes", label = "Cafés", onValueChange = {}, onDismissRequest = {}, count = count)
                }
            }
        }
    }

    /** The one stop TalkBack makes on the option, as it is told about it. */
    private fun ReadSemantics.option(): String {
        val stops = merged.filter { it.click != null }
        assertEquals("the option is not one stop: ${stops.map { it.texts }}", 1, stops.size)
        return "texts=${stops.single().texts} description=${stops.single().description}"
    }

    @Test
    fun anOptionWithACountIsReadAsItsLabelThenItsCount() {
        for (rtl in listOf(false, true)) {
            val tree = draw(count = 12, rtl = rtl)
            val way = if (rtl) "right to left" else "left to right"
            assertEquals("what TalkBack reads, $way", "texts=[Cafés, 12] description=Cafés, 12", tree.option())
            // The counter is its own part at the row's end, outside the label.
            val label = tree.unmerged.single { it.texts == listOf("Cafés") }.bounds
            val counter = tree.unmerged.single { it.texts == listOf("12") }.bounds
            if (rtl) {
                assertTrue("the count is not before the label's start, $way: $counter vs $label", counter.right <= label.left)
            } else {
                assertTrue("the count is not after the label's end, $way: $counter vs $label", counter.left >= label.right)
            }
        }
    }

    /**
     * Decision 5b: one number format. The count is drawn in the current
     * locale's grouping, and TalkBack hears the same text: "Cafés, 1,234"
     * in American English, where the counter draws "1,234"; in German the
     * counter draws "1.234" and the option is "Cafés, 1.234".
     */
    @Test
    fun aCountIsDrawnAndReadInTheLocalesGrouping() {
        for ((locale, grouped) in listOf(Locale.US to "1,234", Locale.GERMANY to "1.234")) {
            val tree = draw(count = 1234, locale = locale)
            val drawn = tree.unmerged.filter { it.texts.size == 1 && it.texts.single() != "Cafés" }.map { it.texts.single() }
            assertEquals("what the counter draws, $locale", listOf(grouped), drawn)
            val stop = tree.merged.single { it.click != null }
            assertEquals("what TalkBack reads, $locale", "Cafés, $grouped", stop.words)
        }
    }

    @Test
    fun anOptionWithoutACountIsReadAsBefore() {
        val tree = draw(count = null)
        assertEquals("texts=[Cafés] description=null", tree.option())
        assertTrue("a count was drawn", tree.unmerged.none { it.texts == listOf("12") })
    }

    private val options = listOf("Cafés" to 128, "Restrooms" to 96, "Shops" to 32, "Information desks" to 1234)

    /**
     * The open list as Material's menu lays it out: a column as wide as its
     * widest option, each option filling it. [selected] is the select's
     * value, the label its trigger shows.
     */
    private fun drawList(selected: String, rtl: Boolean): ReadSemantics = paparazzi.readSemantics {
        val configuration = Configuration(LocalConfiguration.current).apply { setLocale(Locale.US) }
        CompositionLocalProvider(
            LocalLayoutDirection provides if (rtl) LayoutDirection.Rtl else LayoutDirection.Ltr,
            LocalConfiguration provides configuration
        ) {
            KozmosMaterialTheme {
                Column(Modifier.width(IntrinsicSize.Max)) {
                    for ((label, count) in options) {
                        KozmosSelectItem(
                            value = label,
                            label = label,
                            onValueChange = {},
                            onDismissRequest = {},
                            count = count
                        )
                    }
                }
            }
        }
    }

    /**
     * Decision 1: the counts form one column. Every counter's end edge, the
     * right left to right and the left right to left, is the same on every
     * row, whatever the label's and the count's lengths, and does not move
     * when the selection changes.
     */
    @Test
    fun theCountsFormOneColumnWhateverIsSelected() {
        for (rtl in listOf(false, true)) {
            val way = if (rtl) "right to left" else "left to right"
            val edges = options.map { it.first }.associateWith { selected ->
                val tree = drawList(selected, rtl)
                options.map { (_, count) ->
                    val drawn = String.format(Locale.US, "%,d", count)
                    val counter = tree.unmerged.single { it.texts == listOf(drawn) }.bounds
                    val row = tree.merged.single { it.click != null && it.words?.endsWith(", $drawn") == true }.bounds
                    if (rtl) counter.left - row.left else row.right - counter.right
                }
            }
            val first = edges.values.first().first()
            for ((selected, rows) in edges) {
                for ((i, edge) in rows.withIndex()) {
                    assertTrue(
                        "${options[i].first}'s counter is $edge px from its row's end with $selected selected, " +
                            "$first px for ${options[0].first} with ${options[0].first} selected, $way",
                        abs(edge - first) <= 0.5f
                    )
                }
            }
            // And the rows themselves share one end, so the inset is one column.
            val tree = drawList(options[0].first, rtl)
            val ends = tree.merged.filter { it.click != null }.map { if (rtl) it.bounds.left else it.bounds.right }
            assertTrue("the rows do not share an end, $way: $ends", ends.all { abs(it - ends.first()) <= 0.5f })
        }
    }
}
