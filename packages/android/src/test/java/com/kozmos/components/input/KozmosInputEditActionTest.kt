package com.kozmos.components.input

import com.kozmos.components.readSettledSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import androidx.compose.ui.semantics.Role
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * GAP-212, decision 224: Input's edit action, a pencil at the field's end
 * that calls `onEdit`, as React's `{ kind: "edit" }`. Map Personas shows a
 * persona's ID and Map Style read-only, each with a pencil; what editing
 * means is the product's. Read only does not disable it.
 */
class KozmosInputEditActionTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    @Test fun editOnAReadOnlyFieldIsAnEnabledButtonThatCallsOnEdit() {
        var edits = 0
        val tree = paparazzi.readSettledSemantics {
            KozmosMaterialTheme {
                KozmosInput(value = "staff.json", onValueChange = {}, label = "Map Style", readOnly = true,
                    action = KozmosInputAction.Edit(onEdit = { edits += 1 }))
            }
        }
        val edit = tree.named("Edit")
        assertTrue("a read-only field's edit is disabled", edit.enabled)
        assertEquals(Role.Button, edit.role)
        assertNull("the edit reads as a toggle", edit.toggleableState)
        assertTrue(edit.click!!.invoke())
        assertEquals(1, edits)
    }

    @Test fun editTakesItsName() {
        val named = paparazzi.readSettledSemantics {
            KozmosMaterialTheme {
                KozmosInput(value = "x", onValueChange = {}, readOnly = true,
                    action = KozmosInputAction.Edit(label = "Edit Map Style", onEdit = {}))
            }
        }
        assertTrue(named.names().contains("Edit Map Style"))
    }

    @Test fun aDisabledFieldsEditIsDisabled() {
        val disabled = paparazzi.readSettledSemantics {
            KozmosMaterialTheme {
                KozmosInput(value = "x", onValueChange = {}, enabled = false, action = KozmosInputAction.Edit(onEdit = {}))
            }
        }
        assertFalse(disabled.named("Edit").enabled)
    }
}
