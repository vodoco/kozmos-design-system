package com.kozmos.components.togglebutton

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Translate
import com.kozmos.components.ReadNode
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

/**
 * React's ToggleButton is a Radix toggle, a button named by its content or by
 * the `aria-label` the product passes, as an icon-only one must; SwiftUI's
 * takes a required label. Compose's took an optional label and an icon drawn
 * with no description, and nothing else: a toggle with only an icon reached
 * TalkBack with no name at all.
 */
class KozmosToggleButtonNameTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    /** The toggle as TalkBack is told about it: its name and its words. */
    private fun ReadNode.said() = "description=$description texts=$texts click=${click != null}"

    @Test fun anIconOnlyToggleIsNamedInTheProductsWords() {
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosToggleButton(
                    checked = false,
                    onCheckedChange = {},
                    icon = Icons.Default.Translate,
                    contentDescription = "Übersetzung"
                )
            }
        }
        assertEquals(
            listOf("description=Übersetzung texts=[] click=true"),
            tree.merged.filter { it.click != null }.map { it.said() }
        )
    }

    @Test fun aLabelledToggleIsNamedByItsLabelAndItsIconStaysDecoration() {
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosToggleButton(checked = true, onCheckedChange = {}, label = "Beschriftungen", icon = Icons.Default.Translate)
            }
        }
        assertEquals(
            listOf("description=null texts=[Beschriftungen] click=true"),
            tree.merged.filter { it.click != null }.map { it.said() }
        )
    }
}
