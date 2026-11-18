package com.kozmos.components.chipinput

import android.os.SystemClock
import android.view.KeyEvent
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import com.kozmos.components.LiveSemantics
import com.kozmos.components.live
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * GAP-222, decision 216: typing into a ChipInput. A comma adds the text as
 * a chip and says so; Backspace in the empty field removes the last chip and
 * says so. Each test is
 * a live script alone, with no semantics read after it in the same test
 * (#568).
 */
class KozmosChipInputLiveTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    private var seen: List<String> = emptyList()

    private val content: @androidx.compose.runtime.Composable () -> Unit = {
        var values by remember { mutableStateOf(listOf("coffee")) }
        seen = values
        KozmosMaterialTheme {
            KozmosChipInput(
                values = values,
                onValuesChange = { values = it },
                label = "Keywords",
                addedLabel = { "Added $it" },
                removedLabel = { "Removed $it" }
            )
        }
    }

    private fun LiveSemantics.field() = read().merged.single { it.setText != null }
    private fun LiveSemantics.said() = read().merged.single { it.liveRegion != null }.description?.trim()

    private suspend fun LiveSemantics.key(code: Int) {
        val now = SystemClock.uptimeMillis()
        view.dispatchKeyEvent(KeyEvent(now, now, KeyEvent.ACTION_DOWN, code, 0, 0))
        view.dispatchKeyEvent(KeyEvent(now, now, KeyEvent.ACTION_UP, code, 0, 0))
        frames(3)
    }

    @Test fun aCommaAddsTheTextAsAChipAndSaysSo() {
        paparazzi.live(content = content) {
            frames(2)
            field().setText!!.invoke("tea,")
            frames(3)
            assertEquals(listOf("coffee", "tea"), seen)
            assertEquals("", field().editableText)
            assertEquals("Added tea", said())
        }
    }

    @Test fun backspaceInTheEmptyFieldRemovesTheLastChipAndSaysSo() {
        paparazzi.live(content = content) {
            frames(2)
            field().requestFocus!!.invoke()
            frames(2)
            // Only in the empty field: with text typed the key is the text
            // field's own, which layoutlib's key map cannot type.
            key(KeyEvent.KEYCODE_DEL)
            assertEquals(emptyList<String>(), seen)
            assertEquals("Removed coffee", said())
            assertTrue(field().focused == true)
        }
    }
}
