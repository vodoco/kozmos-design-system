package com.kozmos.components.select

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
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

/**
 * GAP-164: an option can carry a count, the neutral Counter at the row's
 * end, outside its label. TalkBack reads the option as one stop, its label
 * then its count; an option with no count is read as it always was.
 */
class KozmosSelectItemCountTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    private fun draw(count: Int?, rtl: Boolean = false): ReadSemantics = paparazzi.readSemantics {
        CompositionLocalProvider(LocalLayoutDirection provides if (rtl) LayoutDirection.Rtl else LayoutDirection.Ltr) {
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
            assertEquals("what TalkBack reads, $way", "texts=[Cafés, 12] description=null", tree.option())
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

    @Test
    fun anOptionWithoutACountIsReadAsBefore() {
        val tree = draw(count = null)
        assertEquals("texts=[Cafés] description=null", tree.option())
        assertTrue("a count was drawn", tree.unmerged.none { it.texts == listOf("12") })
    }
}
