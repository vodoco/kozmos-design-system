// Composes MapControlButton.mdx's and MapControlsGroup.mdx's Compose
// snippets, docsnippets/LayersToggle.kt and docsnippets/MapControls.kt, which
// check-native-snippet-parity holds to their pages word for word.
package com.kozmos.example

import androidx.compose.foundation.layout.Column
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.contracts.KozmosUserLocationState
import com.kozmos.docsnippets.LayersToggle
import com.kozmos.docsnippets.MapControls
import com.kozmos.docsnippets.WayfindingControls
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

/**
 * Compiling is most of the point; composing each snippet shows it lays out,
 * and names what TalkBack is told.
 */
class MapControlDocSnippetsTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    @Test
    fun theDocsSnippetsCompose() {
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme {
                Column {
                    LayersToggle(showsLayers = false, onShowsLayersChange = {})
                    MapControls(
                        bearing = 30f,
                        locationState = KozmosUserLocationState.Heading,
                        zoomIn = {},
                        zoomOut = {},
                        resetBearing = {},
                        recenter = {}
                    )
                    WayfindingControls(stepFree = true, onStepFreeChange = {})
                }
            }
        }
        assertEquals(false, tree.named("Layers, Off").selected)
        assertEquals(true, tree.named("Focus, On, map turns with you").selected)
        assertEquals(true, tree.named("Step-free, On").selected)
    }
}
