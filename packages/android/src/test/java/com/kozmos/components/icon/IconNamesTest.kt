package com.kozmos.components.icon

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.BluetoothDisabled
import androidx.compose.material.icons.filled.Info
import com.kozmos.utils.KozmosNavigationGlyphs
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertSame
import org.junit.Test

/**
 * The names `KozmosIcon` draws, each as its Material counterpart. A name it
 * does not map falls back to Info, so a mapping that is missing shows as that
 * stand-in, not as an error.
 */
class IconNamesTest {
    @Test
    fun navigationPointerIsTheUnmirroredPointrOutline() {
        val pointer = resolveIconVector("navigation-pointer-01")
        assertEquals("NavigationPointer01", pointer.name)
        assertEquals(false, pointer.autoMirror)
        val path = pointer.root[0] as androidx.compose.ui.graphics.vector.VectorPath
        assertEquals(null, path.fill)
        assertEquals(2f, path.strokeLineWidth)
    }
    /**
     * bluetooth-off, the map status pill's No Bluetooth (decision 39), is
     * Material's BluetoothDisabled: the B struck through, as Pointr's is.
     */
    @Test
    fun bluetoothOffIsMaterialsBluetoothDisabled() {
        assertNotEquals("bluetooth-off falls back to the stand-in", Icons.Filled.Info, resolveIconVector("bluetooth-off"))
        assertEquals(Icons.Filled.BluetoothDisabled, resolveIconVector("bluetooth-off"))
    }

    /** The direction marks' Pointr icons are names a product can draw too, unmirrored. */
    @Test
    fun theDirectionMarksArePointrIconsByName() {
        for ((name, vectorName) in listOf("log-in-01" to "LogIn01", "log-out-01" to "LogOut01",
            "arrow-up-right" to "ArrowUpRight", "arrow-down-right" to "ArrowDownRight")) {
            val icon = resolveIconVector(name)
            assertEquals("$name is not Pointr's outline", vectorName, icon.name)
            assertEquals("$name mirrors right to left", false, icon.autoMirror)
        }
    }

    /**
     * The original navigation artwork awaits design approval (D5): no
     * direction draws it, and a product opts in by the names
     * `@kozmos-ds/icons` exports it under.
     */
    @Test
    fun theOriginalNavigationArtworkIsOptInByName() {
        val names = mapOf(
            "elevator-up" to KozmosNavigationGlyphs.ElevatorUp, "elevator-down" to KozmosNavigationGlyphs.ElevatorDown,
            "stairs-up" to KozmosNavigationGlyphs.StairsUp, "stairs-down" to KozmosNavigationGlyphs.StairsDown,
            "escalator-up" to KozmosNavigationGlyphs.EscalatorUp, "escalator-down" to KozmosNavigationGlyphs.EscalatorDown,
            "ramp-up" to KozmosNavigationGlyphs.RampUp, "ramp-down" to KozmosNavigationGlyphs.RampDown,
            "route-enter" to KozmosNavigationGlyphs.RouteEnter, "route-exit" to KozmosNavigationGlyphs.RouteExit,
        )
        for ((name, artwork) in names) assertSame("$name is not the ${artwork.name} artwork", artwork, resolveIconVector(name))
    }
}
