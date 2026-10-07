package com.kozmos.compat

import androidx.compose.foundation.layout.Column
import androidx.compose.material3.MaterialTheme
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.Role
import com.kozmos.components.directionstep.DirectionType
import com.kozmos.components.itinerary.KozmosItinerary
import com.kozmos.components.itinerary.KozmosItineraryStep
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * An Itinerary call written against 0.9.0 still compiles, and still puts
 * every value where it went. GAP-104's endpoint actions — `onEditOrigin`,
 * `onEditDestination`, `changeLabel`, `editOriginLabel`,
 * `editDestinationLabel` — come after 0.9.0's seven parameters, so a call
 * that passed those by position binds as it did, and draws no action.
 */
class ItineraryReleasedOrderTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    private val steps = listOf(KozmosItineraryStep("1", "Rechts abbiegen", DirectionType.Right))

    /** 0.9.0's seven parameters by position, and its three required ones alone. */
    @Test
    fun theReleasedPositionalCallsStillCompileAndPutEachValueWhereItWent() {
        val tree = paparazzi.readSemantics {
            MaterialTheme {
                Column {
                    KozmosItinerary(
                        "Haupteingang",
                        steps,
                        "Flugsteig 12",
                        Modifier.testTag("released"),
                        "Von",
                        "Nach",
                        "Wegbeschreibung"
                    )
                    KozmosItinerary("Lobby", steps, "Gate 3")
                }
            }
        }
        assertTrue("the modifier is not the itinerary's", tree.unmerged.any { it.tag == "released" })
        tree.named("Wegbeschreibung")
        tree.named("Von, Haupteingang")
        tree.named("Nach, Flugsteig 12")
        tree.named("From, Lobby")
        tree.named("To, Gate 3")
        assertEquals("a released call draws no action", emptyList<String?>(), tree.merged.filter { it.role == Role.Button }.map { it.description })
    }

    /** The new parameters by position, eighth to twelfth, and by name. */
    @Test
    fun theNewParametersAreReachedByPositionAndByName() {
        val tree = paparazzi.readSemantics {
            MaterialTheme {
                Column {
                    KozmosItinerary(
                        "Haupteingang",
                        steps,
                        "Flugsteig 12",
                        Modifier,
                        "Von",
                        "Nach",
                        "Wegbeschreibung",
                        {},
                        {},
                        "Ändern",
                        "Ändern: Startpunkt",
                        "Ändern: Ziel"
                    )
                    KozmosItinerary(
                        origin = "Lobby",
                        steps = steps,
                        destination = "Gate 3",
                        onEditDestination = {}
                    )
                }
            }
        }
        assertEquals(
            listOf("Ändern: Startpunkt", "Ändern: Ziel", "Change destination"),
            tree.merged.filter { it.role == Role.Button }.map { it.description }
        )
    }
}
