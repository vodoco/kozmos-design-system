// Composes MapStatusPill.mdx's Compose snippet, docsnippets/PositioningStatus.kt,
// which check-native-snippet-parity holds to the page word for word.
package com.kozmos.example

import androidx.compose.ui.semantics.LiveRegionMode
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.docsnippets.BluetoothStatus
import com.kozmos.docsnippets.PositioningStatus
import com.kozmos.docsnippets.WalkingStatus
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class MapStatusPillDocSnippetsTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    /** Compiling is most of the point; composing each shows it is a pill TalkBack reads. */
    @Test
    fun theDocsSnippetsCompose() {
        for ((isCalculating, words) in listOf(true to "Calculating Precise Position", false to "Established")) {
            val tree = paparazzi.readSemantics { KozmosMaterialTheme { PositioningStatus(isCalculating) } }
            val region = tree.merged.single { it.liveRegion != null }
            assertEquals(LiveRegionMode.Polite, region.liveRegion)
            assertEquals(listOf(words), region.texts)
            assertEquals(48f, region.bounds.height / paparazzi.context.resources.displayMetrics.density, 0.5f)
        }
        val bluetooth = paparazzi.readSemantics { KozmosMaterialTheme { BluetoothStatus() } }
        assertEquals(listOf("No Bluetooth"), bluetooth.merged.single { it.liveRegion != null }.texts)
        val walking = paparazzi.readSemantics { KozmosMaterialTheme { WalkingStatus() } }
        assertEquals(listOf("Walking improves accuracy"), walking.merged.single { it.liveRegion != null }.texts)
    }
}
