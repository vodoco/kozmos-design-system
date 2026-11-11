import SwiftUI

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
}

public struct Node: Identifiable, Hashable {
    public let id = UUID()
    public let value: String
    public let children: [Node]?
    
    public init(value: String, children: [Node]? = nil) {
        self.value = value
        self.children = children
    }
}

public struct KozmosTree: View {
    let nodes: [Node]
    let density: KozmosTreeDensity
    let divided: Bool
    let bleed: CGFloat

    /// The open parents of a divided tree, by their place in it: a node's id
    /// is new each time a product builds its nodes, its place is not.
    @State private var expanded: Set<[Int]> = []

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
    public init(nodes: [Node], density: KozmosTreeDensity = .default, divided: Bool = false, bleed: CGFloat = 0) {
        self.nodes = nodes
        self.density = density
        self.divided = divided
        self.bleed = max(0, bleed)
    }

    /// A divided tree with these parents open, by their place: for tests.
    init(nodes: [Node], density: KozmosTreeDensity = .default, divided: Bool, bleed: CGFloat = 0, expanded: Set<[Int]>) {
        self.init(nodes: nodes, density: density, divided: divided, bleed: bleed)
        self._expanded = State(initialValue: expanded)
    }

    public var body: some View {
        if divided {
            dividedTree
        } else {
            List(nodes, children: \.children) { node in
                Self.label(for: node)
                    .padding(.vertical, density.verticalPadding)
            }
        }
    }

    // MARK: - Divided (GAP-201)

    /// A row of a divided tree, flattened in reading order.
    struct DividedRow: Identifiable {
        let path: [Int]
        let node: Node
        var id: [Int] { path }
        var depth: Int { path.count - 1 }
        var isParent: Bool { !(node.children ?? []).isEmpty }
    }

    /// The rows a divided tree draws: every root, and the children of each
    /// open parent under it.
    static func dividedRows(_ nodes: [Node], expanded: Set<[Int]>, prefix: [Int] = []) -> [DividedRow] {
        nodes.enumerated().flatMap { index, node -> [DividedRow] in
            let path = prefix + [index]
            let row = DividedRow(path: path, node: node)
            guard row.isParent, expanded.contains(path) else { return [row] }
            return [row] + dividedRows(node.children ?? [], expanded: expanded, prefix: path)
        }
    }

    private var dividedTree: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                ForEach(Self.dividedRows(nodes, expanded: expanded)) { row in
                    dividedRow(row)
                }
            }
        }
        // Wider than its slot by the bleed on each side, so the strokes and
        // the surface reach the panel's edges; each row takes it back inside.
        .padding(.horizontal, -bleed)
    }

    private func dividedRow(_ row: DividedRow) -> some View {
        let open = row.isParent && expanded.contains(row.path)
        return KozmosTreeDividedRow(node: row.node, depth: row.depth, isParent: row.isParent, open: open,
                                    density: density, bleed: bleed) {
            if open { expanded.remove(row.path) } else { expanded.insert(row.path) }
        }
    }

    static func label(for node: Node) -> some View {
        HStack {
            if node.children != nil {
               // A theme-coloured icon: theme 600 (decision 59).
               Image(systemName: "folder")
                    .foregroundColor(KozmosColors.primitivesColorsTheme600)
            } else {
                Image(systemName: "doc")
                    .foregroundColor(.gray)
            }
            Text(node.value)
        }
    }
}

/// A divided tree's row (GAP-201): the row, an open parent's surface under
/// it, and the stroke under the row, outside its height. A parent says to
/// VoiceOver whether it is open.
struct KozmosTreeDividedRow: View {
    let node: Node
    let depth: Int
    let isParent: Bool
    let open: Bool
    let density: KozmosTreeDensity
    let bleed: CGFloat
    let toggle: () -> Void

    var body: some View {
        Button {
            if isParent { toggle() }
        } label: {
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
                KozmosTree.label(for: node)
                Spacer(minLength: 0)
            }
            .padding(.leading, CGFloat(depth) * 20)
            .padding(.vertical, density.verticalPadding)
            .padding(.horizontal, KozmosDimensions.primitivesLayoutSpacing100)
            .frame(minHeight: 44)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .padding(.horizontal, bleed)
        // The open row's surface, and the stroke under the row, outside its
        // height: the row and its stroke, as a row and a separator.
        .background(open ? KozmosColors.primitivesColorsBackground50 : Color.clear)
        .padding(.bottom, 1)
        .background(alignment: .bottom) {
            KozmosColors.semanticsBorderSubtle.frame(height: 1)
        }
        .accessibilityValue(isParent ? (open ? "Expanded" : "Collapsed") : "")
    }
}
