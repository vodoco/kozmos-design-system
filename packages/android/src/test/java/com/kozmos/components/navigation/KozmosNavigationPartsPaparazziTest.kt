package com.kozmos.components.navigation

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material3.MaterialTheme
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import app.cash.paparazzi.Paparazzi
import com.kozmos.components.directionstep.DirectionType
import com.kozmos.components.itinerary.KozmosItinerary
import com.kozmos.components.itinerary.KozmosItineraryStep
import com.kozmos.components.manoeuvrecard.KozmosManoeuvreCard
import com.kozmos.components.manoeuvrecard.manoeuvreDescription
import com.kozmos.components.routeprogressrail.KozmosRouteProgressRail
import com.kozmos.components.routeprogressrail.KozmosRouteProgressRailGeometry
import com.kozmos.components.routeprogressrail.KozmosRouteProgressWaypoint
import com.kozmos.components.routesummary.KozmosRouteSummary
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

/**
 * The navigation parts the prototype has and the system lacked. The goldens
 * are the evidence for what is drawn; the arithmetic is asserted outright.
 */
class KozmosNavigationPartsPaparazziTest {
    @get:Rule
    val paparazzi = Paparazzi(maxPercentDifference = 0.0)

    private val steps = listOf(
        KozmosItineraryStep("1", "Take Elevator down to First Floor", DirectionType.Straight),
        KozmosItineraryStep("2", "Take Corridor to Garage B", DirectionType.Straight, isCurrent = true),
        KozmosItineraryStep("3", "Take Walkway to Terminal B", DirectionType.Right),
        KozmosItineraryStep("4", "Destination", DirectionType.Destination)
    )

    @Test
    fun waypointsPreserveCoincidentSemanticsAndAvoidVisualCollisions() {
        val g = KozmosRouteProgressRailGeometry
        val points = listOf(
            KozmosRouteProgressWaypoint("end", 1f, DirectionType.Destination, "Destination"),
            KozmosRouteProgressWaypoint("lift", 0.5f, DirectionType.LiftUp, "Elevator to level 2"),
            KozmosRouteProgressWaypoint("same", 0.5f, DirectionType.Right, "Turn right"),
            KozmosRouteProgressWaypoint("start", 0f, DirectionType.Straight, "Entrance")
        )
        assertEquals(listOf("start", "lift", "same", "end"), g.validWaypoints(points).map { it.id })
        assertEquals(listOf("start", "lift", "end"), g.visibleWaypoints(points, 300.dp, null).map { it.id })
        assertEquals(listOf("start", "end"), g.visibleWaypoints(points, 300.dp, 0.5f).map { it.id })
        assertEquals(emptyList<KozmosRouteProgressWaypoint>(), g.visibleWaypoints(points, 20.dp, null))
        assertEquals(1, g.visibleWaypoints(points, 54.dp, null).size)
        assertEquals(listOf("start", "same", "end"), g.validWaypoints(points + listOf(
            KozmosRouteProgressWaypoint("lift", 0.1f, DirectionType.Left, "Ambiguous"),
            KozmosRouteProgressWaypoint("bad", Float.NaN, DirectionType.Left, "Invalid")
        )).map { it.id })
    }

    @Test
    fun theClosedCardReadsInstructionThenDetail() {
        assertEquals("Turn left, 58 m · 1 min", manoeuvreDescription("Turn left", "58 m · 1 min"))
        assertEquals("Turn left", manoeuvreDescription("Turn left", null))
        assertEquals("Turn left", manoeuvreDescription("Turn left", ""))
    }

    @Test
    fun theDiscTravelsFromAfterTheStartDotToBeforeTheEndDot() {
        val g = KozmosRouteProgressRailGeometry
        assertEquals(10.dp, g.discLeading(0f, 300.dp))
        assertEquals(256.dp, g.discLeading(1f, 300.dp))
        assertEquals(133.dp, g.discLeading(0.5f, 300.dp))
        assertEquals(10.dp, g.discLeading(-1f, 300.dp))
        assertEquals(256.dp, g.discLeading(2f, 300.dp))
        assertEquals(4.dp, g.discLeading(0.5f, 20.dp))
    }

    @Test
    fun nonFiniteProgressStaysAtTheStart() {
        for (progress in listOf(Float.NaN, Float.POSITIVE_INFINITY, Float.NEGATIVE_INFINITY)) {
            assertEquals(10.dp, KozmosRouteProgressRailGeometry.discLeading(progress, 300.dp))
        }
    }

    /** Closed: the arrow, the instruction, the detail, the grab bar. */
    @Test
    fun theClosedCard() {
        paparazzi.snapshot {
            MaterialTheme {
                Box(modifier = Modifier.padding(24.dp).width(360.dp)) {
                    KozmosManoeuvreCard(
                        type = DirectionType.Straight,
                        instruction = "Take Elevator down to First Floor",
                        detail = "58 m · Second Floor",
                        expanded = false,
                        onToggle = {}
                    ) {}
                }
            }
        }
    }

    /** Open: the itinerary in the card, as tall as its rows, the current one emphasised. */
    @Test
    fun theOpenCardHugsItsItinerary() {
        paparazzi.snapshot {
            MaterialTheme {
                Box(modifier = Modifier.padding(24.dp).width(360.dp)) {
                    KozmosManoeuvreCard(
                        type = DirectionType.Straight,
                        instruction = "Take Corridor to Garage B",
                        expanded = true,
                        onToggle = {}
                    ) {
                        KozmosItinerary(origin = "Dunkin'", steps = steps, destination = "Airport Shuttles")
                    }
                }
            }
        }
    }

    /** The rail midway and arriving, and the navigation summary over one. */
    @Test
    fun theRailAndTheNavigationSummary() {
        paparazzi.snapshot {
            MaterialTheme {
                Column(modifier = Modifier.padding(24.dp).width(360.dp)) {
                    KozmosRouteProgressRail(progress = 0.5f, type = DirectionType.Left, label = "Step 2 of 4")
                    KozmosRouteProgressRail(progress = 0.84f, type = DirectionType.Destination, label = "Step 4 of 4", modifier = Modifier.padding(top = 16.dp))
                    KozmosRouteSummary(
                        destination = "Airport Shuttles",
                        durationText = "4 min",
                        distanceText = "201 m",
                        arrivalText = "Arrive 12:58",
                        onEndRoute = {},
                        modifier = Modifier.padding(top = 24.dp),
                        progress = { KozmosRouteProgressRail(progress = 0.16f, type = DirectionType.Straight, label = "Step 1 of 4") }
                    )
                }
            }
        }
    }
}
