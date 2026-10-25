package com.kozmos.components.floorselector

import androidx.compose.ui.unit.LayoutDirection
import com.kozmos.components.tooltip.KozmosTooltipSide
import com.kozmos.components.tooltip.physical
import org.junit.Assert.assertEquals
import org.junit.Test

/**
 * A level's hint opens before the floor selector, on the side reading starts
 * on: away from the screen edge the selector keeps to. The selector picked
 * Left or Right by the layout direction itself; it now passes the tooltip's
 * Leading side, as SwiftUI's does (#368), and opens where it always did.
 */
class KozmosFloorSelectorHintSideTest {
    @Test fun aLevelsHintOpensOnTheLeadingSideWhereItAlwaysDid() {
        assertEquals(KozmosTooltipSide.Leading, FloorHintSide)
        // Left left to right and Right right to left, as the selector chose by hand.
        assertEquals(
            listOf(KozmosTooltipSide.Left, KozmosTooltipSide.Right),
            listOf(LayoutDirection.Ltr, LayoutDirection.Rtl).map { FloorHintSide.physical(it) }
        )
    }
}
