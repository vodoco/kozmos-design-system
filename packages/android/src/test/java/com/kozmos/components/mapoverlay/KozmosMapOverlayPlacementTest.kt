package com.kozmos.components.mapoverlay

import androidx.compose.ui.Alignment
import androidx.compose.ui.unit.LayoutDirection
import org.junit.Assert.assertEquals
import org.junit.Test

class KozmosMapOverlayPlacementTest {
    @Test fun logicalPositionsMirrorWithTheInterface() {
        for (direction in LayoutDirection.values()) {
            assertEquals(Alignment.BottomStart, OverlayPosition.BOTTOM_START.alignment(direction))
            assertEquals(Alignment.BottomEnd, OverlayPosition.BOTTOM_END.alignment(direction))
            assertEquals(Alignment.TopStart, OverlayPosition.TOP_START.alignment(direction))
            assertEquals(Alignment.TopEnd, OverlayPosition.TOP_END.alignment(direction))
        }
    }
    @Test fun physicalPositionsKeepTheirNamedEdge() {
        assertEquals(Alignment.BottomStart, OverlayPosition.BOTTOM_LEFT.alignment(LayoutDirection.Ltr))
        assertEquals(Alignment.BottomEnd, OverlayPosition.BOTTOM_LEFT.alignment(LayoutDirection.Rtl))
        assertEquals(Alignment.TopStart, OverlayPosition.TOP_RIGHT.alignment(LayoutDirection.Rtl))
    }
}
