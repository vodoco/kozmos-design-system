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
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.composed
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.layout.LayoutCoordinates
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.isShiftPressed
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.input.pointer.PointerEventPass
import androidx.compose.ui.input.pointer.PointerInputChange
import androidx.compose.ui.input.pointer.changedToDownIgnoreConsumed
import androidx.compose.ui.input.pointer.isSecondaryPressed
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.semantics.contentDescription
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
 * - A long press (touch) or a secondary (right) click opens it at the press,
 *   over a button or a row inside too, whose own tap still clicks it.
 * - From a keyboard, the Menu key or Shift+F10, while focus is inside, opens
 *   it at the focused [kozmosContextMenuTarget], or else at the area's start.
 * - TalkBack: the content keeps its own focus stops; nothing is merged, so
 *   buttons and rows inside stay separate. Each element marked with
 *   [Modifier.kozmosContextMenuTarget] offers the menu as its long-press
 *   action, labelled [showMenuLabel], and opens it at that element. Mark
 *   what TalkBack stops on: each control, or the text of an area of words.
 *   While any element is marked, the area offers no action of its own, so
 *   it is never a stop of its own. With none marked, the area is one stop
 *   named [label] that offers the menu, so the menu is never out of reach
 *   and never on a nameless stop.
 *
 * @param showMenuLabel The long-press action's label, which TalkBack reads
 *   as "Double-tap and hold to show menu": "Show menu" by default.
 * @param label The area's name when no element in it is marked: "More
 *   options" by default, the words SplitButton's menu half and React's
 *   `aria-label` for an overflow menu use. Pass the product's own words.
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
    label: String = "More options",
    content: @Composable () -> Unit
) {
    val state = remember { KozmosContextMenuState() }
    KozmosContextMenuArea(menu, onItemClick, modifier, showMenuLabel, state, label, content)
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
    label: String = "More options",
    content: @Composable () -> Unit
) {
    var size by remember { mutableStateOf(IntSize.Zero) }
    val rtl = LocalLayoutDirection.current == LayoutDirection.Rtl
    val target = remember { KozmosContextMenuTargets() }
    target.label = showMenuLabel
    target.open = { at -> state.openAt = at }
    // The focused target's start, or the area's: its left, or right to left its right.
    val openAtStart = { state.openAt = target.focused?.invoke() ?: IntOffset(if (rtl) size.width else 0, 0) }
    Box(
        modifier = modifier
            .onSizeChanged { size = it }
            .onGloballyPositioned { target.area = it }
            .pointerInput(Unit) {
                awaitEachGesture {
                    val down = awaitFirstDown(requireUnconsumed = false, pass = PointerEventPass.Initial)
                    val opened = if (currentEvent.buttons.isSecondaryPressed) {
                        down.consume()
                        true
                    } else {
                        // Held still past the long-press timeout, as a touch's
                        // long press is. Lifted, moved past the touch slop (a
                        // scroll or a drag), or its movement taken by another
                        // handler, it is not one: the block ends before the
                        // timeout. The down itself may be taken: every press
                        // detector inside (a row's or a button's click) takes
                        // it, and a long press over one still opens the menu.
                        withTimeoutOrNull(viewConfiguration.longPressTimeoutMillis) {
                            while (true) {
                                val event = awaitPointerEvent(PointerEventPass.Main)
                                val change = event.changes.firstOrNull { it.id == down.id } ?: break
                                if (!change.pressed || change.takenAfterDown()) break
                                if ((change.position - down.position).getDistance() > viewConfiguration.touchSlop) break
                                // What a handler after this one did with it.
                                val after = awaitPointerEvent(PointerEventPass.Final)
                                if (after.changes.any { it.id == down.id && it.takenAfterDown() }) break
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
            // Not merged: the content's controls stay focus stops of their own.
            // While one is marked, the action is theirs; with none, the area
            // is a stop of its own, named, that offers the menu.
            .then(
                if (target.marked == 0) {
                    Modifier.semantics {
                        contentDescription = label
                        onLongClick(label = showMenuLabel) {
                            openAtStart()
                            true
                        }
                    }
                } else {
                    Modifier
                }
            )
    ) {
        CompositionLocalProvider(LocalKozmosContextMenuTargets provides target) { content() }
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

/**
 * Taken by another handler after it went down: the press's movement, which a
 * scroller or a drag takes. A down taken as it lands is a press detector's (a
 * click's), which still lets a long press be the menu's: until 13 Nov a long
 * press over a pressable row or button never opened it (#517).
 */
private fun PointerInputChange.takenAfterDown(): Boolean = isConsumed && !changedToDownIgnoreConsumed()

/** What an area tells the targets inside it. */
internal class KozmosContextMenuTargets {
    var label: String = "Show menu"
    var open: (IntOffset) -> Unit = {}
    var area: LayoutCoordinates? = null
    /** How many targets are marked inside: while any is, the area offers no action itself. */
    var marked by mutableIntStateOf(0)
    /** The focused target's start, in the area's pixels; null when none is focused. */
    var focused: (() -> IntOffset)? = null
}

internal val LocalKozmosContextMenuTargets = staticCompositionLocalOf<KozmosContextMenuTargets?> { null }

/**
 * Marks an element inside a [KozmosContextMenuArea] that TalkBack stops on —
 * a button, a row, or the text of an area of words — as one the area's menu
 * opens from: TalkBack offers the menu as its long-press action, labelled
 * with the area's `showMenuLabel`, and the menu opens at the element's start.
 * Focused from a keyboard, the Menu key or Shift+F10 opens it there too.
 * Outside an area it does nothing.
 *
 * Put it on the element's own modifier, so it is the same node as what
 * TalkBack stops on: `KozmosButton(onClick, Modifier.kozmosContextMenuTarget())`.
 */
fun Modifier.kozmosContextMenuTarget(): Modifier = composed {
    val targets = LocalKozmosContextMenuTargets.current ?: return@composed this
    val rtl = LocalLayoutDirection.current == LayoutDirection.Rtl
    val place = remember { KozmosContextMenuTargetPlace() }
    val start: () -> IntOffset = remember(place) { { place.start } }
    DisposableEffect(targets) {
        targets.marked++
        onDispose { targets.marked-- }
    }
    this
        .onGloballyPositioned { coordinates ->
            val area = targets.area ?: return@onGloballyPositioned
            if (!area.isAttached) return@onGloballyPositioned
            val at = area.localPositionOf(coordinates, Offset.Zero)
            place.start = IntOffset((at.x + if (rtl) coordinates.size.width else 0).toInt(), at.y.toInt())
        }
        .onFocusChanged { focus ->
            if (focus.hasFocus) targets.focused = start else if (targets.focused == start) targets.focused = null
        }
        .semantics {
            onLongClick(label = targets.label) {
                targets.open(place.start)
                true
            }
        }
}

/** Where a target starts in its area, kept as it is laid out. */
private class KozmosContextMenuTargetPlace {
    var start: IntOffset = IntOffset.Zero
}
