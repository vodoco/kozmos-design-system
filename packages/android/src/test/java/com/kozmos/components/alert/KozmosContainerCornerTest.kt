package com.kozmos.components.alert

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.unit.Density
import com.kozmos.components.drawer.KozmosDrawerSide
import com.kozmos.components.drawer.drawerShape
import org.junit.Assert.assertEquals
import org.junit.Test

/**
 * Decision 156: containers are 20 everywhere. Alert and Drawer took the
 * control's 16; they take the container's 20, as React's rounded-container
 * draws them, and as Card already did. A drawer at its edge rounds the two
 * corners that face the page, and the two at the edge stay square. Read off
 * the shapes the parts draw with, at a density of 1, so a corner is in dp.
 */
class KozmosContainerCornerTest {
    private val density = Density(1f)
    private val size = Size(400f, 400f)

    private fun RoundedCornerShape.corners() = listOf(
        topStart.toPx(size, density),
        topEnd.toPx(size, density),
        bottomEnd.toPx(size, density),
        bottomStart.toPx(size, density)
    )

    @Test
    fun anAlertsCornersAreTheContainers() {
        assertEquals(listOf(20f, 20f, 20f, 20f), KozmosAlertShape.corners())
    }

    @Test
    fun aDrawersCornersThatFaceThePageAreTheContainers() {
        // topStart, topEnd, bottomEnd, bottomStart.
        assertEquals("left", listOf(0f, 20f, 20f, 0f), drawerShape(KozmosDrawerSide.Left).corners())
        assertEquals("right", listOf(20f, 0f, 0f, 20f), drawerShape(KozmosDrawerSide.Right).corners())
        assertEquals("top", listOf(0f, 0f, 20f, 20f), drawerShape(KozmosDrawerSide.Top).corners())
        assertEquals("bottom", listOf(20f, 20f, 0f, 0f), drawerShape(KozmosDrawerSide.Bottom).corners())
    }
}
