// Composes the Compose snippets of Kbd.mdx, ContextMenu.mdx and Menu.mdx's
// "An item that leaves the app": docsnippets/ClearSearchHint.kt,
// GateContextMenu.kt and HelpMenu.kt, which check-native-snippet-parity holds
// to the pages word for word.
package com.kozmos.example

import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.docsnippets.ClearSearchHint
import com.kozmos.docsnippets.GateContextMenu
import com.kozmos.docsnippets.HelpMenu
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Rule
import org.junit.Test

class MenusDocSnippetsTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    /** Compiling is most of the point; composed, the key reads "Escape". */
    @Test
    fun theKbdSnippetReadsTheKeyByItsName() {
        val tree = paparazzi.readSemantics { KozmosMaterialTheme { ClearSearchHint() } }
        assertEquals(listOf("Press", "Escape", "to clear"), tree.merged.mapNotNull { it.words })
    }

    @Test
    fun theContextMenuSnippetOffersShowMenu() {
        val tree = paparazzi.readSemantics { KozmosMaterialTheme { GateContextMenu() } }
        assertEquals("Show menu", tree.saying("Gate A12").longClickLabel)
        tree.saying("Picked: Nothing yet")
    }

    @Test
    fun theExternalItemSnippetComposesItsButton() {
        val tree = paparazzi.readSemantics { KozmosMaterialTheme { HelpMenu() } }
        assertNotNull(tree.saying("Help").click)
    }
}
