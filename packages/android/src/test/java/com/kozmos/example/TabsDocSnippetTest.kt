// The Compose snippet of Tabs.mdx, character for character below its
// imports, so it compiles with the package and a renamed or removed parameter
// fails here rather than in a reader's project. Change one, change the other.
package com.kozmos.example

import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.tabs.KozmosTabs
import com.kozmos.components.tabs.KozmosTabsContent
import com.kozmos.components.tabs.KozmosTabsList
import com.kozmos.components.tabs.KozmosTabsTrigger
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Rule
import org.junit.Test

// The list is a background/100 track. The selected tab is a background/0
// segment 4dp inside it, raised by KozmosShadows.semanticsElevationRaised,
// with foreground/0 words; the other tabs' words are foreground/400. No theme
// colour, as on the web and in SwiftUI (decision 65).
@Composable
fun PlaceDetailsTabs() {
    var selected by remember { mutableStateOf("overview") }
    KozmosTabs {
        KozmosTabsList {
            KozmosTabsTrigger(value = "overview", title = "Overview", selectedValue = selected, onValueChange = { selected = it })
            KozmosTabsTrigger(value = "access", title = "Access", selectedValue = selected, onValueChange = { selected = it })
        }
        KozmosTabsContent(value = "overview", selectedValue = selected) {
            Text("Reception is on the ground floor.")
        }
        KozmosTabsContent(value = "access", selectedValue = selected) {
            Text("Step-free access through the main entrance.")
        }
    }
}

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
