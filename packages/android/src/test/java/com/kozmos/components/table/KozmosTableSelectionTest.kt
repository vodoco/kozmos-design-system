package com.kozmos.components.table

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.state.ToggleableState
import com.kozmos.components.live
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.tokens.KozmosThemeTokens
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * GAP-171 (decision 209): a selectable table, React's `selectable` Table.
 * A row with `onSelectedChange` starts with a checkbox named for the row;
 * the header's KozmosTableSelectAllCell is off, mixed or on as none, some
 * or all rows are selected, and its click selects or clears them; and the
 * count is said in a polite live region. A selected row is on the hover
 * fill with no divider under it (decision 207).
 */
class KozmosTableSelectionTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    private val people = listOf("Ada Lovelace", "Grace Hopper")

    @Test fun theSelectAllBoxIsOffMixedOrOnAndTheCountIsSaidInWords() {
        assertEquals(ToggleableState.Off, kozmosTableSelectAllState(0, 2))
        assertEquals(ToggleableState.Indeterminate, kozmosTableSelectAllState(1, 2))
        assertEquals(ToggleableState.On, kozmosTableSelectAllState(2, 2))
        assertEquals(ToggleableState.Off, kozmosTableSelectAllState(0, 0))
        assertEquals("No rows selected", kozmosTableSelectionAnnouncement(0, 2))
        assertEquals("1 row selected", kozmosTableSelectionAnnouncement(1, 2))
        assertEquals("3 rows selected", kozmosTableSelectionAnnouncement(3, 4))
    }

    @Test fun talkBackHearsEachBoxNamedItsStateAndTheCountPolitely() {
        var fill = Color.Unspecified
        var hover = Color.Unspecified
        var dividerUnderSelected = Color.Unspecified
        var dividerUnderOther = Color.Unspecified
        var border = Color.Unspecified
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme {
                fill = tableRowFill(selected = true)
                hover = KozmosThemeTokens.semanticsHoverFill
                dividerUnderSelected = tableRowDivider(selected = true)
                dividerUnderOther = tableRowDivider(selected = false)
                border = KozmosThemeTokens.semanticsBorderSubtle
                KozmosTable(header = {
                    KozmosTableRow {
                        KozmosTableSelectAllCell(
                            selectedCount = 1,
                            rowCount = 2,
                            onSelectAllChange = {},
                            label = "Alle auswählen",
                            announcement = { count, total -> "$count von $total ausgewählt" }
                        )
                        KozmosTableHeaderCell(text = "Name")
                    }
                }) {
                    people.forEach { name ->
                        KozmosTableRow(
                            selected = name == "Ada Lovelace",
                            onSelectedChange = {},
                            selectLabel = "Select $name"
                        ) {
                            KozmosTableCell(text = name)
                        }
                    }
                }
            }
        }
        val all = tree.named("Alle auswählen")
        assertEquals(Role.Checkbox, all.role)
        assertEquals(ToggleableState.Indeterminate, all.toggleState)
        val ada = tree.named("Select Ada Lovelace")
        assertEquals(Role.Checkbox, ada.role)
        assertEquals(ToggleableState.On, ada.toggleState)
        assertEquals(ToggleableState.Off, tree.named("Select Grace Hopper").toggleState)
        val count = tree.named("1 von 2 ausgewählt")
        assertEquals(LiveRegionMode.Polite, count.liveRegion)
        assertEquals(hover, fill)
        assertEquals(Color.Transparent, dividerUnderSelected)
        assertEquals(border, dividerUnderOther)
    }

    @Test fun aClickOnTheMixedBoxSelectsEveryRowAndARowsBoxSelectsIt() {
        var selected by mutableStateOf(setOf("Ada Lovelace"))
        paparazzi.live(content = {
            KozmosMaterialTheme {
                KozmosTable(header = {
                    KozmosTableRow {
                        KozmosTableSelectAllCell(
                            selectedCount = people.count { it in selected },
                            rowCount = people.size,
                            onSelectAllChange = { on -> selected = if (on) people.toSet() else emptySet() }
                        )
                    }
                }) {
                    people.forEach { name ->
                        KozmosTableRow(
                            selected = name in selected,
                            onSelectedChange = { on -> selected = if (on) selected + name else selected - name },
                            selectLabel = "Select $name"
                        ) {
                            KozmosTableCell(text = name)
                        }
                    }
                }
            }
        }) {
            assertTrue(checkNotNull(read().named("Select all rows").click)())
            frames(3)
            assertEquals(people.toSet(), selected)
            assertEquals(ToggleableState.On, read().named("Select all rows").toggleState)
            assertEquals("2 rows selected", read().merged.single { it.liveRegion != null }.description)
            assertTrue(checkNotNull(read().named("Select Grace Hopper").click)())
            frames(3)
            assertEquals(setOf("Ada Lovelace"), selected)
            assertEquals(ToggleableState.Indeterminate, read().named("Select all rows").toggleState)
        }
    }
}
