package com.kozmos.components.chipinput

import android.os.SystemClock
import android.view.KeyEvent
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import com.kozmos.components.LiveSemantics
import com.kozmos.components.live
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.providers.KozmosAnalyticsEvent
import com.kozmos.providers.LocalKozmosAnalytics
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * React's `entry_added` and `entry_removed` on Compose (GAP-234's
 * follow-up): one `entry_added` per entry an edit adds, with its `value`,
 * for a comma, a pasted list or Enter, never for an entry already in the
 * field; one `entry_removed` per entry removed, by Backspace in the empty
 * field or by a chip's remove; nothing while the field is read-only or
 * disabled (typed and by a chip's remove: a Backspace the locked field
 * refuses falls to the text field, which layoutlib's key map cannot run).
 *
 * Live scripts alone, with no semantics read after them in a test of their
 * own (#568), and no picture: the rule discards every frame. Every test ends
 * with an event the field sends, so each fails against a field that sends
 * none, the one that expects silence among them.
 */
class KozmosChipInputAnalyticsTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    private val events = mutableListOf<KozmosAnalyticsEvent>()
    private var values by mutableStateOf(listOf<String>())
    private var enabled by mutableStateOf(true)
    private var readOnly by mutableStateOf(false)

    private fun added(value: String) =
        KozmosAnalyticsEvent(component = "ChipInput", eventName = "entry_added", properties = mapOf("value" to value))

    private fun removed(value: String) =
        KozmosAnalyticsEvent(component = "ChipInput", eventName = "entry_removed", properties = mapOf("value" to value))

    private fun chipInput(start: List<String>, script: suspend LiveSemantics.() -> Unit) {
        values = start
        paparazzi.live(durationMillis = 8000, content = {
            KozmosMaterialTheme {
                CompositionLocalProvider(LocalKozmosAnalytics provides { events += it }) {
                    KozmosChipInput(
                        values = values,
                        onValuesChange = { values = it },
                        label = "Keywords",
                        enabled = enabled,
                        readOnly = readOnly,
                        removeLabel = { "Remove $it" }
                    )
                }
            }
        }, script = script)
    }

    private fun LiveSemantics.field() = read().merged.single { it.setText != null }

    /** Puts [text] in the field, as typing or a paste over its whole text does. */
    private suspend fun LiveSemantics.enter(text: String) {
        field().setText!!.invoke(text)
        frames(3)
    }

    private suspend fun LiveSemantics.key(code: Int) {
        val now = SystemClock.uptimeMillis()
        view.dispatchKeyEvent(KeyEvent(now, now, KeyEvent.ACTION_DOWN, code, 0, 0))
        view.dispatchKeyEvent(KeyEvent(now, now, KeyEvent.ACTION_UP, code, 0, 0))
        frames(3)
    }

    private suspend fun LiveSemantics.focus() {
        field().requestFocus!!.invoke()
        frames(2)
    }

    @Test fun eachEntryACommaAPasteOrEnterAddsSendsEntryAddedAndADuplicateNone() {
        chipInput(listOf("coffee")) {
            frames(2)
            focus()
            // A pasted list: tea and water are added, coffee is already there.
            enter("tea, coffee,water\njuice")
            assertEquals(listOf("coffee", "tea", "water"), values)
            assertEquals(listOf(added("tea"), added("water")), events)
            // Enter on the duplicate left typed adds nothing and sends nothing.
            assertEquals("coffee", field().editableText)
            key(KeyEvent.KEYCODE_ENTER)
            assertEquals("a duplicate was reported", listOf(added("tea"), added("water")), events)
            // A comma typed after one entry.
            enter("juice,")
            // Enter adds what is typed.
            enter(" milk ")
            key(KeyEvent.KEYCODE_ENTER)
            assertEquals(listOf("coffee", "tea", "water", "juice", "milk"), values)
            assertEquals(listOf(added("tea"), added("water"), added("juice"), added("milk")), events)
        }
    }

    @Test fun backspaceInTheEmptyFieldAndAChipsRemoveSendEntryRemoved() {
        chipInput(listOf("coffee", "tea", "water")) {
            frames(2)
            focus()
            key(KeyEvent.KEYCODE_DEL)
            assertEquals(listOf("coffee", "tea"), values)
            assertTrue("coffee's remove did not press", read().named("Remove coffee").click!!.invoke())
            frames(3)
            assertEquals(listOf("tea"), values)
            assertEquals(listOf(removed("water"), removed("coffee")), events)
        }
    }

    @Test fun aReadOnlyOrDisabledFieldSendsNothing() {
        chipInput(listOf("coffee", "tea")) {
            frames(2)
            focus()
            for (lock in listOf("readOnly", "disabled")) {
                if (lock == "readOnly") readOnly = true else enabled = false
                frames(3)
                // No Backspace here: refused by the locked field, the key
                // falls to the text field's own handling, which layoutlib's
                // key map cannot run. removeLast's guard is remove's.
                read().merged.singleOrNull { it.setText != null }?.setText?.invoke("water,")
                frames(3)
                read().merged.firstOrNull { it.description == "Remove coffee" }?.click?.invoke()
                frames(3)
                assertEquals("$lock changed the entries", listOf("coffee", "tea"), values)
                assertEquals("$lock sent events", emptyList<KozmosAnalyticsEvent>(), events)
                readOnly = false
                enabled = true
                frames(3)
            }
            // Unlocked again, a chip's remove removes and reports.
            assertTrue(read().named("Remove tea").click!!.invoke())
            frames(3)
            assertEquals(listOf("coffee"), values)
            assertEquals(listOf(removed("tea")), events)
        }
    }
}
