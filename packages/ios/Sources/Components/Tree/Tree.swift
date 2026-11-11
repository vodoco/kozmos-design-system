import SwiftUI
#if os(macOS)
import AppKit
#elseif canImport(GameController)
import GameController
#endif

public enum KozmosTreeDensity {
    case `default`
    case compact

    var verticalPadding: CGFloat {
        switch self {
        case .default:
            return 8
        case .compact:
            return 4
        }
    }

    /// A section heading's least height: 32, 24 compact.
    var sectionMinHeight: CGFloat {
        switch self {
        case .default:
            return KozmosDimensions.primitivesLayoutSpacing400
        case .compact:
            return KozmosDimensions.primitivesLayoutSpacing300
        }
    }
}

/// How many rows a tree's selection holds (GAP-151).
public enum KozmosTreeSelectionMode {
    /// One row: a tap selects it. With no `selection` bound, the tree draws
    /// no selection, as it always has.
    case single
    /// A set of rows: a tap adds or removes the row; with a hardware keyboard,
    /// Shift selects the rows from the last one picked to this one, and
    /// Command adds or removes this one, as iPadOS's and the Mac's lists do.
    case multiple
}

/// Where a row's `meta` is drawn (GAP-107).
public enum KozmosTreeMetaPlacement {
    /// After the name, on its line: the name is cut short to make room.
    case inline
    /// On a second line under the name, which is never cut short for it.
    case below
}

public struct Node: Identifiable, Hashable {
    /// The node's id, which a tree's selection holds. A product that keeps a
    /// selection across rebuilding its nodes gives each one its own, stable
    /// id; with none, the node gets a new one each time it is made.
    public let id: String
    public let value: String
    public let children: [Node]?
    /// Words about the item after its name, or under it with
    /// `metaPlacement: .below`: "Changes awaiting publish".
    public let meta: String?
    /// A number drawn after the name in a pill: how many items a parent or a
    /// section holds.
    public let count: String?
    /// A section heading (GAP-151): its `value` and `count` drawn as a
    /// heading, and its `children` drawn under it at the section's own depth.
    /// Always open; never selected, focused or expanded.
    public let isSection: Bool
    /// The row is drawn at half strength and cannot be picked; ranges skip it.
    public let isDisabled: Bool

    public init(
        id: String? = nil,
        value: String,
        children: [Node]? = nil,
        meta: String? = nil,
        count: String? = nil,
        isSection: Bool = false,
        isDisabled: Bool = false
    ) {
        self.id = id ?? UUID().uuidString
        self.value = value
        self.children = children
        self.meta = meta
        self.count = count
        self.isSection = isSection
        self.isDisabled = isDisabled
    }

    /// A section heading (GAP-151) over `children`, which are drawn at the
    /// section's own depth: Map Content's POI, Interior asset, Structural and
    /// Virtual under a level, each with its count.
    public static func section(_ value: String, id: String? = nil, count: String? = nil, children: [Node]) -> Node {
        Node(id: id, value: value, children: children, count: count, isSection: true)
    }
}

public struct KozmosTree: View {
    let nodes: [Node]
    let density: KozmosTreeDensity
    let divided: Bool
    let bleed: CGFloat
    let selectionMode: KozmosTreeSelectionMode
    let selection: Binding<Set<String>>?
    let metaPlacement: KozmosTreeMetaPlacement
    let contextMenu: ((Node) -> KozmosMenuContent?)?
    let onContextMenuSelect: (Node, KozmosMenuItem) -> Void

    /// The open parents, by their place in the tree: a node's id is new each
    /// time a product builds its nodes without ids, its place is not.
    @State private var expanded: Set<[Int]> = []
    /// The selection of a multiple tree with no `selection` bound.
    @State private var ownSelection: Set<String> = []
    /// Where a Shift range starts: the last row picked on its own.
    @State private var anchor: String?
    /// The row the keyboard is on.
    @State private var focusedID: String?
    @State private var typed = ""
    @State private var typedAt = Date.distantPast
    @FocusState private var treeFocused: Bool
    @Environment(\.layoutDirection) private var layoutDirection
    @Environment(\.kozmosTreeRowRealised) private var rowRealised

