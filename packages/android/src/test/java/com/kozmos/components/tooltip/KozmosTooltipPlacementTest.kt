package com.kozmos.components.tooltip

import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.IntRect
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.LayoutDirection
import org.junit.Assert.assertEquals
import org.junit.Test

/**
 * Where KozmosTooltip places its bubble, from its trigger, for every side in
 * both reading directions. Top, Bottom, Left and Right are physical, as
 * React's Radix sides and Figma's are: the same in both directions. Leading
 * is the side reading starts on and Trailing the side it ends on, so they
 * swap right to left (the owner's decision, 21 Oct).
 */
class KozmosTooltipPlacementTest {
    private val trigger = IntRect(left = 100, top = 200, right = 180, bottom = 240)
    private val bubble = IntSize(width = 60, height = 20)
    private val gap = 4

    private fun placed(side: KozmosTooltipSide, direction: LayoutDirection): IntOffset =
        TooltipPositionProvider(side, gap).calculatePosition(trigger, IntSize(1000, 1000), direction, bubble)

    @Test fun eachSideIsPlacedOnItsPhysicalSideInBothDirections() {
        val above = IntOffset(110, 176)
        val below = IntOffset(110, 244)
        val right = IntOffset(184, 210)
        val left = IntOffset(36, 210)
        val expected = mapOf(
            LayoutDirection.Ltr to listOf(above, right, below, left, left, right),
            LayoutDirection.Rtl to listOf(above, right, below, left, right, left)
        )
        val sides = listOf(
            KozmosTooltipSide.Top, KozmosTooltipSide.Right, KozmosTooltipSide.Bottom,
            KozmosTooltipSide.Left, KozmosTooltipSide.Leading, KozmosTooltipSide.Trailing
        )
        val read = LayoutDirection.values().associateWith { direction -> sides.map { placed(it, direction) } }
        assertEquals(expected, read)
    }
}
