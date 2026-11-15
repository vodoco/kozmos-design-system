package com.kozmos.components.tree

import com.kozmos.tokens.KozmosDimensions

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyListState
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.saveable.Saver
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.runtime.snapshotFlow
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEvent
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.isAltPressed
import androidx.compose.ui.input.key.isCtrlPressed
import androidx.compose.ui.input.key.isMetaPressed
import androidx.compose.ui.input.key.isShiftPressed
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.input.key.utf16CodePoint
import androidx.compose.ui.input.pointer.PointerEventPass
import androidx.compose.ui.input.pointer.PointerEventType
import androidx.compose.ui.input.pointer.isCtrlPressed
import androidx.compose.ui.input.pointer.isMetaPressed
import androidx.compose.ui.input.pointer.isSecondaryPressed
import androidx.compose.ui.input.pointer.isShiftPressed
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.LayoutCoordinates
import androidx.compose.ui.layout.layout
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.semantics.CollectionInfo
import androidx.compose.ui.semantics.CollectionItemInfo
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.collapse
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.collectionInfo
import androidx.compose.ui.semantics.collectionItemInfo
import androidx.compose.ui.semantics.expand
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.onLongClick
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.offset
import androidx.compose.ui.unit.sp
import com.kozmos.components.contextmenu.KozmosContextMenuArea
import com.kozmos.components.contextmenu.KozmosContextMenuState
import com.kozmos.components.contextmenu.kozmosContextMenuTarget
import com.kozmos.components.menu.KozmosMenuContent
import com.kozmos.components.menu.KozmosMenuItem
import com.kozmos.tokens.KozmosThemeTokens
import kotlinx.coroutines.launch
import java.text.NumberFormat
import java.util.Locale

/**
 * One item of a tree, by a stable [id].
 *
 * @param meta Words about the item, drawn after its name, or under it with
 *   [KozmosTreeMetaPlacement.Below] (GAP-107).
 * @param count A number drawn in a pill after the name: a level's items, a
 *   section's.
 * @param section A section heading (GAP-151): [name] and [count] drawn as a
 *   heading, and [children] the section's items, drawn at the section's own
 *   depth. A section is always open, and never focused, selected or
 *   expanded; TalkBack reads it as a heading.
 * @param disabled The row takes no press and no selection, and focus,
 *   ranges, Ctrl+A and type-ahead pass over it; TalkBack reads it as
 *   disabled.
 */
data class TreeNode(
    val id: String,
    val name: String,
    val children: List<TreeNode> = emptyList(),
    val meta: String? = null,
    val count: Int? = null,
    val section: Boolean = false,
    val disabled: Boolean = false
)

enum class KozmosTreeDensity {
    Default,
    Compact
}

/** How many rows a tree's selection holds: one, or a set with ranges. */
enum class KozmosTreeSelectionMode {
    Single,
    Multiple
}

/** Where a row's meta is drawn: after its name, or on a line under it (GAP-107). */
enum class KozmosTreeMetaPlacement {
    Inline,
    Below
}

/**
 * A tree of [data], one lazy list over its visible rows: only the rows on
 * screen are composed, so a tree of thousands of items (Pointr Cloud's Map
 * Content, 13,031) scrolls as a short one does. Give it a height. Which
 * nodes are open is the tree's, by id, so a row scrolled away and back
 * keeps it.
 *
 * [divided] draws a 1dp stroke in the border role under every row and sets an
 * open parent row on a surface of its own, background 50 (GAP-201): a tree of
 * records, as Pointr Cloud's Map Content tree draws its buildings and levels,
 * rather than a navigation tree. The stroke is under the row, outside its
 * height, so a divided row is a dp taller. [bleed] takes the stroke and the
 * open row's surface that far past the tree on each side, to the panel's
 * edges, while the rows stay where they are: the panel's own padding, 16 in a
 * panel. 0 by default, the tree's own edges.
 *
 * Selection is the caller's: [selectedIds], and [onSelectedIdsChange] with
 * the set a press or a key asks for. Without [onSelectedIdsChange] nothing is
 * selected, as before 0.16.0. A tap or a click selects that row alone.
 * [KozmosTreeSelectionMode.Multiple] adds, from a pointer, Ctrl or Meta+click
 * to toggle a row and Shift+click for the range from the last row chosen
 * (Ctrl+Shift adds the range), and from a hardware keyboard Shift+Up/Down
 * and Shift+Home/End for the range to the focused row, Space to toggle,
 * Shift+Space for the range and Ctrl+A for every row. Ranges skip section
 * headings. Up and Down move focus, Right opens a row and Left closes it
 * (mirrored right to left), Enter does what a click does, and typing moves
 * focus to the next row whose name starts with what was typed.
 *
 * [contextMenu], set, gives each row a Kozmos context menu
 * (`KozmosContextMenuArea`): a right click, a long press, the Menu key or
 * Shift+F10, or TalkBack's long-press action on a row focuses it, selects it
 * if it is not selected, and opens the items [contextMenu] gives for it; a
 * picked item goes to [onContextMenuSelect] with the row's node.
 *
 * TalkBack reads each row's place as "n of m" among the visible rows, an
 * open or closed parent as "Expanded" or "Collapsed", and a selected row as
 * selected.
 */