    /// - Parameters:
    ///   - divided: A stroke in the border role under every row, and an open
    ///     parent row on a surface of its own, background 50 (GAP-201): a
    ///     tree of records, as Pointr Cloud's Map Content tree draws its
    ///     buildings and levels, rather than a navigation tree. The stroke is
    ///     under the row, outside its height, so a divided row is a point
    ///     taller.
    ///   - bleed: How far a divided row's stroke and an open row's surface
    ///     reach past the tree on each side, so they run to the panel's edges
    ///     while the rows stay where they are: the panel's own padding, 16 in
    ///     a panel. 0 by default, the tree's own edges.
    ///   - selectionMode: One row, or a set of rows (GAP-151).
    ///   - selection: The ids of the selected rows. Unbound, a single tree
    ///     draws no selection and a multiple tree keeps its own.
    ///   - metaPlacement: A row's `meta` after its name, or under it
    ///     (GAP-107).
    ///   - contextMenu: The menu a row opens on a long press, or a secondary
    ///     click on iPad and Mac, as `kozmosContextMenu` draws it; nil for a
    ///     row with none.
    ///   - onContextMenuSelect: Called with the row and the item picked.
    ///
    /// The tree is its own scroller, and draws only the rows in view: a tree
    /// of thousands of items scrolls as one of ten does.
    public init(
        nodes: [Node],
        density: KozmosTreeDensity = .default,
        divided: Bool = false,
        bleed: CGFloat = 0,
        selectionMode: KozmosTreeSelectionMode = .single,
        selection: Binding<Set<String>>? = nil,
        metaPlacement: KozmosTreeMetaPlacement = .inline,
        contextMenu: ((Node) -> KozmosMenuContent?)? = nil,
        onContextMenuSelect: @escaping (Node, KozmosMenuItem) -> Void = { _, _ in }
    ) {
        self.nodes = nodes
        self.density = density
        self.divided = divided
        self.bleed = max(0, bleed)
        self.selectionMode = selectionMode
        self.selection = selection
        self.metaPlacement = metaPlacement
        self.contextMenu = contextMenu
        self.onContextMenuSelect = onContextMenuSelect
    }

    /// A tree with these parents open, by their place: for tests.
    init(
        nodes: [Node],
        density: KozmosTreeDensity = .default,
        divided: Bool,
        bleed: CGFloat = 0,
        selectionMode: KozmosTreeSelectionMode = .single,
        selection: Binding<Set<String>>? = nil,
        metaPlacement: KozmosTreeMetaPlacement = .inline,
        expanded: Set<[Int]>
    ) {
        self.init(nodes: nodes, density: density, divided: divided, bleed: bleed, selectionMode: selectionMode,
                  selection: selection, metaPlacement: metaPlacement)
        self._expanded = State(initialValue: expanded)
    }

    public var body: some View {
        let rows = Self.visibleRows(nodes, expanded: expanded)
        ScrollViewReader { proxy in
            ScrollView {
                // Lazy over the flattened rows: only those in view are made.
                LazyVStack(alignment: .leading, spacing: 0) {
                    ForEach(rows) { row in
                        rowView(row, rows: rows)
                            .id(row.path)
                    }
                }
            }
            .modifier(KozmosTreeKeyboard(focused: $treeFocused) { key, modifiers in
                handle(key, modifiers: modifiers, rows: rows, proxy: proxy)
            } onType: { text in
                typeAhead(text, rows: rows, proxy: proxy)
            })
        }
        // Wider than its slot by the bleed on each side, so the strokes and
        // the surface reach the panel's edges; each row takes it back inside.
        .padding(.horizontal, -bleed)
    }

    // MARK: - Rows

