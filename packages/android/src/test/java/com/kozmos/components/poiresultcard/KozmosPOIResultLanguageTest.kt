package com.kozmos.components.poiresultcard

import android.text.Spanned
import android.text.style.LocaleSpan
import android.view.accessibility.AccessibilityNodeInfo
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.width
import androidx.compose.material3.MaterialTheme
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.platform.ViewRootForTest
import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.unit.dp
import com.kozmos.components.poiresultgroup.KozmosPOIResultGroup
import com.kozmos.components.poiresultlist.KozmosPOIResultList
import com.kozmos.components.poiresultlist.KozmosPOIResultListItem
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.contracts.KozmosPOIPresentation
import com.kozmos.contracts.KozmosPOIResultPresentation
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * GAP-125 and GAP-004 on Android: a result's authored name and its generated
 * summary can each be in a language other than the interface's, and TalkBack
 * must say each in its own voice. MAP-474 US2-EC1: a visitor asks in Spanish
 * on an English device, and the model writes the summary in Spanish while
 * every fixed label stays English.
 */
class KozmosPOIResultLanguageTest {
    @get:Rule val paparazzi = semanticsPaparazzi()
    private fun SemanticsNode.flatten(): List<SemanticsNode> = listOf(this) + children.flatMap { it.flatten() }

    private val poi = KozmosPOIPresentation(
        id = "lounge", name = "空港ラウンジ", categoryLabel = "Lounge", floorLabel = "Level 2",
        availabilityLabel = "Open"
    )
    private val summary = "La más tranquila de las tres salas, antes del control."
    private val sentence = "空港ラウンジ, Lounge, Level 2, $summary, Open"

    private fun result(
        selected: Boolean = false,
        available: Boolean? = null,
        summary: String? = this.summary,
        nameLanguage: String? = "ja",
        summaryLanguage: String? = "es"
    ) = KozmosPOIResultPresentation(
        poiId = "lounge", resultIndex = 1, selected = selected, available = available,
        nameLanguage = nameLanguage, summary = summary, summaryLanguage = summaryLanguage
    )

    @Test fun theSummaryIsHeardAfterWhereThePlaceIs() {
        // The web's order: the name, its category, where it is, the summary,
        // then whether it is open.
        val plain = paparazzi.readSemantics {
            MaterialTheme {
                KozmosPOIResultCard(poi, result(nameLanguage = null, summaryLanguage = null), onSelect = {})
            }
        }
        plain.saying(sentence)
        // A selection label still replaces the whole name, summary and all.
        val named = paparazzi.readSemantics {
            MaterialTheme {
                KozmosPOIResultCard(poi, result(), onSelect = {}, selectionLabel = "Choose the lounge")
            }
        }
        named.saying("Choose the lounge")
        // An empty summary is no summary: no empty phrase, no stray comma.
        val empty = paparazzi.readSemantics {
            MaterialTheme {
                KozmosPOIResultCard(poi, result(summary = "", nameLanguage = null, summaryLanguage = null), onSelect = {})
            }
        }
        empty.saying("空港ラウンジ, Lounge, Level 2, Open")
    }

    /** What TalkBack is handed for the node that says [sentence]: its text, description and click. */
    private class Spoken(
        val text: CharSequence?,
        val description: CharSequence?,
        val clicked: Boolean,
        val others: List<String>
    )

    private fun spoken(content: @androidx.compose.runtime.Composable () -> Unit): Spoken {
        var read: Spoken? = null
        paparazzi.snapshot {
            val view = LocalView.current
            Box(Modifier.onGloballyPositioned {
                val nodes = (view as ViewRootForTest).semanticsOwner.rootSemanticsNode.flatten()
                val node = nodes.single {
                    it.config.getOrNull(SemanticsProperties.Text).orEmpty().any { text -> text.text == sentence }
                }
                val info = view.accessibilityNodeProvider!!.createAccessibilityNodeInfo(node.id)!!
                read = Spoken(
                    text = info.text,
                    description = info.contentDescription,
                    clicked = view.accessibilityNodeProvider.performAction(node.id, AccessibilityNodeInfo.ACTION_CLICK, null),
                    // What the platform hands TalkBack for every other node:
                    // a node merged into the row is still a child TalkBack
                    // reads after the row's own text, unless it was cleared.
                    others = view.semanticsOwner.unmergedRootSemanticsNode.flatten()
                        .filter { it.id != node.id }
                        .mapNotNull { view.accessibilityNodeProvider.createAccessibilityNodeInfo(it.id) }
                        .flatMap { listOfNotNull(it.text?.toString(), it.contentDescription?.toString()) }
                )
            }) {
                MaterialTheme { Box(Modifier.width(340.dp)) { content() } }
            }
        }
        return checkNotNull(read) { "nothing said \"$sentence\"" }
    }