@Composable
fun KozmosTree(
    data: List<TreeNode>,
    modifier: Modifier = Modifier,
    density: KozmosTreeDensity = KozmosTreeDensity.Default,
    divided: Boolean = false,
    bleed: Dp = 0.dp,
    selectionMode: KozmosTreeSelectionMode = KozmosTreeSelectionMode.Single,
    selectedIds: Set<String> = emptySet(),
    onSelectedIdsChange: ((Set<String>) -> Unit)? = null,
    metaPlacement: KozmosTreeMetaPlacement = KozmosTreeMetaPlacement.Inline,
    contextMenu: ((TreeNode) -> KozmosMenuContent)? = null,
    onContextMenuSelect: (TreeNode, KozmosMenuItem) -> Unit = { _, _ -> },
    state: LazyListState = rememberLazyListState()
) = KozmosTree(
    data, modifier, density, divided, bleed, selectionMode, selectedIds, onSelectedIdsChange,
    metaPlacement, contextMenu, onContextMenuSelect, state, expandedIds = emptySet()
)

/** A tree with the nodes of [expandedIds] open from the start: for tests. */
@Composable
internal fun KozmosTree(
    data: List<TreeNode>,
    modifier: Modifier = Modifier,
    density: KozmosTreeDensity = KozmosTreeDensity.Default,
    divided: Boolean = false,
    bleed: Dp = 0.dp,
    selectionMode: KozmosTreeSelectionMode = KozmosTreeSelectionMode.Single,
    selectedIds: Set<String> = emptySet(),
    onSelectedIdsChange: ((Set<String>) -> Unit)? = null,
    metaPlacement: KozmosTreeMetaPlacement = KozmosTreeMetaPlacement.Inline,
    contextMenu: ((TreeNode) -> KozmosMenuContent)? = null,
    onContextMenuSelect: (TreeNode, KozmosMenuItem) -> Unit = { _, _ -> },
    state: LazyListState = rememberLazyListState(),
    expandedIds: Set<String>,
    menuState: KozmosContextMenuState = remember { KozmosContextMenuState() }
) {
    val reach = if (divided) bleed.coerceAtLeast(0.dp) else 0.dp
    val open = rememberSaveable(stateSaver = KozmosTreeExpandedSaver) { mutableStateOf(expandedIds) }
    val tree = remember(open) { KozmosTreeController(open) }
    tree.scope = rememberCoroutineScope()
    tree.list = state
    tree.mode = selectionMode
    tree.selectedIds = selectedIds
    tree.onSelectedIdsChange = onSelectedIdsChange
    tree.rtl = LocalLayoutDirection.current == LayoutDirection.Rtl
    tree.menuState = if (contextMenu != null) menuState else null
    tree.rowHeightPx = with(LocalDensity.current) { kozmosTreeRowHeight(density, divided).toPx() }
    val rows = remember(data, tree.expanded) { flattenTree(data, tree.expanded) }
    tree.rows = rows
    val itemRows = remember(rows) { rows.count { !it.section } }

    // A menu opened from any path (a right click, a long press, a key, TalkBack)
    // is the row's it was asked on: focus it, and select it if it is not.
    if (contextMenu != null) {
        LaunchedEffect(menuState) {
            snapshotFlow { menuState.openAt != null }.collect { open ->
                if (!open) return@collect
                val id = tree.contextId
                val row = id?.let { tree.rows.firstOrNull { it.node.id == id } }
                // Asked where no enabled row is, a disabled row or none, the
                // menu closes before a frame draws it.
                if (row == null || row.node.disabled) menuState.openAt = null else tree.chooseForMenu(row.node.id)
            }
        }
    }

    val list = @Composable { listModifier: Modifier ->
        // Wider than its slot by the bleed on each side, so the strokes and the
        // surface reach the panel's edges; each row takes the bleed back inside.
        LazyColumn(
            state = state,
            modifier = listModifier
                .kozmosTreeBleed(reach)
                .pointerInput(Unit) {
                    awaitPointerEventScope {
                        while (true) {
                            val event = awaitPointerEvent(PointerEventPass.Initial)
                            // Each press starts with no row; the row under it says which.
                            if (event.type == PointerEventType.Press) tree.contextId = null
                        }
                    }
                }
                .semantics { collectionInfo = CollectionInfo(rowCount = itemRows, columnCount = 1) }
        ) {
            items(rows, key = { it.node.id }, contentType = { if (it.section) 1 else 0 }) { row ->
                if (row.section) {
                    TreeSectionRow(
                        name = row.node.name,
                        count = row.node.count,
                        depth = row.depth,
                        density = density,
                        modifier = Modifier.padding(horizontal = reach)
                    )
                } else {
                    TreeRow(
                        node = row.node,
                        depth = row.depth,
                        density = density,
                        divided = divided,
                        bleed = reach,
                        metaPlacement = metaPlacement,
                        expanded = row.node.id in tree.expanded,
                        selected = row.node.id in selectedIds,
                        selectable = onSelectedIdsChange != null,
                        tree = tree,
                        itemIndex = row.itemIndex
                    )
                }
            }
        }
    }

    if (contextMenu == null) {
        list(modifier)
    } else {
        val node = tree.contextId?.let { id -> rows.firstOrNull { it.node.id == id }?.node }
        KozmosContextMenuArea(
            menu = node?.let(contextMenu) ?: KozmosMenuContent(items = emptyList()),
            onItemClick = { item -> node?.let { onContextMenuSelect(it, item) } },
            modifier = modifier.onGloballyPositioned { tree.area = it },
            showMenuLabel = "Show menu",
            state = menuState
        ) {
            list(Modifier)
        }
    }
}