    /// A row of the tree, flattened in reading order.
    struct Row: Identifiable {
        let path: [Int]
        let node: Node
        /// Its indent: a section adds none to its items.
        let depth: Int
        var id: [Int] { path }
        var isParent: Bool { !node.isSection && !(node.children ?? []).isEmpty }
        /// A row a selection, a range or the keyboard can land on.
        var isSelectable: Bool { !node.isSection && !node.isDisabled }
    }

    /// The rows the tree draws: every root, the children of each open parent
    /// under it, and every section's items, at the section's depth.
    static func visibleRows(_ nodes: [Node], expanded: Set<[Int]>, prefix: [Int] = [], depth: Int = 0) -> [Row] {
        var rows: [Row] = []
        appendRows(nodes, expanded: expanded, prefix: prefix, depth: depth, to: &rows)
        return rows
    }

    private static func appendRows(_ nodes: [Node], expanded: Set<[Int]>, prefix: [Int], depth: Int, to rows: inout [Row]) {
        for (index, node) in nodes.enumerated() {
            let path = prefix + [index]
            let row = Row(path: path, node: node, depth: depth)
            rows.append(row)
            if node.isSection {
                appendRows(node.children ?? [], expanded: expanded, prefix: path, depth: depth, to: &rows)
            } else if row.isParent, expanded.contains(path) {
                appendRows(node.children ?? [], expanded: expanded, prefix: path, depth: depth + 1, to: &rows)
            }
        }
    }

    /// The rows a divided tree draws (GAP-201): the same rows as any tree's.
    static func dividedRows(_ nodes: [Node], expanded: Set<[Int]>) -> [Row] {
        visibleRows(nodes, expanded: expanded)
    }

    @ViewBuilder
    private func rowView(_ row: Row, rows: [Row]) -> some View {
        if row.node.isSection {
            KozmosTreeSectionRow(node: row.node, depth: row.depth, density: density, bleed: bleed)
                .onAppear { rowRealised?(row.node) }
        } else {
            let open = row.isParent && expanded.contains(row.path)
            KozmosTreeDividedRow(
                node: row.node, depth: row.depth, isParent: row.isParent, open: open, density: density, bleed: bleed,
                divided: divided, selected: selectionShown && currentSelection.contains(row.node.id),
                focused: treeFocused && focusedID == row.node.id, metaPlacement: metaPlacement
            ) {
                activate(row, rows: rows, modifiers: KozmosTreeHeldKeys.current())
            }
            .modifier(KozmosTreeRowMenu(menu: contextMenu?(row.node)) { item in
                onContextMenuSelect(row.node, item)
            })
            .onAppear { rowRealised?(row.node) }
        }
    }

    // MARK: - Selection (GAP-151)

    private var selectionShown: Bool { selection != nil || selectionMode == .multiple }

    private var currentSelection: Set<String> { selection?.wrappedValue ?? ownSelection }

    private func setSelection(_ ids: Set<String>) {
        guard ids != currentSelection else { return }
        if let selection { selection.wrappedValue = ids } else { ownSelection = ids }
    }

    /// A tap, or Return: a parent opens or closes, unless Shift or Command
    /// is held, and the row is picked.
    private func activate(_ row: Row, rows: [Row], modifiers: EventModifiers) {
        guard row.isSelectable else { return }
        focusedID = row.node.id
        if row.isParent, modifiers.isDisjoint(with: [.shift, .command]) { toggle(row.path) }
        guard selectionShown else { return }
        let result = KozmosTreeSelection.pick(row.node.id, rows: rows, mode: selectionMode, modifiers: modifiers,
                                              selection: currentSelection, anchor: anchor)
        anchor = result.anchor
        setSelection(result.selection)
    }

    private func toggle(_ path: [Int]) {
        if expanded.contains(path) { expanded.remove(path) } else { expanded.insert(path) }
    }

    // MARK: - Keyboard

