package com.kozmos.components.select

import android.view.KeyEvent
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.semantics.Role
import com.kozmos.components.ReadNode
import com.kozmos.components.live
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * React's SelectTrigger is a Radix trigger: one control, a combobox button
 * that says its choice, or its placeholder until there is one, and opens the
 * list. Compose's closed field is KozmosSelectTrigger: one TalkBack stop, a
 * drop-down list (Role.DropdownList, which TalkBack names in the device's
 * language) with Material's menu-anchor semantics, opened by a tap, by
 * TalkBack's double tap, and by Enter or Space from a keyboard.
 */
@OptIn(ExperimentalMaterial3Api::class)
class KozmosSelectTriggerSemanticsTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    @Composable
    private fun ThemeField(
        choice: String?,
        enabled: Boolean = true,
        expanded: Boolean = false,
        onExpandedChange: (Boolean) -> Unit = {}
    ) = KozmosMaterialTheme {
        KozmosSelect(
            expanded = expanded,
            onExpandedChange = onExpandedChange,
            trigger = { KozmosSelectTrigger(value = choice, placeholder = "Thema", enabled = enabled) }
        ) {
            KozmosSelectItem(value = "hell", label = "Hell", onValueChange = {}, onDismissRequest = {})
        }
    }

    /** The nodes TalkBack would stop on, as it is told about each. */
    private fun stops(nodes: List<ReadNode>) = nodes
        .filter { it.click != null || it.words != null || it.role != null }
        .map { "role=${it.role} texts=${it.texts} click=${it.click != null} enabled=${it.enabled}" }

    @Test fun theTriggerIsOneDropDownListThatSaysItsChoice() {
        val tree = paparazzi.readSemantics { ThemeField(choice = "Hell") }
        assertEquals(listOf("role=DropdownList texts=[Hell] click=true enabled=true"), stops(tree.merged))
        // Material's menu anchor tells TalkBack, in the device's language,
        // that it is a menu and whether it is open.
        val trigger = tree.merged.single { it.role == Role.DropdownList }
        assertTrue("Material's description of the anchor: ${trigger.description}", !trigger.description.isNullOrBlank())
        assertTrue("Material's collapsed state: ${trigger.stateDescription}", !trigger.stateDescription.isNullOrBlank())
    }

    @Test fun withNoChoiceItSaysItsPlaceholder() {
        val tree = paparazzi.readSemantics { ThemeField(choice = null) }
        assertEquals(listOf("role=DropdownList texts=[Thema] click=true enabled=true"), stops(tree.merged))
    }

    @Test fun disabledItIsReadAsDisabledAndOpensNothing() {
        val tree = paparazzi.readSemantics { ThemeField(choice = "Hell", enabled = false) }
        assertEquals(listOf("role=DropdownList texts=[Hell] click=false enabled=false"), stops(tree.merged))
    }

    @Test fun aDoubleTapOpensTheMenu() {
        val asked = mutableListOf<Boolean>()
        paparazzi.live(content = {
            var expanded by remember { mutableStateOf(false) }
            ThemeField(choice = "Hell", expanded = expanded, onExpandedChange = { asked += it; expanded = it })
        }) {
            frames(2)
            read().merged.single { it.role == Role.DropdownList }.click!!.invoke()
            frames(3)
            assertEquals("what the trigger asked for", listOf(true), asked)
        }
    }

    @Test fun enterOrSpaceOnTheFocusedTriggerOpensTheMenu() {
        for (key in listOf(KeyEvent.KEYCODE_ENTER, KeyEvent.KEYCODE_SPACE)) {
            val asked = mutableListOf<Boolean>()
            paparazzi.live(content = {
                ThemeField(choice = "Hell", onExpandedChange = { asked += it })
            }) {
                frames(2)
                val trigger = read().merged.single { it.role == Role.DropdownList }
                val focus = checkNotNull(trigger.requestFocus) { "the trigger cannot take focus" }
                focus()
                frames(2)
                assertEquals("focused", true, read().merged.single { it.role == Role.DropdownList }.focused)
                view.dispatchKeyEvent(KeyEvent(KeyEvent.ACTION_DOWN, key))
                view.dispatchKeyEvent(KeyEvent(KeyEvent.ACTION_UP, key))
                frames(2)
                assertEquals("what ${KeyEvent.keyCodeToString(key)} asked for", listOf(true), asked)
            }
        }
    }
}
