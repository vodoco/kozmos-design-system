package com.kozmos.components.navigation

import androidx.compose.material3.MaterialTheme
import com.kozmos.components.listbox.KozmosListboxOption
import com.kozmos.components.routelocationfield.KozmosRouteLocationField
import com.kozmos.components.routelocationfield.KozmosRouteLocationStatus
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test

class KozmosRouteLocationFieldTest {
    @get:Rule val paparazzi = semanticsPaparazzi()
    private val lobby = KozmosListboxOption("lobby", "Lobby", "North Terminal · Ground floor")

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
