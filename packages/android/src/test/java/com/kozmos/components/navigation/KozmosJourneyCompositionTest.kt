package com.kozmos.components.navigation

import androidx.compose.foundation.layout.Column
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import com.kozmos.components.arrivalpanel.KozmosArrivalPanel
import com.kozmos.components.button.KozmosButton
import com.kozmos.components.directionstep.DirectionType
import com.kozmos.components.routepreviewpanel.KozmosRoutePreviewPanel
import com.kozmos.components.routeprogressrail.KozmosRouteProgressRail
import com.kozmos.components.routesetuppanel.KozmosRouteSetupPanel
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.contracts.KozmosRouteOptionPresentation
import com.kozmos.contracts.KozmosRoutePreference
import com.kozmos.contracts.KozmosRouteReadiness
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test

/** Offline public-component composition, not a live SDK adapter. Re-render the host after each real semantic action. */
class KozmosJourneyCompositionTest {
    @get:Rule val paparazzi = semanticsPaparazzi()
    private var phase = "setup"
    private var progress: Float? = null
    private var doneCount = 0

    @Composable private fun Fixture() {
        KozmosMaterialTheme { Column {
            when (phase) {
                "setup", "calculating" -> {
                    KozmosRouteSetupPanel(true, { phase = "calculating" }, { phase = "setup" }, pending = phase == "calculating") { Text("Lobby → Gallery") }
                    if (phase == "calculating") KozmosButton(onClick = { phase = "preview" }) { Text("Deliver calculated route") }
                }
                "preview" -> KozmosRoutePreviewPanel("Gallery", listOf(KozmosRouteOptionPresentation("route-1", "Step-free", 360.0, "6 min", 220.0, "220 m", KozmosRoutePreference.StepFree, selected = true)),
                    KozmosRouteReadiness.Ready, "Back", "Start navigation", {}, { phase = "setup" }, { phase = "navigating" })
                "navigating" -> {
                    KozmosRouteProgressRail(progress = progress, type = DirectionType.LiftUp, label = "Journey progress")
                    KozmosButton(onClick = { progress = 1f }) { Text("Report 100 percent") }
                    KozmosButton(onClick = { phase = "arrived" }) { Text("Confirm arrival") }
                }
                "arrived" -> KozmosArrivalPanel("Gallery", onDone = { if (phase == "arrived") { doneCount++; phase = "browse" } })
                "browse" -> Text("Selected destination: Gallery")
            }
        } }
    }

    @Test fun composedJourneyRequiresConfirmedArrivalAndRetainsDestination() {
        fun click(label: String) {
            val tree = paparazzi.readSemantics { Fixture() }
            tree.merged.single { label in it.texts && it.click != null }.click!!.invoke()
        }
        click("Continue")
        assertEquals("calculating", phase)
        click("Deliver calculated route")
        click("Start navigation")
        click("Report 100 percent")
        assertEquals("navigating", phase)
        click("Confirm arrival")
        val arrived = paparazzi.readSemantics { Fixture() }
        assertTrue(arrived.unmerged.flatMap { it.texts }.contains("You've arrived"))
        assertFalse(arrived.unmerged.flatMap { it.texts }.contains("Journey time"))
        val done = arrived.merged.single { "Done" in it.texts && it.click != null }
        done.click!!.invoke()
        done.click!!.invoke() // A queued duplicate activation cannot finish twice.
        assertEquals(1, doneCount)
        assertTrue(paparazzi.readSemantics { Fixture() }.unmerged.flatMap { it.texts }.contains("Selected destination: Gallery"))
    }
}
