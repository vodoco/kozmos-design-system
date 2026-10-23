package com.kozmos.components.popover

import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.IntRect
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.LayoutDirection
import org.junit.Assert.assertEquals
import org.junit.Test

/**
 * The popover's placement on each side, as Radix places it: `gap` from the
 * anchor, centred on it, flipped where the side has no room and the other
 * side has more, slid along to stay in the window. Sides are physical, as
 * Radix's are, so a right-to-left layout places them the same.
 */
class KozmosPopoverPositionTest {
    private val window = IntSize(1000, 800)
    private val popover = IntSize(200, 100)
    private val anchor = IntRect(400, 350, 448, 398)

    private fun at(side: KozmosPopoverSide, anchor: IntRect = this.anchor, size: IntSize = popover,
                   direction: LayoutDirection = LayoutDirection.Ltr): IntOffset =
        KozmosPopoverPosition(side, gap = 12).calculatePosition(anchor, window, direction, size)

    @Test fun eachSideIsTheGapFromTheAnchorAndCentredOnIt() {
        for (direction in LayoutDirection.values()) {
            assertEquals(IntOffset(324, 238), at(KozmosPopoverSide.Top, direction = direction))
            assertEquals(IntOffset(324, 410), at(KozmosPopoverSide.Bottom, direction = direction))
            assertEquals(IntOffset(188, 324), at(KozmosPopoverSide.Left, direction = direction))
            assertEquals(IntOffset(460, 324), at(KozmosPopoverSide.Right, direction = direction))
        }
    }

    @Test fun aSideWithNoRoomFlipsToTheOther() {
        assertEquals("top, at the window's top", 68 + 12, at(KozmosPopoverSide.Top, IntRect(400, 20, 448, 68)).y)
        assertEquals("bottom, at the window's bottom", 720 - 12 - 100, at(KozmosPopoverSide.Bottom, IntRect(400, 720, 448, 768)).y)
        assertEquals("left, at the window's left", 68 + 12, at(KozmosPopoverSide.Left, IntRect(20, 350, 68, 398)).x)
        assertEquals("right, at the window's right", 940 - 12 - 200, at(KozmosPopoverSide.Right, IntRect(940, 350, 988, 398)).x)
    }

    /** Where neither side has room, the popover stays on the side with more of it. */
    @Test fun withNoRoomEitherWayItKeepsTheSideWithMore() {
        val tall = IntSize(200, 500)
        assertEquals("more room above", 400 - 12 - 500, at(KozmosPopoverSide.Bottom, IntRect(400, 400, 448, 448), tall).y)
        assertEquals("more room below", 300 + 48 + 12, at(KozmosPopoverSide.Top, IntRect(400, 300, 448, 348), tall).y)
    }

    @Test fun nearAnEdgeItSlidesAlongTheAnchorOntoTheWindow() {
        assertEquals(0, at(KozmosPopoverSide.Top, IntRect(10, 350, 58, 398)).x)
        assertEquals(800, at(KozmosPopoverSide.Bottom, IntRect(960, 350, 1000, 398)).x)
        assertEquals(0, at(KozmosPopoverSide.Right, IntRect(400, 10, 448, 58)).y)
        assertEquals(700, at(KozmosPopoverSide.Left, IntRect(400, 760, 448, 800)).y)
        assertEquals("wider than the window: from its start", 0, at(KozmosPopoverSide.Top, size = IntSize(1200, 100)).x)
    }
}
