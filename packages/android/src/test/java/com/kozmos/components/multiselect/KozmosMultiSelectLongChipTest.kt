package com.kozmos.components.multiselect

import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.layout.boundsInRoot
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.kozmos.components.chip.KozmosChip
import com.kozmos.components.listbox.KozmosListboxOption
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

/**
 * A chip whose words are wider than its room (#537's audit found React's run
 * under MultiSelect's clear). Here the chips have a row of their own above
 * the search field, so none reaches the clear or the chevron; but the label's
 * Text was measured first, took the whole row, and left the remove after it
 * no width, so a long chip in a narrow field had no remove to press. Now the
 * label takes what the remove leaves and ends in an ellipsis; the remove keeps
 * its 24dp and stays inside the room, in both directions, in a 200dp
 * MultiSelect and for a chip alone in a 120dp box.
 */
class KozmosMultiSelectLongChipTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    private val label = "Step-free access from the street entrance"

    private fun Rect.inDp(density: Float) = Rect(left / density, top / density, right / density, bottom / density)

    /**
     * In a row that scrolls sideways (a LazyRow of filters) the chip has no
     * width to fit: it is as wide as its words, none cut, and keeps its
     * remove. A weighted child of an unbounded Row is measured to nothing.
     */
    @Test fun aChipInAScrollingRowIsAsWideAsItsWords() {
        var density = 1f
        val tree = paparazzi.readSemantics {
            density = LocalDensity.current.density
            KozmosMaterialTheme {
                Row(Modifier.width(120.dp).horizontalScroll(rememberScrollState())) {
                    KozmosChip(text = label, onRemove = {})
                }
            }
        }
        val remove = tree.named("Remove $label").frame.inDp(density)
        val words = tree.merged.first { it.texts.contains(label) && it.description == null }
        val measured = mapOf(
            "the remove" to "%.1f×%.1f".format(remove.width, remove.height),
            "the label ends in an ellipsis" to (words.textLayout?.isLineEllipsized(0) == true).toString(),
            "the label wider than the row" to (words.frame.inDp(density).width > 120f).toString()
        )
        println("MultiSelect Android, a chip in a scrolling row: $measured")
        assertEquals(
            mapOf(
                "the remove" to "24.0×24.0",
                "the label ends in an ellipsis" to "false",
                "the label wider than the row" to "true"
            ),
            measured
        )
    }

    @Test fun aLongChipKeepsItsRemoveAndTruncatesItsLabel() {
        val measured = mutableMapOf<String, String>()
        val expected = mutableMapOf<String, String>()
        for (rtl in listOf(false, true)) {
            for (alone in listOf(false, true)) {
                val case = "${if (rtl) "right to left" else "left to right"}, ${if (alone) "a chip in 120dp" else "MultiSelect in 200dp"}"
                var density = 1f
                var room = Rect.Zero
                val tree = paparazzi.readSemantics {
                    density = LocalDensity.current.density
                    CompositionLocalProvider(
                        LocalLayoutDirection provides if (rtl) LayoutDirection.Rtl else LayoutDirection.Ltr
                    ) {
                        KozmosMaterialTheme {
                            Column(Modifier.padding(24.dp)) {
                                val measure = Modifier.onGloballyPositioned { room = it.boundsInRoot() }
                                if (alone) {
                                    Box(Modifier.width(120.dp).then(measure)) {
                                        KozmosChip(text = label, onRemove = {})
                                    }
                                } else {
                                    KozmosMultiSelect(
                                        selectedValues = listOf("step-free"),
                                        onValueChange = {},
                                        searchValue = "",
                                        onSearchValueChange = {},
                                        options = listOf(KozmosListboxOption("step-free", label)),
                                        expanded = false,
                                        modifier = Modifier.width(200.dp).then(measure)
                                    )
                                }
                            }
                        }
                    }
                }
                val box = room.inDp(density)
                val remove = tree.named("Remove $label").frame.inDp(density)
                measured["$case: the remove"] = "%.1f×%.1f".format(remove.width, remove.height)
                expected["$case: the remove"] = "24.0×24.0"
                measured["$case: the remove inside the room"] =
                    (remove.left >= box.left - 0.5f && remove.right <= box.right + 0.5f).toString()
                expected["$case: the remove inside the room"] = "true"
                val words = tree.merged.first { it.texts.contains(label) && it.description == null }
                measured["$case: the label ends in an ellipsis"] =
                    (words.textLayout?.isLineEllipsized(0) == true).toString()
                expected["$case: the label ends in an ellipsis"] = "true"
                val text = words.frame.inDp(density)
                measured["$case: the label clear of the remove"] =
                    (if (rtl) text.left >= remove.right - 0.5f else text.right <= remove.left + 0.5f).toString()
                expected["$case: the label clear of the remove"] = "true"
            }
        }
        println("MultiSelect Android, a long chip: $measured")
        assertEquals(expected, measured)
    }
}