    private func handle(_ key: KozmosTreeKey, modifiers: EventModifiers, rows: [Row], proxy: ScrollViewProxy) -> Bool {
        let focused = focusedID.flatMap { id in rows.first { $0.node.id == id } }
            ?? rows.first { $0.isSelectable }
        guard let focused else { return false }
        switch key {
        case .expand, .collapse:
            let opening = (key == .expand) == (layoutDirection == .leftToRight)
            if focused.isParent, expanded.contains(focused.path) != opening {
                toggle(focused.path)
            } else if opening, focused.isParent {
                return handle(.down, modifiers: [], rows: rows, proxy: proxy)
            } else if !opening, let parent = rows.first(where: { $0.path == Array(focused.path.dropLast()) && $0.isSelectable }) {
                move(to: parent.node.id, proxy: proxy, rows: rows)
            }
            return true
        case .activate:
            activate(focused, rows: rows, modifiers: [])
            return true
        default:
            guard selectionShown || [.up, .down, .home, .end].contains(key) else { return false }
            let result = KozmosTreeSelection.key(key, rows: rows, mode: selectionMode, modifiers: modifiers,
                                                 focused: focused.node.id, selection: currentSelection, anchor: anchor)
            anchor = result.anchor
            if selectionShown { setSelection(result.selection) }
            move(to: result.focused, proxy: proxy, rows: rows)
            return true
        }
    }

    /// Printable keys move to the next row whose name starts with what was
    /// typed, as React's tree does.
    private func typeAhead(_ text: String, rows: [Row], proxy: ScrollViewProxy) -> Bool {
        let now = Date()
        typed = now.timeIntervalSince(typedAt) > 0.5 ? text : typed + text
        typedAt = now
        guard let target = KozmosTreeSelection.typeAhead(typed, rows: rows, after: focusedID) else { return false }
        move(to: target, proxy: proxy, rows: rows)
        return true
    }

    private func move(to id: String, proxy: ScrollViewProxy, rows: [Row]) {
        focusedID = id
        if let row = rows.first(where: { $0.node.id == id }) { proxy.scrollTo(row.path) }
    }
}

// MARK: - Selection rules

/// The keys a tree answers on a hardware keyboard.
enum KozmosTreeKey: Equatable {
    case up, down, home, end, space, selectAll, expand, collapse, activate
}

/// A tree's selection rules, apart from its drawing (GAP-151): the same as
/// React's Tree in multiple mode, but for a tap with no keys held, which
/// adds or removes the row rather than picking it alone, since touch has no
/// Command key.
enum KozmosTreeSelection {
    struct Result: Equatable {
        var selection: Set<String>
        var anchor: String?
        var focused: String
    }

    /// The ids a range, Select All or the keyboard can land on, in order.
    static func selectableIDs(_ rows: [KozmosTree.Row]) -> [String] {
        rows.filter(\.isSelectable).map(\.node.id)
    }

    /// The rows from `anchor` to `id`, either way, skipping section headings
    /// and disabled rows; just `id` when the anchor is not drawn.
    static func range(_ rows: [KozmosTree.Row], from anchor: String?, to id: String) -> [String] {
        let ids = selectableIDs(rows)
        guard let end = ids.firstIndex(of: id) else { return [] }
        guard let anchor, let start = ids.firstIndex(of: anchor) else { return [id] }
        return Array(ids[min(start, end)...max(start, end)])
    }

    /// A tap on the row `id`, with these keys held.
    static func pick(_ id: String, rows: [KozmosTree.Row], mode: KozmosTreeSelectionMode, modifiers: EventModifiers,
                     selection: Set<String>, anchor: String?) -> Result {
        guard mode == .multiple else { return Result(selection: [id], anchor: id, focused: id) }
        if modifiers.contains(.shift), anchor != nil {
            let span = Set(range(rows, from: anchor, to: id))
            return Result(selection: modifiers.contains(.command) ? selection.union(span) : span, anchor: anchor, focused: id)
        }
        var next = selection
        if next.contains(id) { next.remove(id) } else { next.insert(id) }
        return Result(selection: next, anchor: id, focused: id)
    }

