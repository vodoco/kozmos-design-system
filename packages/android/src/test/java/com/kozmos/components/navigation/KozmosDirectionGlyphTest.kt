package com.kozmos.components.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowDownward
import androidx.compose.material.icons.filled.ArrowRightAlt
import androidx.compose.material.icons.filled.ArrowUpward
import androidx.compose.material.icons.filled.Info
import androidx.compose.ui.graphics.PathFillType
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.vector.VectorPath
import com.kozmos.components.directionstep.DirectionType
import com.kozmos.components.directionstep.icon
import com.kozmos.utils.KozmosNavigationGlyphs
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertSame
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * The direction marks, one table for step, card, itinerary and rail. Lifts,
 * escalators, stairs, ramps, entry, exit, the turns, turning back, walking and
 * the destination draw Pointr's wayfinding artwork from Pointr Maps - Express,
 * filled, as React draws it (2026-10-04; walking's FollowTheLine, 2026-10-05).
 * Straight on, a level change and transition keep the marks main drew.
 * [KozmosDirectionGlyphPixelsTest] reads what they draw.
 */
class KozmosDirectionGlyphTest {
    @Test fun everyDefaultIsAnApprovedMark() {
        val approved = mapOf(
            DirectionType.Straight to Icons.Default.ArrowUpward,
            DirectionType.Left to KozmosNavigationGlyphs.HardLeft,
            DirectionType.Right to KozmosNavigationGlyphs.HardRight,
            DirectionType.Destination to KozmosNavigationGlyphs.Arriving,
            DirectionType.LiftUp to KozmosNavigationGlyphs.ElevatorUp,
            DirectionType.LiftDown to KozmosNavigationGlyphs.ElevatorDown,
            DirectionType.EscalatorUp to KozmosNavigationGlyphs.EscalatorUp,
            DirectionType.EscalatorDown to KozmosNavigationGlyphs.EscalatorDown,
            DirectionType.StairsUp to KozmosNavigationGlyphs.StairsUp,
            DirectionType.StairsDown to KozmosNavigationGlyphs.StairsDown,
            DirectionType.LevelUp to Icons.Default.ArrowUpward,
            DirectionType.LevelDown to Icons.Default.ArrowDownward,
            DirectionType.Transition to Icons.Default.ArrowRightAlt,
            DirectionType.TurnBack to KozmosNavigationGlyphs.TurnBack,
            DirectionType.Walking to KozmosNavigationGlyphs.FollowTheLine,
            DirectionType.Enter to KozmosNavigationGlyphs.RouteEnter,
            DirectionType.Exit to KozmosNavigationGlyphs.RouteExit,
            DirectionType.RampUp to KozmosNavigationGlyphs.RampUp,
            DirectionType.RampDown to KozmosNavigationGlyphs.RampDown,
        )
        assertEquals("a direction has no approved mark", DirectionType.entries.toSet(), approved.keys)
        for ((type, mark) in approved) {
            assertNotEquals("$type falls back to the stand-in", Icons.Default.Info, mark)
            assertSame("$type does not draw ${mark.name}", mark, type.icon())
        }
    }

    /**
     * The Express marks are solid shapes on the 24 grid: every path filled
     * with the nonzero rule, as React fills it, and none stroked.
     */
    @Test fun theExpressMarksAreSolidShapes() {
        val express = mapOf(
            DirectionType.LiftUp to "ElevatorUp", DirectionType.LiftDown to "ElevatorDown",
            DirectionType.EscalatorUp to "EscalatorUp", DirectionType.EscalatorDown to "EscalatorDown",
            DirectionType.StairsUp to "StairsUp", DirectionType.StairsDown to "StairsDown",
            DirectionType.RampUp to "RampUp", DirectionType.RampDown to "RampDown",
            DirectionType.Enter to "RouteEnter", DirectionType.Exit to "RouteExit",
            DirectionType.Left to "HardLeft", DirectionType.Right to "HardRight",
            DirectionType.TurnBack to "TurnBack", DirectionType.Walking to "FollowTheLine",
            DirectionType.Destination to "Arriving",
        )
        // Fifteen directions are Express artwork; the other four keep Material's marks.
        val material = setOf(DirectionType.Straight, DirectionType.LevelUp, DirectionType.LevelDown, DirectionType.Transition)
        assertEquals("a direction is neither Express nor Material", DirectionType.entries.toSet() - material, express.keys)
        for ((type, name) in express) {
            val vector = type.icon()
            assertEquals("$type is not the Express $name", name, vector.name)
            assertEquals("$type is not on the 24 grid", 24f, vector.viewportWidth)
            val paths = vector.root.filterIsInstance<VectorPath>()
            assertEquals("$type has a path in a group", vector.root.size, paths.size)
            for (path in paths) {
                assertTrue("$type has an unfilled path", path.fill is SolidColor)
                assertNull("$type is stroked", path.stroke)
                assertEquals("$type is not filled nonzero", PathFillType.NonZero, path.pathFillType)
            }
        }
        // Exit's door is Entrance's: the same first path, the door on the right.
        assertEquals((DirectionType.Enter.icon().root[0] as VectorPath).pathData,
            (DirectionType.Exit.icon().root[0] as VectorPath).pathData)
    }

    /** Physical directions never mirror: a ramp rises to the right, in Arabic as in English. */
    @Test fun noDirectionMirrorsRightToLeft() {
        assertTrue(DirectionType.entries.filter { it.icon().autoMirror }.toString(), DirectionType.entries.none { it.icon().autoMirror })
    }
}
