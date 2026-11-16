package com.kozmos.components.tabs

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.kozmos.components.ReadNode
import com.kozmos.components.ReadSemantics
import com.kozmos.components.live
import com.kozmos.components.motion.LocalKozmosAnimatorScale
import com.kozmos.components.readSettledSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import kotlin.math.abs

/**
 * GAP-254, decision 182: a tab list wider than its space scrolls sideways
 * inside its own track. The track keeps the width it is given and scrolls,
 * each tab keeps its natural width, the selected tab is scrolled into view
 * when the list is first laid out and when the selection moves, and right to
 * left the list starts at the right. A list that fits does not scroll. Until
 * then the tabs were squeezed into equal shares of the width, their titles
 * cut short.
 *
 * The Cloud type picker's five families, each an icon over its title, in a
 * 320dp column. Read from the semantics tree: a tab's [ReadNode.frame] is
 * where it is laid out, its [ReadNode.bounds] what the track leaves of it.
 */
class KozmosTabsScrollTest {
    @get:Rule
    val paparazzi = semanticsPaparazzi()

    private val families = listOf("Everything", "POI", "Interior asset", "Structural", "Virtual")

    @Composable
    private fun FamilyTabs(selected: String, titles: List<String> = families, rtl: Boolean = false, animatorScale: Float? = null) {
        CompositionLocalProvider(
            LocalLayoutDirection provides if (rtl) LayoutDirection.Rtl else LayoutDirection.Ltr,
            LocalKozmosAnimatorScale provides animatorScale
        ) {
            KozmosMaterialTheme {
                Box(Modifier.width(320.dp)) {
                    KozmosTabs {
                        KozmosTabsList {
                            for (title in titles) {
                                KozmosTabsTrigger(
                                    value = title.lowercase(),
                                    title = title,
                                    selectedValue = selected,
                                    onValueChange = {},
                                    icon = { Icon(Icons.Filled.Home, contentDescription = null) }
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    /** The one tab whose own words are [title]. */
    private fun ReadSemantics.tab(title: String): ReadNode = saying(title)

    /** The list: the node that scrolls sideways, or the selectable group when nothing does. */
    private fun ReadSemantics.list(): ReadNode = merged.single { it.selectableGroup != null }

    /** Whether a tab is drawn whole: the track clips none of it. */
    private fun ReadNode.whole(): Boolean =
        abs(bounds.left - frame.left) < 0.5f && abs(bounds.right - frame.right) < 0.5f && bounds.width > 0f

    @Test
    fun aListWiderThanItsSpaceScrollsInsideItsTrackShowingTheSelectedTab() {
        val tree = paparazzi.readSettledSemantics { FamilyTabs(selected = "structural") }
        val list = tree.list()
        // The track keeps the column's width and scrolls.
        val max = list.horizontalScrollMax
        assertNotNull("the list does not scroll", max)
        assertTrue("the list has nothing to scroll: $max", max!! > 0f)
        val widths = families.map { tree.tab(it).frame.width }
        // Natural widths: each its own, and together wider than the track,
        // where equal shares would each be a fifth of it.
        assertTrue("the tabs are squeezed to equal shares: $widths", widths.toSet().size > 2)
        assertTrue("the tabs fit the track after all: $widths in ${list.bounds.width}", widths.sum() > list.bounds.width)
        // Structural, the fourth, is in view without scrolling.
        val structural = tree.tab("Structural")
        assertTrue("Structural is clipped: laid out at ${structural.frame}, drawn at ${structural.bounds}", structural.whole())
        assertTrue("Structural is outside the track ${list.bounds}: ${structural.frame}",
            structural.frame.left >= list.bounds.left && structural.frame.right <= list.bounds.right)
        assertTrue("Structural is still selected", structural.selected == true)
        // Still the one selectable group of five tabs.
        assertEquals(families, list.selectableGroup!!.map { it.words })
    }

    @Test
    fun rightToLeftTheListStartsAtTheRight() {
        val tree = paparazzi.readSettledSemantics { FamilyTabs(selected = "everything", rtl = true) }
        val list = tree.list()
        val first = tree.tab("Everything")
        assertTrue("Everything is clipped: ${first.frame}", first.whole())
        // At the track's right end, 4dp in (the frame is in px: the track's
        // right edge less a small inset).
        assertTrue("Everything is not at the right end: ${first.frame} in ${list.bounds}",
            first.frame.right <= list.bounds.right && list.bounds.right - first.frame.right < 0.1f * list.bounds.width)
        assertTrue("the tabs do not run right to left",
            tree.tab("POI").frame.right <= first.frame.left + 0.5f)
        assertFalse("Virtual is already in view", tree.tab("Virtual").whole())
    }

    @Test
    fun aSelectionThatMovesScrollsItsTabIntoView() {
        for (scale in listOf(0f, 1f)) {
            var selected by mutableStateOf("everything")
            paparazzi.live(content = { FamilyTabs(selected = selected, animatorScale = scale) }) {
                assertFalse("Virtual is already in view", read().tab("Virtual").whole())
                selected = "virtual"
                // At once without animations; animated, within a second.
                frames(if (scale == 0f) 3 else 60)
                val virtual = read().tab("Virtual")
                assertTrue("animator scale $scale: Virtual is clipped: ${virtual.frame}, drawn ${virtual.bounds}", virtual.whole())
            }
        }
    }

    @Test
    fun rightToLeftASelectionThatMovesScrollsLeft() {
        var selected by mutableStateOf("everything")
        paparazzi.live(content = { FamilyTabs(selected = selected, rtl = true, animatorScale = 0f) }) {
            assertFalse("Virtual is already in view", read().tab("Virtual").whole())
            selected = "virtual"
            frames(3)
            assertTrue("Virtual is clipped", read().tab("Virtual").whole())
        }
    }

    /** A list that fits has no scroll: its tabs share the track. */
    @Test
    fun aListThatFitsDoesNotScroll() {
        val tree = paparazzi.readSettledSemantics { FamilyTabs(selected = "hours", titles = listOf("Hours", "Access")) }
        val list = tree.list()
        assertTrue("a list that fits scrolls: ${list.horizontalScrollMax}", (list.horizontalScrollMax ?: 0f) == 0f)
        val hours = tree.tab("Hours").frame.width
        val access = tree.tab("Access").frame.width
        assertEquals("the tabs do not share the track", hours, access, 1f)
    }
}
