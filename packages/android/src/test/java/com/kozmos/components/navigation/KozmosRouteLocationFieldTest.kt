package com.kozmos.components.navigation

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.layout.boundsInRoot
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.kozmos.components.listbox.KozmosListboxOption
import com.kozmos.components.listbox.KozmosPickerAction
import com.kozmos.components.listbox.validPickerActions
import com.kozmos.components.routelocationfield.KozmosRouteLocationField
import com.kozmos.components.routelocationfield.KozmosRouteLocationStatus
import com.kozmos.components.routelocationfield.KozmosRouteLocationFilterMode
import com.kozmos.components.live
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test

class KozmosRouteLocationFieldTest {
    @get:Rule val paparazzi = semanticsPaparazzi()
    private val lobby = KozmosListboxOption("lobby", "Lobby", "North Terminal · Ground floor")

    @Test fun listboxSelectionIsExposedAndCommandsNeverBecomeSelected() {
        for (multiple in listOf(false, true)) {
            val selected = mutableStateOf(listOf("lobby"))
            var changes = 0; var maps = 0
            paparazzi.live(content = { KozmosMaterialTheme {
                com.kozmos.components.listbox.KozmosListbox(
                    options = listOf(lobby, KozmosListboxOption("gallery", "Gallery"),
                        KozmosListboxOption("locked", "Locked", disabled = true)),
                    selectedValues = selected.value, multiple = multiple,
                    onSelectionChange = { values, _ -> selected.value = values; changes++ },
                    actions = listOf(KozmosPickerAction("lobby", "Map") { maps++ }))
            } }) {
                fun row(label: String) = read().merged.single { label in it.texts && it.click != null }
                assertEquals(true, row("Lobby").selected)
                assertEquals(false, row("Gallery").selected)
                assertFalse(row("Locked").enabled)
                assertNull(row("Map").selected)
                row("Gallery").click!!.invoke(); frames(3)
                assertEquals(true, row("Gallery").selected)
                assertEquals(multiple, row("Lobby").selected)
                row("Map").click!!.invoke(); frames(3)
                assertEquals(1, maps); assertEquals(1, changes)
                assertEquals(if (multiple) listOf("lobby", "gallery") else listOf("gallery"), selected.value)
            }
        }
    }

    @Test fun mapActionIsInsidePickerAndDoesNotSelectOrRewriteQuery() {
        var maps = 0; var writes = 0; var selections = 0
        paparazzi.live(content = { KozmosMaterialTheme {
            KozmosRouteLocationField("From", null, "unmatched", emptyList(), { writes++ }, { selections++ }, {},
                onChooseMap = { maps++ }, status = KozmosRouteLocationStatus.Error)
        } }) {
            assertFalse(read().merged.any { "Select from the map" in it.texts })
            read().named("Open options").click!!.invoke(); frames(3)
            read().merged.single { "Select from the map" in it.texts && it.click != null }.click!!.invoke(); frames(3)
            assertEquals(1, maps); assertEquals(0, writes); assertEquals(0, selections)
            assertFalse(read().merged.any { "Select from the map" in it.texts })
        }
    }

    @Test fun forcedOpenReadOnlyPickerCannotSelect() {
        var selections=0
        val tree=paparazzi.readSemantics { KozmosMaterialTheme {
            com.kozmos.components.combobox.KozmosCombobox("", { _, _ -> selections++ }, "", {}, listOf(lobby),
                readOnly=true, expanded=true)
        } }
        val options=tree.merged.filter { "Lobby" in it.texts && it.click != null }
        assertTrue(options.isEmpty() || options.all { !it.enabled })
        assertEquals(0,selections)
    }

    @Test fun suggestionStatusIsShownOnceWhenCommandsRemainAvailable() {
        paparazzi.live(content = { KozmosMaterialTheme {
            KozmosRouteLocationField("From", null, "unmatched", emptyList(), {}, {}, {},
                currentPosition = lobby, status = KozmosRouteLocationStatus.Error)
        } }) {
            read().named("Open options").click!!.invoke(); frames(3)
            assertEquals(1, read().unmerged.count { it.texts == listOf("Locations are unavailable") })
            assertTrue(read().merged.any { "Current position" in it.texts })
        }
    }

