package com.kozmos.example

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.requiredWidth
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.docsnippets.VenueOverview
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

/**
 * Container.mdx's Compose example (docsnippets/VenueOverview.kt), drawn as
 * well as compiled: in a container 1100 wide, where the window inset takes
 * 32, the panel inset keeps its text 16 from the side and none from the top.
 */
class ContainerDocSnippetTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    @Test
    fun theDocsExampleKeepsSixteenASide() {
        var density = 1f
        val tree = paparazzi.readSemantics {
            density = LocalDensity.current.density
            KozmosMaterialTheme {
                Box(Modifier.requiredWidth(1100.dp).semantics { contentDescription = "host" }) { VenueOverview() }
            }
        }
        val host = tree.named("host").frame
        val text = tree.merged.single { "Venue overview" in it.texts }.frame
        assertEquals(16f, (text.left - host.left) / density, 1f)
        assertEquals(0f, (text.top - host.top) / density, 1f)
    }
}
