// Composes Tabs.mdx's Compose snippet, docsnippets/PlaceDetailsTabs.kt, which
// check-native-snippet-parity holds to the page word for word.
package com.kozmos.example

import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.docsnippets.PlaceDetailsTabs
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Rule
import org.junit.Test

class TabsDocSnippetTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    /**
     * Compiling is most of the point; composing it shows each tab is a 44dp
     * target, the track's whole height, that TalkBack reads by its words.
     */
    @Test
    fun theDocsSnippetComposesTwoTabsEach44dpTall() {
        val tree = paparazzi.readSemantics { KozmosMaterialTheme { PlaceDetailsTabs() } }
        val density = paparazzi.context.resources.displayMetrics.density
        for (title in listOf("Overview", "Access")) {
            val tab = tree.saying(title)
            assertNotNull("$title has no click", tab.click)
            assertEquals("$title's height in dp", 44f, tab.bounds.height / density, 0.5f)
        }
        tree.saying("Reception is on the ground floor.")
    }
}
