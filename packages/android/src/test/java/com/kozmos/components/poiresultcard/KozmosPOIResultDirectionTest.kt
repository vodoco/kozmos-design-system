package com.kozmos.components.poiresultcard

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.width
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.platform.ViewRootForTest
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.text.style.ResolvedTextDirection
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.contracts.KozmosPOIPresentation
import com.kozmos.contracts.KozmosPOIResultPresentation
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * GAP-125. A right-to-left language's name or summary in a left-to-right card
 * took the card's direction: its paragraph was laid out left to right, so the
 * full stop fell at the words' right and a clamped summary's ellipsis on the
 * wrong side. Each now takes its direction from its own words, as the web's
 * dir="auto" does, and its lines still start at the card's start, as the
 * web's lines do: a Latin brand in an Arabic card stays at the right.
 */
class KozmosPOIResultDirectionTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    private fun SemanticsNode.flatten(): List<SemanticsNode> = listOf(this) + children.flatMap { it.flatten() }

    /** How each drawn text was laid out, by its words. */
    private fun layouts(direction: LayoutDirection, content: @Composable () -> Unit): Map<String, TextLayoutResult> {
        var read: Map<String, TextLayoutResult>? = null
        paparazzi.snapshot {
            val view = LocalView.current
            Box(Modifier.onGloballyPositioned {
                read = (view as ViewRootForTest).semanticsOwner.unmergedRootSemanticsNode.flatten()
                    .mapNotNull { node ->
                        val words = node.config.getOrNull(SemanticsProperties.Text)?.singleOrNull()?.text
                        val layout = node.config.getOrNull(SemanticsActions.GetTextLayoutResult)?.action
                        if (words == null || layout == null) null else {
                            val results = mutableListOf<TextLayoutResult>()
                            layout(results)
                            words to results.single()
                        }
                    }.toMap()
            }) {
                CompositionLocalProvider(LocalLayoutDirection provides direction) {
                    MaterialTheme { Box(Modifier.width(320.dp)) { content() } }
                }
            }
        }
        return checkNotNull(read) { "the card was never laid out" }
    }

    // Long enough for two lines at 320, the second shorter than the first.
    private val hebrew = "הכי שקטה מבין שלוש הטרקלינים, ליד שער ב׳, לפני הבידוק."
    private val english = "The quietest of the three lounges, beside gate B, before security."

    @Test fun arabicAndHebrewWordsInALeftToRightCardRunRightToLeftFromItsStart() {
        val name = "صيدلية."
        val laid = layouts(LayoutDirection.Ltr) {
            KozmosPOIResultCard(
                KozmosPOIPresentation(id = "p", name = name, categoryLabel = "Pharmacy", floorLabel = "Level 2"),
                KozmosPOIResultPresentation("p", 1, nameLanguage = "ar", summary = hebrew, summaryLanguage = "he"),
                onSelect = {}
            )
        }
        for (words in listOf(name, hebrew)) {
            val layout = laid.getValue(words)
            assertEquals(words, ResolvedTextDirection.Rtl, layout.getParagraphDirection(0))
            // The full stop ends the words, so it is drawn to the left of their first letter.
            val stop = layout.getBoundingBox(words.length - 1)
            assertTrue(words, stop.right <= layout.getBoundingBox(0).left + 0.5f)
        }
        // Two lines, each starting at the card's start, the left.
        val summary = laid.getValue(hebrew)
        assertEquals(2, summary.lineCount)
        for (line in 0 until summary.lineCount) {
            assertEquals("line $line", 0f, summary.getLineLeft(line), 0.5f)
        }
        // The card's own words keep the card's direction.
        assertEquals(ResolvedTextDirection.Ltr, laid.getValue("Pharmacy").getParagraphDirection(0))
    }

    @Test fun latinWordsInARightToLeftCardRunLeftToRightFromItsStart() {
        val name = "Costa Coffee (B)"
        val laid = layouts(LayoutDirection.Rtl) {
            KozmosPOIResultCard(
                KozmosPOIPresentation(id = "c", name = name, categoryLabel = "مقهى", floorLabel = "الطابق الثاني"),
                KozmosPOIResultPresentation("c", 1, nameLanguage = "en", summary = english, summaryLanguage = "en"),
                onSelect = {}
            )
        }
        for (words in listOf(name, english)) {
            val layout = laid.getValue(words)
            assertEquals(words, ResolvedTextDirection.Ltr, layout.getParagraphDirection(0))
            // Its closing bracket or full stop closes it, at its right.
            assertTrue(words, layout.getBoundingBox(words.length - 1).left >= layout.getBoundingBox(0).right - 0.5f)
        }
        val summary = laid.getValue(english)
        assertEquals(2, summary.lineCount)
        for (line in 0 until summary.lineCount) {
            assertEquals("line $line", summary.size.width.toFloat(), summary.getLineRight(line), 0.5f)
        }
    }
}
