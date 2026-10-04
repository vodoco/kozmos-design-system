package com.kozmos.components.combobox

import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import com.kozmos.components.listbox.KozmosPickerAction
import com.kozmos.components.live
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/** Where focus goes when a picker closes, and what TalkBack hears of the field's caption. */
class KozmosComboboxFocusTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    @Composable private fun Picker(onMap: () -> Unit) {
        var query by remember { mutableStateOf("Lobby") }
        KozmosCombobox("", { _, _ -> }, query, { query = it }, emptyList(), KozmosComboboxLabels(), true,
            listOf(KozmosPickerAction("map", "Map", onAction = onMap)), label = "From")
    }

    @Test fun commandFromAPickerOpenedByTheChevronFocusesNoField() {
        var maps = 0
        paparazzi.live(content = { MaterialTheme { Picker { maps++ } } }) {
            assertEquals(false, read().named("From").focused)
            read().named("Open options").click!!.invoke(); frames(3)
            read().merged.single { "Map" in it.texts && it.click != null }.click!!.invoke(); frames(3)
            assertEquals(1, maps)
            assertFalse(read().merged.any { "Map" in it.texts })
            // A focused field raises the keyboard over the map the host shows next.
            assertEquals(emptyList<String?>(), read().unmerged.filter { it.focused == true }.map { it.description ?: it.texts.toString() })
        }
    }

    @Test fun commandHandsFocusBackToAFieldTheVisitorWasTypingIn() {
        var maps = 0
        paparazzi.live(content = { MaterialTheme { Picker { maps++ } } }) {
            assertTrue(read().named("From").requestFocus!!.invoke()); frames(2)
            assertTrue(read().named("From").setText!!.invoke("Lobbyx")); frames(3)
            assertEquals(true, read().named("From").focused)
            // Moved to the command, as a keyboard or switch user does, then chosen.
            val command = read().merged.single { "Map" in it.texts && it.click != null }
            assertTrue(command.requestFocus!!.invoke()); frames(2)
            assertEquals(false, read().named("From").focused)
            read().merged.single { "Map" in it.texts && it.click != null }.click!!.invoke(); frames(3)
            assertEquals(1, maps)
            assertEquals(true, read().named("From").focused)
        }
    }

    @Test fun theCaptionIsTheFieldsNameAndIsNotHeardBeforeIt() {
        val tree = paparazzi.readSemantics { MaterialTheme {
            KozmosCombobox("", { _, _ -> }, "Lobby", {}, emptyList(), label = "From")
        } }
        assertNotNull("the field is named From", tree.named("From").setText)
        // TalkBack said "From", then "From, edit box".
        assertEquals(emptyList<String>(), tree.unmerged.filter { "From" in it.texts }.map { it.texts.joinToString() })
    }
}