/**
 * A row's height for [density]: the chevron's 24 and the row's padding above
 * and below, and the 1dp stroke under it when [divided]. A page of PageUp and
 * PageDown is the rows of this height that fit the list, less one.
 */
internal fun kozmosTreeRowHeight(density: KozmosTreeDensity, divided: Boolean): Dp {
    val padding = if (density == KozmosTreeDensity.Compact) {
        KozmosDimensions.primitivesLayoutSpacing25
    } else {
        KozmosDimensions.primitivesLayoutSpacing50
    }
    return KozmosDimensions.primitivesLayoutSizing300 + padding * 2 + if (divided) 1.dp else 0.dp
}

/** Saves a tree's open ids, so a rotation or a configuration change keeps them open. */
internal val KozmosTreeExpandedSaver: Saver<Set<String>, ArrayList<String>> = Saver(
    save = { ArrayList(it) },
    restore = { it.toSet() }
)

/** One visible row of a flattened tree. */
internal data class KozmosTreeRow(
    val node: TreeNode,
    val depth: Int,
    val section: Boolean,
    /** Its place among the visible rows that are not headings; -1 for a heading. */
    val itemIndex: Int,
    val parentId: String?
)

/**
 * The rows a tree draws, in order: each node, then, open, its children a
 * level deeper; a section's heading, then its items at the section's depth.
 */
internal fun flattenTree(data: List<TreeNode>, expanded: Set<String>): List<KozmosTreeRow> {
    val rows = ArrayList<KozmosTreeRow>()
    var items = 0
    fun add(nodes: List<TreeNode>, depth: Int, parentId: String?) {
        for (node in nodes) {
            if (node.section) {
                rows += KozmosTreeRow(node, depth, true, -1, parentId)
                add(node.children, depth, parentId)
            } else {
                rows += KozmosTreeRow(node, depth, false, items++, parentId)
                if (node.children.isNotEmpty() && node.id in expanded) add(node.children, depth + 1, node.id)
            }
        }
    }
    add(data, 0, null)
    return rows
}

/**
 * The ids from [from] to [to] in [order], both included, either way round;
 * just [to] if [from] is not there.
 */
internal fun treeRange(order: List<String>, from: String, to: String): Set<String> {
    val a = order.indexOf(from)
    val b = order.indexOf(to)
    if (b < 0) return emptySet()
    if (a < 0) return setOf(to)
    return order.subList(minOf(a, b), maxOf(a, b) + 1).toCollection(LinkedHashSet())
}

/** What a tree's rows share: which are open, the selection's anchor, focus, the menu's row. */
internal class KozmosTreeController(private val open: MutableState<Set<String>>) {
    constructor(initiallyExpanded: Set<String>) : this(mutableStateOf(initiallyExpanded))

