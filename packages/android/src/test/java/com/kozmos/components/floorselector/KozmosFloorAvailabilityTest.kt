package com.kozmos.components.floorselector

import com.kozmos.contracts.KozmosFloorPresentation
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class KozmosFloorAvailabilityTest {
    private val floors = listOf("2", "1", "G").map { KozmosFloorPresentation(id = it, label = it, shortLabel = it) }

    @Test fun unknownSelectionCannotStepFromAnAssumedFloor() {
        val missing = floors.indexOfFirst { it.id == "missing" }
        assertNull(reachableFloorIndex(floors, missing, -1))
        assertNull(reachableFloorIndex(floors, missing, 1))
    }

    @Test fun topMiddleBottomAndUnknownFloors() {
        assertEquals(FloorAvailability(false, true), floorAvailability(floors, "2"))
        assertEquals(FloorAvailability(true, true), floorAvailability(floors, "1"))
        assertEquals(FloorAvailability(true, false), floorAvailability(floors, "G"))
        assertEquals(FloorAvailability(false, false), floorAvailability(floors, "missing"))
    }

    @Test fun singleEmptyAndDisabledFloors() {
        assertEquals(FloorAvailability(false, false), floorAvailability(listOf(floors.last()), "G"))
        assertEquals(FloorAvailability(false, false), floorAvailability(emptyList(), "G"))
        assertEquals(FloorAvailability(false, false), floorAvailability(floors.map { it.copy(disabled = it.id != "G") }, "G"))
    }
}
