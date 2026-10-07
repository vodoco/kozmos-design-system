package com.kozmos.components.floorselector

import androidx.compose.ui.Modifier
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.contracts.KozmosFloorPresentation
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * The floor selector as TalkBack hears it.
 *
 * The compact stepper's two buttons were hard-coded English until row 67. Only
 * the stepper draws them; the lists name each level by its own label, which is
 * product data and was never the problem. Row 69 adds the levels' result
 * counts, said on the level's own button.
 */
class KozmosFloorSelectorSemanticsTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    @Test
    fun existingPositionalCountFormatterCallStillCompilesWithCountsOff() {
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme {
                // The 0.6.0 positional signature, including its last lambda.
                KozmosFloorSelector(
                    resultLevels, "1", {}, Modifier,
                    KozmosFloorSelectorVariant.VerticalList, "Floors",
                    "Up", "Down", null, "your level", { "$it matches" }
                )
            }
        }
        tree.named("Level 2")
        assertTrue(tree.names().none { it.contains("matches") })
    }

    @Test
    fun unknownSelectionCannotEmitAFabricatedFloorChoice() {
        val selected = mutableListOf<String>()
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosFloorSelector(
                    floors = listOf("2", "1", "G"),
                    selectedFloor = "missing",
                    onFloorSelect = { selected += it },
                    variant = KozmosFloorSelectorVariant.CompactStepper
                )
            }
        }
        // Invoke semantics directly as assistive technology does. No path
        // may report an ID that was never supplied as a selectable floor.
        for (name in listOf("Floor up", "Floor down", "missing")) {
            val node = tree.named(name)
            assertFalse("$name must be disabled", node.enabled)
            node.click?.invoke()
        }
        assertEquals(emptyList<String>(), selected)
    }

    @Test
    fun theStepperTakesTheProductsNames() {
        val selected = mutableListOf<String>()
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosFloorSelector(
                    floors = listOf("2", "1", "G"),
                    selectedFloor = "1",
                    onFloorSelect = { selected += it },
                    variant = KozmosFloorSelectorVariant.CompactStepper,
                    previousFloorLabel = "Vorherige Etage",
                    nextFloorLabel = "Nächste Etage"
                )
            }
        }

        // The previous level in list order is on the up chevron, the next on
        // the down — the names follow the buttons, not the other way round.
        tree.named("Vorherige Etage").click!!.invoke()
        tree.named("Nächste Etage").click!!.invoke()
        assertEquals(listOf("2", "G"), selected)
        assertTrue(tree.names().none { it == "Floor up" || it == "Floor down" })
    }

    @Test
    fun theStepperNamesDefaultToTheEnglishTheyWere() {
        // The words these buttons always said, which React and SwiftUI say
        // too; a product that passes none here hears nothing new.
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosFloorSelector(
                    floors = listOf("2", "1", "G"),
                    selectedFloor = "1",
                    onFloorSelect = {},
                    variant = KozmosFloorSelectorVariant.CompactStepper
                )
            }
        }

        tree.named("Floor up")
        tree.named("Floor down")
    }

    // Row 69 (GAP-070): the levels that hold results. Level 2 holds three,
    // Level 3 a real zero, Level 1 no count at all. Level 3's short label is
    // "3", which is the collision a marker on a numbered control invites, as
    // React's test found.
    private val resultLevels = listOf(
        KozmosFloorPresentation(id = "1", label = "Level 1", shortLabel = "1"),
        KozmosFloorPresentation(id = "2", label = "Level 2", shortLabel = "2", resultCount = 3),
        KozmosFloorPresentation(id = "3", label = "Level 3", shortLabel = "3", resultCount = 0)
    )

    @Test
    fun suppliedResultCountsAreOffByDefault() {
        for (variant in listOf(KozmosFloorSelectorVariant.VerticalList, KozmosFloorSelectorVariant.HorizontalList)) {
            val tree = paparazzi.readSemantics {
                KozmosMaterialTheme {
                    KozmosFloorSelector(floors = resultLevels, selectedFloor = "1", onFloorSelect = {}, variant = variant)
                }
            }
            tree.named("Level 2")
            assertTrue(tree.names().none { it.contains("results") })
        }
    }

    @Test
    fun theListsSayWhereTheResultsAre() {
        for (variant in listOf(KozmosFloorSelectorVariant.VerticalList, KozmosFloorSelectorVariant.HorizontalList)) {
            val tree = paparazzi.readSemantics {
                KozmosMaterialTheme {
                    KozmosFloorSelector(
                        floors = resultLevels,
                        selectedFloor = "1",
                        onFloorSelect = {},
                        variant = variant,
                        showResultCounts = true,
                        resultCountLabel = { "$it Ergebnisse" }
                    )
                }
            }

            // The count joins the level's own label, in the product's words.
            val level2 = tree.named("Level 2, 3 Ergebnisse")
            // Zero is not "unknown", and neither is marked: a level with no
            // results reads as itself.
            tree.named("Level 3")
            tree.named("Level 1")
            // Said once, on the button: the marker is no stop of its own, and
            // its "3" is not among the button's words — only the short label is.
            assertEquals("$variant", listOf("2"), level2.texts)
            assertEquals("$variant", listOf("Level 3"), tree.merged.filter { "3" in it.texts }.map { it.description })
            assertEquals("$variant", 3, tree.merged.count { it.click != null })
        }
    }

    @Test
    fun theStepperMarksNoLevel() {
        // It shows one level at a time, so a marker on the level already in
        // view says nothing — and what is not drawn is not said.
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosFloorSelector(
                    floors = resultLevels,
                    selectedFloor = "2",
                    onFloorSelect = {},
                    variant = KozmosFloorSelectorVariant.CompactStepper,
                    showResultCounts = true
                )
            }
        }
        assertEquals(listOf("2"), tree.named("Level 2").texts)
        assertTrue(tree.names().none { "result" in it })
    }

    @Test
    fun theCountIsSaidInEnglishUntilTheProductSaysOtherwise() {
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosFloorSelector(
                    showResultCounts = true,
                    floors = resultLevels + KozmosFloorPresentation(id = "4", label = "Level 4", shortLabel = "4", resultCount = 1),
                    selectedFloor = "1",
                    onFloorSelect = {}
                )
            }
        }
        tree.named("Level 2, 3 results")
        tree.named("Level 4, 1 result")
    }

    @Test
    fun theLevelsShowTheirShortLabelAndSayTheirName() {
        // Until row 69 the selector took strings only, so a venue's floor IDs
        // had to double as what the buttons show and what TalkBack says.
        val selected = mutableListOf<String>()
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosFloorSelector(
                    floors = listOf(
                        KozmosFloorPresentation(id = "b:2", label = "Second Floor", shortLabel = "L2"),
                        KozmosFloorPresentation(id = "b:1", label = "First Floor", shortLabel = "L1")
                    ),
                    selectedFloor = "b:1",
                    onFloorSelect = { selected += it }
                )
            }
        }
        val second = tree.named("Second Floor")
        assertEquals(listOf("L2"), second.texts)
        assertEquals(false, second.selected)
        assertEquals(true, tree.named("First Floor").selected)
        second.click!!.invoke()
        assertEquals(listOf("b:2"), selected)
    }

    @Test
    fun aClosedLevelCannotBeChosenAndTheStepperPassesIt() {
        val selected = mutableListOf<String>()
        val floors = listOf(
            KozmosFloorPresentation(id = "3", label = "Level 3", shortLabel = "3"),
            KozmosFloorPresentation(id = "2", label = "Level 2", shortLabel = "2", disabled = true),
            KozmosFloorPresentation(id = "1", label = "Level 1", shortLabel = "1")
        )
        val list = paparazzi.readSemantics {
            KozmosMaterialTheme { KozmosFloorSelector(floors = floors, selectedFloor = "3", onFloorSelect = { selected += it }) }
        }
        assertFalse(list.named("Level 2").enabled)

        val stepper = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosFloorSelector(
                    floors = floors,
                    selectedFloor = "3",
                    onFloorSelect = { selected += it },
                    variant = KozmosFloorSelectorVariant.CompactStepper
                )
            }
        }
        // Down from Level 3 lands on Level 1: Level 2 is closed.
        stepper.named("Floor down").click!!.invoke()
        assertEquals(listOf("1"), selected)
        assertFalse(stepper.named("Floor up").enabled)
    }
}
