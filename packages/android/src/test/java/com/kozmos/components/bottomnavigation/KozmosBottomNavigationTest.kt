package com.kozmos.components.bottomnavigation

import androidx.compose.foundation.layout.Box
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.platform.ViewRootForTest
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.text.TextLayoutResult
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import com.kozmos.docsnippets.BottomNavigationExample
import com.kozmos.tokens.KozmosTypography
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

/**
 * Decision 41: the bottom navigation's labels are 11sp, as React's and
 * iOS's bars label theirs. It is Material's NavigationBar, whose items label
 * themselves in labelMedium, 12sp, unless told otherwise. Read from each
 * label's own text layout, in BottomNavigation.mdx's Compose snippet
 * (docsnippets/BottomNavigationExample.kt).
 */
class KozmosBottomNavigationTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    private fun SemanticsNode.flatten(): List<SemanticsNode> = listOf(this) + children.flatMap { it.flatten() }

    @Test
    fun itsLabelsAre11sp() {
        val titles = listOf("Home", "Maps", "Alerts")
        val sizes = mutableMapOf<String, Float>()
        paparazzi.snapshot {
            val view = LocalView.current
            KozmosMaterialTheme(typography = KozmosTypography.typography()) {
                Box(
                    Modifier.onGloballyPositioned {
                        val nodes = (view as ViewRootForTest).semanticsOwner.unmergedRootSemanticsNode.flatten()
                        for (title in titles) {
                            val text = nodes.first { node ->
                                node.config.getOrNull(SemanticsProperties.Text)?.any { it.text == title } == true
                            }
                            val layouts = mutableListOf<TextLayoutResult>()
                            text.config[SemanticsActions.GetTextLayoutResult].action?.invoke(layouts)
                            sizes[title] = layouts.single().layoutInput.style.fontSize.value
                        }
                    }
                ) {
                    BottomNavigationExample()
                }
            }
        }
        for (title in titles) assertEquals("\"$title\"", 11f, checkNotNull(sizes[title]) { "no label \"$title\"" }, 0.01f)
    }
}