    /** The open nodes, by id: saved with the screen, so a rotation keeps them. */
    var expanded: Set<String>
        get() = open.value
        set(value) { open.value = value }
    var rows: List<KozmosTreeRow> = emptyList()
    var mode = KozmosTreeSelectionMode.Single
    var selectedIds: Set<String> = emptySet()
    var onSelectedIdsChange: ((Set<String>) -> Unit)? = null
    var anchorId: String? = null
    var rtl = false
    var scope: kotlinx.coroutines.CoroutineScope? = null
    var list: LazyListState? = null
    /** The row focus is moving to; it takes focus once it is composed. */
    var pendingFocusId by mutableStateOf<String?>(null)
    var focusedId: String? = null
    /** The row the context menu was last asked on. */
    var contextId by mutableStateOf<String?>(null)
    var menuState: KozmosContextMenuState? = null
    var area: LayoutCoordinates? = null
    /** A row's height for the tree's density, with its stroke when divided: what a page counts. */
    var rowHeightPx = 0f
    private var typed = ""
    private var typedAt = 0L

    /** The rows focus, ranges, Ctrl+A and type-ahead reach: visible, not headings, not disabled. */
    private val enabledRows: List<KozmosTreeRow> get() = rows.filter { !it.section && !it.node.disabled }
    private val order: List<String> get() = enabledRows.map { it.node.id }

    fun toggleExpanded(id: String) = setExpanded(id, id !in expanded)

    /**
     * Opens or closes [id]. Closing it takes its descendants, now hidden, out
     * of the selection: [selection], or the current one, trimmed, is handed
     * on once.
     */
    fun setExpanded(id: String, open: Boolean, selection: Set<String>? = null) {
        if (!open) {
            val hidden = HashSet<String>()
            fun collect(node: TreeNode) = node.children.forEach { hidden += it.id; collectAll(it, hidden) }
            rows.firstOrNull { it.node.id == id }?.node?.let(::collect)
            expanded = expanded - id
            val base = selection ?: selectedIds
            // Multiple, the hidden rows leave the selection; single, the one
            // selected row stays selected out of sight.
            val trimmed = if (mode == KozmosTreeSelectionMode.Multiple) base - hidden else base
            if (selection != null || trimmed.size != base.size) select(trimmed)
            if (anchorId in hidden) anchorId = id
        } else {
            expanded = expanded + id
            selection?.let(::select)
        }
    }

    private fun collectAll(node: TreeNode, into: MutableSet<String>) {
        node.children.forEach { into += it.id; collectAll(it, into) }
    }

    private fun select(ids: Set<String>) {
        val change = onSelectedIdsChange ?: return
        // Kept here too, so keys pressed before the caller recomposes build on it.
        selectedIds = ids
        change(ids)
    }

    /** A press, with the keyboard modifiers held. */
    fun click(row: TreeNode, shift: Boolean, toggle: Boolean) {
        if (row.disabled) return
        val id = row.id
        if (mode == KozmosTreeSelectionMode.Multiple && (shift || toggle)) {
            if (shift) {
                val range = treeRange(order, anchorId ?: id, id)
                select(if (toggle) selectedIds + range else range)
            } else {
                select(if (id in selectedIds) selectedIds - id else selectedIds + id)
                anchorId = id
            }
            return
        }
        anchorId = id
        if (row.children.isNotEmpty()) setExpanded(id, id !in expanded, setOf(id)) else select(setOf(id))
    }

    /** The row a menu was opened on: focused, and selected if it is not. */
    fun chooseForMenu(id: String) {
        if (rows.firstOrNull { it.node.id == id }?.node?.disabled == true) return
        if (id !in selectedIds) {
            select(setOf(id))
            anchorId = id
        }
        if (focusedId != id) focus(id)
    }

    /** Moves focus to [id], scrolling it into the list first if it is not composed. */
    fun focus(id: String) {
        val index = rows.indexOfFirst { it.node.id == id }
        if (index < 0) return
        val state = list
        if (state != null && state.layoutInfo.visibleItemsInfo.none { it.index == index }) {
            scope?.launch { state.scrollToItem(index) }
        }
        pendingFocusId = id
    }

