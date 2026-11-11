package com.kozmos.components.fieldwrapper

import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import com.kozmos.components.LiveSemantics
import com.kozmos.components.ReadSemantics
import com.kozmos.components.combobox.KozmosCombobox
import com.kozmos.components.input.KozmosInput
import com.kozmos.components.listbox.KozmosListboxOption
import com.kozmos.components.live
import com.kozmos.components.numberinput.KozmosNumberInput
import com.kozmos.components.readSemantics
import com.kozmos.components.select.KozmosSelect
import com.kozmos.components.select.KozmosSelectItem
import com.kozmos.components.select.KozmosSelectTrigger
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * GAP-153: a field of a multi-selection whose values differ shows "Multiple
 * values", is said with it once, keeps it until edited, and offers "Reset to
 * multiple values" once edited, which takes it back and hands focus to the
 * field. As React's fields do.
 */
@OptIn(ExperimentalMaterial3Api::class)
class KozmosMixedValueTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    private val options = listOf(KozmosListboxOption("a1", "Gate A1"), KozmosListboxOption("b2", "Gate B2"))

    private fun LiveSemantics.reset() = read().merged.singleOrNull { "Reset to multiple values" in it.texts }

    /** The text field: the node TalkBack edits. */
    private fun LiveSemantics.field() = read().merged.single { it.setText != null }

    /** How many times TalkBack is given the mixed label, across the merged tree. */
    private fun ReadSemantics.mixedSaid() = merged.sumOf { node ->
        (node.texts + listOfNotNull(node.stateDescription, node.description)).count { it == "Multiple values" }
    }

    @Test fun anInputIsMixedUntilEditedAndResetsToIt() {
        paparazzi.live(content = {
            var edit by remember { mutableStateOf<String?>(null) }
            KozmosMaterialTheme {
                KozmosInput(
                    value = edit ?: "",
                    onValueChange = { edit = it },
                    label = "Name",
                    placeholder = "Name",
                    mixed = edit == null,
                    onResetMixed = { edit = null }
                )
            }
        }) {
            frames(2)
            assertEquals("Multiple values", field().stateDescription)
            assertEquals("said once, as the field's state", 1, read().mixedSaid())
            assertNull("no reset while mixed", reset())

            field().setText!!.invoke("B2")
            frames(3)
            assertEquals("B2", field().editableText)
            assertNull(field().stateDescription)
            val reset = checkNotNull(reset()) { "the reset is offered once edited" }
            assertEquals(Role.Button, reset.role)

            reset.click!!.invoke()
            frames(3)
            assertEquals("", field().editableText)
            assertEquals("Multiple values", field().stateDescription)
            assertEquals("focus is back on the field", true, field().focused)
            assertNull(reset())
        }
    }

    @Test fun aMixedInputShowsNoneOfItsValueAndSaysTheLabelOnce() {
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosInput(value = "Gate A1", onValueChange = {}, label = "Name", mixed = true, mixedLabel = "Multiple values")
            }
        }
        val field = tree.merged.single { it.setText != null }
        assertEquals("", field.editableText)
        assertEquals("Multiple values", field.stateDescription)
        assertEquals("said once, as the field's state", 1, tree.mixedSaid())
    }

    @Test fun noResetWhileDisabledOrReadOnly() {
        for ((enabled, readOnly) in listOf(true to false, false to false, true to true)) {
            val tree = paparazzi.readSemantics {
                KozmosMaterialTheme {
                    KozmosInput(
                        value = "B2", onValueChange = {}, label = "Name",
                        enabled = enabled, readOnly = readOnly, onResetMixed = {}
                    )
                }
            }
            val offered = tree.merged.any { "Reset to multiple values" in it.texts }
            assertEquals("enabled=$enabled readOnly=$readOnly", enabled && !readOnly, offered)
        }
    }

    // Decision of 11 Nov: a step from a mixed field would start from nothing
    // and write that number over every selected feature's own.
    @Test fun aNumberInputsSteppersWaitForATypedEdit() {
        paparazzi.live(content = {
            var edit by remember { mutableStateOf<Double?>(null) }
            var edited by remember { mutableStateOf(false) }
            KozmosMaterialTheme {
                KozmosNumberInput(
                    value = edit ?: 7.0,
                    onValueChange = { edit = it; edited = true },
                    label = "Height",
                    mixed = !edited,
                    onResetMixed = { edit = null; edited = false }
                )
            }
        }) {
            frames(2)
            assertEquals("", field().editableText)
            assertEquals("Multiple values", field().stateDescription)
            assertEquals(1, read().mixedSaid())
            assertNull(reset())
            val steppers = read().merged.filter { it.description == "Increase value" || it.description == "Decrease value" }
            assertEquals(2, steppers.size)
            assertTrue("steppers are disabled while mixed", steppers.none { it.enabled })

            field().setText!!.invoke("4")
            frames(3)
            assertEquals("4", field().editableText)
            assertTrue(read().merged.filter { it.description == "Increase value" }.all { it.enabled })
            checkNotNull(reset()).click!!.invoke()
            frames(3)
            assertEquals("", field().editableText)
            assertEquals("Multiple values", field().stateDescription)
            assertEquals(true, field().focused)
        }
    }

    @Test fun aComboboxIsMixedUntilAChoice() {
        paparazzi.live(content = {
            var edit by remember { mutableStateOf<String?>(null) }
            var text by remember { mutableStateOf("") }
            KozmosMaterialTheme {
                KozmosCombobox(
                    value = edit ?: "a1",
                    onValueChange = { value, _ -> edit = value },
                    inputValue = text,
                    onInputValueChange = { text = it },
                    options = options,
                    label = "Gate",
                    defaultExpanded = true,
                    mixed = edit == null,
                    onResetMixed = { edit = null }
                )
            }
        }) {
            frames(2)
            assertEquals("Multiple values", field().stateDescription)
            assertEquals(1, read().mixedSaid())
            assertTrue("no option is checked", read().merged.none { it.selected == true })
            assertNull(reset())

            read().merged.single { "Gate B2" in it.texts && it.click != null }.click!!.invoke()
            frames(3)
            assertEquals("Gate B2", field().editableText)
            assertNull(field().stateDescription)

            checkNotNull(reset()).click!!.invoke()
            frames(3)
            assertEquals("", field().editableText)
            assertEquals("Multiple values", field().stateDescription)
            assertEquals(true, field().focused)
        }
    }

    @Test fun aMixedComboboxsClearEmptiesOnlyTheQuery() {
        val chosen = mutableListOf<String>()
        paparazzi.live(content = {
            var text by remember { mutableStateOf("") }
            KozmosMaterialTheme {
                KozmosCombobox(
                    value = "",
                    onValueChange = { value, _ -> chosen += value },
                    inputValue = text,
                    onInputValueChange = { text = it },
                    options = options,
                    label = "Gate",
                    mixed = true,
                    onResetMixed = {}
                )
            }
        }) {
            frames(2)
            field().setText!!.invoke("B")
            frames(3)
            assertEquals("B", field().editableText)
            read().merged.single { it.description == "Clear selection" }.click!!.invoke()
            frames(3)
            assertEquals("", field().editableText)
            assertEquals("no empty choice is reported while mixed", emptyList<String>(), chosen)
        }
    }

    @Test fun aComboboxEmptiesItsTextOnlyAsItTurnsMixed() {
        var mixed by mutableStateOf(false)
        var text by mutableStateOf("Gate B2")
        paparazzi.live(content = {
            KozmosMaterialTheme {
                KozmosCombobox(
                    value = "b2", onValueChange = { _, _ -> },
                    inputValue = text, onInputValueChange = { text = it },
                    options = options, label = "Gate", mixed = mixed
                )
            }
        }) {
            frames(2)
            assertEquals("Gate B2", field().editableText)
            mixed = true
            frames(3)
            assertEquals("the choice's label goes as it turns mixed", "", text)
        }
    }

    @Test fun aQueryTypedWhileMixedSurvivesTheFieldComingBack() {
        var shown by mutableStateOf(true)
        var text by mutableStateOf("")
        paparazzi.live(content = {
            KozmosMaterialTheme {
                if (shown) KozmosCombobox(
                    value = "", onValueChange = { _, _ -> },
                    inputValue = text, onInputValueChange = { text = it },
                    options = options, label = "Gate", mixed = true
                )
            }
        }) {
            frames(2)
            field().setText!!.invoke("B")
            frames(3)
            // Scrolled away and back, or a tab left and returned to.
            shown = false
            frames(2)
            shown = true
            frames(3)
            assertEquals("B", text)
            assertEquals("B", field().editableText)
        }
    }

    @Test fun aSelectTriggerSaysTheMixedLabelOnceAndOffersTheReset() {
        fun tree(mixed: Boolean, enabled: Boolean = true) = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosSelect(expanded = false, onExpandedChange = {}, trigger = {
                    KozmosSelectTrigger(
                        value = "POI", placeholder = "Type", enabled = enabled,
                        mixed = mixed, onResetMixed = {}
                    )
                }) {
                    KozmosSelectItem(value = "poi", label = "POI", onValueChange = {}, onDismissRequest = {})
                }
            }
        }
        val mixed = tree(mixed = true)
        val trigger = mixed.merged.single { it.role == Role.DropdownList }
        assertEquals(listOf("Multiple values"), trigger.texts)
        assertEquals(1, mixed.mixedSaid())
        assertTrue(mixed.merged.none { "Reset to multiple values" in it.texts })

        val edited = tree(mixed = false)
        assertEquals(listOf("POI"), edited.merged.single { it.role == Role.DropdownList }.texts)
        assertEquals(Role.Button, edited.merged.single { "Reset to multiple values" in it.texts }.role)

        assertTrue(tree(mixed = false, enabled = false).merged.none { "Reset to multiple values" in it.texts })
    }

    // The caller's modifier is the field's, as before the reset was added:
    // its description and tag land on the one TalkBack stop.
    @Test fun aSelectTriggersModifierIsTheFields() {
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosSelect(expanded = false, onExpandedChange = {}, trigger = {
                    KozmosSelectTrigger(
                        value = "POI", placeholder = "Type",
                        modifier = Modifier.testTag("type-field").semantics { contentDescription = "Type" },
                        onResetMixed = {}
                    )
                }) {
                    KozmosSelectItem(value = "poi", label = "POI", onValueChange = {}, onDismissRequest = {})
                }
            }
        }
        val stops = tree.merged.filter { it.role == Role.DropdownList }
        assertEquals("one stop for the field", 1, stops.size)
        assertEquals("type-field", stops[0].tag)
        assertTrue("its description: ${stops[0].description}", stops[0].description?.contains("Type") == true)
        assertTrue("the reset is a stop of its own", tree.merged.any { "Reset to multiple values" in it.texts && it.tag == null })
    }

    @Test fun aSelectTriggersResetHandsFocusBack() {
        paparazzi.live(content = {
            var mixed by remember { mutableStateOf(false) }
            KozmosMaterialTheme {
                KozmosSelect(expanded = false, onExpandedChange = {}, trigger = {
                    KozmosSelectTrigger(
                        value = "POI", placeholder = "Type",
                        mixed = mixed, onResetMixed = { mixed = true }
                    )
                }) {
                    KozmosSelectItem(value = "poi", label = "POI", onValueChange = {}, onDismissRequest = {})
                }
            }
        }) {
            frames(2)
            checkNotNull(reset()).click!!.invoke()
            frames(3)
            val trigger = read().merged.single { it.role == Role.DropdownList }
            assertEquals(listOf("Multiple values"), trigger.texts)
            assertEquals(true, trigger.focused)
        }
    }

    @Test fun theResetIsOfferedOnlyWhenGivenAndNotMixed() {
        assertTrue(KozmosMixedValue.showsReset(mixed = false, onReset = {}, enabled = true))
        assertTrue(!KozmosMixedValue.showsReset(mixed = true, onReset = {}, enabled = true))
        assertTrue(!KozmosMixedValue.showsReset(mixed = false, onReset = null, enabled = true))
        assertTrue(!KozmosMixedValue.showsReset(mixed = false, onReset = {}, enabled = true, readOnly = true))
    }
}
