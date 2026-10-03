package com.kozmos.components.navigation

import androidx.compose.material3.MaterialTheme
import com.kozmos.components.directionstep.DirectionType
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import com.kozmos.components.routeprogressrail.KozmosRouteProgressRail
import com.kozmos.components.directionstep.KozmosDirectionStep
import com.kozmos.components.itinerary.KozmosItinerary
import com.kozmos.components.itinerary.KozmosItineraryStep
import com.kozmos.components.routepreviewpanel.KozmosRoutePreviewPanel
import com.kozmos.components.routinginputgroup.KozmosRoutePoint
import com.kozmos.components.routinginputgroup.KozmosRoutingInputGroup
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.contracts.KozmosRouteOptionPresentation
import com.kozmos.contracts.KozmosRoutePreference
import com.kozmos.contracts.KozmosRouteReadiness
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test

class KozmosNavigationSafetySemanticsTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    @Test fun unknownRailDoesNotAnnounceZeroAndAcceptsLocalizedDescription() {
        val tree = paparazzi.readSemantics { MaterialTheme {
            KozmosRouteProgressRail(null, DirectionType.Left, "Journey", valueText = "Position unbekannt")
        } }
        val rail = tree.named("Journey")
        assertEquals(ProgressBarRangeInfo.Indeterminate, rail.progressRange)
        assertEquals("Position unbekannt", rail.stateDescription)
    }

    @Test fun itineraryMetricsAreVisibleAndReadWithTheStep() {
        val step = KozmosItineraryStep("a", "Turn left", DirectionType.Left, duration = "0 min")
        assertEquals("0 min", step.copy(isCurrent = true).duration)
        assertNotEquals(step, step.copy(duration = "1 min"))
        val tree = paparazzi.readSemantics { MaterialTheme { KozmosItinerary("A", listOf(step), "B") } }
        assertTrue(tree.unmerged.flatMap { it.texts }.contains("0 min"))
        assertNotNull(tree.named("Turn left, 0 min"))
    }

    @Test fun durationOnlyHasNoOrphanSeparator() {
        val tree = paparazzi.readSemantics {
            MaterialTheme { KozmosDirectionStep(DirectionType.Left, "Turn left", duration = "0 min") }
        }
        assertTrue(tree.unmerged.flatMap { it.texts }.contains("0 min"))
        assertFalse(tree.unmerged.flatMap { it.texts }.any { it.trim().startsWith("•") })
    }

    @Test fun populatedRouteFieldsHaveIndependentNames() {
        val tree = paparazzi.readSemantics {
            MaterialTheme {
                KozmosRoutingInputGroup(listOf(KozmosRoutePoint("a", "Lobby"), KozmosRoutePoint("b", "Gate")), { _, _ -> })
            }
        }
        assertNotNull(tree.named("Origin"))
        assertNotNull(tree.named("Destination"))
    }

    @Test fun nonReadyOptionsAreDisabledWithoutStatusContent() {
        val option = KozmosRouteOptionPresentation("quickest", "Quickest", 240.0, "4 min", 150.0, "150 m", KozmosRoutePreference.Quickest, selected = true)
        for (status in listOf(KozmosRouteReadiness.Calculating, KozmosRouteReadiness.Error, KozmosRouteReadiness.NoRoute)) {
            val tree = paparazzi.readSemantics {
                MaterialTheme {
                    KozmosRoutePreviewPanel("Gate", listOf(option), status, "Back", "Continue", {}, {}, {})
                }
            }
            val route = tree.merged.single { "Quickest" in it.texts }
            assertFalse("stale route enabled during $status", route.enabled)
        }
    }
}