    fun onKey(row: TreeNode, event: KeyEvent): Boolean {
        if (event.type != KeyEventType.KeyDown) return false
        val ids = order
        val at = ids.indexOf(row.id)
        if (at < 0) return false
        val multiple = mode == KozmosTreeSelectionMode.Multiple
        val command = event.isCtrlPressed || event.isMetaPressed
        fun moveTo(target: Int): Boolean {
            val id = ids.getOrNull(target.coerceIn(0, ids.lastIndex)) ?: return true
            if (event.isShiftPressed && multiple) {
                // The range runs from where it started, and grows or shrinks from there.
                val anchor = anchorId ?: row.id
                anchorId = anchor
                select(treeRange(ids, anchor, id))
            } else {
                anchorId = id
            }
            if (id != row.id) focus(id)
            return true
        }
        // A page, as on every platform: the rows of this density (and its
        // stroke, divided) that fit the list's height, less one.
        val viewport = list?.layoutInfo?.let { it.viewportEndOffset - it.viewportStartOffset } ?: 0
        val page = if (rowHeightPx > 0f) maxOf(1, (viewport / rowHeightPx).toInt() - 1) else 1
        val open = if (rtl) Key.DirectionLeft else Key.DirectionRight
        val close = if (rtl) Key.DirectionRight else Key.DirectionLeft
        if (event.typedChar() == '*' || event.key == Key.NumPadMultiply) {
            if (command || event.isAltPressed) return false
            // Every sibling of the focused row that has children opens (APG).
            val here = rows.firstOrNull { it.node.id == row.id } ?: return true
            val siblings = rows.filter { !it.section && it.parentId == here.parentId && it.depth == here.depth }
            expanded = expanded + siblings.filter { it.node.children.isNotEmpty() && !it.node.disabled }.map { it.node.id }
            return true
        }
        return when (event.key) {
            Key.DirectionDown -> moveTo(at + 1)
            Key.DirectionUp -> moveTo(at - 1)
            Key.PageDown -> moveTo(at + page)
            Key.PageUp -> moveTo(at - page)
            Key.MoveHome -> moveTo(0)
            Key.MoveEnd -> moveTo(ids.lastIndex)
            open -> {
                if (row.children.isNotEmpty()) {
                    if (row.id !in expanded) setExpanded(row.id, true) else moveTo(at + 1)
                }
                true
            }
            close -> {
                if (row.children.isNotEmpty() && row.id in expanded) {
                    setExpanded(row.id, false)
                } else {
                    rows.firstOrNull { it.node.id == row.id }?.parentId?.let { parent ->
                        // The range starts again from the parent, as on React and SwiftUI.
                        anchorId = parent
                        focus(parent)
                    }
                }
                true
            }
            Key.Spacebar -> {
                when {
                    // A space inside a typed name is typed (APG).
                    typed.isNotEmpty() && System.currentTimeMillis() - typedAt <= 500 -> typeAhead(row, event)
                    !multiple -> click(row, shift = false, toggle = false)
                    event.isShiftPressed -> select(treeRange(ids, anchorId ?: row.id, row.id))
                    else -> click(row, shift = false, toggle = true)
                }
                true
            }
            Key.Enter, Key.NumPadEnter -> {
                click(row, shift = false, toggle = false)
                true
            }
            Key.A -> if (command && multiple) {
                select(ids.toCollection(LinkedHashSet()))
                true
            } else typeAhead(row, event)
            Key.Menu, Key.F10 -> {
                // The menu is the area's to open; it is this row's.
                contextId = row.id
                false
            }
            else -> typeAhead(row, event)
        }
    }

    /**
     * Printable keys move focus to the next row whose name starts with what
     * was typed, as React's Tree does (APG): one letter, or the same letter
     * again, moves on from the focused row, so "p" then "p" reaches the
     * second row starting with p; more letters keep to the focused row while
     * it still matches. Never with Ctrl, Meta or Alt, and never `+`, `-` or
     * `*`.
     */
    private fun typeAhead(row: TreeNode, event: KeyEvent): Boolean {
        if (event.isCtrlPressed || event.isMetaPressed || event.isAltPressed) return false
        val char = event.typedChar() ?: return false
        if (char < ' ' || char in "+-*") return false
        if (char == ' ' && typed.isEmpty()) return false
        val now = System.currentTimeMillis()
        if (now - typedAt > 500) typed = ""
        typedAt = now
        typed += char.lowercaseChar()
        val visible = enabledRows
        if (visible.isEmpty()) return false
        val at = visible.indexOfFirst { it.node.id == row.id }
        val repeated = typed.all { it == typed[0] }
        val search = if (repeated) typed.substring(0, 1) else typed
        val start = if (repeated) at + 1 else at
        val found = visible.indices.map { visible[(start + it).mod(visible.size)] }
            .firstOrNull { it.node.name.lowercase().startsWith(search) }
        // Nothing matches: the key is not the tree's, and goes on to the host.
        found ?: return false
        anchorId = found.node.id
        if (found.node.id != row.id) focus(found.node.id)
        return true
    }

    /** Where a row starts in the menu's area, for TalkBack's long press on it. */
    fun startOf(coordinates: LayoutCoordinates): IntOffset {
        val area = area ?: return IntOffset.Zero
        if (!area.isAttached || !coordinates.isAttached) return IntOffset.Zero
        val at = area.localPositionOf(coordinates, Offset.Zero)
        return IntOffset((at.x + if (rtl) coordinates.size.width else 0).toInt(), at.y.toInt())
    }
}

/**
 * The character a key types, or null for none. Where the device has no key
 * character map (a host without one, as layoutlib), read from the key code.
 */
