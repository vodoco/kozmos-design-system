// The Compose snippet of MapStatusPill.mdx, character for character below its
// imports, so it compiles with the package and a renamed or removed parameter
// fails here rather than in a reader's project. Change one, change the other.
package com.kozmos.example

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.BluetoothDisabled
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.semantics.LiveRegionMode
import com.kozmos.components.mapstatuspill.KozmosMapStatusPill
import com.kozmos.components.mapstatuspill.KozmosMapStatusPillTone
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

// The product's words, in the visitor's language, and its tone for each.
@Composable
fun PositioningStatus(isCalculating: Boolean) {
    KozmosMapStatusPill(
        text = if (isCalculating) "Calculating Precise Position" else "Established",
        tone = if (isCalculating) KozmosMapStatusPillTone.Progress else KozmosMapStatusPillTone.Success
    )
}

// The product's own mark in place of the tone's.
@Composable
fun BluetoothStatus() {
    KozmosMapStatusPill(
        text = "No Bluetooth",
        tone = KozmosMapStatusPillTone.Danger,
        icon = { Icon(Icons.Filled.BluetoothDisabled, contentDescription = null) }
    )
}

class MapStatusPillDocSnippetsTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    /** Compiling is most of the point; composing each shows it is a pill TalkBack reads. */
    @Test
    fun theDocsSnippetsCompose() {
        for ((isCalculating, words) in listOf(true to "Calculating Precise Position", false to "Established")) {
            val tree = paparazzi.readSemantics { MaterialTheme { PositioningStatus(isCalculating) } }
            val region = tree.merged.single { it.liveRegion != null }
            assertEquals(LiveRegionMode.Polite, region.liveRegion)
            assertEquals(listOf(words), region.texts)
            assertEquals(48f, region.bounds.height / paparazzi.context.resources.displayMetrics.density, 0.5f)
        }
        val bluetooth = paparazzi.readSemantics { MaterialTheme { BluetoothStatus() } }
        assertEquals(listOf("No Bluetooth"), bluetooth.merged.single { it.liveRegion != null }.texts)
    }
}
