package com.kozmos.components.contextmenu

import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.absoluteOffset
import androidx.compose.foundation.layout.size
import androidx.compose.material3.DropdownMenu
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.isShiftPressed
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.input.pointer.PointerEventPass
import androidx.compose.ui.input.pointer.isSecondaryPressed
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.semantics.onLongClick
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.kozmos.components.menu.KozmosMenuContent
import com.kozmos.components.menu.KozmosMenuItem
import com.kozmos.components.menu.KozmosMenuItems

/**
 * A context menu on [content] (GAP-155): the same items `KozmosMenu` draws,
 * from the same [KozmosMenuContent], opened where it is asked for.
 *
 * - A long press (touch) or a secondary (right) click opens it at the press.
 * - From a keyboard, the Menu key or Shift+F10, while focus is inside, opens
 *   it at the area's start.
 * - TalkBack offers it as the area's long-press action, labelled
 *   [showMenuLabel].
 *
 * It closes when dismissed and after an item is picked, which calls
 * [onItemClick].
 */
@Composable
fun KozmosContextMenuArea(
    menu: KozmosMenuContent,
    onItemClick: (KozmosMenuItem) -> Unit,
    modifier: Modifier = Modifier,
    showMenuLabel: String = "Show menu",
    content: @Composable () -> Unit
) {
    val state = remember { KozmosContextMenuState() }
    KozmosContextMenuArea(menu, onItemClick, modifier, showMenuLabel, state, content)
}

/** Where the menu is open, in the area's pixels from its top left; null while closed. */
internal class KozmosContextMenuState {
    var openAt by mutableStateOf<IntOffset?>(null)
}

@Composable
internal fun KozmosContextMenuArea(
    menu: KozmosMenuContent,
    onItemClick: (KozmosMenuItem) -> Unit,
    modifier: Modifier,
    showMenuLabel: String,
    state: KozmosContextMenuState,
    content: @Composable () -> Unit
) {
    var size by remember { mutableStateOf(IntSize.Zero) }
    val rtl = LocalLayoutDirection.current == LayoutDirection.Rtl
    // The area's start: its left, or right to left its right.
    val openAtStart = { state.openAt = IntOffset(if (rtl) size.width else 0, 0) }
    Box(
        modifier = modifier
            .onSizeChanged { size = it }
            .pointerInput(Unit) {
                awaitEachGesture {
                    val down = awaitFirstDown(requireUnconsumed = false, pass = PointerEventPass.Initial)
                    val opened = if (currentEvent.buttons.isSecondaryPressed) {
                        down.consume()
                        true
                    } else {
                        // Held still past the long-press timeout, as a touch's
                        // long press is. Lifted, moved past the touch slop (a
                        // scroll or a drag), or taken by another handler, it is
                        // not one: the block ends before the timeout.
                        withTimeoutOrNull(viewConfiguration.longPressTimeoutMillis) {
                            while (true) {
                                val event = awaitPointerEvent(PointerEventPass.Main)
                                val change = event.changes.firstOrNull { it.id == down.id } ?: break
                                if (!change.pressed || change.isConsumed) break
                                if ((change.position - down.position).getDistance() > viewConfiguration.touchSlop) break
                                // What a handler after this one did with it.
                                val after = awaitPointerEvent(PointerEventPass.Final)
                                if (after.changes.any { it.id == down.id && it.isConsumed }) break
                            }
                        } == null
                    }
                    if (opened) {
                        state.openAt = IntOffset(down.position.x.toInt(), down.position.y.toInt())
                        // The rest of the press is the menu's: what is under it
                        // takes no click from the release.
                        do {
                            val event = awaitPointerEvent(PointerEventPass.Initial)
                            event.changes.forEach { it.consume() }
                        } while (event.changes.any { it.pressed })
                    }
                }
            }
            .onKeyEvent { event ->
                val asks = event.type == KeyEventType.KeyDown &&
                    (event.key == Key.Menu || (event.key == Key.F10 && event.isShiftPressed))
                if (asks) openAtStart()
                asks
            }
            .semantics(mergeDescendants = true) {
                onLongClick(label = showMenuLabel) {
                    openAtStart()
                    true
                }
            }
    ) {
        content()
        // The menu's anchor: an empty box where it was asked for.
        Box(Modifier.absoluteOffset { state.openAt ?: IntOffset.Zero }.size(0.dp)) {
            DropdownMenu(
                expanded = state.openAt != null,
                onDismissRequest = { state.openAt = null }
            ) {
                KozmosMenuItems(
                    content = menu,
                    onItemClick = onItemClick,
                    onDismissRequest = { state.openAt = null }
                )
            }
        }
    }
}