private fun KeyEvent.typedChar(): Char? {
    val code = try {
        utf16CodePoint
    } catch (unavailable: RuntimeException) {
        val key = nativeKeyEvent.keyCode
        when (key) {
            in android.view.KeyEvent.KEYCODE_A..android.view.KeyEvent.KEYCODE_Z ->
                'a'.code + key - android.view.KeyEvent.KEYCODE_A
            in android.view.KeyEvent.KEYCODE_0..android.view.KeyEvent.KEYCODE_9 ->
                '0'.code + key - android.view.KeyEvent.KEYCODE_0
            android.view.KeyEvent.KEYCODE_SPACE -> ' '.code
            android.view.KeyEvent.KEYCODE_STAR, android.view.KeyEvent.KEYCODE_NUMPAD_MULTIPLY -> '*'.code
            android.view.KeyEvent.KEYCODE_PLUS, android.view.KeyEvent.KEYCODE_NUMPAD_ADD -> '+'.code
            android.view.KeyEvent.KEYCODE_MINUS, android.view.KeyEvent.KEYCODE_NUMPAD_SUBTRACT -> '-'.code
            else -> 0
        }
    }
    return if (code == 0) null else code.toChar()
}

/** Lays the tree out [bleed] wider on each side than its slot, centred on it. */
private fun Modifier.kozmosTreeBleed(bleed: Dp): Modifier =
    if (bleed <= 0.dp) this else layout { measurable, constraints ->
        val extra = bleed.roundToPx() * 2
        val wide = constraints.copy(
            minWidth = (constraints.minWidth + extra).coerceAtMost(Constraints.Infinity),
            maxWidth = if (constraints.hasBoundedWidth) constraints.maxWidth + extra else Constraints.Infinity
        )
        val placeable = measurable.measure(wide)
        val width = (placeable.width - extra).coerceAtLeast(0)
        layout(width, placeable.height) { placeable.placeRelative(-extra / 2, 0) }
    }

/**
 * One node and, open, its children, drawn as rows in a column: for a tree a
 * screen composes itself. [KozmosTree] draws its rows lazily instead.
 */
@Composable
fun TreeItem(
    item: TreeNode,
    depth: Int,
    density: KozmosTreeDensity = KozmosTreeDensity.Default,
    divided: Boolean = false,
    bleed: Dp = 0.dp,
    metaPlacement: KozmosTreeMetaPlacement = KozmosTreeMetaPlacement.Inline
) = TreeItem(item, depth, density, divided, bleed, expandedIds = emptySet(), metaPlacement = metaPlacement)

@Composable
internal fun TreeItem(
    item: TreeNode,
    depth: Int,
    density: KozmosTreeDensity,
    divided: Boolean,
    bleed: Dp,
    expandedIds: Set<String>,
    metaPlacement: KozmosTreeMetaPlacement = KozmosTreeMetaPlacement.Inline
) {
    if (item.section) {
        Column {
            TreeSectionRow(item.name, Modifier.padding(horizontal = bleed), item.count, depth, density)
            item.children.forEach { child ->
                TreeItem(child, depth, density, divided, bleed, expandedIds, metaPlacement)
            }
        }
        return
    }
    var isExpanded by remember { mutableStateOf(item.id in expandedIds) }
    Column {
        TreeRow(
            node = item,
            depth = depth,
            density = density,
            divided = divided,
            bleed = bleed,
            metaPlacement = metaPlacement,
            expanded = isExpanded,
            selected = false,
            selectable = false,
            tree = null,
            itemIndex = -1,
            onToggle = { isExpanded = !isExpanded }
        )
        AnimatedVisibility(visible = isExpanded) {
            Column {
                item.children.forEach { child ->
                    TreeItem(child, depth + 1, density, divided, bleed, expandedIds, metaPlacement)
                }
            }
        }
    }
}

/**
 * A section heading (GAP-151): [name] in the theme's colour, 11sp medium,
 * with [count] in a pill after it. It takes no indent of its own beyond
 * [depth]'s, draws no stroke and no surface, and TalkBack reads it as a
 * heading.
 */
@Composable
fun TreeSectionRow(
    name: String,
    modifier: Modifier = Modifier,
    count: Int? = null,
    depth: Int = 0,
    density: KozmosTreeDensity = KozmosTreeDensity.Default
) {
    val format = rememberTreeCountFormat()
    // TalkBack reads the name and the count as the locale writes it: "POI, 3,257".
    val label = if (count == null) name else "$name, ${format.format(count)}"
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = modifier
            .fillMaxWidth()
            .heightIn(min = if (density == KozmosTreeDensity.Compact) 24.dp else 32.dp)
            .clearAndSetSemantics {
                heading()
                contentDescription = label
            }
            .padding(horizontal = KozmosDimensions.primitivesLayoutSpacing100)
    ) {
        Spacer(modifier = Modifier.width((depth * 16).dp))
        Text(
            text = name,
            fontSize = 11.sp,
            fontWeight = FontWeight.Medium,
            color = KozmosThemeTokens.primitivesColorsTheme600,
            modifier = Modifier.weight(1f, fill = false)
        )
        if (count != null) {
            TreeCount(count, Modifier.padding(start = KozmosDimensions.primitivesLayoutSpacing100))
        }
    }
}

