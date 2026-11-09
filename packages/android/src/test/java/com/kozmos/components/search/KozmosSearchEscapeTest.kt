package com.kozmos.components.search

import android.view.KeyEvent
import android.view.View
import androidx.compose.foundation.layout.Box
import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.platform.LocalView
import com.kozmos.components.LiveSemantics
import com.kozmos.components.bottomsheet.KozmosBottomSheet
import com.kozmos.components.dialog.KozmosDialog
import com.kozmos.components.live
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

/**
 * Escape in a clearable Search: with text, the field's, down and up, so a
 * Dialog or sheet around it stays; empty, passed on, so the screen hears it
 * and a Dialog closes as it did.
 */
class KozmosSearchEscapeTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    private fun LiveSemantics.focusField() {
        assertEquals(true, read().merged.single { it.setText != null }.requestFocus!!.invoke())
    }

    @Test fun escapeInAnEmptyFieldReachesTheScreen() {
        val query = mutableStateOf("")
        var heard = 0
        var clears = 0
        paparazzi.live(content = {
            KozmosMaterialTheme {
                Box(Modifier.onKeyEvent { event ->
                    if (event.key == Key.Escape && event.type == KeyEventType.KeyDown) heard++
                    false
                }) {
                    KozmosSearch(value = query.value, onValueChange = { query.value = it }, clearable = true, onClear = { clears++ })
                }
            }
        }) {
            focusField(); frames(2)
            view.dispatchKeyEvent(escapeKey(KeyEvent.ACTION_DOWN))
            view.dispatchKeyEvent(escapeKey(KeyEvent.ACTION_UP))
            frames(2)
            assertEquals("Escape in an empty field never reached the screen", 1, heard)
            assertEquals(0, clears)
        }
    }

    /**
     * [surface] wraps a clearable Search; the press goes to the window the
     * Search is in, through the window's own dispatch, as a keyboard's does.
     */
    private fun escapeIn(
        query: MutableState<String>,
        surface: @Composable (onDismiss: () -> Unit, content: @Composable () -> Unit) -> Unit,
        key: Int = KeyEvent.KEYCODE_ESCAPE,
        check: (dismissals: Int) -> Unit
    ) {
        var dismissals = 0
        var window: View? = null
        // The surface is a window of its own, with its own semantics: focus is asked for here.
        val focus = FocusRequester()
        paparazzi.live(content = {
            KozmosMaterialTheme {
                surface({ dismissals++ }) {
                    window = LocalView.current.rootView
                    KozmosSearch(
                        value = query.value,
                        onValueChange = { query.value = it },
                        clearable = true,
                        modifier = Modifier.focusRequester(focus)
                    )
                }
            }
        }) {
            frames(4)
            focus.requestFocus(); frames(2)
            val root = checkNotNull(window) { "the surface drew nothing" }
            root.dispatchKeyEvent(hardwareKey(KeyEvent.ACTION_DOWN, key))
            root.dispatchKeyEvent(hardwareKey(KeyEvent.ACTION_UP, key))
            // A sheet hides before it reports its dismissal: its animation runs first.
            frames(60)
            check(dismissals)
        }
    }

    private val dialog: @Composable (() -> Unit, @Composable () -> Unit) -> Unit =
        { onDismiss, content -> KozmosDialog(onDismissRequest = onDismiss) { content() } }

    @Test fun escapeClearsTheSearchAndLeavesTheDialogOpen() {
        val query = mutableStateOf("Gate 12")
        escapeIn(query, dialog) { dismissals ->
            assertEquals("", query.value)
            assertEquals("the dialog was dismissed as the field cleared", 0, dismissals)
        }
    }

    @Test fun escapeInAnEmptySearchStillDismissesTheDialog() {
        val query = mutableStateOf("")
        escapeIn(query, dialog) { dismissals ->
            assertEquals("Escape no longer dismissed the dialog", 1, dismissals)
        }
    }

    private val sheet: @Composable (() -> Unit, @Composable () -> Unit) -> Unit =
        { onDismiss, content -> KozmosBottomSheet(onDismissRequest = onDismiss) { content() } }

    @Test fun escapeClearsTheSearchAndLeavesTheSheetOpen() {
        val query = mutableStateOf("Gate 12")
        escapeIn(query, sheet) { dismissals ->
            assertEquals("", query.value)
            assertEquals("the sheet was dismissed as the field cleared", 0, dismissals)
        }
    }

    /**
     * Material's sheet (1.1.2, Kozmos's BOM) closes on Back, never on Escape,
     * with a Search in it or not: Back in it, holding text or not, still does.
     */
    private fun backDismissesTheSheet(text: String) {
        val query = mutableStateOf(text)
        escapeIn(query, sheet, key = KeyEvent.KEYCODE_BACK) { dismissals ->
            assertEquals("Back no longer dismissed the sheet over \"$text\"", 1, dismissals)
            assertEquals(text, query.value)
        }
    }

    @Test fun backInAnEmptySearchStillDismissesTheSheet() = backDismissesTheSheet("")

    @Test fun backInASearchHoldingTextStillDismissesTheSheet() = backDismissesTheSheet("Gate 12")
}
