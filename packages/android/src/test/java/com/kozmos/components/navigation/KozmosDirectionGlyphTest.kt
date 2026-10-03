package com.kozmos.components.navigation

import com.kozmos.components.directionstep.DirectionType
import com.kozmos.components.directionstep.icon
import org.junit.Assert.*
import org.junit.Test

class KozmosDirectionGlyphTest {
    @Test fun transportAndTravelDirectionsHaveSixDistinctDrawings() {
        val glyphs = listOf(DirectionType.LiftUp, DirectionType.LiftDown, DirectionType.StairsUp, DirectionType.StairsDown, DirectionType.EscalatorUp, DirectionType.EscalatorDown).map { it.icon() }
        assertEquals(6, glyphs.toSet().size)
        assertTrue(glyphs.none { it.autoMirror })
    }
}