    /// A key on the row `focused`.
    static func key(_ key: KozmosTreeKey, rows: [KozmosTree.Row], mode: KozmosTreeSelectionMode, modifiers: EventModifiers,
                    focused: String, selection: Set<String>, anchor: String?) -> Result {
        let ids = selectableIDs(rows)
        guard !ids.isEmpty else { return Result(selection: selection, anchor: anchor, focused: focused) }
        let index = ids.firstIndex(of: focused)
        switch key {
        case .up, .down, .home, .end:
            let target: String
            switch key {
            case .up: target = ids[max(0, (index ?? 0) - 1)]
            case .down: target = ids[min(ids.count - 1, index.map { $0 + 1 } ?? 0)]
            case .home: target = ids[0]
            default: target = ids[ids.count - 1]
            }
            guard mode == .multiple, modifiers.contains(.shift) else {
                return Result(selection: selection, anchor: anchor, focused: target)
            }
            let start = anchor ?? focused
            let span = Set(range(rows, from: start, to: target))
            return Result(selection: modifiers.contains(.command) ? selection.union(span) : span, anchor: start, focused: target)
        case .space:
            return pick(focused, rows: rows, mode: mode, modifiers: modifiers.intersection(.shift), selection: selection,
                        anchor: anchor)
        case .selectAll:
            guard mode == .multiple else { return Result(selection: selection, anchor: anchor, focused: focused) }
            return Result(selection: Set(ids), anchor: anchor, focused: focused)
        default:
            return Result(selection: selection, anchor: anchor, focused: focused)
        }
    }

    /// The next row after `focused`, wrapping, whose name starts with
    /// `typed`, ignoring case.
    static func typeAhead(_ typed: String, rows: [KozmosTree.Row], after focused: String?) -> String? {
        let candidates = rows.filter(\.isSelectable)
        guard !typed.isEmpty, !candidates.isEmpty else { return nil }
        let start = focused.flatMap { id in candidates.firstIndex { $0.node.id == id } } ?? -1
        // One letter again moves on; more letters stay while they still match.
        let from = typed.count > 1 ? max(start, 0) : start + 1
        for offset in 0..<candidates.count {
            let row = candidates[(from + offset) % candidates.count]
            if row.node.value.range(of: typed, options: [.caseInsensitive, .anchored]) != nil { return row.node.id }
        }
        return nil
    }
}

/// The modifier keys held as a row is tapped: Shift and Command on a
/// hardware keyboard, on iPadOS and the Mac. None on touch alone.
enum KozmosTreeHeldKeys {
    static func current() -> EventModifiers {
        var held: EventModifiers = []
        #if os(macOS)
        let flags = NSEvent.modifierFlags
        if flags.contains(.shift) { held.insert(.shift) }
        if flags.contains(.command) { held.insert(.command) }
        #elseif canImport(GameController)
        guard let keys = GCKeyboard.coalesced?.keyboardInput else { return held }
        func down(_ code: GCKeyCode) -> Bool { keys.button(forKeyCode: code)?.isPressed == true }
        if down(.leftShift) || down(.rightShift) { held.insert(.shift) }
        if down(.leftGUI) || down(.rightGUI) { held.insert(.command) }
        #endif
        return held
    }
}

/// The tree's keys on a hardware keyboard, where SwiftUI has them (iOS 17,
/// macOS 14): the arrows, Home and End, Space, Return, Command-A and
/// type-ahead. The tree is one focus stop, as React's is.
struct KozmosTreeKeyboard: ViewModifier {
    let focused: FocusState<Bool>.Binding
    let onKey: (KozmosTreeKey, EventModifiers) -> Bool
    let onType: (String) -> Bool

    func body(content: Content) -> some View {
        if #available(iOS 17.0, macOS 14.0, *) {
            content.modifier(KozmosTreeKeys(focused: focused, onKey: onKey, onType: onType))
        } else {
            content
        }
    }
}

@available(iOS 17.0, macOS 14.0, *)
private struct KozmosTreeKeys: ViewModifier {
    let focused: FocusState<Bool>.Binding
    let onKey: (KozmosTreeKey, EventModifiers) -> Bool
    let onType: (String) -> Bool

