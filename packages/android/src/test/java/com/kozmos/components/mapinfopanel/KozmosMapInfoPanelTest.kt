package com.kozmos.components.mapinfopanel

import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.*
import org.junit.Rule
import org.junit.Test

class KozmosMapInfoPanelTest {
    @get:Rule val paparazzi = semanticsPaparazzi()
    @Test fun safeDestinations() {
        listOf("https://example.com", "http://example.com", "mailto:support@example.com", "tel:+4412345678").forEach {
            assertEquals(it, KozmosMapInfoEntry("x", "Link", it).destination)
        }
        listOf("javascript:bad()", "data:text/html,bad", "/relative", "https://user:secret@example.com", "mailto:", "tel:").forEach {
            assertNull(it, KozmosMapInfoEntry("x", "Link", it).destination)
        }
    }
    @Test fun compactPresentationAndDesktopReservation() {
        assertFalse(KozmosMapInfoLayout.isWide(390f))
        assertFalse(KozmosMapInfoLayout.isWide(1103f))
        assertTrue(KozmosMapInfoLayout.isWide(1104f))
        assertEquals(384f, KozmosMapInfoLayout.panelWidth, 0f)
    }
    @Test fun faqExposesNativeDisclosureActionsAndUsesControlledState() {
        for (expanded in listOf(false, true)) {
            var next: String? = "unchanged"
            val tree = paparazzi.readSemantics {
                KozmosMaterialTheme {
                    KozmosMapInfoPanel(
                        content = KozmosMapInfoContent(title = "About", faqs = listOf(KozmosMapInfoFAQ("floors", "Change floor?", "Choose a level."))),
                        onClose = {}, expandedFAQ = if (expanded) "floors" else null, onExpandedFAQChange = { next = it }
                    )
                }
            }
            val question = tree.named("Change floor?")
            if (expanded) {
                assertNotNull(question.collapse)
                question.collapse!!.invoke()
                assertNull(next)
                assertTrue(tree.merged.any { "Choose a level." in it.texts })
            } else {
                assertNotNull(question.expand)
                question.expand!!.invoke()
                assertEquals("floors", next)
                assertFalse(tree.merged.any { "Choose a level." in it.texts })
            }
        }
    }
    @Test fun hostContentAndLocalizedCloseRemainAccessible() {
        var closed = false
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme {
                KozmosMapInfoPanel(
                    content = KozmosMapInfoContent(title = "About this map", credits = listOf(KozmosMapInfoEntry("owner", "Indoor data")), versions = listOf(KozmosMapInfoVersion("sdk", "SDK version", "10.11.0"))),
                    onClose = { closed = true }, closeLabel = "Fermer"
                )
            }
        }
        assertTrue(tree.merged.any { "About this map" in it.texts })
        assertTrue(tree.merged.any { "Indoor data" in it.texts })
        assertTrue(tree.merged.any { "SDK version: 10.11.0" in it.texts })
        tree.named("Fermer").click!!.invoke()
        assertTrue(closed)
    }
}