/** Counts as the app's language writes them: 13,031 in English, 13.031 in German. */
@Composable
private fun rememberTreeCountFormat(): NumberFormat {
    val locale = LocalConfiguration.current.locales[0] ?: Locale.getDefault()
    return remember(locale) { NumberFormat.getIntegerInstance(locale) }
}

/**
 * A count, in a pill, grouped as the app's language writes it: a row's and a
 * section heading's. Internal for the tests, which read what it draws (a
 * heading's words are cleared for TalkBack, which reads its name).
 */
@Composable
internal fun TreeCount(count: Int, modifier: Modifier = Modifier) {
    val format = rememberTreeCountFormat()
    val shape = RoundedCornerShape(percent = 50)
    Box(
        contentAlignment = Alignment.Center,
        modifier = modifier
            .height(20.dp)
            .defaultMinSize(minWidth = 20.dp)
            .background(KozmosThemeTokens.primitivesColorsBackground100, shape)
            .border(1.dp, KozmosThemeTokens.semanticsBorderSubtle, shape)
            .padding(horizontal = KozmosDimensions.primitivesLayoutSpacing75)
    ) {
        Text(
            text = format.format(count),
            fontSize = 12.sp,
            fontWeight = FontWeight.Medium,
            color = KozmosThemeTokens.primitivesColorsForeground500,
            maxLines = 1
        )
    }
}

/** What a press held: Shift, and Ctrl or Meta. */
private class TreePress {
    var shift = false
    var toggle = false
    var coordinates: LayoutCoordinates? = null
}

@Composable
private fun TreeRow(
    node: TreeNode,
    depth: Int,
    density: KozmosTreeDensity,
    divided: Boolean,
    bleed: Dp,
    metaPlacement: KozmosTreeMetaPlacement,
    expanded: Boolean,
    selected: Boolean,
    selectable: Boolean,
    tree: KozmosTreeController?,
    itemIndex: Int,
    onToggle: () -> Unit = {}
) {
    val hasChildren = node.children.isNotEmpty()
    val rtl = LocalLayoutDirection.current == LayoutDirection.Rtl
    val rotation by animateFloatAsState(
        targetValue = if (expanded) (if (rtl) -90f else 90f) else 0f,
        label = "rotation"
    )
    val verticalPadding = if (density == KozmosTreeDensity.Compact) {
        KozmosDimensions.primitivesLayoutSpacing25
    } else {
        KozmosDimensions.primitivesLayoutSpacing50
    }
    val press = remember { TreePress() }
    val focus = remember { FocusRequester() }
    val currentNode by rememberUpdatedState(node)

    if (tree != null) {
        val wanted = tree.pendingFocusId == node.id
        LaunchedEffect(wanted) {
            if (wanted) {
                focus.requestFocus()
                tree.pendingFocusId = null
            }
        }
    }

    val fill = when {
        selected -> KozmosThemeTokens.semanticsHoverFill
        divided && hasChildren && expanded -> KozmosThemeTokens.primitivesColorsBackground50
        else -> Color.Transparent
    }

    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier
            .fillMaxWidth()
            // Divided, an open parent sits on a surface of its own and a
            // stroke runs under the row, outside its height (GAP-201).
            .then(
                if (divided) Modifier
                    .background(fill)
                    .kozmosTreeRowStroke(KozmosThemeTokens.semanticsBorderSubtle)
                    .padding(horizontal = bleed)
                else Modifier.background(fill)
            )
            .then(if (tree != null) treeRowInput(node, tree, press, focus, itemIndex) else Modifier)
            .semantics {
                if (selectable) this.selected = selected
                if (hasChildren && !node.disabled) {
                    val state = if (expanded) "Expanded" else "Collapsed"
                    stateDescription = if (selectable && selected) "Selected, $state" else state
                    if (expanded) collapse { tree?.toggleExpanded(node.id) ?: onToggle(); true }
                    else expand { tree?.toggleExpanded(node.id) ?: onToggle(); true }
                }
            }
            // Disabled, it takes no press, no focus and no selection, and
            // TalkBack reads it as disabled. A long press is the menu area's,
            // which opens the row's menu over its click.
            .clickable(enabled = !node.disabled) {
                if (tree != null) {
                    tree.click(currentNode, press.shift, press.toggle)
                    press.shift = false
                    press.toggle = false
                } else if (hasChildren) {
                    onToggle()
                }
            }
            .padding(vertical = verticalPadding, horizontal = KozmosDimensions.primitivesLayoutSpacing100)
    ) {
        Spacer(modifier = Modifier.width((depth * 16).dp))
        if (hasChildren) {
            Icon(
                imageVector = Icons.AutoMirrored.Filled.KeyboardArrowRight,
                // The row says Expanded or Collapsed: the chevron is drawing.
                contentDescription = null,
                modifier = Modifier
                    .size(KozmosDimensions.primitivesLayoutSizing300)
                    .rotate(rotation)
            )
        } else {
            Spacer(modifier = Modifier.size(KozmosDimensions.primitivesLayoutSizing300))
        }
        val meta = node.meta
        if (meta != null && metaPlacement == KozmosTreeMetaPlacement.Below) {
            // Under the name, so the name is never cut for it (GAP-107).
            Column(
                modifier = Modifier
                    .weight(1f)
                    .padding(start = KozmosDimensions.primitivesLayoutSpacing100)
            ) {
                Text(text = node.name, style = MaterialTheme.typography.bodyMedium)
                TreeMeta(meta, Modifier)
            }
        } else {
            Text(
                text = node.name,
                style = MaterialTheme.typography.bodyMedium,
                modifier = Modifier
                    .weight(1f)
                    .padding(start = KozmosDimensions.primitivesLayoutSpacing100)
            )
        }
        node.count?.let { TreeCount(it, Modifier.padding(start = KozmosDimensions.primitivesLayoutSpacing100)) }
        if (meta != null && metaPlacement == KozmosTreeMetaPlacement.Inline) {
            TreeMeta(meta, Modifier.padding(start = KozmosDimensions.primitivesLayoutSpacing100))
        }
    }
}

