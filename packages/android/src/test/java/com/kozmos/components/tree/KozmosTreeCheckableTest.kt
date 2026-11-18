package com.kozmos.components.tree

import android.os.SystemClock
import android.view.InputDevice
import android.view.KeyEvent
import android.view.MotionEvent
import android.view.View
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.state.ToggleableState
import androidx.compose.ui.unit.dp
import com.kozmos.components.LiveSemantics
import com.kozmos.components.ReadNode
import com.kozmos.components.live
import com.kozmos.components.semanticsPaparazzi
import com.kozmos.components.themeprovider.KozmosMaterialTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

/**
 * GAP-277 (MAP-32 row 4): Add New Access picks several clients, or some of a
 * client's sites, with a checkbox on each row; checking a client clears its
 * sites, and checking a site clears its client; the chevron at the row's
 * end.
 */
class KozmosTreeCheckableTest {
    @get:Rule val paparazzi = semanticsPaparazzi()

    private val clients = listOf(
        TreeNode("acme", "Acme", listOf(TreeNode("acme-hq", "Acme HQ"), TreeNode("acme-lab", "Acme Lab"))),
        TreeNode(
            "globex", "Globex",
            listOf(TreeNode("globex-places", "Places", listOf(TreeNode("globex-east", "Globex East")), section = true))
        ),
        TreeNode("initech", "Initech"),
        TreeNode("old", "Old", disabled = true)
    )

    private var checked by mutableStateOf(emptySet<String>())

    private fun tree(
        expanded: Set<String> = setOf("acme"),
        rule: KozmosTreeCheckRule = KozmosTreeCheckRule.Exclusive,
        position: KozmosTreeDisclosurePosition = KozmosTreeDisclosurePosition.Start
    ): @androidx.compose.runtime.Composable () -> Unit = {
        KozmosMaterialTheme {
            Box { Box(Modifier.size(300.dp, 500.dp)) {
                KozmosTree(
                    clients,
                    selectionMode = KozmosTreeSelectionMode.Multiple,
                    selectedIds = checked,
                    onSelectedIdsChange = { checked = it },
                    expandedIds = expanded,
                    checkable = true,
                    checkRule = rule,
                    disclosurePosition = position
                )
            } }
        }
    }

    private fun LiveSemantics.row(name: String): ReadNode =
        read().merged.single { name in it.texts && it.click != null }

    @Test fun checkingAClientOrASiteClearsTheOther() {
        var next = toggleTreeCheck("acme", clients, setOf("acme-hq", "acme-lab", "globex-east"), KozmosTreeCheckRule.Exclusive)
        assertEquals("a client clears its sites", setOf("acme", "globex-east"), next)
        next = toggleTreeCheck("acme-lab", clients, next, KozmosTreeCheckRule.Exclusive)
        assertEquals("a site clears its client", setOf("acme-lab", "globex-east"), next)
        next = toggleTreeCheck("globex", clients, next, KozmosTreeCheckRule.Exclusive)
        assertEquals("past a section", setOf("acme-lab", "globex"), next)
        assertEquals("a second check clears the row", setOf("acme-lab"), toggleTreeCheck("globex", clients, next, KozmosTreeCheckRule.Exclusive))
        // A mixed parent's check takes its sites (decision 211): KozmosTreeMixedTest.
        assertEquals(
            "independent leaves the others",
            setOf("acme-hq", "initech"),
            toggleTreeCheck("initech", clients, setOf("acme-hq"), KozmosTreeCheckRule.Independent)
        )
    }

    @Test fun aTapChecksTheRowAndOpensNothing() {
        checked = setOf("acme-hq")
        paparazzi.live(content = tree(expanded = emptySet())) {
            frames(2)
            click(row("Acme").bounds.center)
            assertEquals(setOf("acme"), checked)
            assertNotNull("the tap opened the client", row("Acme").expand)
            click(row("Initech").bounds.center)
            assertEquals(setOf("acme", "initech"), checked)
            click(row("Old").bounds.center)
            assertEquals("a disabled row was checked", setOf("acme", "initech"), checked)
        }
    }

