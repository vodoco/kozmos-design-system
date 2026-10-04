package com.kozmos.components.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowDownward
import androidx.compose.material.icons.filled.ArrowRightAlt
import androidx.compose.material.icons.filled.ArrowUpward
import androidx.compose.material.icons.filled.DirectionsWalk
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.TurnLeft
import androidx.compose.material.icons.filled.TurnRight
import androidx.compose.material.icons.filled.UTurnLeft
import androidx.compose.ui.graphics.vector.VectorPath
import androidx.compose.ui.graphics.vector.addPathNodes
import com.kozmos.components.directionstep.DirectionType
import com.kozmos.components.directionstep.icon
import com.kozmos.components.icon.resolveIconVector
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertSame
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * D5 (2026-10-04): design has not approved the original lift, escalator,
 * stairs, ramp and entry artwork, so no direction draws it. A level change by
 * any means shows the up or down arrow main drew, and the words name the lift,
 * escalator or stairs; entry, exit and the ramps are Pointr's LogIn01,
 * LogOut01, ArrowUpRight and ArrowDownRight, as React draws them.
 */
class KozmosDirectionGlyphTest {
    @Test fun everyDefaultIsAnApprovedMark() {
        val approved = mapOf(
            DirectionType.Straight to Icons.Default.ArrowUpward,
            DirectionType.Left to Icons.Default.TurnLeft,
            DirectionType.Right to Icons.Default.TurnRight,
            DirectionType.Destination to Icons.Default.LocationOn,
            DirectionType.LiftUp to Icons.Default.ArrowUpward,
            DirectionType.EscalatorUp to Icons.Default.ArrowUpward,
            DirectionType.StairsUp to Icons.Default.ArrowUpward,
            DirectionType.LevelUp to Icons.Default.ArrowUpward,
            DirectionType.LiftDown to Icons.Default.ArrowDownward,
            DirectionType.EscalatorDown to Icons.Default.ArrowDownward,
            DirectionType.StairsDown to Icons.Default.ArrowDownward,
            DirectionType.LevelDown to Icons.Default.ArrowDownward,
            DirectionType.Transition to Icons.Default.ArrowRightAlt,
            DirectionType.TurnBack to Icons.Default.UTurnLeft,
            DirectionType.Walking to Icons.Default.DirectionsWalk,
            DirectionType.Enter to resolveIconVector("log-in-01"),
            DirectionType.Exit to resolveIconVector("log-out-01"),
            DirectionType.RampUp to resolveIconVector("arrow-up-right"),
            DirectionType.RampDown to resolveIconVector("arrow-down-right"),
        )
        assertEquals("a direction has no approved mark", DirectionType.entries.toSet(), approved.keys)
        for ((type, mark) in approved) {
            assertNotEquals("$type falls back to the stand-in", Icons.Default.Info, mark)
            assertSame("$type does not draw ${mark.name}", mark, type.icon())
        }
    }

    /** Pointr's own path data, from `icons.generated.ts`: each mark is drawn from exactly it. */
    @Test fun entryExitAndRampsArePointrsOutlines() {
        val pointr = mapOf(
            // log-in-01, node 1007:10044.
            DirectionType.Enter to "M15 3H16.2C17.8802 3 18.7202 3 19.362 3.32698C19.9265 3.6146 20.3854 4.07354 20.673 4.63803C21 5.27976 21 6.11985 21 7.8V16.2C21 17.8802 21 18.7202 20.673 19.362C20.3854 19.9265 19.9265 20.3854 19.362 20.673C18.7202 21 17.8802 21 16.2 21H15M10 17L15 12L10 7M15 12L3 12",
            // log-out-01, node 1007:10056.
            DirectionType.Exit to "M16 7L21 12L16 17M21 12H9M9 3H7.8C6.11984 3 5.27976 3 4.63803 3.32698C4.07354 3.6146 3.6146 4.07354 3.32698 4.63803C3 5.27976 3 6.11984 3 7.8V16.2C3 17.8802 3 18.7202 3.32698 19.362C3.6146 19.9265 4.07354 20.3854 4.63803 20.673C5.27976 21 6.11984 21 7.8 21H9",
            // arrow-up-right, node 1007:9346.
            DirectionType.RampUp to "M7 17L17 7M17 17V7H7",
            // arrow-down-right, node 1007:9283.
            DirectionType.RampDown to "M7 7L17 17M7 17H17V7",
        )
        for ((type, data) in pointr) {
            val vector = type.icon()
            assertEquals("$type is not on Pointr's 24 grid", 24f, vector.viewportWidth)
            val path = vector.root.single() as VectorPath
            assertEquals("$type is not Pointr's path", addPathNodes(data), path.pathData)
            assertEquals("$type is filled", null, path.fill)
            assertEquals("$type is not stroked at 2", 2f, path.strokeLineWidth)
        }
    }

    /** Physical directions never mirror: a ramp rises to the right, in Arabic as in English. */
    @Test fun noDirectionMirrorsRightToLeft() {
        assertTrue(DirectionType.entries.filter { it.icon().autoMirror }.toString(), DirectionType.entries.none { it.icon().autoMirror })
    }
}