    private static let keys: [KeyEquivalent: KozmosTreeKey] = [
        .upArrow: .up, .downArrow: .down, .home: .home, .end: .end, .space: .space,
        .rightArrow: .expand, .leftArrow: .collapse, .return: .activate,
    ]

    func body(content: Content) -> some View {
        content
            .focusable()
            .focused(focused)
            .onKeyPress(keys: Set(Self.keys.keys)) { press in
                guard let key = Self.keys[press.key] else { return .ignored }
                return onKey(key, press.modifiers) ? .handled : .ignored
            }
            .onKeyPress(characters: .alphanumerics.union(.punctuationCharacters)) { press in
                if press.modifiers.contains(.command) {
                    guard press.characters.lowercased() == "a" else { return .ignored }
                    return onKey(.selectAll, press.modifiers) ? .handled : .ignored
                }
                return onType(press.characters) ? .handled : .ignored
            }
    }
}

/// A row's context menu (GAP-155), when it has one.
private struct KozmosTreeRowMenu: ViewModifier {
    let menu: KozmosMenuContent?
    let onItemSelect: (KozmosMenuItem) -> Void

    func body(content: Content) -> some View {
        if let menu {
            content.kozmosContextMenu(menu, onItemSelect: onItemSelect)
        } else {
            content
        }
    }
}

// MARK: - Drawing

/// Told of each row as it is made: tests count them, to show only the rows
/// in view are.
struct KozmosTreeRowRealisedKey: EnvironmentKey {
    static let defaultValue: ((Node) -> Void)? = nil
}

extension EnvironmentValues {
    var kozmosTreeRowRealised: ((Node) -> Void)? {
        get { self[KozmosTreeRowRealisedKey.self] }
        set { self[KozmosTreeRowRealisedKey.self] = newValue }
    }
}

/// The indent of a level.
private let kozmosTreeIndent: CGFloat = 20

/// A count, in a pill after the name.
struct KozmosTreeCount: View {
    let text: String

    var body: some View {
        Text(text)
            .font(KozmosTypography.caption.weight(.medium))
            .monospacedDigit()
            .lineLimit(1)
            .foregroundColor(KozmosColors.primitivesColorsForeground100)
            .padding(.horizontal, KozmosDimensions.primitivesLayoutSpacing75)
            .frame(minWidth: 20, minHeight: 20)
            .background(Capsule().fill(KozmosColors.primitivesColorsBackground100))
            .overlay(Capsule().strokeBorder(KozmosColors.semanticsBorderSubtle, lineWidth: 1))
            .fixedSize()
    }
}

/// A tree's row: its chevron, icon, name, count and meta; selected on the
/// hover fill at full strength (decision 173). Divided (GAP-201), an open
/// parent's surface under it and a stroke under the row, outside its height.
/// A parent says to VoiceOver whether it is open, and a selected row that it
/// is selected.
struct KozmosTreeDividedRow: View {
    let node: Node
    let depth: Int
    let isParent: Bool
    let open: Bool
    let density: KozmosTreeDensity
    let bleed: CGFloat
    let divided: Bool
    let selected: Bool
    let focused: Bool
    let metaPlacement: KozmosTreeMetaPlacement
    let action: () -> Void

    init(node: Node, depth: Int, isParent: Bool, open: Bool, density: KozmosTreeDensity, bleed: CGFloat,
         divided: Bool = true, selected: Bool = false, focused: Bool = false,
         metaPlacement: KozmosTreeMetaPlacement = .inline, action: @escaping () -> Void) {
        self.node = node
        self.depth = depth
        self.isParent = isParent
        self.open = open
        self.density = density
        self.bleed = bleed
        self.divided = divided
        self.selected = selected
        self.focused = focused
        self.metaPlacement = metaPlacement
        self.action = action
    }

