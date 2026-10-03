package com.kozmos.components.navigation

import androidx.compose.foundation.layout.width
import androidx.compose.material3.MaterialTheme
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import com.kozmos.components.arrivalpanel.KozmosArrivalPanel
import com.kozmos.components.routesummary.KozmosRouteSummary
import com.kozmos.components.routesummary.KozmosRoutePresentation
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test

class KozmosArrivalPanelTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    @Test fun absentActualMetricsStayAbsentAndDoneDelegates() {
        var calls = 0
        val tree = paparazzi.readSemantics { MaterialTheme {
            KozmosArrivalPanel("Gate 3", { calls++ }, Modifier.width(320.dp).testTag("arrival-host"))
        } }
        val words = tree.unmerged.flatMap { it.texts }
        assertTrue(words.contains("You've arrived"))
        assertFalse(words.contains("Journey time"))
        assertFalse(words.contains("Distance travelled"))
        assertTrue(tree.merged.none { it.liveRegion != null })
        val done = tree.merged.single { "Done" in it.texts && it.click != null }
        assertTrue(done.enabled)
        val rootWidth = tree.unmerged.single { it.tag == "arrival-host" }.bounds.width
        assertEquals(rootWidth, done.bounds.width, 1f)
        done.click!!.invoke()
        assertEquals(1, calls)
    }

    @Test fun actualZeroAndLocalizedLabelsSurvivePendingCompletion() {
        val tree = paparazzi.readSemantics { MaterialTheme {
            KozmosArrivalPanel("Gate 3", {}, actualDurationText = "0 min",
                durationLabel = "Dauer", doneLabel = "Fertig", pending = true)
        } }
        val words = tree.unmerged.flatMap { it.texts }
        assertTrue(words.contains("0 min"))
        assertTrue(words.contains("Dauer"))
        assertFalse(words.contains("Distance travelled"))
        assertFalse(tree.merged.single { "Fertig" in it.texts && it.click != null }.enabled)
    }

    @Test fun hostedSummaryAcceptsUnknownEstimatesWithoutFabrication() {
        val tree = paparazzi.readSemantics { MaterialTheme {
            KozmosRouteSummary(destination = "Gate 3", onEndRoute = {}, presentation = KozmosRoutePresentation.Hosted)
        } }
        val words = tree.unmerged.flatMap { it.texts }.filter { it.isNotEmpty() }
        assertEquals(listOf("Gate 3", "End"), words)
    }
}
