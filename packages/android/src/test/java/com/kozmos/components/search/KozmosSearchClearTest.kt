package com.kozmos.components.search

import android.view.KeyEvent
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import com.kozmos.components.LiveSemantics
import com.kozmos.components.live
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.providers.KozmosAnalyticsEvent
import com.kozmos.providers.LocalKozmosAnalytics
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * Search's clear (GAP-161, decision 132): a button named in the product's
 * language while a clearable field holds text, which empties the field through
 * onValueChange, calls onClear, reports `search_cleared` with no query and
 * hands focus back to the field; Escape does the same while there is text.
 */
class KozmosSearchClearTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    private val events = mutableListOf<KozmosAnalyticsEvent>()
    private val cleared = KozmosAnalyticsEvent(component = "Search", eventName = "search_cleared")

    private fun search(
        query: MutableState<String>,
        clears: MutableList<Unit> = mutableListOf(),
        clearLabel: String = "Clear search",
        script: suspend LiveSemantics.() -> Unit
    ) = paparazzi.live(content = {
        KozmosMaterialTheme {
            CompositionLocalProvider(LocalKozmosAnalytics provides { events += it }) {
                KozmosSearch(
                    value = query.value,
                    onValueChange = { query.value = it },
                    placeholder = "Find a place",
                    clearable = true,
                    clearLabel = clearLabel,
                    onClear = { clears += Unit }
                )
            }
        }
    }, script = script)

    private fun LiveSemantics.field() = read().merged.single { it.setText != null }

    @Test fun theClearEmptiesTheFieldReportsItAndHandsFocusBack() {
        val query = mutableStateOf("Gate 12")
        val clears = mutableListOf<Unit>()
        search(query, clears) {
            read().named("Clear search").click!!.invoke(); frames(3)
            assertEquals("", query.value)
            assertEquals(1, clears.size)
            assertEquals(listOf(cleared), events)
            assertEquals("focus did not come back to the field", true, field().focused)
            assertFalse("the clear stayed with nothing to clear", read().names().contains("Clear search"))
        }
    }

    @Test fun theClearIsNamedInTheProductsLanguage() {
        val query = mutableStateOf("Kapı 12")
        search(query, clearLabel = "Aramayı temizle") {
            assertTrue(read().names().contains("Aramayı temizle"))
        }
    }

    @Test fun escapeClearsAFieldHoldingText() {
        val query = mutableStateOf("Gate 12")
        val clears = mutableListOf<Unit>()
        search(query, clears) {
            assertTrue(field().requestFocus!!.invoke()); frames(2)
            view.dispatchKeyEvent(escapeKey(KeyEvent.ACTION_DOWN))
            view.dispatchKeyEvent(escapeKey(KeyEvent.ACTION_UP))
            frames(3)
            assertEquals("", query.value)
            assertEquals(1, clears.size)
            assertEquals(listOf(cleared), events)
        }
    }

    @Test fun noClearWithoutClearableOrText() {
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosSearch(value = "Gate 12", onValueChange = {})
                KozmosSearch(value = "", onValueChange = {}, clearable = true)
                KozmosSearch(value = "Gate 12", onValueChange = {}, clearable = true, enabled = false)
                KozmosSearch(value = "Gate 12", onValueChange = {}, clearable = true, readOnly = true)
            }
        }
        assertFalse(tree.names().contains("Clear search"))
    }
}
