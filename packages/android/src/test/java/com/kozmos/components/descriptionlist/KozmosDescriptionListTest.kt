package com.kozmos.components.descriptionlist

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Info
import androidx.compose.material3.Text
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.kozmos.components.iconbutton.KozmosIconButton
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * GAP-221, decision 199: a read-only record, each value under its label with
 * no field chrome. TalkBack hears each item as its label and its value, one
 * node; an item's action is a node of its own; a yes/no is said as a word.
 */
class KozmosDescriptionListTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    @Test fun eachItemIsHeardAsItsLabelAndValueAndItsActionAlone() {
        for (layout in KozmosDescriptionListLayout.entries) {
            val read = paparazzi.readSemantics {
                KozmosMaterialTheme {
                    Box(Modifier.width(360.dp)) {
                        KozmosDescriptionList(layout = layout) {
                            KozmosDescriptionListItem(label = "Name", value = "Gate A12")
                            KozmosDescriptionListItem(label = "Featured", checked = false)
                            KozmosDescriptionListItem(label = "Tags") { Text("Food") }
                            KozmosDescriptionListItem(
                                label = "FID",
                                value = "0f3c-91",
                                action = { KozmosIconButton(icon = Icons.Filled.Info, contentDescription = "Copy FID", onClick = {}) }
                            )
                        }
                    }
                }
            }
            fun item(label: String) = read.merged.single { it.texts.firstOrNull() == label }
            assertEquals("$layout", listOf("Name", "Gate A12"), item("Name").texts)
            assertEquals("$layout: a yes/no is a word", listOf("Featured", "No"), item("Featured").texts)
            assertEquals("$layout", listOf("Tags", "Food"), item("Tags").texts)
            assertEquals("$layout", listOf("FID", "0f3c-91"), item("FID").texts)
            assertTrue("$layout: the copy is its own node", read.merged.any { it.description == "Copy FID" && it.click != null })
        }
    }
}
