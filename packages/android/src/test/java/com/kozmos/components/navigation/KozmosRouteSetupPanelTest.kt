package com.kozmos.components.navigation

import androidx.compose.material3.Text
import com.kozmos.components.routesetuppanel.KozmosRouteSetupPanel
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test

class KozmosRouteSetupPanelTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    @Test fun unavailableContinuationStillPermitsClosing() {
        for ((ready, pending) in listOf(false to false, true to true)) {
            var continues = 0
            var closes = 0
            val tree = paparazzi.readSemantics { KozmosMaterialTheme {
                KozmosRouteSetupPanel(ready, { continues++ }, { closes++ }, pending = pending,
                    continueLabel = "Weiter", closeLabel = "Schließen") { Text("Lobby → Gallery") }
            } }
            val next = tree.merged.single { "Weiter" in it.texts && it.click != null }
            assertFalse(next.enabled)
            next.click?.invoke()
            assertEquals(0, continues)
            tree.named("Schließen").click!!.invoke()
            assertEquals(1, closes)
        }
    }

    @Test fun validContinuationDelegatesOnceWithoutDroppingContent() {
        var calls = 0
        val tree = paparazzi.readSemantics { KozmosMaterialTheme {
            KozmosRouteSetupPanel(true, { calls++ }, {}) { Text("Lobby → Gallery") }
        } }
        assertTrue(tree.unmerged.flatMap { it.texts }.contains("Lobby → Gallery"))
        val next = tree.merged.single { "Continue" in it.texts && it.click != null }
        assertTrue(next.enabled)
        next.click!!.invoke()
        assertEquals(1, calls)
    }
}
