package com.kozmos.components.icon

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.BluetoothDisabled
import androidx.compose.material.icons.filled.Info
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.vector.VectorPath
import java.io.File
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
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
        val path = pointer.root[0] as VectorPath
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

    /** Pointr's entry, exit and diagonal arrows stay names a product can draw, unmirrored, though no direction draws them now. */
    @Test
    fun pointrsEntryExitAndDiagonalArrowsStayIconsByName() {
        for ((name, vectorName) in listOf("log-in-01" to "LogIn01", "log-out-01" to "LogOut01",
            "arrow-up-right" to "ArrowUpRight", "arrow-down-right" to "ArrowDownRight")) {
            val icon = resolveIconVector(name)
            assertEquals("$name is not Pointr's outline", vectorName, icon.name)
            assertEquals("$name mirrors right to left", false, icon.autoMirror)
        }
    }

    /**
     * The wayfinding artwork's glyphs, export name and paint, from its source,
     * found by walking up from the directory Gradle runs the tests in. The
     * SwiftUI suite reads the same file.
     */
    private fun wayfindingGlyphs(): List<Pair<String, String>> {
        var directory: File? = File(System.getProperty("user.dir")).absoluteFile
        while (directory != null) {
            val candidate = File(directory, "packages/icons/src/owned/navigation-glyphs.json")
            if (candidate.isFile) {
                val source = candidate.readText()
                val names = Regex("\"name\"\\s*:\\s*\"([A-Za-z0-9]+)\"").findAll(source).map { it.groupValues[1] }.toList()
                val paints = Regex("\"paint\"\\s*:\\s*\"([a-z]+)\"").findAll(source).map { it.groupValues[1] }.toList()
                assertEquals("a glyph in navigation-glyphs.json has no paint", names.size, paints.size)
                return names.zip(paints)
            }
            directory = directory.parentFile
        }
        error("no packages/icons/src/owned/navigation-glyphs.json above ${System.getProperty("user.dir")}")
    }

    /** The name a glyph is drawn by: its export name in kebab case, ElevatorUpAndDown as elevator-up-and-down. */
    private fun iconName(exportName: String): String = exportName.replace(Regex("(?<=[a-z0-9])([A-Z])"), "-$1").lowercase()

    /**
     * Pointr's wayfinding artwork from Pointr Maps - Express is drawn by name,
     * filled, never mirrored: the fifteen the directions draw (the lifts,
     * escalators, stairs and ramps, route-enter, route-exit, hard-left,
     * hard-right, turn-back, follow-the-line and arriving) and the eight only
     * a name draws. Every glyph in the shared
     * source has its name, so a glyph added there without one fails here and
     * in the SwiftUI suite alike.
     */
    @Test
    fun theWayfindingArtworkIsDrawnFilledByName() {
        val glyphs = wayfindingGlyphs()
        assertEquals("the Express wayfinding set is 23 glyphs", 23, glyphs.size)
        for ((exportName, paint) in glyphs) {
            val name = iconName(exportName)
            val icon = resolveIconVector(name)
            assertNotEquals("$name falls back to the stand-in", Icons.Filled.Info, icon)
            assertEquals("$name is not the $exportName artwork", exportName, icon.name)
            assertEquals("$name mirrors right to left", false, icon.autoMirror)
            assertEquals("$exportName is not solid artwork", "fill", paint)
            for (path in icon.root.filterIsInstance<VectorPath>()) {
                assertTrue("$name has an unfilled path", path.fill is SolidColor)
                assertNull("$name is stroked", path.stroke)
            }
        }
    }
}
