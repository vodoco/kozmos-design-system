package com.kozmos.components.fieldwrapper

import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.semantics.Role
import com.kozmos.components.LiveSemantics
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
 * values", is said with it, keeps it until edited, and offers "Reset to
 * multiple values" once edited, which takes it back. As React's fields do.
 */
@OptIn(ExperimentalMaterial3Api::class)
class KozmosMixedValueTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    private fun LiveSemantics.reset() = read().merged.singleOrNull { "Reset to multiple values" in it.texts }

    /** The text field: the node TalkBack edits. */
    private fun LiveSemantics.field() = read().merged.single { it.setText != null }

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
            assertTrue("the field shows the mixed label", read().unmerged.any { "Multiple values" in it.texts })
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
            assertNull(reset())
        }
    }

    @Test fun aMixedInputShowsNoneOfItsValue() {
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosInput(value = "Gate A1", onValueChange = {}, label = "Name", mixed = true, mixedLabel = "Mehrere Werte")
            }
        }
        val field = tree.merged.single { it.setText != null }
        assertEquals("", field.editableText)
        assertEquals("Mehrere Werte", field.stateDescription)
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

    @Test fun aNumberInputIsMixedUntilStepped() {
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
            assertNull(reset())

            // A step starts from nothing, not from the value it hides.
            read().merged.single { it.description == "Increase value" }.click!!.invoke()
            frames(3)
            assertEquals("1", field().editableText)
            checkNotNull(reset()).click!!.invoke()
            frames(3)
            assertEquals("", field().editableText)
            assertEquals("Multiple values", field().stateDescription)
        }
    }

    @Test fun aComboboxIsMixedUntilAChoice() {
        val options = listOf(KozmosListboxOption("a1", "Gate A1"), KozmosListboxOption("b2", "Gate B2"))
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
        }
    }

    @Test fun aSelectTriggerSaysTheMixedLabelAndOffersTheReset() {
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
        assertTrue(mixed.merged.none { "Reset to multiple values" in it.texts })

        val edited = tree(mixed = false)
        assertEquals(listOf("POI"), edited.merged.single { it.role == Role.DropdownList }.texts)
        assertEquals(Role.Button, edited.merged.single { "Reset to multiple values" in it.texts }.role)

        assertTrue(tree(mixed = false, enabled = false).merged.none { "Reset to multiple values" in it.texts })
    }

    @Test fun theResetIsOfferedOnlyWhenGivenAndNotMixed() {
        assertTrue(KozmosMixedValue.showsReset(mixed = false, onReset = {}, enabled = true))
        assertTrue(!KozmosMixedValue.showsReset(mixed = true, onReset = {}, enabled = true))
        assertTrue(!KozmosMixedValue.showsReset(mixed = false, onReset = null, enabled = true))
        assertTrue(!KozmosMixedValue.showsReset(mixed = false, onReset = {}, enabled = true, readOnly = true))
    }
}
