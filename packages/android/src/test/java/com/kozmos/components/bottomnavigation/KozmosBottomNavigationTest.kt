package com.kozmos.components.bottomnavigation

import androidx.compose.foundation.layout.Box
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Place
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
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
import com.kozmos.tokens.KozmosTypography
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

/**
 * Decision 41: the bottom navigation's labels are 11sp, as React's and
 * iOS's bars label theirs. It is Material's NavigationBar, whose items label
 * themselves in labelMedium, 12sp, unless told otherwise. Read from each
 * label's own text layout.
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
            MaterialTheme(typography = KozmosTypography.typography()) {
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

// BottomNavigation.mdx's Compose example, the same code, so that it compiles
// somewhere: the docs' native snippets are compiled nowhere else.
@Composable
fun BottomNavigationExample() {
    var route by remember { mutableStateOf("home") }
    KozmosBottomNavigation(
        items = listOf(
            BottomNavigationItem(title = "Home", icon = Icons.Default.Home, route = "home"),
            BottomNavigationItem(title = "Maps", icon = Icons.Default.Place, route = "maps"),
            BottomNavigationItem(title = "Alerts", icon = Icons.Default.Notifications, route = "alerts")
        ),
        currentRoute = route,
        onNavigate = { route = it }
    )
}
