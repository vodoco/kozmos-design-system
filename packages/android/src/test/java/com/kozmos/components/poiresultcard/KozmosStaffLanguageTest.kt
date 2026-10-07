package com.kozmos.components.poiresultcard

import androidx.compose.material3.MaterialTheme
import com.kozmos.components.KeptFrames
import com.kozmos.components.pixelsPaparazzi
import com.kozmos.components.readSemantics
import com.kozmos.components.poiresultlist.KozmosPOIResultList
import com.kozmos.components.poiresultlist.KozmosPOIResultListItem
import com.kozmos.contracts.KozmosPOIPresentation
import com.kozmos.contracts.KozmosPOIResultPresentation
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

class KozmosStaffLanguageTest {
    @get:Rule val paparazzi = pixelsPaparazzi(KeptFrames())

    @Test fun listForwardsLocalizedDisclosureAcrossSelection() {
        val result = KozmosPOIResultPresentation("p", 1, summary = "A pharmacy", languageNotListed = true)
        val semantics = paparazzi.readSemantics {
            MaterialTheme {
                KozmosPOIResultList(
                    listOf(KozmosPOIResultListItem(KozmosPOIPresentation("p", "Pharmacy"), result)),
                    "1 result", onSelect = {}, selectedPoiId = "p",
                    languageNotListedLabel = "Türkçe listelenmemiş"
                )
            }
        }
        assertTrue("Türkçe listelenmemiş" in semantics.unmerged.flatMap { it.texts })
        assertTrue(semantics.merged.any { it.words?.contains("Türkçe listelenmemiş") == true })
        assertEquals("A pharmacy", result.selecting("p").summary)
    }

    @Test fun explicitDisclosureSurvivesCustomSelectionName() {
        for (flag in listOf(true, false, null)) {
            val result = KozmosPOIResultPresentation("p", 1, languageNotListed = flag)
            val semantics = paparazzi.readSemantics {
                MaterialTheme {
                    KozmosPOIResultCard(KozmosPOIPresentation("p", "Pharmacy"), result,
                        onSelect = {}, selectionLabel = "Choose")
                }
            }
            val texts = semantics.unmerged.flatMap { it.texts }
            assertEquals(flag == true, "Language not listed" in texts)
            assertTrue(semantics.merged.any {
                it.words == if (flag == true) "Choose, Language not listed" else "Choose"
            })
            assertEquals(flag, result.selecting("p").languageNotListed)
        }
    }
}
