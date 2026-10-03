package com.kozmos.components.navigation

import androidx.compose.material3.MaterialTheme
import com.kozmos.components.directionstep.DirectionType
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import com.kozmos.components.routeprogressrail.KozmosRouteProgressRail
import com.kozmos.components.routeprogressrail.KozmosRouteProgressWaypoint
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
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.unit.Density
import com.kozmos.components.combobox.KozmosCombobox
import com.kozmos.components.wayfindingcard.KozmosWayfindingInputRow

class KozmosNavigationSafetySemanticsTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    @Test fun populatedComboboxHasAFieldName() {
        var density = 1f
        val tree = paparazzi.readSemantics { MaterialTheme {
            density = LocalDensity.current.density
            KozmosCombobox("", { _, _ -> }, "Lobby", {}, emptyList(), label = "From")
        } }
        assertNotNull(tree.named("From"))
        for (name in listOf("Open options", "Clear selection")) {
            assertTrue(name, tree.named(name).bounds.width / density >= 48f)
            assertTrue(name, tree.named(name).bounds.height / density >= 48f)
        }
    }

    @Test fun endpointCaptionGrowsForLargeTextInsteadOfBreakingFrom() {
        var density = 1f
        val tree = paparazzi.readSemantics { MaterialTheme {
            density = LocalDensity.current.density
            CompositionLocalProvider(LocalDensity provides Density(density, 2f)) {
                KozmosItinerary("Lobby", emptyList(), "Gallery")
            }
        } }
        val caption = tree.unmerged.single { "FROM" in it.texts }
        assertTrue("caption width ${caption.bounds.width / density}", caption.bounds.width / density > 40f)
        assertTrue("caption wraps at large text", caption.bounds.height / density < 45f)
    }

    @Test fun routingActionsHaveReal48DpTargets() {
        var density = 1f
        val points = listOf(KozmosRoutePoint("a", "Lobby"), KozmosRoutePoint("b", "Gallery"))
        val group = paparazzi.readSemantics { MaterialTheme {
            density = LocalDensity.current.density
            KozmosRoutingInputGroup(points, { _, _ -> }, onSwap = {}, onAddPoint = {})
        } }
        for (name in listOf("Swap route points", "Add route point")) {
            val button = group.named(name)
            assertTrue("$name width ${button.bounds.width / density}", button.bounds.width / density >= 48f)
            assertTrue("$name height ${button.bounds.height / density}", button.bounds.height / density >= 48f)
        }
        val row = paparazzi.readSemantics { MaterialTheme {
            KozmosWayfindingInputRow("Lobby", {}, "Gallery", {}, {})
        } }
        val swap = row.named("Swap origin and destination")
        assertTrue(swap.bounds.width / density >= 48f)
        assertTrue(swap.bounds.height / density >= 48f)
        val stops = paparazzi.readSemantics { MaterialTheme {
            KozmosRoutingInputGroup(listOf(points[0], KozmosRoutePoint("stop", "Cafe", label = "Stop"), points[1]), { _, _ -> }, onRemovePoint = {})
        } }
        val remove = stops.named("Remove Stop")
        assertTrue(remove.bounds.width / density >= 48f)
        assertTrue(remove.bounds.height / density >= 48f)
    }

    @Test fun unknownRailDoesNotAnnounceZeroAndAcceptsLocalizedDescription() {
        val tree = paparazzi.readSemantics { MaterialTheme {
            KozmosRouteProgressRail(null, DirectionType.Left, "Journey", valueText = "Position unbekannt")
        } }
        val rail = tree.named("Journey")
        assertEquals(ProgressBarRangeInfo.Indeterminate, rail.progressRange)
        assertEquals("Position unbekannt", rail.stateDescription)
    }

    @Test fun coincidentWaypointsKeepEveryLocalizedDescription() {
        val tree = paparazzi.readSemantics { MaterialTheme {
            KozmosRouteProgressRail(null, DirectionType.Left, "Journey", waypoints = listOf(
                KozmosRouteProgressWaypoint("a", 0.5f, DirectionType.Left, "Gallery entrance"),
                KozmosRouteProgressWaypoint("b", 0.5f, DirectionType.Right, "Turn right into gallery")
            ))
        } }
        assertNotNull(tree.named("Journey; Gallery entrance; Turn right into gallery"))
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

    @Test fun ambiguousRouteSnapshotsCannotContinue() {
        val first = KozmosRouteOptionPresentation("a", "Quickest", 240.0, "4 min", 150.0, "150 m", KozmosRoutePreference.Quickest, selected = true)
        for (options in listOf(listOf(first, first.copy(id = "b")), listOf(first, first.copy(selected = false)))) {
            val tree = paparazzi.readSemantics { MaterialTheme {
                KozmosRoutePreviewPanel("Gallery", options, KozmosRouteReadiness.Ready, "Back", "Continue", {}, {}, {})
            } }
            assertFalse(tree.merged.single { "Continue" in it.texts && it.click != null }.enabled)
        }
    }

    @Test fun multipleCurrentStepsAreNotChosen() {
        val tree = paparazzi.readSemantics { MaterialTheme {
            KozmosItinerary("A", listOf(
                KozmosItineraryStep("a", "Left", DirectionType.Left, isCurrent = true),
                KozmosItineraryStep("b", "Right", DirectionType.Right, isCurrent = true)
            ), "B")
        } }
        assertFalse(tree.named("Left").selected == true)
        assertFalse(tree.named("Right").selected == true)
    }
}
