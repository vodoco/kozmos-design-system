package com.kozmos.example

import android.text.Spanned
import android.text.style.LocaleSpan
import android.view.accessibility.AccessibilityNodeInfo
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.width
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.platform.ViewRootForTest
import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.unit.dp
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.contracts.KozmosPOIPresentation
import com.kozmos.docsnippets.ResultWithSummary
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * POIResultCard.mdx's Compose example (docsnippets/ResultWithSummary.kt),
 * drawn as well as compiled (GAP-125): TalkBack is handed the row's words with
 * a LocaleSpan over exactly the summary, in the language its summaryLanguage
 * names, a Spanish one and an Arabic one on an English card.
 */
class POIResultCardDocSnippetTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    private val poi = KozmosPOIPresentation(
        id = "quiet-lounge", name = "Quiet Lounge", categoryLabel = "Lounge", floorLabel = "Level 2",
        availabilityLabel = "Open"
    )

    private fun SemanticsNode.flatten(): List<SemanticsNode> = listOf(this) + children.flatMap { it.flatten() }

    /** The text TalkBack is handed for the node whose words hold [summary], and whether clicking it worked. */
    private fun spoken(summary: String, language: String, onSelect: (String) -> Unit): Pair<CharSequence?, Boolean> {
        var read: Pair<CharSequence?, Boolean>? = null
        paparazzi.snapshot {
            val view = LocalView.current
            Box(Modifier.onGloballyPositioned {
                val nodes = (view as ViewRootForTest).semanticsOwner.rootSemanticsNode.flatten()
                val node = nodes.single {
                    it.config.getOrNull(SemanticsProperties.Text).orEmpty().any { text -> summary in text.text }
                }
                val provider = view.accessibilityNodeProvider!!
                read = provider.createAccessibilityNodeInfo(node.id)!!.text to
                    provider.performAction(node.id, AccessibilityNodeInfo.ACTION_CLICK, null)
            }) {
                KozmosMaterialTheme {
                    Box(Modifier.width(340.dp)) {
                        ResultWithSummary(poi, number = 1, summary = summary, summaryLanguage = language, onSelect = onSelect)
                    }
                }
            }
        }
        return checkNotNull(read) { "nothing said \"$summary\"" }
    }

    /** The language of the LocaleSpan over exactly [words] in [text], or null when none covers them. */
    private fun localeOf(text: Spanned, words: String): String? {
        val start = text.toString().indexOf(words)
        assertTrue("\"$words\" is not in \"$text\"", start >= 0)
        val span = text.getSpans(start, start + words.length, LocaleSpan::class.java).singleOrNull() ?: return null
        assertEquals("The tag must start at \"$words\"", start, text.getSpanStart(span))
        assertEquals("The tag must end with \"$words\"", start + words.length, text.getSpanEnd(span))
        return span.locales[0].toLanguageTag()
    }

    @Test
    fun talkBackSaysTheDocsSnippetsSummaryInItsLanguage() {
        for ((language, summary) in listOf(
            "es" to "La más tranquila de las tres salas, antes del control de seguridad.",
            "ar" to "أهدأ الصالات الثلاث، قبل نقطة التفتيش الأمني."
        )) {
            val selections = mutableListOf<String>()
            val (text, clicked) = spoken(summary, language) { selections += it }
            val spanned = text as? Spanned
            assertTrue("$language: the platform text must keep its spans", spanned != null)
            assertEquals(language, localeOf(spanned!!, summary))
            // The card's own words are the interface's and carry no tag.
            assertNull(language, localeOf(spanned, "Quiet Lounge, Lounge, Level 2, "))
            assertTrue(language, clicked)
            assertEquals(language, listOf("quiet-lounge"), selections)
        }
    }
}
