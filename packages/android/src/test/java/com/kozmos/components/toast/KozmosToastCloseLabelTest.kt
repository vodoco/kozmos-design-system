package com.kozmos.components.toast

import androidx.compose.material3.SnackbarDuration
import androidx.compose.material3.SnackbarHostState
import com.kozmos.components.live
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.launch
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

/**
 * GAP-182: the toast's close button was named "Dismiss notification" in
 * fixed English. It is named by `closeLabel`, on each of the three ways in,
 * as React's ToastClose is by its `aria-label`, and keeps the English when
 * that is left out.
 */
class KozmosToastCloseLabelTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    /** The words of each control TalkBack can press. */
    private fun pressable(tree: com.kozmos.components.ReadSemantics) =
        tree.merged.filter { it.click != null }.map { it.words }

    @Test fun theCloseButtonSaysAProductsOwnWords() {
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosToast(title = "Gespeichert", onDismiss = {}, closeLabel = "Mitteilung schließen")
                KozmosToast(
                    content = KozmosToastContent(title = "Gespeichert", closeLabel = "Hinweis schließen"),
                    onDismiss = {}
                )
            }
        }
        assertEquals(listOf("Mitteilung schließen", "Hinweis schließen"), pressable(tree))
    }

    @Test fun aHostsSnackbarsSayAProductsOwnWords() {
        val host = SnackbarHostState()
        paparazzi.live(content = {
            KozmosMaterialTheme { KozmosToast(hostState = host, closeLabel = "Mitteilung schließen") }
        }) {
            coroutineScope {
                val shown = launch {
                    host.showSnackbar("Gespeichert", withDismissAction = true, duration = SnackbarDuration.Indefinite)
                }
                frames(10)
                assertEquals(listOf("Mitteilung schließen"), pressable(read()))
                shown.cancel()
            }
        }
    }

    @Test fun theCloseButtonKeepsTheEnglishWhenLeftOut() {
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosToast(title = "Saved", onDismiss = {})
            }
        }
        assertEquals(listOf("Dismiss notification"), pressable(tree))
    }
}
