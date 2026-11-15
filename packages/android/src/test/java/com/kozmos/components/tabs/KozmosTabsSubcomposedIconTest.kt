package com.kozmos.components.tabs

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.layout.boundsInRoot
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.Role
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import kotlin.math.abs

/**
 * A tab's icon may be built from a SubcomposeLayout (`BoxWithConstraints`,
 * an async image, a lazy row), which throws when asked for an intrinsic
 * measurement. [KozmosTabsList] sizes its tabs by their intrinsic height
 * (decision 3), and the icon's fixed 20dp box answers that query itself,
 * never asking the icon. This holds that: without the fixed size the list
 * throws here (seen 11 Nov 2026). The icon draws at its 20dp, and the word
 * tab beside it still takes the stacked height.
 */
class KozmosTabsSubcomposedIconTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    @Test
    fun anIconBuiltFromASubcomposeLayoutDrawsInAList() {
        var px = 0f
        var icon: Rect? = null
        val tree = paparazzi.readSemantics {
            px = LocalDensity.current.density
            KozmosMaterialTheme {
                KozmosTabs {
                    KozmosTabsList {
                        KozmosTabsTrigger(value = "hours", title = "Hours", selectedValue = "hours", onValueChange = {})
                        KozmosTabsTrigger(
                            value = "access",
                            title = "Access",
                            selectedValue = "hours",
                            onValueChange = {},
                            icon = {
                                BoxWithConstraints(Modifier.fillMaxSize()) {
                                    Box(Modifier.fillMaxSize().onGloballyPositioned { icon = it.boundsInRoot() })
                                }
                            }
                        )
                    }
                }
            }
        }
        val drawn = checkNotNull(icon) { "the icon was never placed" }
        assertTrue("icon width ${drawn.width}", abs(20 * px - drawn.width) <= 1f)
        assertTrue("icon height ${drawn.height}", abs(20 * px - drawn.height) <= 1f)
        val words = tree.saying("Hours").bounds
        val iconed = tree.saying("Access").bounds
        assertTrue("the icon tab is not stacked: ${iconed.height}", iconed.height > 44 * px + 1)
        assertTrue("the word tab ${words.height} against the icon tab ${iconed.height}", abs(iconed.height - words.height) <= 1f)
        assertEquals("the tabs TalkBack is given", listOf("Hours", "Access"), tree.merged.filter { it.role == Role.Tab }.map { it.words })
    }
}