@Composable
private fun TreeMeta(meta: String, modifier: Modifier) {
    Text(
        text = meta,
        fontSize = 12.sp,
        color = KozmosThemeTokens.primitivesColorsForeground400,
        maxLines = 1,
        overflow = TextOverflow.Ellipsis,
        modifier = modifier
    )
}

/**
 * A lazy tree's row: its keys, the keyboard modifiers of a press, its place
 * in the list for TalkBack, focus, and its context menu.
 */
@Composable
private fun treeRowInput(
    node: TreeNode,
    tree: KozmosTreeController,
    press: TreePress,
    focus: FocusRequester,
    itemIndex: Int
): Modifier {
    val currentNode by rememberUpdatedState(node)
    val menu = tree.menuState
    return Modifier
        .onGloballyPositioned { press.coordinates = it }
        // Outside the target's own, so it is the one TalkBack is given: its
        // long press opens this row's menu, not the area's.
        .semantics {
            collectionItemInfo = CollectionItemInfo(itemIndex, 1, 0, 1)
            if (menu != null && !currentNode.disabled) {
                onLongClick(label = "Show menu") {
                    tree.contextId = currentNode.id
                    menu.openAt = press.coordinates?.let(tree::startOf) ?: IntOffset.Zero
                    true
                }
            }
        }
        // A disabled row is no target: TalkBack offers no menu on it.
        .then(if (menu != null && !node.disabled) Modifier.kozmosContextMenuTarget() else Modifier)
        .pointerInput(Unit) {
            awaitPointerEventScope {
                while (true) {
                    val event = awaitPointerEvent(PointerEventPass.Initial)
                    if (event.type == PointerEventType.Press) {
                        press.shift = event.keyboardModifiers.isShiftPressed
                        press.toggle = event.keyboardModifiers.isCtrlPressed || event.keyboardModifiers.isMetaPressed
                        // Any press may become a menu's: a right click, a long press.
                        tree.contextId = currentNode.id.takeUnless { currentNode.disabled }
                        // The area opened its menu on this same event, before
                        // this row saw it: a disabled row closes it at once.
                        if (currentNode.disabled && event.buttons.isSecondaryPressed) menu?.openAt = null
                    }
                }
            }
        }
        .focusRequester(focus)
        .onFocusChanged { if (it.isFocused) tree.focusedId = currentNode.id }
        .onKeyEvent { tree.onKey(currentNode, it) }
}

/** A 1dp stroke under the row, below its height: the row grows by it. */
private fun Modifier.kozmosTreeRowStroke(color: Color): Modifier =
    layout { measurable, constraints ->
        val stroke = 1.dp.roundToPx()
        val placeable = measurable.measure(constraints.offset(vertical = -stroke))
        layout(placeable.width, placeable.height + stroke) { placeable.placeRelative(0, 0) }
    }.drawBehind {
        val stroke = 1.dp.toPx()
        drawRect(color, topLeft = Offset(0f, size.height - stroke), size = Size(size.width, stroke))
    }
