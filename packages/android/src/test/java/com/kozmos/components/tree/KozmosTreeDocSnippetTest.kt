package com.kozmos.components.tree

import com.kozmos.components.readSettledSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.docsnippets.MapContentTree
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * Composes Tree.mdx's Compose snippet, docsnippets/MapContentTree.kt, which
 * check-native-snippet-parity holds to the page word for word.
 */
class KozmosTreeDocSnippetTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    @Test fun theSnippetDrawsItsSectionsAsHeadingsAndItsRowsAsSelectable() {
        val tree = paparazzi.readSettledSemantics { KozmosMaterialTheme { MapContentTree() } }
        assertEquals(listOf("POI, 2", "Structural, 1"), tree.merged.filter { it.heading }.map { it.description })
        val cafe = tree.merged.single { "Bean & Leaf Café" in it.texts && it.click != null }
        assertEquals(false, cafe.selected)
        assertEquals("Show menu", cafe.longClickLabel)
        assertTrue("Changes awaiting publish" in cafe.texts)
    }
}
