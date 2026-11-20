package com.kozmos.components.poidetailpanel

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Text
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.dp
import com.kozmos.components.ReadSemantics
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.contracts.KozmosPOIAction
import com.kozmos.contracts.KozmosPOIPresentation
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * GAP-131: the details card takes the product's own content, a place's QR
 * code on desktop and kiosk, drawn last in its body, inside the body's 16 of
 * padding and its scroll, after everything Kozmos draws. It had nowhere to go.
 */
class KozmosPOIDetailPanelContentSlotTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    private var density = 1f

    private val poi = KozmosPOIPresentation(
        id = "harbour-coffee",
        name = "Harbour Coffee Co.",
        floorId = "2",
        floorLabel = "Level 2",
        description = "Coffee by the water.",
        actions = listOf(KozmosPOIAction.Navigate)
    )

    private fun read(): ReadSemantics = paparazzi.readSemantics {
        density = LocalDensity.current.density
        KozmosMaterialTheme {
            Box(modifier = Modifier.width(360.dp)) {
                KozmosPOIDetailPanel(
                    poi = poi,
                    actionLabels = mapOf(KozmosPOIAction.Navigate to "Go"),
                    onAction = { _, _ -> },
                    content = { Text("Scan for directions") }
                )
            }
        }
    }

    @Test
    fun theProductsContentIsDrawnLastInTheBodyInsideItsPadding() {
        val read = read()
        val words = read.unmerged.mapNotNull { node -> node.texts.firstOrNull()?.let { it to node } }
        val qr = words.singleOrNull { it.first == "Scan for directions" }?.second
        checkNotNull(qr) { "the product's content was not drawn: ${words.map { it.first }}" }
        // 16 in from the card's start, as the body's own rows are.
        assertEquals(16f, qr.bounds.left / density, 1.5f)
        // After the description and the actions, the last of Kozmos's own.
        val go = words.first { it.first == "Go" }.second
        assertTrue("the content is not after the actions", qr.bounds.top > go.bounds.bottom)
        val description = words.single { it.first == "Coffee by the water." }.second
        assertTrue("the content is not after the description", qr.bounds.top > description.bounds.bottom)
    }
}
