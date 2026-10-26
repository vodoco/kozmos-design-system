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

    /**
     * The names the web's registry knows (`kozmosIconNames` in
     * packages/icons/src/registry.ts), read from its source as text.
     */
    private fun webRegistryNames(): List<String> {
        var directory: File? = File(System.getProperty("user.dir")).absoluteFile
        while (directory != null) {
            val candidate = File(directory, "packages/icons/src/registry.ts")
            if (candidate.isFile) {
                val source = candidate.readText()
                val list = source.substringAfter("export const kozmosIconNames = [", "")
                    .substringBefore("] as const;", "")
                check(list.isNotEmpty()) { "no kozmosIconNames list in $candidate" }
                return list.lines()
                    .map { it.substringBefore("//").trim() }
                    .flatMap { line -> Regex("\"([a-z0-9-]+)\"").findAll(line).map { it.groupValues[1] }.toList() }
            }
            directory = directory.parentFile
        }
        error("no packages/icons/src/registry.ts above ${System.getProperty("user.dir")}")
    }

    /**
     * Every name the web's registry draws, Compose draws: a chip with
     * `iconName = "phone"` drew an icon on the web and nothing on Android. A
     * name added to the web registry without a Compose vector fails here.
     */
    @Test
    fun everyNameTheWebRegistryKnowsComposeDraws() {
        val names = webRegistryNames()
        assertEquals("the web registry's names are not unique", names.size, names.toSet().size)
        assertTrue("the web registry lists ${names.size} names; the list was not read", names.size >= 57)
        val missing = names.filter { knownIconVector(it) == null }
        assertTrue("Compose draws nothing for ${missing.size} of the web registry's ${names.size} names: $missing", missing.isEmpty())
    }

    /** packages/icons/src/registry.ts, found by walking up from the directory Gradle runs the tests in. */
    private fun webRegistrySource(): String {
        var directory: File? = File(System.getProperty("user.dir")).absoluteFile
        while (directory != null) {
            val candidate = File(directory, "packages/icons/src/registry.ts")
            if (candidate.isFile) return candidate.readText()
            directory = directory.parentFile
        }
        error("no packages/icons/src/registry.ts above ${System.getProperty("user.dir")}")
    }

    /**
     * The names the web draws beyond its curated library
     * (`kozmosIconNamesBeyondTheLibrary` in packages/icons/src/registry.ts),
     * read from its source as text.
     */
    private fun webNamesBeyondTheLibrary(): List<String> {
        val list = webRegistrySource().substringAfter("export const kozmosIconNamesBeyondTheLibrary = [", "")
            .substringBefore("] as const;", "")
        check(list.isNotEmpty()) { "no kozmosIconNamesBeyondTheLibrary list in registry.ts" }
        return list.lines()
            .map { it.substringBefore("//").trim() }
            .flatMap { line -> Regex("\"([a-z0-9-]+)\"").findAll(line).map { it.groupValues[1] }.toList() }
    }

    /** The export the web draws each of those names with: `kozmosIconsBeyondTheLibrary`, read the same way. */
    private fun webExportsBeyondTheLibrary(): Map<String, String> {
        val map = webRegistrySource().substringAfter("const kozmosIconsBeyondTheLibrary", "")
            .substringAfter("= {", "")
            .substringBefore("};", "")
        check(map.isNotEmpty()) { "no kozmosIconsBeyondTheLibrary map in registry.ts" }
        val entry = Regex("^\\s*\"?([a-z0-9-]+)\"?\\s*:\\s*([A-Za-z0-9]+),?\\s*$")
        return map.lines().mapNotNull { line ->
            entry.find(line.substringBefore("//"))?.let { it.groupValues[1] to it.groupValues[2] }
        }.toMap()
    }

    /**
     * GAP-179: every name the web draws beyond its curated library, Compose
     * draws with the artwork the web draws it with: the wayfinding glyphs of
     * Pointr Maps - Express, the four Pointr outlines and the map controls'
     * layers glyph and walking figure (GAP-181), held to one list,
     * `kozmosIconNamesBeyondTheLibrary`. A name renamed or dropped on either
     * side fails here, and in the SwiftUI suite alike.
     */
    @Test
    fun everyNameTheWebDrawsBeyondItsLibraryComposeDraws() {
        val names = webNamesBeyondTheLibrary()
        val exports = webExportsBeyondTheLibrary()
        assertTrue("the web lists ${names.size} names beyond its library; the list was not read", names.size >= 29)
        assertEquals("the web's names beyond its library are not unique", names.size, names.toSet().size)
        assertEquals("the web draws other names than it lists", names.toSet(), exports.keys)
        val registry = webRegistryNames().toSet()
        assertEquals("a name beyond the library is in kozmosIconNames", emptyList<String>(), names.filter { it in registry })
        val wrong = names.filter { knownIconVector(it)?.name != exports.getValue(it) }
            .map { "$it (${knownIconVector(it)?.name ?: "nothing"}, not ${exports.getValue(it)})" }
        assertTrue(
            "Compose does not draw ${wrong.size} of the web's ${names.size} names beyond its library as the web does: $wrong",
            wrong.isEmpty(),
        )
    }

    /**
     * The names Compose lacked until 2026-10-07 are Pointr's own outlines,
     * from packages/icons, unmirrored and stroked 2 on the 24 grid, as React
     * draws them: never a Material near-miss.
     */
    @Test
    fun theNamesComposeLackedAreThePointrOutlines() {
        val pointr = mapOf(
            "arrow-down" to "ArrowDown", "arrow-up" to "ArrowUp", "bookmark" to "Bookmark",
            "calendar-check-01" to "CalendarCheck01", "clock-plus" to "ClockPlus", "eye" to "Eye",
            "feather" to "Feather", "flip-backward" to "FlipBackward", "globe-02" to "Globe02",
            "heart" to "Heart", "layout-alt-02" to "LayoutAlt02", "loading-01" to "Loading01",
            "mail-01" to "Mail01", "phone" to "Phone", "share-01" to "Share01",
            "shopping-bag-02" to "ShoppingBag02", "stars-01" to "Stars01", "switch-vertical-01" to "SwitchVertical01"
        )
        for ((name, vectorName) in pointr) {
            val icon = knownIconVector(name)
            assertEquals("$name is not Pointr's $vectorName", vectorName, icon?.name)
            assertEquals("$name mirrors right to left", false, icon!!.autoMirror)
            assertEquals("$name is not on the 24 grid", 24f, icon.viewportWidth)
            val paths = icon.root.filterIsInstance<VectorPath>()
            assertTrue("$name draws no path", paths.isNotEmpty())
            for (path in paths) {
                assertNull("$name is filled", path.fill)
                assertEquals("$name is not stroked 2", 2f, path.strokeLineWidth)
            }
        }
    }

    /**
     * GAP-181: the map control's layers glyph and the status pill's walking
     * figure, which React draws with `LayersThree01` and `Walking` from
     * @kozmos-ds/icons, are drawn by name: `layers-three-01`, Pointr's
     * outline stroked 2 on the 24 grid, and `walking`, the SDK's figure,
     * solid on its own squared viewBox. Neither is mirrored, and neither is a
     * Material stand-in. Compose drew nothing for either name.
     */
    @Test
    fun theLayersAndWalkingGlyphsAreDrawnByName() {
        val layers = knownIconVector("layers-three-01")
        assertEquals("layers-three-01 is not Pointr's LayersThree01", "LayersThree01", layers?.name)
        assertEquals(false, layers!!.autoMirror)
        assertEquals(24f, layers.viewportWidth)
        val outline = layers.root.filterIsInstance<VectorPath>()
        assertTrue("layers-three-01 draws no path", outline.isNotEmpty())
        for (path in outline) {
            assertNull("layers-three-01 is filled", path.fill)
            assertEquals("layers-three-01 is not stroked 2", 2f, path.strokeLineWidth)
        }

        val walking = knownIconVector("walking")
        assertEquals("walking is not the SDK's Walking figure", "Walking", walking?.name)
        assertEquals(false, walking!!.autoMirror)
        assertEquals("walking is not on its own squared viewBox", walking.viewportWidth, walking.viewportHeight)
        val solid = walking.root.filterIsInstance<androidx.compose.ui.graphics.vector.VectorGroup>()
            .flatMap { group -> group.filterIsInstance<VectorPath>() }
        assertTrue("walking draws no path", solid.isNotEmpty())
        for (path in solid) {
            assertTrue("walking is not filled", path.fill is SolidColor)
            assertNull("walking is stroked", path.stroke)
        }
    }

    /** The name a glyph is drawn by: its export name in kebab case, ElevatorUpAndDown as elevator-up-and-down. */
    private fun iconName(exportName: String): String = exportName.replace(Regex("(?<=[a-z0-9])([A-Z])"), "-$1").lowercase()

    /**
     * Pointr's wayfinding artwork from Pointr Maps - Express is drawn by name,
     * filled, never mirrored: the fifteen the directions draw (the lifts,
     * escalators, stairs and ramps, route-enter, route-exit, hard-left,
     * hard-right, turn-back, follow-the-line and arriving) and the eight only
     * a name draws. Every glyph in the shared source has its name, so a glyph
     * added there without one fails here and in the SwiftUI suite alike.
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