    /** The language of the LocaleSpan over [words] in [text], or null when none covers them. */
    private fun language(text: Spanned, words: String): String? {
        val start = text.toString().indexOf(words)
        assertTrue("\"$words\" is not in \"$text\"", start >= 0)
        val span = text.getSpans(start, start + words.length, LocaleSpan::class.java).singleOrNull() ?: return null
        assertEquals("The tag must start at \"$words\"", start, text.getSpanStart(span))
        assertEquals("The tag must end with \"$words\"", start + words.length, text.getSpanEnd(span))
        return span.locales[0].toLanguageTag()
    }

    @Test fun talkBackSaysTheNameAndTheSummaryInTheirOwnLanguages() {
        val item = KozmosPOIResultListItem(poi, result())
        // The card alone, in a list, and as a group's row: each draws the
        // result through KozmosPOIResultCard, and each must keep the tags.
        for (kind in 0..2) {
            val selections = mutableListOf<String>()
            val read = spoken {
                when (kind) {
                    0 -> KozmosPOIResultCard(poi, result(), onSelect = { selections += it })
                    1 -> KozmosPOIResultList(listOf(item), "1 result", onSelect = { selections += it })
                    else -> KozmosPOIResultGroup(items = listOf(item), expanded = true, onSelect = { selections += it })
                }
            }
            // TalkBack reads a description in place of the text, so there
            // must be none: the text is what carries the languages.
            assertNull("kind $kind", read.description)
            val text = read.text as? Spanned
            assertNotNull("kind $kind: the platform text must keep its spans", text)
            assertEquals("kind $kind", sentence, text.toString())
            assertEquals("kind $kind", "es", language(text!!, summary))
            assertEquals("kind $kind", "ja", language(text, "空港ラウンジ"))
            // The fixed labels are the interface's and carry no tag.
            assertNull("kind $kind", language(text, "Lounge, Level 2, "))
            assertNull("kind $kind", language(text, ", Open"))
            assertTrue("kind $kind", read.clicked)
            assertEquals("kind $kind", listOf("lounge"), selections)
            // Nothing else says the name or the summary a second time.
            assertEquals("kind $kind", emptyList<String>(), read.others.filter { summary in it || "空港ラウンジ" in it })
        }
    }

    @Test fun theLanguageNodeIsTheRowTalkBackAlreadyKnew() {
        // Tagged or not, the row hands TalkBack its words as text, never as a
        // description: one property, so a product's test finds every result
        // the same way. Same words, same state (selected, enabled,
        // clickable), so nothing but the voice changes.
        for ((name, selected, available) in listOf(
            Triple("at rest", false, null), Triple("selected", true, null), Triple("unavailable", false, false)
        )) {
            val plain = paparazzi.readSemantics {
                MaterialTheme {
                    KozmosPOIResultCard(poi, result(selected, available, nameLanguage = null, summaryLanguage = null), onSelect = {})
                }
            }.merged.single { sentence in it.texts }
            val tagged = paparazzi.readSemantics {
                MaterialTheme { KozmosPOIResultCard(poi, result(selected, available), onSelect = {}) }
            }.merged.single { sentence in it.texts }
            assertEquals(name, listOf(sentence), plain.texts)
            assertNull(name, plain.description)
            assertEquals(name, listOf(sentence), tagged.texts)
            assertNull(name, tagged.description)
            assertEquals(name, plain.selected, tagged.selected)
            assertEquals(name, plain.enabled, tagged.enabled)
            assertEquals(name, plain.role, tagged.role)
            assertEquals(name, plain.click != null, tagged.click != null)
            assertEquals(name, plain.bounds, tagged.bounds)
        }
    }

    @Test fun theCardDrawsTheSummaryInTwoLinesAtMost() {
        // The web's GAP-029: a scanned card shows the summary, clamped to two
        // lines so a long one never pushes the results below it down. The
        // place has enough lines that the card's 80dp minimum takes none of
        // the summary's height.
        val place = KozmosPOIPresentation(
            id = "p", name = "Pharmacy", categoryLabel = "Health", floorLabel = "Level 2", availabilityLabel = "Open"
        )
        fun height(summary: String?): Float {
            val tree = paparazzi.readSemantics {
                MaterialTheme {
                    Box(Modifier.width(320.dp)) {
                        KozmosPOIResultCard(place, KozmosPOIResultPresentation("p", 1, summary = summary), onSelect = {})
                    }
                }
            }
            return tree.merged.single { it.words?.startsWith("Pharmacy") == true }.bounds.height
        }
        val none = height(null)
        assertEquals("An empty summary draws nothing", none, height(""), 0.5f)
        val one = height("Open late.") - none
        val two = height("Abierto hasta medianoche, junto a la puerta B. ".repeat(12)) - none
        assertTrue("The summary must be drawn: +$one", one > 10)
        assertTrue("A long summary takes a second line: +$one, +$two", two > one * 1.5f)
        assertTrue("…and no third: +$one, +$two", two < one * 2.5f)
    }
}
