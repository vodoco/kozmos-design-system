package com.kozmos.components.poiresultcard

import android.view.accessibility.AccessibilityNodeInfo
import android.view.accessibility.AccessibilityNodeProvider
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.platform.ViewRootForTest
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.unit.dp
import com.kozmos.components.poiresultgroup.KozmosPOIResultGroup
import com.kozmos.components.poiresultlist.KozmosPOIResultList
import com.kozmos.components.poiresultlist.KozmosPOIResultListItem
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.contracts.KozmosPOIPresentation
import com.kozmos.contracts.KozmosPOIResultPresentation
import com.kozmos.contracts.KozmosTravelEstimatePresentation
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * TalkBack says a result once. The row's description is the whole sentence,
 * and Compose hands a merging node's description to TalkBack on a helper child
 * ahead of the row's other children, which TalkBack reads with it. Every Text
 * drawn inside the row and left in semantics was one of those children, so
 * the row was heard as "Pharmacy, Health, Level 2, Open" and then "Pharmacy",
 * "Health", "Level 2", "Open" again; with a selection label, the drawn words
 * followed the product's own name for the row.
 */
class KozmosPOIResultCardTalkBackTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    private val poi = KozmosPOIPresentation(
        id = "pharmacy", name = "Pharmacy", categoryLabel = "Health", floorLabel = "Level 2",
        buildingLabel = "Terminal B", availabilityLabel = "Open"
    )
    private val walk = KozmosTravelEstimatePresentation(durationSeconds = 180.0, durationLabel = "3 min")

    /** Every phrase the card draws. Only the row's own words may say one. */
    private val drawn = listOf(
        "Pharmacy", "Health", "Level 2 · Terminal B", "Open", "3 min", "Language not listed", "Closed for cleaning"
    )

    private fun result(
        selected: Boolean = false,
        available: Boolean? = null,
        featured: Boolean = false
    ) = KozmosPOIResultPresentation(
        poiId = "pharmacy", resultIndex = 4, selected = selected, featured = featured, travelEstimate = walk,
        available = available, unavailableReason = if (available == false) "Closed for cleaning" else null,
        languageNotListed = true
    )

    private class Heard(
        /** What TalkBack says on the row: its own words, then each child's it reads with them. */
        val row: List<String>,
        /** What the platform hands TalkBack for every other node in the unmerged tree. */
        val others: List<String>,
        /** The row's own text and description, as the platform hands them. */
        val text: String?,
        val description: String?,
        /** The row's state, as the platform hands it to TalkBack. */
        val focusable: Boolean,
        /** What TalkBack says of the row's selection: "Selected" or "Not selected". */
        val selection: String?,
        val enabled: Boolean,
        /** Whether TalkBack's double tap selected the result. */
        val clicked: Boolean
    )

    private fun SemanticsNode.flatten(): List<SemanticsNode> = listOf(this) + children.flatMap { it.flatten() }

    /** A child's virtual view id: the platform keeps it in the upper half of the child's node id. */
    private val childId = AccessibilityNodeInfo::class.java.getMethod("getChildId", Int::class.javaPrimitiveType)

    /**
     * What TalkBack reads when it lands on [id]: the node's description and
     * text, then the same of each child that is not a stop of its own.
     */
    private fun AccessibilityNodeProvider.said(id: Int, landedOn: Boolean = true): List<String> {
        val info = createAccessibilityNodeInfo(id) ?: return emptyList()
        if (!landedOn && (info.isScreenReaderFocusable || info.isFocusable || info.isClickable)) return emptyList()
        val own = listOfNotNull(info.contentDescription, info.text).map { it.toString() }
        return own + (0 until info.childCount).flatMap { index ->
            said(((childId.invoke(info, index) as Long) ushr 32).toInt(), landedOn = false)
        }
    }

    private fun heard(content: @Composable () -> Unit): Heard {
        var read: Heard? = null
        paparazzi.snapshot {
            val view = LocalView.current
            Box(Modifier.onGloballyPositioned {
                val provider = view.accessibilityNodeProvider!!
                val nodes = (view as ViewRootForTest).semanticsOwner.unmergedRootSemanticsNode.flatten()
                val row = nodes.filter { it.config.contains(SemanticsActions.OnClick) }
                check(row.size == 1) { "expected one row to select, found ${row.size}" }
                val rowId = row.single().id
                val info = provider.createAccessibilityNodeInfo(rowId)!!
                read = Heard(
                    row = provider.said(rowId),
                    others = nodes.filter { it.id != rowId }
                        .mapNotNull { provider.createAccessibilityNodeInfo(it.id) }
                        .flatMap { listOfNotNull(it.text?.toString(), it.contentDescription?.toString()) },
                    text = info.text?.toString(),
                    description = info.contentDescription?.toString(),
                    focusable = info.isScreenReaderFocusable,
                    selection = info.stateDescription?.toString(),
                    enabled = info.isEnabled,
                    clicked = provider.performAction(rowId, AccessibilityNodeInfo.ACTION_CLICK, null)
                )
            }) {
                KozmosMaterialTheme { Box(Modifier.width(340.dp)) { content() } }
            }
        }
        return checkNotNull(read) { "the card was never laid out" }
    }

    private fun assertSaidOnce(case: String, sentence: String, heard: Heard, drawn: List<String> = this.drawn) {
        assertEquals(case, listOf(sentence), heard.row)
        assertEquals(case, emptyList<String>(), heard.others.filter { said -> drawn.any { it in said } })
    }

    @Test fun theRowSaysTheResultOnceAndNoDrawnTextRepeatsIt() {
        val sentence = "Pharmacy, Health, Level 2 · Terminal B, Open, 3 min, Language not listed"
        val item = KozmosPOIResultListItem(poi, result())
        // The card alone, in a list, and as a group's row: each draws the
        // result through KozmosPOIResultCard.
        for (kind in listOf("card", "list", "group")) {
            val selections = mutableListOf<String>()
            val heard = heard {
                when (kind) {
                    "card" -> KozmosPOIResultCard(poi, result(), onSelect = { selections += it })
                    "list" -> KozmosPOIResultList(listOf(item), "1 result", onSelect = { selections += it })
                    else -> KozmosPOIResultGroup(items = listOf(item), expanded = true, onSelect = { selections += it })
                }
            }
            assertSaidOnce(kind, sentence, heard)
            // Still one stop that selects the result.
            assertTrue(kind, heard.focusable)
            assertEquals(kind, "Not selected", heard.selection)
            assertTrue(kind, heard.clicked)
            assertEquals(kind, listOf("pharmacy"), selections)
        }
    }

    @Test fun aSelectionLabelIsAllThatIsHeard() {
        val heard = heard {
            KozmosPOIResultCard(poi, result(), onSelect = {}, selectionLabel = "Choose the pharmacy")
        }
        assertSaidOnce("labelled", "Choose the pharmacy, Language not listed", heard)
    }

    @Test fun everyStateOfTheRowIsHeardOnce() {
        val selected = heard { KozmosPOIResultCard(poi, result(selected = true), onSelect = {}) }
        assertSaidOnce("selected", "Pharmacy, Health, Level 2 · Terminal B, Open, 3 min, Language not listed", selected)
        assertEquals("Selected", selected.selection)

        val unavailable = heard { KozmosPOIResultCard(poi, result(available = false), onSelect = {}) }
        assertSaidOnce(
            "unavailable",
            "Pharmacy, Health, Level 2 · Terminal B, Open, 3 min, Closed for cleaning, Language not listed",
            unavailable
        )
        assertEquals(false, unavailable.enabled)

        // The featured, numbered tab was already left to the row's words.
        val featured = heard { KozmosPOIResultCard(poi, result(featured = true), onSelect = {}, numbered = true) }
        assertSaidOnce(
            "featured",
            "4, Featured, Pharmacy, Health, Level 2 · Terminal B, Open, 3 min, Language not listed",
            featured
        )

        val legacy = heard {
            KozmosPOIResultCard(
                poi = poi, result = result(), onSelect = {},
                presentationStyle = KozmosPOIResultPresentationStyle.Legacy
            )
        }
        assertSaidOnce("legacy", "Pharmacy, Health, Level 2 · Terminal B, Open, 3 min, Language not listed", legacy)
    }

    @Test fun aRowWithALanguageIsHeardOnceTooAndEveryRowSaysItAsText() {
        // GAP-125: the name or the summary in a language other than the
        // interface's. The row says the same words with each phrase's
        // language, the drawn summary included, and no drawn text repeats a
        // phrase, tagged or not. Both give TalkBack the words as text and no
        // description, so a product finds every row the same way.
        val summary = "La más tranquila de las tres salas."
        val sentence = "Pharmacy, Health, Level 2 · Terminal B, $summary, Open, 3 min, Language not listed"
        for ((case, nameLanguage, summaryLanguage) in listOf(
            Triple("untagged", null, null), Triple("tagged", "en-GB", "es")
        )) {
            val tagged = result().copy(summary = summary, nameLanguage = nameLanguage, summaryLanguage = summaryLanguage)
            val heard = heard { KozmosPOIResultCard(poi, tagged, onSelect = {}) }
            assertSaidOnce(case, sentence, heard, drawn + summary)
            assertEquals(case, sentence, heard.text)
            assertEquals(case, null, heard.description)
            val labelled = heard { KozmosPOIResultCard(poi, tagged, onSelect = {}, selectionLabel = "Choose the pharmacy") }
            assertSaidOnce("$case, labelled", "Choose the pharmacy, Language not listed", labelled, drawn + summary)
        }
    }
}
