package com.kozmos.components.userlocationmarker

import androidx.compose.ui.semantics.Role
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * The marker's name, for a visitor who cannot see it.
 *
 * It had none until row 67: TalkBack passed over the visitor's own position on
 * the map. React called it "User location" in English whatever the device's
 * language; both platforms now take the product's word for it.
 */
class KozmosUserLocationMarkerSemanticsTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    @Test
    fun theMarkerIsAnImageNamedInEnglishByDefault() {
        val tree = paparazzi.readSemantics { KozmosUserLocationMarker() }
        assertEquals(Role.Image, tree.named("User location").role)
    }

    @Test
    fun theProductNamesTheMarker() {
        val tree = paparazzi.readSemantics { KozmosUserLocationMarker(label = "Ihr Standort") }

        assertEquals(Role.Image, tree.named("Ihr Standort").role)
        assertTrue(tree.names().none { it == "User location" })
    }
}