    @Test fun hostFilteredFieldSelectsSynonymButLocalAndLoadingDoNot() {
        for ((mode, status) in listOf(KozmosRouteLocationFilterMode.Local to KozmosRouteLocationStatus.Ready,
            KozmosRouteLocationFilterMode.Host to KozmosRouteLocationStatus.Loading,
            KozmosRouteLocationFilterMode.Host to KozmosRouteLocationStatus.Ready)) {
            var selected: String? = null
            paparazzi.live(content = { KozmosMaterialTheme {
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

    @Test fun currentPositionRequiresUsableHostIdentityAndIgnoresSuggestionStatus() {
        for (position in listOf(null, lobby.copy(value = " "), lobby.copy(disabled = true), lobby)) {
            var selected: KozmosListboxOption? = null
            paparazzi.live(content = { KozmosMaterialTheme {
                KozmosRouteLocationField("From", null, "unmatched", emptyList(), {}, { selected = it }, {},
                    currentPosition = position, status = KozmosRouteLocationStatus.Loading)
            } }) {
                read().named("Open options").click!!.invoke(); frames(3)
                val actions = read().merged.filter { "Current position" in it.texts && it.click != null }
                if (position == lobby) {
                    assertEquals(1, actions.size)
                    actions.single().click!!.invoke(); frames(3)
                    assertSame(lobby, selected)
                    assertFalse(read().merged.any { "Current position" in it.texts })
                } else { assertTrue(actions.isEmpty()); assertNull(selected) }
            }
        }
    }

    @Test fun controlledActionClosesBeforeCallbackWithoutWritingLocationOrQuery() {
      for (replaceQuery in listOf(false, true)) {
        val expanded = mutableStateOf(true)
        val query = mutableStateOf("unmatched")
        val events = mutableListOf<String>()
        paparazzi.live(content = { KozmosMaterialTheme {
            com.kozmos.components.combobox.KozmosCombobox("kept", { _, _ -> events.add("value") }, query.value,
                { events.add("query") }, emptyList(), controlLabels = com.kozmos.components.combobox.KozmosComboboxLabels(),
                filterLocally = true, popupActions = listOf(KozmosPickerAction("map", "Map") {
                    if (replaceQuery) query.value = "Host draft"
                    events.add("map:${expanded.value}")
                }),
                expanded = expanded.value, onExpandedChange = { expanded.value = it; events.add("open:$it") })
        } }) {
            read().merged.single { "Map" in it.texts && it.click != null }.click!!.invoke(); frames(3)
            assertEquals(listOf("open:false", "map:false"), events)
            assertEquals(if (replaceQuery) "Host draft" else "unmatched", query.value)
            assertFalse(read().merged.any { "Map" in it.texts })
        }
      }
    }

    @Test fun actionsHaveStableUnambiguousIdentityAndRespectDisabledState() {
        val actions = listOf(KozmosPickerAction("dup", "First") {}, KozmosPickerAction("dup", "Second") {},
            KozmosPickerAction(" ", "Blank") {}, KozmosPickerAction("valid", "Unavailable", disabled = true) {})
        assertEquals(listOf("valid"), validPickerActions(actions).map { it.id })
        val tree = paparazzi.readSemantics { KozmosMaterialTheme {
            com.kozmos.components.listbox.KozmosListbox(options = emptyList(), actions = actions)
        } }
        assertFalse(tree.merged.single { "Unavailable" in it.texts && it.click != null }.enabled)
        assertFalse(tree.merged.any { "First" in it.texts || "Second" in it.texts || "Blank" in it.texts })
    }

    @Test fun resolvedLocationShowsContextAndDelegatesClearWithoutExternalMapAction() {
        var clears = 0
        var maps = 0
        val tree = paparazzi.readSemantics { KozmosMaterialTheme {
            KozmosRouteLocationField("From", lobby, "unrelated draft", listOf(lobby), {}, {}, { clears++ },
                onChooseMap = { maps++ }, clearLabel = "Clear origin", mapLabel = "Choose on map")
        } }
        val words = tree.unmerged.flatMap { it.texts }
        assertTrue(words.contains(lobby.description))
        assertFalse(words.contains("unrelated draft"))
        val clear = tree.merged.single { (it.description == "Clear origin" || "Clear origin" in it.texts) && it.click != null }
        assertTrue("Selected endpoints use a visible text action, not another close icon", "Clear origin" in clear.texts)
        val label = tree.unmerged.single { it.texts == listOf("From") }
        val description = tree.unmerged.single { it.texts == listOf(lobby.description) }
        assertEquals("The action is centered across the entire endpoint", (label.frame.top + description.frame.bottom) / 2f,
            (clear.frame.top + clear.frame.bottom) / 2f, 1f)
        clear.click!!.invoke()
        assertFalse(tree.merged.any { "Choose on map" in it.texts })
        assertEquals(1, clears)
        assertEquals(0, maps)
    }

    @Test fun loadingKeepsInputAvailableAndResolvedIdentityAbsent() {
        var selections = 0
        val tree = paparazzi.readSemantics { KozmosMaterialTheme {
            KozmosRouteLocationField("From", null, "Lobby", listOf(lobby), {}, { selections++ }, {},
                status = KozmosRouteLocationStatus.Loading, statusText = "Searching places")
        } }
        assertTrue(tree.named("From").enabled)
        assertTrue(tree.unmerged.flatMap { it.texts }.contains("Searching places"))
        assertEquals(0, selections)
    }

    @Test fun disabledResolvedLocationCannotClear() {
        val tree = paparazzi.readSemantics { KozmosMaterialTheme {
            KozmosRouteLocationField("From", lobby, "", emptyList(), {}, {}, {}, enabled = false)
        } }
        assertFalse(tree.merged.single { "Clear location" in it.texts && it.click != null }.enabled)
    }

    @Test fun changeAndCancelPreserveHostIdentityAndIndependentCallbacks() {
        for (direction in LayoutDirection.values()) for (scale in listOf(1f, 2f)) {
            val editing = mutableStateOf(false)
            val events = mutableListOf<String>()
            var density = 1f
            var host = Rect.Zero
            paparazzi.live(content = {
                density = LocalDensity.current.density
                CompositionLocalProvider(LocalDensity provides Density(density, scale), LocalLayoutDirection provides direction) {
                    KozmosMaterialTheme { Box(Modifier.width(320.dp).onGloballyPositioned { host = it.boundsInRoot() }) {
                        KozmosRouteLocationField("From", if (editing.value) null else lobby, "", listOf(lobby),
                            {}, { events.add("select") }, { events.add("clear") },
                            onEdit = { events.add("edit"); editing.value = true }, changeLabel = "Ändern",
                            onCancelEdit = { events.add("cancel"); editing.value = false }, cancelEditLabel = "Abbrechen")
                    } }
                }
            }) {
                val action = read().merged.single { "Ändern" in it.texts && it.click != null }
                assertEquals("Ändern From", action.description)
                // The Core Button: drawn at least 44dp, its 48dp target Material's (D7).
                assertTrue(action.frame.height >= 44f * density - 1f)
                assertTrue("$direction $scale: ${action.frame} must fit $host", action.frame.left >= host.left && action.frame.right <= host.right + 1f)
                action.click!!.invoke()
                frames(3)
                assertEquals(listOf("edit"), events)
                read().merged.single { "Abbrechen" in it.texts && it.click != null }.click!!.invoke()
                frames(3)
                assertEquals(listOf("edit", "cancel"), events)
                assertTrue(read().unmerged.flatMap { it.texts }.contains(lobby.description))
            }
        }
    }

    @Test fun disabledChangeAndCancelAreNotAvailableActions() {
        for (selected in listOf(true, false)) {
            val tree = paparazzi.readSemantics { KozmosMaterialTheme {
                KozmosRouteLocationField("From", if (selected) lobby else null, "", emptyList(), {}, {}, {},
                    enabled = false, onEdit = {}, onCancelEdit = {})
            } }
            val label = if (selected) "Change" else "Cancel"
            assertFalse(tree.merged.single { label in it.texts && it.click != null }.enabled)
        }
    }
}
