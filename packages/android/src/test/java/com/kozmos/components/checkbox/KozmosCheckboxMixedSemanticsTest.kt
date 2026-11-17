package com.kozmos.components.checkbox

import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.state.ToggleableState
import com.kozmos.components.live
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.providers.KozmosAnalyticsEvent
import com.kozmos.providers.LocalKozmosAnalytics
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * Decision 188 (17 Nov 2026): Checkbox's mixed state, React's
 * `checked="indeterminate"`, on Compose. A mixed checkbox is a checkbox
 * whose toggle state is Indeterminate, which TalkBack says as partly
 * checked; it stays mixed when disabled and in error; and a click checks it,
 * reported as checked, as Radix reports a mixed box a click checks.
 */
class KozmosCheckboxMixedSemanticsTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    @Test
    fun aMixedCheckboxIsIndeterminateToTalkBackWhenDisabledAndInErrorToo() {
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme {
                Column {
                    KozmosCheckbox(state = ToggleableState.Indeterminate, onCheckedChange = {}, label = "All floors")
                    KozmosCheckbox(state = ToggleableState.Indeterminate, onCheckedChange = {}, label = "All gates", enabled = false)
                    KozmosCheckbox(state = ToggleableState.Indeterminate, onCheckedChange = {}, label = "All desks", error = true)
                }
            }
        }
        for (label in listOf("All floors", "All gates", "All desks")) {
            val box = tree.merged.single { label in it.texts }
            assertEquals("$label's role", Role.Checkbox, box.role)
            assertEquals("$label's state", ToggleableState.Indeterminate, box.toggleState)
        }
    }

    @Test
    fun aClickOnAMixedCheckboxChecksItAndReportsItChecked() {
        var state by mutableStateOf(ToggleableState.Indeterminate)
        val events = mutableListOf<KozmosAnalyticsEvent>()
        paparazzi.live(content = {
            CompositionLocalProvider(LocalKozmosAnalytics provides { events += it }) {
                KozmosMaterialTheme {
                    KozmosCheckbox(state = state, onCheckedChange = { state = ToggleableState(it) }, label = "All floors")
                }
            }
        }) {
            val before = read().merged.single { "All floors" in it.texts }
            assertEquals(ToggleableState.Indeterminate, before.toggleState)
            assertTrue(checkNotNull(before.click)())
            frames(3)
            assertEquals(ToggleableState.On, read().merged.single { "All floors" in it.texts }.toggleState)
            assertEquals(listOf("checkbox_toggled"), events.map { it.eventName })
            assertEquals(mapOf("checked" to "true"), events.single().properties)
            // And checked, a click unchecks it, as before.
            assertTrue(checkNotNull(read().merged.single { "All floors" in it.texts }.click)())
            frames(3)
            assertEquals(ToggleableState.Off, read().merged.single { "All floors" in it.texts }.toggleState)
            assertEquals(mapOf("checked" to "false"), events.last().properties)
        }
    }
}
