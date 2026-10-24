package com.kozmos.components.breadcrumb

import com.kozmos.components.ReadNode
import com.kozmos.components.ReadSemantics
import com.kozmos.components.readSemantics
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

/**
 * React's breadcrumb tells a screen reader which crumb is the page it is on:
 * `aria-current="page"`, on a disabled link. TalkBack heard the current crumb
 * only as disabled. It is now selected, which TalkBack says in the visitor's
 * own language, as Compose's navigation item marks its current destination;
 * the earlier crumbs say nothing of a selection.
 */
class KozmosBreadcrumbSemanticsTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    private val items = listOf("Home", "Terminal 2", "Gate 14")

    private fun ReadSemantics.crumb(title: String): ReadNode {
        val found = merged.filter { title in it.texts }
        check(found.size == 1) { "expected one node showing \"$title\", found ${found.size} among ${merged.map { it.texts }}" }
        return found.single()
    }

    @Test fun onlyTheCurrentPageIsSelected() {
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme { KozmosBreadcrumb(items = items, onItemClick = {}) }
        }
        val crumbs = items.map { tree.crumb(it) }
        assertEquals("each crumb's selection, as TalkBack is told it", listOf(null, null, true), crumbs.map { it.selected })
        assertEquals("each crumb's enabled state", listOf(true, true, false), crumbs.map { it.enabled })
    }

    @Test fun anEarlierCrumbStillGoesThere() {
        val chosen = mutableListOf<Int>()
        val tree = paparazzi.readSemantics {
            KozmosMaterialTheme { KozmosBreadcrumb(items = items, onItemClick = { chosen += it }) }
        }
        tree.crumb("Terminal 2").click!!.invoke()
        assertEquals(listOf(1), chosen)
    }
}
