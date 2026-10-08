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
    
    public init(nodes: [Node], density: KozmosTreeDensity = .default) {
        self.nodes = nodes
        self.density = density
    }
    
    public var body: some View {
        List(nodes, children: \.children) { node in
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
            .padding(.vertical, density.verticalPadding)
        }
    }
}
