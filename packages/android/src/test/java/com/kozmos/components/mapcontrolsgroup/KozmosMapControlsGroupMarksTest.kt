package com.kozmos.components.mapcontrolsgroup

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Accessible
import androidx.compose.material.icons.filled.Explore
import androidx.compose.material.icons.filled.NearMe
import androidx.compose.material.icons.filled.Navigation
import androidx.compose.material.icons.outlined.NearMe
import androidx.compose.material.icons.outlined.NearMeDisabled
import com.kozmos.contracts.KozmosUserLocationState
import org.junit.Assert.assertEquals
import org.junit.Assert.assertSame
import org.junit.Test

/**
 * The mark the location control draws for each mode (row 77), in Material's
 * own glyphs — the convention KozmosIcon keeps — standing in for the revamp's
 * artwork: the outline pointer at rest, the solid pointer while the map
 * follows, the upright pointer while it turns with the visitor, and the
 * pointer struck through when there is no position to show.
 */
class KozmosMapControlsGroupMarksTest {
    @Test
    fun theLocationControlDrawsAMarkForEachMode() {
        val expected = mapOf(
            KozmosUserLocationState.Off to Icons.Outlined.NearMe,
            KozmosUserLocationState.Locating to Icons.Outlined.NearMe,
            KozmosUserLocationState.Stale to Icons.Outlined.NearMe,
            KozmosUserLocationState.Following to Icons.Filled.NearMe,
            KozmosUserLocationState.Heading to Icons.Filled.Navigation,
            KozmosUserLocationState.PermissionDenied to Icons.Outlined.NearMeDisabled,
            KozmosUserLocationState.Unavailable to Icons.Outlined.NearMeDisabled
        )
        assertEquals(KozmosUserLocationState.values().toSet(), expected.keys)

        for ((state, mark) in expected) {
            assertSame("$state", mark, locationMark(state, icons = emptyMap()))
        }
    }

    @Test
    fun theProductCanDrawItsOwnMarkForAMode() {
        val icons = mapOf(KozmosUserLocationState.Heading to Icons.Filled.Explore)

        assertSame(Icons.Filled.Explore, locationMark(KozmosUserLocationState.Heading, icons))
        // Only the mode it was given: the others keep the group's own marks.
        assertSame(Icons.Filled.NearMe, locationMark(KozmosUserLocationState.Following, icons))
    }

    @Test
    fun stepFreeDrawsTheWheelchairRouteOptionCardDraws() {
        assertSame(Icons.AutoMirrored.Filled.Accessible, stepFreeMark(icon = null))
        assertSame(Icons.Filled.Explore, stepFreeMark(icon = Icons.Filled.Explore))
    }
}
