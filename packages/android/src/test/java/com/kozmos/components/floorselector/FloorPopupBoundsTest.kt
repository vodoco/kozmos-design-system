package com.kozmos.components.floorselector

import androidx.compose.ui.unit.IntRect
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.LayoutDirection
import org.junit.Assert.*
import org.junit.Test

class FloorPopupBoundsTest {
    @Test fun popupMovesBesideSameSidePanelInsteadOfRefusingToOpen() {
        val bounds = IntRect(100, 100, 500, 500)
        for ((x, direction) in listOf(700 to LayoutDirection.Ltr, 20 to LayoutDirection.Rtl)) {
            val anchor = IntRect(x, 440, x + 48, 488)
            val height = floorPopupHeight(anchor, bounds, 4, allowHorizontalShift = true)
            assertTrue("A same-side panel must not disable the floor menu", height >= 56)
            val position = FloorSwitcherColumnPosition(4, bounds).calculatePosition(
                anchor, IntSize(1000, 600), direction, IntSize(56, height)
            )
            assertTrue(position.x >= bounds.left && position.x + 56 <= bounds.right)
            assertTrue(position.y >= bounds.top && position.y + height <= bounds.bottom)
        }
    }

    private val band = IntRect(80, 100, 400, 380)
    private val anchor = IntRect(336, 316, 384, 364)

    @Test fun longListStaysInEmbeddedBandInBothDirections() {
        val height = floorPopupHeight(anchor, band, 4)
        assertEquals(268, height)
        for (direction in listOf(LayoutDirection.Ltr, LayoutDirection.Rtl)) {
            val position = FloorSwitcherColumnPosition(4, band).calculatePosition(
                anchor, IntSize(900, 900), direction, IntSize(56, height)
            )
            assertEquals(100, position.y)
            assertTrue(position.x >= band.left && position.x + 56 <= band.right)
            assertTrue(position.y + height <= band.bottom)
        }
    }

    @Test fun topAnchorUsesSpaceBelow() {
        val top = IntRect(336, 116, 384, 164)
        val height = floorPopupHeight(top, band, 4)
        assertEquals(268, height)
        val position = FloorSwitcherColumnPosition(4, band).calculatePosition(
            top, IntSize(900, 900), LayoutDirection.Ltr, IntSize(56, height)
        )
        assertEquals(112, position.y)
        assertEquals(band.bottom, position.y + height)
    }

    @Test fun shortListCannotEscapeAboveTheEmbeddedBand() {
        val position = FloorSwitcherColumnPosition(4, band).calculatePosition(
            IntRect(336, 116, 384, 164), IntSize(900, 900), LayoutDirection.Ltr, IntSize(56, 160)
        )
        assertEquals(112, position.y)
    }

    @Test fun missingOrExcludedAnchorCannotOpen() {
        assertEquals(0, floorPopupHeight(IntRect.Zero, band, 4))
        assertEquals(0, floorPopupHeight(anchor, IntRect(80, 100, 400, 300), 4))
        assertEquals(0, floorPopupHeight(anchor, IntRect(336, 100, 384, 380), 4))
    }
}
