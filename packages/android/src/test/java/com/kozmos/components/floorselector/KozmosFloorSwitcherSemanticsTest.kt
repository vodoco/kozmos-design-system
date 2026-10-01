package com.kozmos.components.floorselector

import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.snapshots.Snapshot
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.DpSize
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.IntRect
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.mapcontrolbutton.KozmosMapControlSize
import com.kozmos.contracts.KozmosFloorPresentation
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * Row 79 (GAP-080): the SDK's level switcher, as Olcay's board draws it
 * (decision 38), as TalkBack hears it. At rest one map-control tile showing the
 * current level's short label; activated, a column of every level, top floor
 * first (decision 29), the current one outlined; the level the visitor is on
 * carries a dot, said with the level's name.
 */
class KozmosFloorSwitcherSemanticsTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    private val levels = listOf(
        KozmosFloorPresentation(id = "2", label = "Second floor", shortLabel = "2F"),
        KozmosFloorPresentation(id = "1", label = "First floor", shortLabel = "1F"),
        KozmosFloorPresentation(id = "g", label = "Ground floor", shortLabel = "GF")
    )

    private val english: (Int) -> String = { count -> if (count == 1) "1 result" else "$count results" }

    /**
     * Presses controls that [readSemantics] read, once Paparazzi's frame is
     * over, inside a Compose snapshot of their own, applied at the end.
     * Closing the column writes Compose state (the tile's `returnFocus`).
     * Written to the global snapshot outside a frame, it woke Compose's
     * snapshot manager, which posted its work to a main looper no frame runs
     * again, and every composition after it in the JVM got no frames:
     * KozmosMapControlsGroupPressesTest read an empty group on CI (#169), and
     * the panel header's drag tests did not move the sheet. Written in a
     * snapshot of its own, the state reaches no global observer.
     */
    private fun afterTheSnapshot(presses: () -> Unit) = Snapshot.withMutableSnapshot(presses)

    @Test
    fun theSwitcherRestsAsOneMapControlTile() {
        val tree = paparazzi.readSemantics {
            MaterialTheme {
                KozmosFloorSelector(
                    floors = levels,
                    selectedFloor = "1",
                    onFloorSelect = {},
                    variant = KozmosFloorSelectorVariant.Collapsible
                )
            }
        }
        // One control, named by the level it shows — not a button per level.
        assertEquals(listOf("First floor"), tree.merged.filter { it.click != null }.map { it.description })
        val tile = tree.named("First floor")
        assertEquals(listOf("1F"), tile.texts)
        // TalkBack hears it closed and can open it: the platform's own
        // expanded state, in the visitor's language.
        assertNotNull("the closed tile offers no way to expand it", tile.expand)
        assertNull("the closed tile offers to collapse", tile.collapse)
        // A choice is heard as the tile's new name.
        assertEquals(LiveRegionMode.Polite, tile.liveRegion)
    }

    @Test
    fun theTileSaysTheVisitorsLevelOnlyWhileItShowsIt() {
        fun tile(selected: String, userFloor: String?, userFloorLabel: String = "your level"): List<String?> =
            paparazzi.readSemantics {
                MaterialTheme {
                    KozmosFloorSelector(
                        floors = levels,
                        selectedFloor = selected,
                        onFloorSelect = {},
                        variant = KozmosFloorSelectorVariant.Collapsible,
                        userFloor = userFloor,
                        userFloorLabel = userFloorLabel
                    )
                }
            }.merged.filter { it.click != null }.map { it.description }

        assertEquals(listOf("Ground floor, your level"), tile("g", "g"))
        // Showing another level, the tile says nothing of the visitor's.
        assertEquals(listOf("First floor"), tile("1", "g"))
        assertEquals(listOf("Ground floor"), tile("g", null))
        assertEquals(listOf("Ground floor, Ihre Ebene"), tile("g", "g", "Ihre Ebene"))
    }

    @Test
    fun theTileOpensAndClosesTheColumn() {
        val asked = mutableListOf<Boolean>()
        val closed = paparazzi.readSemantics {
            MaterialTheme {
                KozmosFloorSwitcher(
                    floors = levels,
                    selectedFloor = "1",
                    expanded = false,
                    onExpandedChange = { asked += it },
                    onChoose = {}
                )
            }
        }
        afterTheSnapshot {
            closed.named("First floor").expand!!.invoke()
            closed.named("First floor").click!!.invoke()
        }
        val open = paparazzi.readSemantics {
            MaterialTheme {
                KozmosFloorSwitcher(
                    floors = levels,
                    selectedFloor = "1",
                    expanded = true,
                    onExpandedChange = { asked += it },
                    onChoose = {}
                )
            }
        }
        val tile = open.merged.single { it.description == "First floor" && it.liveRegion != null }
        assertNull("the open tile offers to expand", tile.expand)
        afterTheSnapshot {
            tile.collapse!!.invoke()
            tile.click!!.invoke()
        }
        assertEquals(listOf(true, true, false, false), asked)
    }

    @Test
    fun theColumnListsEveryLevelTopFloorFirst() {
        val chosen = mutableListOf<String>()
        val floors = listOf(
            KozmosFloorPresentation(id = "3", label = "Third floor", shortLabel = "3F"),
            KozmosFloorPresentation(id = "2", label = "Second floor", shortLabel = "2F", resultCount = 3),
            KozmosFloorPresentation(id = "1", label = "First floor", shortLabel = "1F"),
            KozmosFloorPresentation(id = "g", label = "Ground floor", shortLabel = "GF", disabled = true)
        )
        val tree = paparazzi.readSemantics {
            MaterialTheme {
                KozmosFloorSwitcherColumn(
                    floors = floors,
                    selectedFloor = "1",
                    userFloor = "2",
                    userFloorLabel = "your level",
                    resultCountLabel = english,
                    levelSize = DpSize(KozmosMapControlSize, KozmosMapControlSize),
                    onChoose = { chosen += it.id }
                )
            }
        }
        val rows = tree.merged.filter { it.role == Role.Button }
        // Top floor first; the visitor's level and its count said with its name.
        assertEquals(
            listOf("Third floor", "Second floor, your level, 3 results", "First floor", "Ground floor"),
            rows.map { it.description }
        )
        // Each level its short label, as the tile shows it; the marks said once.
        assertEquals(listOf(listOf("3F"), listOf("2F"), listOf("1F"), listOf("GF")), rows.map { it.texts })
        assertEquals(listOf(false, false, true, false), rows.map { it.selected })
        // A closed level is listed, not chosen.
        assertEquals(listOf(true, true, true, false), rows.map { it.enabled })
        afterTheSnapshot { tree.named("Third floor").click!!.invoke() }
        assertEquals(listOf("3"), chosen)
    }

    @Test
    fun theVisitorsLevelIsSaidInTheProductsWords() {
        val ground = levels[2]
        assertEquals("Ground floor, Ihre Ebene", switcherSpokenLabel(ground, "g", "Ihre Ebene", english))
        assertEquals("Ground floor", switcherSpokenLabel(ground, null, "your level", english))
        assertEquals("Ground floor", switcherSpokenLabel(ground, "1", "your level", english))
        val counted = ground.copy(resultCount = 1)
        assertEquals("Ground floor, your level, 1 result", switcherSpokenLabel(counted, "g", "your level", english))
    }

    @Test
    fun theColumnClosesOnBackAndOnATapOutside() {
        // The platform's popup does both, if it is asked to: focusable, so its
        // own window hears Back, and Escape, which Android falls back to Back.
        assertTrue(FloorSwitcherPopupProperties.focusable)
        assertTrue(FloorSwitcherPopupProperties.dismissOnBackPress)
        assertTrue(FloorSwitcherPopupProperties.dismissOnClickOutside)
    }

    @Test
    fun theColumnLiesOverTheTile() {
        // A 44 tile at three times, 8 of inset: the column reaches past the
        // tile's end and bottom edges by the inset, so its bottom level lies on
        // the tile.
        val position = FloorSwitcherColumnPosition(inset = 8)
        val tile = IntRect(left = 900, top = 1700, right = 1032, bottom = 1832)
        val column = IntSize(148, 440)
        val window = IntSize(1080, 1920)
        assertEquals(IntOffset(892, 1400), position.calculatePosition(tile, window, LayoutDirection.Ltr, column))
        // A column wider than the tile keeps to the tile's trailing edge.
        val wide = IntSize(300, 440)
        assertEquals(1032 + 8 - 300, position.calculatePosition(tile, window, LayoutDirection.Ltr, wide).x)
        // Right to left the switcher is parked at the start, the left, and
        // the column keeps to the tile's trailing edge there, its left.
        val start = IntRect(left = 48, top = 1700, right = 180, bottom = 1832)
        assertEquals(IntOffset(40, 1400), position.calculatePosition(start, window, LayoutDirection.Rtl, column))
        assertEquals(40, position.calculatePosition(start, window, LayoutDirection.Rtl, wide).x)
        // Never past the window's edge.
        assertEquals(1080 - 300, position.calculatePosition(tile, window, LayoutDirection.Rtl, wide).x)
        // No room above: it grows downwards from the tile's top instead.
        val high = IntRect(left = 900, top = 100, right = 1032, bottom = 232)
        assertEquals(IntOffset(892, 92), position.calculatePosition(high, window, LayoutDirection.Ltr, column))
    }

    @Test
    fun theDocsExampleIsTheSwitcher() {
        // LevelSwitcher, below, is FloorSelector.mdx's Compose example as it
        // is written there: the docs' native snippets are compiled nowhere
        // else.
        val tree = paparazzi.readSemantics {
            MaterialTheme { LevelSwitcher(selected = "G", visitorLevel = "G", onSelect = {}) }
        }
        assertEquals(listOf("Ground, your level"), tree.merged.filter { it.click != null }.map { it.description })
    }
}

// The SDK's level switcher, parked in a corner of the map: one tile that
// grows into every level. The dot marks the level the visitor is on.
@Composable
fun LevelSwitcher(selected: String, visitorLevel: String?, onSelect: (String) -> Unit) {
    KozmosFloorSelector(
        floors = listOf(
            KozmosFloorPresentation(id = "L2", label = "Level 2", shortLabel = "L2"),
            KozmosFloorPresentation(id = "L1", label = "Level 1", shortLabel = "L1"),
            KozmosFloorPresentation(id = "G", label = "Ground", shortLabel = "G")
        ),
        selectedFloor = selected,
        onFloorSelect = onSelect,
        variant = KozmosFloorSelectorVariant.Collapsible,
        userFloor = visitorLevel,
        userFloorLabel = "your level"
    )
}
