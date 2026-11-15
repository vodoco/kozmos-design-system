import SwiftUI

/// A persona's colour mark (GAP-106): a small diamond in the persona's
/// colour, as Pointr Cloud marks each persona in its Map Persona Visibility
/// list.
///
/// The colour is product data, the persona's own, drawn as given in both
/// appearances, as `KozmosCategoryTint` takes a category's. Beside the
/// persona's name the mark is decoration, hidden from VoiceOver, so the name
/// is read once; given `name`, it stands alone, an image named by it.
///
/// Drawn as React's `<PersonaMark>` is: 12 by 12, a square turned an eighth,
/// its points on the box's edges.
public struct KozmosPersonaMark: View {
    let color: Color
    let name: String?

    /// - Parameters:
    ///   - color: The persona's colour, as the product holds it.
    ///   - name: The persona's name, for a mark that stands alone. Leave it
    ///     out when the name is shown beside the mark.
    public init(color: Color, name: String? = nil) {
        self.color = color
        self.name = name
    }

    public var body: some View {
        if let name {
            KozmosPersonaDiamond(color: color)
                .accessibilityElement()
                .accessibilityLabel(Text(verbatim: name))
                .accessibilityAddTraits(.isImage)
        } else {
            KozmosPersonaDiamond(color: color)
                .accessibilityHidden(true)
        }
    }
}

/// One persona in a `KozmosPersonaMarkGroup`: its name and its colour.
public struct KozmosPersonaMarkPersona: Hashable {
    public let name: String
    public let color: Color

    public init(name: String, color: Color) {
        self.name = name
        self.color = color
    }
}

/// The personas something is visible to, as a row of marks 2 apart: a tree
/// row's "Assigned personas" (GAP-106).
///
/// One VoiceOver element, an image read as `label` and every persona's name:
/// "Assigned personas: Customer, Visitor". With no persona it draws nothing.
public struct KozmosPersonaMarkGroup: View {
    let personas: [KozmosPersonaMarkPersona]
    let label: String

    /// - Parameters:
    ///   - personas: The personas, each drawn as its mark, in this order.
    ///   - label: What the group is, read before the names. English by
    ///     default; pass the product's own words.
    public init(_ personas: [KozmosPersonaMarkPersona], label: String = "Assigned personas") {
        self.personas = personas
        self.label = label
    }

    /// What VoiceOver reads: the label, then the names.
    var spokenLabel: String {
        "\(label): \(personas.map(\.name).joined(separator: ", "))"
    }

    public var body: some View {
        if !personas.isEmpty {
            HStack(spacing: KozmosDimensions.primitivesLayoutSpacing25) {
                ForEach(Array(personas.enumerated()), id: \.offset) { _, persona in
                    KozmosPersonaDiamond(color: persona.color)
                }
            }
            .fixedSize()
            .accessibilityElement(children: .ignore)
            .accessibilityLabel(Text(verbatim: spokenLabel))
            .accessibilityAddTraits(.isImage)
        }
    }
}

/// The diamond, 12 by 12: React's `.kozmos-persona-mark-shape`. No token is 12.
struct KozmosPersonaDiamond: View {
    static let size: CGFloat = 12
    let color: Color

    var body: some View {
        KozmosDiamondShape()
            .fill(color)
            .frame(width: Self.size, height: Self.size)
    }
}

/// A square turned an eighth: its points on the rect's edge midpoints.
struct KozmosDiamondShape: Shape {
    func path(in rect: CGRect) -> Path {
        var path = Path()
        path.move(to: CGPoint(x: rect.midX, y: rect.minY))
        path.addLine(to: CGPoint(x: rect.maxX, y: rect.midY))
        path.addLine(to: CGPoint(x: rect.midX, y: rect.maxY))
        path.addLine(to: CGPoint(x: rect.minX, y: rect.midY))
        path.closeSubpath()
        return path
    }
}
