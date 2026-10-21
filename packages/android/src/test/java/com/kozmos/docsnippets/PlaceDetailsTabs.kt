// Tabs.mdx's Compose snippet, word for word below the package line: compiled
// here, so a renamed or removed parameter fails in this target rather than in
// a reader's project, and composed by TabsDocSnippetTest. Change the two
// together.
package com.kozmos.docsnippets

import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import com.kozmos.components.tabs.KozmosTabs
import com.kozmos.components.tabs.KozmosTabsContent
import com.kozmos.components.tabs.KozmosTabsList
import com.kozmos.components.tabs.KozmosTabsTrigger

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