    @Test fun theChevronOpensACheckableParentAtTheEnd() {
        checked = emptySet()
        paparazzi.live(content = tree(expanded = emptySet(), position = KozmosTreeDisclosurePosition.End)) {
            frames(2)
            val acme = row("Acme")
            // The chevron is the row's last 24 before its end padding.
            val chevron = Offset(acme.bounds.right - with(view.resources.displayMetrics) { 20 * density }, acme.bounds.center.y)
            click(chevron)
            assertNotNull("the chevron did not open the client", row("Acme").collapse)
            assertEquals("the chevron checked the client", emptySet<String>(), checked)
            assertTrue("the open client's sites are not drawn", read().merged.any { "Acme HQ" in it.texts })
        }
    }

    @Test fun spaceAndEnterCheckTheFocusedRow() {
        checked = emptySet()
        paparazzi.live(content = tree()) {
            // A key press draws a ripple: layoutlib's hardware renderer takes it down.
            software()
            frames(2)
            row("Acme").requestFocus!!.invoke()
            frames(2)
            key(KeyEvent.KEYCODE_SPACE)
            assertEquals(setOf("acme"), checked)
            key(KeyEvent.KEYCODE_DPAD_DOWN)
            assertEquals("Down moves to the site", true, row("Acme HQ").focused)
            key(KeyEvent.KEYCODE_ENTER)
            assertEquals("Enter checks the site and clears the client", setOf("acme-hq"), checked)
            key(KeyEvent.KEYCODE_A, KeyEvent.META_CTRL_ON)
            assertEquals("Ctrl+A checked rows", setOf("acme-hq"), checked)
            key(KeyEvent.KEYCODE_DPAD_UP, KeyEvent.META_SHIFT_ON)
            assertEquals("Shift+Up made a range", setOf("acme-hq"), checked)
            key(KeyEvent.KEYCODE_DPAD_LEFT)
            key(KeyEvent.KEYCODE_DPAD_LEFT)
            assertNotNull("Left did not close the client", row("Acme").expand)
            assertEquals("closing the client dropped its checked site", setOf("acme-hq"), checked)
        }
    }

    @Test fun talkBackReadsACheckableRowAsACheckbox() {
        checked = setOf("initech")
        paparazzi.live(content = tree(expanded = emptySet())) {
            frames(2)
            val initech = row("Initech")
            assertEquals(Role.Checkbox, initech.role)
            assertEquals(ToggleableState.On, initech.toggleableState)
            assertNull("a checkable row reads as selected", initech.selected)
            val acme = row("Acme")
            assertEquals(ToggleableState.Off, acme.toggleableState)
            assertEquals("Not checked, Collapsed", acme.stateDescription)
            assertNotNull("a checkable parent cannot be opened by TalkBack", acme.expand)
        }
    }

    private fun LiveSemantics.software() {
        view.setLayerType(View.LAYER_TYPE_SOFTWARE, null)
        (view.parent as? View)?.setLayerType(View.LAYER_TYPE_SOFTWARE, null)
    }

    private suspend fun LiveSemantics.click(at: Offset) {
        software()
        val down = SystemClock.uptimeMillis()
        for ((action, time) in listOf(MotionEvent.ACTION_DOWN to down, MotionEvent.ACTION_UP to down + 50)) {
            val event = MotionEvent.obtain(
                down, time, action, 1,
                arrayOf(MotionEvent.PointerProperties().apply { id = 0; toolType = MotionEvent.TOOL_TYPE_FINGER }),
                arrayOf(MotionEvent.PointerCoords().apply { x = at.x; y = at.y; pressure = 1f; size = 1f }),
                0, 0, 1f, 1f, 0, 0, InputDevice.SOURCE_TOUCHSCREEN, 0
            )
            view.dispatchTouchEvent(event)
            event.recycle()
            frames(2)
        }
        frames(2)
    }

    private suspend fun LiveSemantics.key(code: Int, meta: Int = 0) {
        val now = SystemClock.uptimeMillis()
        view.dispatchKeyEvent(KeyEvent(now, now, KeyEvent.ACTION_DOWN, code, 0, meta))
        view.dispatchKeyEvent(KeyEvent(now, now, KeyEvent.ACTION_UP, code, 0, meta))
        frames(3)
    }
}
