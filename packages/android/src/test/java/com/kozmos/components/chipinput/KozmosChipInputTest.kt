package com.kozmos.components.chipinput

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.width
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.dp
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * GAP-222, decision 216: what TalkBack is given. Each chip's remove is a
 * button named by removeLabel, in the product's words; the field is named
 * by its label; and a polite region is there from the start for what is
 * added and removed. A read alone: the live edits are KozmosChipInputLiveTest's.
 */
class KozmosChipInputTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    @Test fun eachRemoveIsNamedByRemoveLabelAndTheFieldByItsLabel() {
        val read = paparazzi.readSemantics {
            KozmosMaterialTheme {
                Box(Modifier.width(360.dp)) {
                    KozmosChipInput(
                        values = listOf("kahve", "çay"),
                        onValuesChange = {},
                        label = "Anahtar kelimeler",
                        removeLabel = { "$it kaldır" }
                    )
                }
            }
        }
        for (entry in listOf("kahve", "çay")) {
            val remove = read.named("$entry kaldır")
            assertTrue("$entry's remove can be pressed", remove.click != null)
        }
        val field = read.merged.single { it.setText != null }
        assertEquals("Anahtar kelimeler", field.description)
        assertTrue(
            "a polite region for what is added and removed",
            read.merged.any { it.liveRegion == androidx.compose.ui.semantics.LiveRegionMode.Polite }
        )
        assertEquals(Role.Button, read.named("kahve kaldır").role)
    }
}
