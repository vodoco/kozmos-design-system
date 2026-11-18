package com.kozmos.components.fieldwrapper

import androidx.compose.foundation.layout.Box
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.platform.ViewRootForTest
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import com.kozmos.components.combobox.KozmosCombobox
import com.kozmos.components.input.KozmosInput
import com.kozmos.components.multiselect.KozmosMultiSelect
import com.kozmos.components.numberinput.KozmosNumberInput
import com.kozmos.components.otpinput.KozmosOTPInput
import com.kozmos.components.passwordinput.KozmosPasswordInput
import com.kozmos.components.listbox.KozmosListboxOption
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * GAP-235: Compose 1.6 has no read-only semantics, so a read-only field was
 * said as an editable one; each field now says "Read only" in its state
 * description. GAP-236: a field's error was a text of its own after the
 * field; each field now carries `error(message)` while in error. Read from
 * the text field's own merged node, the one TalkBack focuses.
 */
class KozmosFieldStateSemanticsTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    private data class FieldRead(val state: String?, val error: String?)

    /** The editable text field's state description and error. */
    private fun field(content: @Composable () -> Unit): FieldRead {
        var read: FieldRead? = null
        paparazzi.snapshot {
            val view = LocalView.current
            Box(Modifier.onGloballyPositioned {
                val owner = (view as ViewRootForTest).semanticsOwner
                val nodes = mutableListOf<SemanticsNode>()
                fun walk(node: SemanticsNode) { nodes += node; node.children.forEach(::walk) }
                walk(owner.rootSemanticsNode)
                val text = nodes.first { it.config.getOrNull(SemanticsActions.SetText) != null || it.config.getOrNull(SemanticsProperties.EditableText) != null }
                read = FieldRead(
                    text.config.getOrNull(SemanticsProperties.StateDescription),
                    text.config.getOrNull(SemanticsProperties.Error)
                )
            }) { KozmosMaterialTheme { content() } }
        }
        return checkNotNull(read)
    }

    private val options = listOf(KozmosListboxOption("a", "Alpha"))

    private fun every(readOnly: Boolean, error: String?): Map<String, FieldRead> = mapOf(
        "Input" to field { KozmosInput(value = "x", onValueChange = {}, readOnly = readOnly, error = error != null, errorMessage = error) },
        "NumberInput" to field { KozmosNumberInput(value = 1.0, onValueChange = {}, readOnly = readOnly, error = error != null, errorMessage = error) },
        "PasswordInput" to field { KozmosPasswordInput(value = "x", onValueChange = {}, readOnly = readOnly, error = error != null, errorMessage = error) },
        "Combobox" to field { KozmosCombobox("", { _, _ -> }, "", {}, options, readOnly = readOnly, error = error != null, errorMessage = error) },
        "MultiSelect" to field { KozmosMultiSelect(emptyList(), {}, "", {}, options, readOnly = readOnly, error = error != null, errorMessage = error) },
        "OTPInput" to field { KozmosOTPInput(value = "12", onValueChange = {}, readOnly = readOnly, error = error != null, errorMessage = error) }
    )

    @Test fun eachReadOnlyFieldSaysSo() {
        every(readOnly = true, error = null).forEach { (name, read) ->
            assertTrue("$name said ${read.state}", read.state?.endsWith("Read only") == true)
        }
        assertEquals("6 digits, Read only", every(readOnly = true, error = null).getValue("OTPInput").state)
    }

    @Test fun anEditableFieldSaysNoReadOnly() {
        every(readOnly = false, error = null).forEach { (name, read) ->
            assertTrue("$name said ${read.state}", read.state?.contains("Read only") != true)
            assertNull("$name carried an error", read.error)
        }
    }

    @Test fun eachFieldInErrorCarriesItsMessage() {
        every(readOnly = false, error = "Enter a value.").forEach { (name, read) ->
            assertEquals(name, "Enter a value.", read.error)
        }
    }

    @Test fun aProductsOwnReadOnlyWords() {
        val read = field { KozmosInput(value = "x", onValueChange = {}, readOnly = true, readOnlyLabel = "Schreibgeschützt") }
        assertEquals("Schreibgeschützt", read.state)
    }
}
