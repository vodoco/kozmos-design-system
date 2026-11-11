package com.kozmos.components.radio

import androidx.compose.foundation.layout.Row
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Layers
import androidx.compose.material.icons.filled.Map
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.semantics.Role
import com.kozmos.components.ReadSemantics
import com.kozmos.components.live
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Assert.assertNull
import org.junit.Rule
import org.junit.Test

/**
 * GAP-158: a radio card and a radio tile are each one radio. TalkBack stops
 * on the box once, hears its title and then its description, never its
 * media, and whether it is the chosen one; the group is one selectable group,
 * and choosing a card moves the selection.
 */
class KozmosRadioCardSemanticsTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    private val options = listOf(
        Triple("vector", "Vector", "Drawn from the building's plans"),
        Triple("satellite", "Satellite", "Aerial imagery under the plans")
    )

    @Composable
    private fun Options(variant: KozmosRadioGroupItemVariant, selected: String, onSelect: (String) -> Unit) {
        KozmosMaterialTheme {
            KozmosRadioGroup {
                Row {
                    for ((value, title, description) in options) {
                        KozmosRadioGroupItem(
                            value = value,
                            selectedValue = selected,
                            onOptionSelected = onSelect,
                            label = title,
                            description = description,
                            variant = variant,
                            // Named on purpose: were the media read, its name would be.
                            media = {
                                Icon(if (value == "vector") Icons.Default.Map else Icons.Default.Layers, contentDescription = "$title picture")
                            }
                        )
                    }
                }
            }
        }
    }

    private fun ReadSemantics.radios() = merged.filter { it.role == Role.RadioButton }

    private fun eachIsOneRadio(variant: KozmosRadioGroupItemVariant) {
        val tree = paparazzi.readSemantics { Options(variant, "satellite") {} }
        val radios = tree.radios()
        assertEquals("$variant: one radio per option", 2, radios.size)
        assertEquals(options.map { listOf(it.second, it.third) }, radios.map { it.texts })
        assertEquals("$variant: the media is read", listOf<String?>(null, null), radios.map { it.description })
        assertEquals(listOf(false, true), radios.map { it.selected })
        // What TalkBack walks: the merged tree.
        val everyName = tree.merged.mapNotNull { it.description }
        assertTrue("$variant: the media is in the tree: $everyName", everyName.none { it.endsWith("picture") })
        val groups = tree.merged.mapNotNull { it.selectableGroup }
        assertEquals("$variant: not one selectable group", 1, groups.size)
        assertEquals(listOf(false, true), groups.single().map { it.selected })
    }

    @Test
    fun eachCardIsOneRadioReadByTitleThenDescription() = eachIsOneRadio(KozmosRadioGroupItemVariant.Card)

    @Test
    fun eachTileIsOneRadioReadByTitleThenDescription() = eachIsOneRadio(KozmosRadioGroupItemVariant.Tile)

    @Test
    fun aDefaultRadioReadsItsDescriptionAfterItsLabel() {
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosRadioGroup {
                    KozmosRadioGroupItem(
                        value = "auto",
                        selectedValue = "auto",
                        onOptionSelected = {},
                        label = "Auto-generate",
                        description = "Kozmos draws the outline for you"
                    )
                }
            }
        }
        assertEquals(listOf("Auto-generate", "Kozmos draws the outline for you"), tree.radios().single().texts)
    }

    @Test
    fun choosingACardMovesTheSelection() {
        var selected by mutableStateOf("vector")
        paparazzi.live(content = { Options(KozmosRadioGroupItemVariant.Card, selected) { selected = it } }) {
            assertEquals(listOf(true, false), read().radios().map { it.selected })
            val press = read().radios()[1].click
            assertNotNull("the Satellite card cannot be chosen", press)
            press!!.invoke()
            frames(3)
            assertEquals("satellite", selected)
            assertEquals(listOf(false, true), read().radios().map { it.selected })
            assertNull(read().radios()[0].description)
        }
    }
}
