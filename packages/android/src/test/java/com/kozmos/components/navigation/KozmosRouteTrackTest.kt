package com.kozmos.components.navigation

import androidx.compose.ui.unit.dp
import com.kozmos.components.progress.KozmosProgressRange
import com.kozmos.components.progress.KozmosProgressPositionMode
import com.kozmos.components.routeprogressrail.KozmosRouteProgressRailGeometry
import com.kozmos.components.routeprogressrail.KozmosRouteProgressWaypoint
import com.kozmos.components.directionstep.DirectionType
import org.junit.Assert.*
import org.junit.Test

class KozmosRouteTrackTest {
    @Test fun staticSectionAndCumulativeLiveFillHaveDifferentMeaning() {
        val range = KozmosProgressRange(0.4f, 1f)
        assertEquals(KozmosProgressRange(0f, 0.6f), range.fill(0.6f, KozmosProgressPositionMode.Live))
        assertEquals(range, range.fill(null, KozmosProgressPositionMode.Static))
        assertNull(range.fill(null, KozmosProgressPositionMode.Live))
        assertNull(range.fill(0.2f, KozmosProgressPositionMode.Live))
        assertEquals(KozmosProgressRange(0.6f, 1f), range.flow(0.6f, KozmosProgressPositionMode.Live))
        assertEquals(range, range.flow(null, KozmosProgressPositionMode.Static))
        assertNull(range.flow(1f, KozmosProgressPositionMode.Live))
    }
    @Test fun rangeIsIndependentOfProgressAndRejectsInvalidSnapshots() {
        val range = KozmosProgressRange(0f, 0.4f)
        assertTrue(range.isValid)
        assertEquals(0f, range.position(0f))
        assertEquals(0.4f, range.position(0.4f))
        listOf(null, Float.NaN, Float.POSITIVE_INFINITY, -0.1f, 0.8f).forEach { assertNull(range.position(it)) }
        assertFalse(KozmosProgressRange(0.6f, 0.2f).isValid)
        assertFalse(KozmosProgressRange(0.4f, 0.4f).isValid)
    }
    @Test fun nextTransitionHasPriorityIndependentOfUserPosition() {
        val points = listOf(KozmosRouteProgressWaypoint("other", 0.39f, DirectionType.Right, "Right"),
            KozmosRouteProgressWaypoint("lift", 0.4f, DirectionType.LiftUp, "Elevator"))
        assertEquals(listOf("lift"), KozmosRouteProgressRailGeometry.visibleRouteWaypoints(points, 320.dp, 0.4f).map { it.id })
        assertTrue(KozmosRouteProgressRailGeometry.visibleRouteWaypoints(points, 20.dp, 0.4f).isEmpty())
        val coincident = listOf(KozmosRouteProgressWaypoint("turn", 0.4f, DirectionType.Right, "Right"), points[1])
        assertEquals(listOf("lift"), KozmosRouteProgressRailGeometry.visibleRouteWaypoints(coincident, 320.dp, 0.4f, "lift").map { it.id })
    }
}
