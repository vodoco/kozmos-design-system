// Composes the Compose snippets of Progress.mdx's "At the top of the page" and
// Notice.mdx's "Success, progress and done": docsnippets/PageLoadingBar.kt
// and GeometryNotices.kt, which check-native-snippet-parity holds to the
// pages word for word.
package com.kozmos.example

import androidx.compose.material3.Text
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.docsnippets.GeometryNotices
import com.kozmos.docsnippets.PageLoadingBar
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

class NoticeProgressDocSnippetsTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    @Test
    fun theTopBarSnippetDrawsAnIndeterminateBar() {
        val tree = paparazzi.readSemantics { KozmosMaterialTheme { PageLoadingBar(loading = true) { Text("Map") } } }
        assertEquals(ProgressBarRangeInfo.Indeterminate, tree.merged.single { it.progressRange != null }.progressRange)
    }

    @Test
    fun theGeometryNoticesSnippetComposesItsThreeNotices() {
        val tree = paparazzi.readSemantics { KozmosMaterialTheme { GeometryNotices(onSetBoundary = {}) } }
        assertNotNull(tree.merged.firstOrNull { "Set Building Boundary" in it.texts }?.click)
        assertTrue(tree.merged.any { "Saving the geometry" in it.texts })
        assertTrue(tree.merged.any { "Geometry is set" in it.texts })
    }
}
