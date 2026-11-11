package com.kozmos.components.tree

import android.os.SystemClock
import android.view.InputDevice
import android.view.KeyEvent
import android.view.MotionEvent
import android.view.View
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyListState
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.unit.dp
import com.kozmos.components.LiveSemantics
import com.kozmos.components.ReadNode
import com.kozmos.components.contextmenu.KozmosContextMenuState
import com.kozmos.components.live
import com.kozmos.components.menu.KozmosMenuContent
import com.kozmos.components.menu.KozmosMenuItem
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * GAP-151: a tree's selection is a set of ids. A click selects one row;
 * Ctrl or Meta+click toggles a row; Shift+click selects the range from the
 * last row chosen; from a hardware keyboard Shift+Up/Down grows the range
 * and Ctrl+A takes every row. Ranges skip section headings. A right click,
 * the Menu key or TalkBack's long press on a row selects it and asks for
 * that row's menu.
 */
class KozmosTreeSelectionTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    private val data = listOf(
        TreeNode("b1", "B1", listOf(TreeNode("l0", "L0"), TreeNode("l1", "L1"), TreeNode("l2", "L2"))),
        TreeNode("p", "P"),
        TreeNode("q", "Q")
    )

    private var selected by mutableStateOf(emptySet<String>())
    /** How many times the tree handed on a selection. */
    private var changes = 0

    private fun tree(
        data: List<TreeNode> = this.data,
        mode: KozmosTreeSelectionMode = KozmosTreeSelectionMode.Multiple,
        menu: ((TreeNode) -> KozmosMenuContent)? = null,
        menuState: KozmosContextMenuState = KozmosContextMenuState(),
        expanded: Set<String> = setOf("b1"),
        list: LazyListState? = null,
        height: Int = 500
    ): @androidx.compose.runtime.Composable () -> Unit = {
        KozmosMaterialTheme {
            Box(Modifier.size(300.dp, height.dp)) {
                KozmosTree(
                    data,
                    selectionMode = mode,
                    selectedIds = selected,
                    onSelectedIdsChange = { selected = it; changes++ },
                    contextMenu = menu,
                    state = list ?: rememberLazyListState(),
                    expandedIds = expanded,
                    menuState = menuState
                )
            }
        }
    }

    private fun LiveSemantics.row(name: String): ReadNode =
        read().merged.single { name in it.texts && it.click != null }

    @Test fun ctrlClickTogglesAndShiftClickSelectsTheRange() {
        selected = emptySet()
        paparazzi.live(content = tree()) {
            frames(2)
            click(row("L0").bounds.center)
            assertEquals("a click selects the row alone", setOf("l0"), selected)
            click(row("L2").bounds.center, KeyEvent.META_SHIFT_ON)
            assertEquals("Shift+click selects the range", setOf("l0", "l1", "l2"), selected)
            click(row("P").bounds.center, KeyEvent.META_CTRL_ON)
            assertEquals("Ctrl+click adds a row", setOf("l0", "l1", "l2", "p"), selected)
            click(row("L1").bounds.center, KeyEvent.META_META_ON)
            assertEquals("Meta+click takes it out", setOf("l0", "l2", "p"), selected)
            click(row("Q").bounds.center, KeyEvent.META_CTRL_ON or KeyEvent.META_SHIFT_ON)
            assertEquals("Ctrl+Shift+click adds the range", setOf("l0", "l1", "l2", "p", "q"), selected)
            click(row("P").bounds.center)
            assertEquals("a plain click selects one again", setOf("p"), selected)
            assertTrue("the row does not read as selected", row("P").selected == true)
            assertTrue("a row not chosen reads as selected", row("Q").selected == false)
        }
    }

    @Test fun singleModeSelectsOneRowWhateverIsHeld() {
        selected = emptySet()
        paparazzi.live(content = tree(mode = KozmosTreeSelectionMode.Single)) {
            frames(2)
            click(row("L0").bounds.center)
            click(row("L2").bounds.center, KeyEvent.META_SHIFT_ON)
            assertEquals(setOf("l2"), selected)
            click(row("P").bounds.center, KeyEvent.META_CTRL_ON)
            assertEquals(setOf("p"), selected)
        }
    }

    @Test fun shiftArrowsGrowTheRangeFromAHardwareKeyboard() {
        selected = emptySet()
        paparazzi.live(content = tree()) {
            frames(2)
            row("L0").requestFocus!!.invoke()
            frames(2)
            key(KeyEvent.KEYCODE_DPAD_DOWN, KeyEvent.META_SHIFT_ON)
            key(KeyEvent.KEYCODE_DPAD_DOWN, KeyEvent.META_SHIFT_ON)
            assertEquals("Shift+Down twice", setOf("l0", "l1", "l2"), selected)
            assertEquals("focus moves with the range", true, row("L2").focused)
            key(KeyEvent.KEYCODE_DPAD_UP, KeyEvent.META_SHIFT_ON)
            assertEquals("Shift+Up shrinks it", setOf("l0", "l1"), selected)
            key(KeyEvent.KEYCODE_DPAD_DOWN)
            assertEquals("a plain arrow moves focus only", true, row("L2").focused)
            assertEquals(setOf("l0", "l1"), selected)
            key(KeyEvent.KEYCODE_SPACE)
            assertEquals("Space toggles the focused row", setOf("l0", "l1", "l2"), selected)
            key(KeyEvent.KEYCODE_A, KeyEvent.META_CTRL_ON)
            assertEquals("Ctrl+A takes every row", setOf("b1", "l0", "l1", "l2", "p", "q"), selected)
        }
    }

    @Test fun rangesAndCtrlASkipSectionHeadings() {
        selected = emptySet()
        val sectioned = listOf(
            TreeNode("poi", "POI", listOf(TreeNode("cafe", "Café"), TreeNode("gate", "Gate")), count = 2, section = true),
            TreeNode("structural", "Structural", listOf(TreeNode("wall", "Wall")), count = 1, section = true)
        )
        paparazzi.live(content = tree(data = sectioned)) {
            frames(2)
            click(row("Café").bounds.center)
            click(row("Wall").bounds.center, KeyEvent.META_SHIFT_ON)
            assertEquals("the range has no headings", setOf("cafe", "gate", "wall"), selected)
            key(KeyEvent.KEYCODE_A, KeyEvent.META_CTRL_ON)
            assertEquals(setOf("cafe", "gate", "wall"), selected)
            val heading = read().merged.single { it.heading && it.description!!.startsWith("POI") }
            assertNull("a heading is pressed", heading.click)
        }
    }

    @Test fun aRightClickSelectsTheRowAndOpensItsMenu() {
        selected = setOf("l0")
        val asked = mutableListOf<String>()
        val state = KozmosContextMenuState()
        val menu = { node: TreeNode ->
            asked += node.id
            KozmosMenuContent(items = listOf(KozmosMenuItem(text = "Rename ${node.name}")))
        }
        paparazzi.live(content = tree(menu = menu, menuState = state)) {
            frames(2)
            val at = row("P").bounds.center
            mouse(MotionEvent.ACTION_DOWN, at, MotionEvent.BUTTON_SECONDARY)
            frames(2)
            mouse(MotionEvent.ACTION_UP, at, 0)
            frames(3)
            assertNotNull("no menu opened", state.openAt)
            assertEquals("the menu is not the row's", "p", asked.last())
            assertEquals("the row is not selected", setOf("p"), selected)
        }
    }

    @Test fun talkBacksLongPressAndTheMenuKeyOpenThatRowsMenu() {
        selected = emptySet()
        val asked = mutableListOf<String>()
        val state = KozmosContextMenuState()
        val menu = { node: TreeNode ->
            asked += node.id
            KozmosMenuContent(items = listOf(KozmosMenuItem(text = "Rename")))
        }
        paparazzi.live(content = tree(menu = menu, menuState = state)) {
            frames(2)
            assertEquals("Show menu", row("L1").longClickLabel)
            row("L1").longClick!!.invoke()
            frames(3)
            assertNotNull("TalkBack's long press opened no menu", state.openAt)
            assertEquals("TalkBack's menu is not the row's", "l1", asked.last())
            assertEquals(setOf("l1"), selected)
            state.openAt = null
            frames(2)
            row("Q").requestFocus!!.invoke()
            frames(2)
            key(KeyEvent.KEYCODE_MENU)
            assertNotNull("the Menu key opened no menu", state.openAt)
            assertEquals("the Menu key's menu is not the row's", "q", asked.last())
            assertEquals(setOf("q"), selected)
        }
    }

    @Test fun aDisabledRowTakesNoPressAndFocusAndRangesPassOverIt() {
        selected = emptySet()
        val data = listOf(
            TreeNode("b1", "B1", listOf(TreeNode("l0", "L0"), TreeNode("l1", "L1", disabled = true), TreeNode("l2", "L2"))),
            TreeNode("p", "P")
        )
        paparazzi.live(content = tree(data = data)) {
            frames(2)
            assertEquals("TalkBack does not read it as disabled", false, row("L1").enabled)
            click(row("L1").bounds.center)
            assertEquals("a disabled row was selected", emptySet<String>(), selected)
            click(row("L0").bounds.center)
            click(row("L2").bounds.center, KeyEvent.META_SHIFT_ON)
            assertEquals("the range took the disabled row", setOf("l0", "l2"), selected)
            row("L0").requestFocus!!.invoke()
            frames(2)
            key(KeyEvent.KEYCODE_DPAD_DOWN)
            assertEquals("Down did not pass over the disabled row", true, row("L2").focused)
            key(KeyEvent.KEYCODE_A, KeyEvent.META_CTRL_ON)
            assertEquals("Ctrl+A took the disabled row", setOf("b1", "l0", "l2", "p"), selected)
        }
    }

    @Test fun aDisabledRowOpensNoMenuFromAnyPath() {
        selected = setOf("p")
        val asked = mutableListOf<String>()
        val state = KozmosContextMenuState()
        var shownOpen = false
        val data = listOf(
            TreeNode("b1", "B1", listOf(TreeNode("l0", "L0"), TreeNode("l1", "L1", disabled = true))),
            TreeNode("p", "P")
        )
        val menu = { node: TreeNode ->
            asked += node.id
            KozmosMenuContent(items = listOf(KozmosMenuItem(text = "Rename")))
        }
        val content = tree(data = data, menu = menu, menuState = state)
        paparazzi.live(durationMillis = 8000, content = {
            content()
            // A frame drawn with the menu open, however briefly.
            SideEffect { if (state.openAt != null) shownOpen = true }
        }) {
            frames(2)
            assertNull("TalkBack offers a disabled row's menu", row("L1").longClick)
            val at = row("L1").bounds.center
            mouse(MotionEvent.ACTION_DOWN, at, MotionEvent.BUTTON_SECONDARY)
            assertNull("a right click opened a disabled row's menu", state.openAt)
            frames(2)
            mouse(MotionEvent.ACTION_UP, at, 0)
            frames(3)
            assertNull("a right click opened a disabled row's menu", state.openAt)
            touch(MotionEvent.ACTION_DOWN, at)
            frames(30) // a second of frames, past the long-press timeout
            assertNull("a long press opened a disabled row's menu", state.openAt)
            touch(MotionEvent.ACTION_UP, at)
            frames(3)
            assertEquals("a frame was drawn with the menu open", false, shownOpen)
            assertEquals("the selection changed", setOf("p"), selected)
            assertTrue("a disabled row's menu was asked for: $asked", "l1" !in asked)
            // The same long press on an enabled row opens its menu: the press above was one.
            val l0 = row("L0").bounds.center
            touch(MotionEvent.ACTION_DOWN, l0)
            frames(30)
            assertNotNull("the long press opened no menu on an enabled row", state.openAt)
            touch(MotionEvent.ACTION_UP, l0)
            frames(3)
        }
    }

    @Test fun closingAParentDeselectsItsHiddenRowsInOneChange() {
        selected = setOf("l0", "l2", "p")
        paparazzi.live(content = tree()) {
            frames(2)
            changes = 0
            row("B1").collapse!!.invoke()
            frames(3)
            assertEquals("the hidden rows are still selected", setOf("p"), selected)
            assertEquals("the trimmed set was not handed on once", 1, changes)
            row("B1").expand!!.invoke()
            frames(3)
            click(row("L1").bounds.center, KeyEvent.META_CTRL_ON)
            assertEquals(setOf("p", "l1"), selected)
            changes = 0
            click(row("B1").bounds.center)
            assertEquals("a click on an open parent selects it alone and closes it", setOf("b1"), selected)
            assertEquals("the click handed on more than one selection", 1, changes)
        }
    }

    @Test fun ctrlASelectsOnlyTheVisibleEnabledRows() {
        selected = emptySet()
        val data = listOf(
            TreeNode("b1", "B1", listOf(TreeNode("l0", "L0"))),
            TreeNode("p", "P", disabled = true),
            TreeNode("q", "Q")
        )
        paparazzi.live(content = tree(data = data, expanded = emptySet())) {
            frames(2)
            row("Q").requestFocus!!.invoke()
            frames(2)
            key(KeyEvent.KEYCODE_A, KeyEvent.META_CTRL_ON)
            assertEquals("Ctrl+A took a hidden or disabled row", setOf("b1", "q"), selected)
        }
    }

    @Test fun starOpensEverySiblingThatHasChildren() {
        selected = emptySet()
        val data = listOf(
            TreeNode("a", "A", listOf(TreeNode("a0", "A0"))),
            TreeNode("b", "B", listOf(TreeNode("b0", "B0"))),
            TreeNode("c", "C")
        )
        paparazzi.live(content = tree(data = data, expanded = emptySet())) {
            frames(2)
            row("C").requestFocus!!.invoke()
            frames(2)
            key(KeyEvent.KEYCODE_STAR)
            val names = read().merged.flatMap { it.texts }
            assertTrue("* did not open A and B: $names", "A0" in names && "B0" in names)
        }
    }

    @Test fun pageDownMovesFocusByThePageTheListShows() {
        selected = emptySet()
        val data = List(100) { TreeNode("r$it", "Row $it") }
        val list = LazyListState()
        paparazzi.live(content = tree(data = data, expanded = emptySet(), list = list, height = 300)) {
            frames(2)
            val page = list.layoutInfo.visibleItemsInfo.size
            assertTrue("the page is the whole list: $page", page in 2..50)
            row("Row 0").requestFocus!!.invoke()
            frames(2)
            key(KeyEvent.KEYCODE_PAGE_DOWN)
            frames(3)
            assertEquals("PageDown did not move a page", true, row("Row $page").focused)
            key(KeyEvent.KEYCODE_PAGE_DOWN, KeyEvent.META_SHIFT_ON)
            frames(3)
            assertEquals("Shift+PageDown did not select the page", (page..2 * page).map { "r$it" }.toSet(), selected)
            key(KeyEvent.KEYCODE_PAGE_UP)
            frames(3)
            assertEquals("PageUp did not move a page back", true, row("Row $page").focused)
        }
    }

    @Test fun typingTheSameLetterAgainCyclesThroughTheMatches() {
        selected = emptySet()
        val data = listOf("Alpha", "Pine", "Park", "Plaza", "Quay").map { TreeNode(it.lowercase(), it) }
        paparazzi.live(content = tree(data = data, expanded = emptySet())) {
            frames(2)
            row("Alpha").requestFocus!!.invoke()
            frames(2)
            val seen = mutableListOf<String>()
            repeat(4) {
                key(KeyEvent.KEYCODE_P)
                seen += read().merged.single { it.focused == true }.texts.first()
            }
            assertEquals("p, p, p, p", listOf("Pine", "Park", "Plaza", "Pine"), seen)
            Thread.sleep(600)
            key(KeyEvent.KEYCODE_P)
            key(KeyEvent.KEYCODE_A)
            assertEquals("pa keeps to the row that still matches", true, row("Park").focused)
        }
    }

    @Test fun typeAheadNeverTakesPlusMinusStarOrACommandKey() {
        selected = emptySet()
        val data = listOf("Alpha", "-Minus", "+Plus", "Pine").map { TreeNode(it.lowercase(), it) }
        paparazzi.live(content = tree(data = data, expanded = emptySet())) {
            frames(2)
            row("Alpha").requestFocus!!.invoke()
            frames(2)
            for ((name, code, meta) in listOf(
                Triple("-", KeyEvent.KEYCODE_MINUS, 0),
                Triple("+", KeyEvent.KEYCODE_PLUS, 0),
                Triple("Ctrl+P", KeyEvent.KEYCODE_P, KeyEvent.META_CTRL_ON),
                Triple("Meta+P", KeyEvent.KEYCODE_P, KeyEvent.META_META_ON),
                Triple("Alt+P", KeyEvent.KEYCODE_P, KeyEvent.META_ALT_ON)
            )) {
                key(code, meta)
                Thread.sleep(600)
                assertEquals("$name moved focus", true, row("Alpha").focused)
            }
        }
    }

    private fun LiveSemantics.software() {
        // As Taps.press: a ripple on layoutlib's hardware renderer takes it down.
        view.setLayerType(View.LAYER_TYPE_SOFTWARE, null)
        (view.parent as? View)?.setLayerType(View.LAYER_TYPE_SOFTWARE, null)
    }

    /** A finger's tap at [at], with the keyboard's [meta] held. */
    private suspend fun LiveSemantics.click(at: Offset, meta: Int = 0) {
        software()
        val down = SystemClock.uptimeMillis()
        for ((action, time) in listOf(MotionEvent.ACTION_DOWN to down, MotionEvent.ACTION_UP to down + 50)) {
            val event = MotionEvent.obtain(
                down, time, action, 1,
                arrayOf(MotionEvent.PointerProperties().apply { id = 0; toolType = MotionEvent.TOOL_TYPE_FINGER }),
                arrayOf(MotionEvent.PointerCoords().apply { x = at.x; y = at.y; pressure = 1f; size = 1f }),
                meta, 0, 1f, 1f, 0, 0, InputDevice.SOURCE_TOUCHSCREEN, 0
            )
            view.dispatchTouchEvent(event)
            event.recycle()
            frames(2)
        }
        frames(2)
    }

    private var downAt = 0L

    /** A finger held on the touchscreen, at [at] in the view's pixels. */
    private fun LiveSemantics.touch(action: Int, at: Offset) {
        software()
        val now = SystemClock.uptimeMillis()
        if (action == MotionEvent.ACTION_DOWN) downAt = now
        val event = MotionEvent.obtain(
            downAt, now, action, 1,
            arrayOf(MotionEvent.PointerProperties().apply { id = 0; toolType = MotionEvent.TOOL_TYPE_FINGER }),
            arrayOf(MotionEvent.PointerCoords().apply { x = at.x; y = at.y; pressure = 1f; size = 1f }),
            0, 0, 1f, 1f, 0, 0, InputDevice.SOURCE_TOUCHSCREEN, 0
        )
        view.dispatchTouchEvent(event)
        event.recycle()
    }

    /** A mouse with [buttons] held, at [at] in the view's pixels. */
    private fun LiveSemantics.mouse(action: Int, at: Offset, buttons: Int) {
        software()
        val now = SystemClock.uptimeMillis()
        if (action == MotionEvent.ACTION_DOWN) downAt = now
        val event = MotionEvent.obtain(
            downAt, now, action, 1,
            arrayOf(MotionEvent.PointerProperties().apply { id = 0; toolType = MotionEvent.TOOL_TYPE_MOUSE }),
            arrayOf(MotionEvent.PointerCoords().apply { x = at.x; y = at.y; pressure = 1f; size = 1f }),
            0, buttons, 1f, 1f, 0, 0, InputDevice.SOURCE_MOUSE, 0
        )
        view.dispatchTouchEvent(event)
        event.recycle()
    }

    /** A hardware key, down and up, with [meta] held. */
    private suspend fun LiveSemantics.key(code: Int, meta: Int = 0) {
        val now = SystemClock.uptimeMillis()
        view.dispatchKeyEvent(KeyEvent(now, now, KeyEvent.ACTION_DOWN, code, 0, meta))
        view.dispatchKeyEvent(KeyEvent(now, now, KeyEvent.ACTION_UP, code, 0, meta))
        frames(3)
    }
}
