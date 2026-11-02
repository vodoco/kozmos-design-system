package com.kozmos.contracts

import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.docsnippets.BuildingFloors
import com.kozmos.docsnippets.startFloor
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * The building and the site the live map reports (GAP-175): the web's
 * `BuildingPresentation` and `SitePresentation`, and the docs' example that
 * hands a building's floors to the floor selector.
 */
class KozmosBuildingPresentationTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    private val floors = listOf(
        KozmosFloorPresentation(id = "3", label = "Departures", shortLabel = "3"),
        KozmosFloorPresentation(id = "2", label = "Arrivals", shortLabel = "2"),
        KozmosFloorPresentation(id = "0", label = "Ground transport", shortLabel = "0"),
        KozmosFloorPresentation(id = "-1", label = "Car park", shortLabel = "P")
    )
    private val terminal = KozmosBuildingPresentation(id = "t2", label = "Terminal 2", siteId = "airport", floors = floors)

    @Test
    fun aBuildingCarriesWhatTheWebContractDoes() {
        assertEquals("t2", terminal.id)
        assertEquals("Terminal 2", terminal.label)
        assertEquals("airport", terminal.siteId)
        // Top floor first, as given: the contract never reorders.
        assertEquals(listOf("3", "2", "0", "-1"), terminal.floors.map { it.id })
        // An untitled building is an empty label, not a missing one.
        assertEquals("", KozmosBuildingPresentation("b", "", "s", emptyList()).label)
    }

    /**
     * The level to start on (decision 141): Pointr's default, by its id in
     * `floors`, which a building may leave out; the docs' `startFloor` falls
     * back to the ground level the product names.
     */
    @Test
    fun aBuildingNamesTheLevelToStartOn() {
        val marked = terminal.copy(defaultFloorId = "-1")
        assertEquals("-1", marked.defaultFloorId)
        assertTrue(marked.floors.any { it.id == marked.defaultFloorId })
        // Left out, there is none.
        assertNull(terminal.defaultFloorId)
        assertNull(KozmosBuildingPresentation("b", "", "s", emptyList()).defaultFloorId)
        // It is part of the value: a building with a default is another building.
        assertNotEquals(terminal, marked)
        assertEquals("-1", startFloor(marked, ground = "0"))
        assertEquals("0", startFloor(terminal, ground = "0"))
    }

    @Test
    fun aSiteCarriesItsBuildings() {
        val annex = KozmosBuildingPresentation(id = "t1", label = "Terminal 1", siteId = "airport", floors = emptyList())
        val site = KozmosSitePresentation(id = "airport", label = "Airport", buildings = listOf(terminal, annex))
        assertEquals(listOf("t2", "t1"), site.buildings.map { it.id })
        assertTrue(site.buildings.all { it.siteId == site.id })
        assertEquals(terminal, terminal.copy())
        assertNotEquals(terminal, annex)
    }

    /**
     * FloorSelector.mdx's example (docsnippets/BuildingFloors.kt): the
     * building's floors, top first, are the selector's levels in that order,
     * and choosing one reaches the product.
     */
    @Test
    fun theDocsExampleDrawsTheBuildingsFloorsTopFirst() {
        val chosen = mutableListOf<String>()
        val tree = paparazzi.readSemantics {
            // Started where the docs start: the building's default, the second floor.
            val start = startFloor(terminal.copy(defaultFloorId = "2"), ground = "0")
            KozmosMaterialTheme { BuildingFloors(terminal, selectedFloor = start, onFloorSelect = { chosen += it }) }
        }
        val levels = tree.names().filter { name -> floors.any { name.startsWith(it.label) } }
        assertEquals(listOf("Departures", "Arrivals", "Ground transport", "Car park"), levels)
        tree.named("Car park").click!!.invoke()
        assertEquals(listOf("-1"), chosen)
    }
}
