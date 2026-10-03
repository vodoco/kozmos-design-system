package com.kozmos.components.navigation

import androidx.compose.material3.MaterialTheme
import com.kozmos.components.listbox.KozmosListboxOption
import com.kozmos.components.routelocationfield.KozmosRouteLocationField
import com.kozmos.components.routelocationfield.KozmosRouteLocationStatus
import com.kozmos.components.routelocationfield.KozmosRouteLocationFilterMode
import com.kozmos.components.live
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test

class KozmosRouteLocationFieldTest {
    @get:Rule val paparazzi = semanticsPaparazzi()
    private val lobby = KozmosListboxOption("lobby", "Lobby", "North Terminal · Ground floor")

    @Test fun hostFilteredFieldSelectsSynonymButLocalAndLoadingDoNot() {
        for ((mode, status) in listOf(KozmosRouteLocationFilterMode.Local to KozmosRouteLocationStatus.Ready,
            KozmosRouteLocationFilterMode.Host to KozmosRouteLocationStatus.Loading,
            KozmosRouteLocationFilterMode.Host to KozmosRouteLocationStatus.Ready)) {
            var selected: String? = null
            paparazzi.live(content = { MaterialTheme {
                KozmosRouteLocationField("From", null, "lift", listOf(KozmosListboxOption("e1", "Elevator", "Ground floor")), {}, { selected = it.value }, {}, filterMode = mode, status = status)
            } }) {
                read().named("Open options").click!!.invoke()
                frames(3)
                val options = read().merged.filter { "Elevator" in it.texts && it.click != null }
                if (mode == KozmosRouteLocationFilterMode.Host && status == KozmosRouteLocationStatus.Ready) {
                    assertEquals(1, options.size)
                    options.single().click!!.invoke()
                    assertEquals("e1", selected)
                } else { assertTrue(options.isEmpty()); assertNull(selected) }
            }
        }
    }

    @Test fun resolvedLocationShowsContextAndDelegatesClearAndMap() {
        var clears = 0
        var maps = 0
        val tree = paparazzi.readSemantics { MaterialTheme {
            KozmosRouteLocationField("From", lobby, "unrelated draft", listOf(lobby), {}, {}, { clears++ },
                onChooseMap = { maps++ }, clearLabel = "Clear origin", mapLabel = "Choose on map")
        } }
        val words = tree.unmerged.flatMap { it.texts }
        assertTrue(words.contains(lobby.description))
        assertFalse(words.contains("unrelated draft"))
        tree.named("Clear origin").click!!.invoke()
        tree.merged.single { "Choose on map" in it.texts && it.click != null }.click!!.invoke()
        assertEquals(1, clears)
        assertEquals(1, maps)
    }

    @Test fun loadingKeepsInputAvailableAndResolvedIdentityAbsent() {
        var selections = 0
        val tree = paparazzi.readSemantics { MaterialTheme {
            KozmosRouteLocationField("From", null, "Lobby", listOf(lobby), {}, { selections++ }, {},
                status = KozmosRouteLocationStatus.Loading, statusText = "Searching places")
        } }
        assertTrue(tree.named("From").enabled)
        assertTrue(tree.unmerged.flatMap { it.texts }.contains("Searching places"))
        assertEquals(0, selections)
    }

    @Test fun disabledResolvedLocationCannotClear() {
        val tree = paparazzi.readSemantics { MaterialTheme {
            KozmosRouteLocationField("From", lobby, "", emptyList(), {}, {}, {}, enabled = false)
        } }
        assertFalse(tree.named("Clear location").enabled)
    }
}
