package com.kozmos.components.fieldwrapper

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.semantics.Role
import com.kozmos.components.LiveSemantics
import com.kozmos.components.ReadNode
import com.kozmos.components.ReadSemantics
import com.kozmos.components.datepicker.KozmosDatePicker
import com.kozmos.components.daterangepicker.KozmosDateRangePicker
import com.kozmos.components.daterangepicker.KozmosDateRangeValue
import com.kozmos.components.listbox.KozmosListboxOption
import com.kozmos.components.live
import com.kozmos.components.multiselect.KozmosMultiSelect
import com.kozmos.components.pickerInitialValue
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.components.timepicker.KozmosTimePicker
import java.time.LocalDate
import java.time.LocalTime
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * GAP-255, decision 188: MultiSelect, TimePicker, DatePicker and
 * DateRangePicker take GAP-153's mixed state. Mixed, the field shows none of
 * its own value, "Multiple values" in its place, said once as its state;
 * MultiSelect's list checks nothing and a choice is that option alone; the
 * reset is offered once edited, never disabled or read-only, and hands focus
 * back to the field.
 */
class KozmosMixedPickerTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    private val options = listOf(KozmosListboxOption("a1", "Gate A1"), KozmosListboxOption("b2", "Gate B2"))

    private fun ReadSemantics.mixedSaid() = merged.sumOf { node ->
        (node.texts + listOfNotNull(node.stateDescription, node.description)).count { it == "Multiple values" }
    }

    private fun ReadSemantics.reset() = merged.singleOrNull { "Reset to multiple values" in it.texts }

    private fun LiveSemantics.reset() = read().reset()

    private fun ReadSemantics.multiSelectField(): ReadNode = merged.single { it.setText != null }

    private fun ReadSemantics.saysAnywhere(words: String) =
        merged.any { node -> (node.texts + listOfNotNull(node.description, node.stateDescription)).any { words in it } }

    @Composable
    private fun MultiSelect(
        selected: List<String>,
        mixed: Boolean,
        expanded: Boolean = false,
        enabled: Boolean = true,
        readOnly: Boolean = false,
        onValueChange: (List<String>) -> Unit = {},
        onResetMixed: (() -> Unit)? = {}
    ) = KozmosMaterialTheme {
        KozmosMultiSelect(
            selectedValues = selected, onValueChange = onValueChange,
            searchValue = "", onSearchValueChange = {},
            options = options, label = "Gates",
            enabled = enabled, readOnly = readOnly, expanded = expanded,
            mixed = mixed, onResetMixed = onResetMixed
        )
    }

    @Test fun aMixedMultiSelectShowsNoChipsAndSaysTheLabelOnce() {
        val tree = paparazzi.readSemantics { MultiSelect(selected = listOf("a1", "b2"), mixed = true) }
        assertTrue("no chip of its own value", !tree.saysAnywhere("Gate A1") && !tree.saysAnywhere("Gate B2"))
        assertEquals("Multiple values", tree.multiSelectField().stateDescription)
        assertEquals("said once, as the field's state", 1, tree.mixedSaid())
        assertTrue("nothing to clear", tree.merged.none { it.description == "Clear selected options" })
        assertNull("no reset while mixed", tree.reset())
    }

    @Test fun aMixedMultiSelectsListChecksNothingAndAChoiceIsThatOptionAlone() {
        val reported = mutableListOf<List<String>>()
        val tree = paparazzi.readSemantics {
            MultiSelect(selected = listOf("a1"), mixed = true, expanded = true, onValueChange = { reported += it })
        }
        val rows = tree.merged.filter { "Gate A1" in it.texts || "Gate B2" in it.texts }
        assertEquals("both options listed", 2, rows.size)
        assertTrue("none checked: ${rows.map { it.selected }}", rows.none { it.selected == true })
        rows.single { "Gate B2" in it.texts }.click!!.invoke()
        assertEquals(listOf(listOf("b2")), reported)
    }

    @Test fun aMultiSelectsResetHandsFocusBackAndIsNeverOfferedLocked() {
        paparazzi.live(content = {
            var edit by remember { mutableStateOf<List<String>?>(listOf("b2")) }
            MultiSelect(
                selected = edit ?: listOf("a1"), mixed = edit == null,
                onValueChange = { edit = it }, onResetMixed = { edit = null }
            )
        }) {
            frames(2)
            assertTrue("the edit's chip shows", read().saysAnywhere("Gate B2"))
            checkNotNull(reset()) { "the reset is offered once edited" }.click!!.invoke()
            frames(3)
            val field = read().multiSelectField()
            assertEquals("Multiple values", field.stateDescription)
            assertEquals("focus is back on the field", true, field.focused)
            assertNull(reset())
        }
        for ((enabled, readOnly) in listOf(false to false, true to true)) {
            val tree = paparazzi.readSemantics {
                MultiSelect(selected = listOf("b2"), mixed = false, enabled = enabled, readOnly = readOnly)
            }
            assertNull("enabled=$enabled readOnly=$readOnly", tree.reset())
        }
    }

    private fun ReadSemantics.pickerField(label: String) = merged.single { it.role == Role.Button && it.description == label }

    @Test fun aMixedDateOrTimePickerShowsAndSaysTheLabelOnce() {
        val date = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosDatePicker(date = LocalDate.of(2026, 5, 25), onDateSelected = {}, label = "Opens", mixed = true, onResetMixed = {})
            }
        }
        val dateField = date.pickerField("Opens")
        assertEquals("Multiple values", dateField.stateDescription)
        assertTrue("no date of its own: ${dateField.texts}", dateField.texts.none { "2026" in it })
        assertEquals(1, date.mixedSaid())
        assertNull(date.reset())

        val time = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosTimePicker(time = LocalTime.of(9, 30), onTimeSelected = {}, label = "Opens at", mixed = true)
            }
        }
        val timeField = time.pickerField("Opens at")
        assertEquals("Multiple values", timeField.stateDescription)
        assertTrue("no time of its own: ${timeField.texts}", timeField.texts.none { "30" in it })
        assertEquals(1, time.mixedSaid())
    }

    @Test fun aPickerFieldsResetHandsFocusBackAndIsNeverOfferedLocked() {
        paparazzi.live(content = {
            var edit by remember { mutableStateOf<LocalDate?>(LocalDate.of(2026, 5, 25)) }
            KozmosMaterialTheme {
                KozmosDatePicker(
                    date = edit, onDateSelected = { edit = it }, label = "Opens",
                    mixed = edit == null, onResetMixed = { edit = null }
                )
            }
        }) {
            frames(2)
            val reset = checkNotNull(reset()) { "the reset is offered once edited" }
            assertEquals(Role.Button, reset.role)
            reset.click!!.invoke()
            frames(3)
            val field = read().pickerField("Opens")
            assertEquals("Multiple values", field.stateDescription)
            assertEquals("focus is back on the field", true, field.focused)
            assertNull(reset())
        }
        for ((enabled, readOnly) in listOf(false to false, true to true)) {
            val tree = paparazzi.readSemantics {
                KozmosMaterialTheme {
                    KozmosTimePicker(
                        time = LocalTime.of(9, 30), onTimeSelected = {}, label = "Opens at",
                        enabled = enabled, readOnly = readOnly, onResetMixed = {}
                    )
                }
            }
            assertNull("enabled=$enabled readOnly=$readOnly", tree.reset())
        }
    }

    @Test fun aMixedDateRangeShowsTheLabelOnBothEndsAndOneReset() {
        val range = KozmosDateRangeValue(LocalDate.of(2026, 5, 21), LocalDate.of(2026, 5, 25))
        val mixed = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosDateRangePicker(value = range, onValueChange = {}, label = "Season", mixed = true, onResetMixed = {})
            }
        }
        for (end in listOf("Start date", "End date")) {
            val field = mixed.pickerField(end)
            assertEquals(end, "Multiple values", field.stateDescription)
            assertTrue("$end shows no date: ${field.texts}", field.texts.none { "26" in it })
        }
        assertEquals("said once on each end", 2, mixed.mixedSaid())
        assertNull(mixed.reset())

        val edited = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosDateRangePicker(value = range, onValueChange = {}, label = "Season", onResetMixed = {})
            }
        }
        assertEquals("one reset for the range", 1, edited.merged.count { "Reset to multiple values" in it.texts })
    }

    // The Material dialog opens on nothing chosen while mixed: what it is
    // given to start from.
    @Test fun aMixedPickersDialogStartsWithNothingChosen() {
        val day = LocalDate.of(2026, 5, 25)
        assertNull(pickerInitialValue(day, mixed = true))
        assertEquals(day, pickerInitialValue(day, mixed = false))
    }
}