    var body: some View {
        Button(action: action) {
            HStack(spacing: KozmosDimensions.primitivesLayoutSpacing100) {
                Group {
                    if isParent {
                        Image(systemName: "chevron.right")
                            .font(.caption.weight(.semibold))
                            .rotationEffect(.degrees(open ? 90 : 0))
                            .foregroundColor(KozmosColors.primitivesColorsForeground400)
                    }
                }
                .frame(width: 16)
                icon
                text
                Spacer(minLength: 0)
            }
            .padding(.leading, CGFloat(depth) * kozmosTreeIndent)
            .padding(.vertical, density.verticalPadding)
            .padding(.horizontal, KozmosDimensions.primitivesLayoutSpacing100)
            .frame(minHeight: 44)
            .background(
                RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl, style: .continuous)
                    .fill(selected ? KozmosColors.semanticsHoverFill : Color.clear)
            )
            .overlay(
                RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl, style: .continuous)
                    .strokeBorder(focused ? KozmosColors.primitivesColorsTheme600 : Color.clear, lineWidth: 2)
            )
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .disabled(node.isDisabled)
        .padding(.horizontal, bleed)
        // The open row's surface, and the stroke under the row, outside its
        // height: the row and its stroke, as a row and a separator.
        .background(divided && open ? KozmosColors.primitivesColorsBackground50 : Color.clear)
        .padding(.bottom, divided ? 1 : 0)
        .background(alignment: .bottom) {
            if divided { KozmosColors.semanticsBorderSubtle.frame(height: 1) }
        }
        .accessibilityValue(isParent ? (open ? "Expanded" : "Collapsed") : "")
        .accessibilityAddTraits(selected ? .isSelected : [])
    }

    private var icon: some View {
        Group {
            if node.children != nil {
                // A theme-coloured icon: theme 600 (decision 59).
                Image(systemName: "folder")
                    .foregroundColor(KozmosColors.primitivesColorsTheme600)
            } else {
                Image(systemName: "doc")
                    .foregroundColor(KozmosColors.primitivesColorsForeground400)
            }
        }
    }

    @ViewBuilder
    private var text: some View {
        let name = HStack(spacing: KozmosDimensions.primitivesLayoutSpacing75) {
            Text(node.value)
                .foregroundColor(KozmosColors.primitivesColorsForeground100)
                .lineLimit(node.meta != nil && metaPlacement == .inline ? 1 : nil)
            if let count = node.count { KozmosTreeCount(text: count) }
        }
        if let meta = node.meta {
            let words = Text(meta)
                .font(KozmosTypography.caption)
                .foregroundColor(KozmosColors.primitivesColorsForeground400)
            switch metaPlacement {
            case .inline:
                name
                Spacer(minLength: KozmosDimensions.primitivesLayoutSpacing100)
                words.lineLimit(1).fixedSize()
            case .below:
                // A second line, so the name is never cut short for it (GAP-107).
                VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing25) {
                    name
                    words.fixedSize(horizontal: false, vertical: true)
                }
            }
        } else {
            name
        }
    }
}

/// A section heading (GAP-151): its name in the theme's colour, 11 and
/// medium, and its count; no stroke and no surface. A heading to VoiceOver.
struct KozmosTreeSectionRow: View {
    let node: Node
    let depth: Int
    let density: KozmosTreeDensity
    let bleed: CGFloat

    var body: some View {
        HStack(spacing: KozmosDimensions.primitivesLayoutSpacing75) {
            Text(node.value)
                .font(KozmosTypography.caption2.weight(.medium))
                .foregroundColor(KozmosColors.primitivesColorsTheme600)
            if let count = node.count { KozmosTreeCount(text: count) }
            Spacer(minLength: 0)
        }
        .padding(.leading, CGFloat(depth) * kozmosTreeIndent)
        .padding(.horizontal, KozmosDimensions.primitivesLayoutSpacing100)
        .frame(minHeight: density.sectionMinHeight)
        .padding(.horizontal, bleed)
        .accessibilityElement(children: .combine)
        .accessibilityAddTraits(.isHeader)
    }
}
