import SwiftUI

/// What a step of a route asks for. The four turns, and the transitions the
/// routing engines describe: a level change by lift, escalator or stairs —
/// up or down — or by something unnamed; a same-level transition, a
/// walkway or a corridor to another building; and turning back. Each
/// platform draws the closest glyph its own icon set has, and the
/// instruction's words carry the rest.
public enum DirectionType: Sendable, CaseIterable {
    case straight, left, right, destination
    case liftUp, liftDown
    case escalatorUp, escalatorDown
    case stairsUp, stairsDown
    /// A level change by a transition the route does not name.
    case levelUp, levelDown
    /// A transition on the same level: a walkway, a corridor, another building.
    case transition
    case turnBack

    /// SF Symbols has no lift and no escalator: those, and an unnamed level
    /// change, show the direction of travel; stairs have their own figure.
    var iconName: String {
        switch self {
        case .straight: return "arrow.up"
        case .left: return "arrow.turn.up.left"
        case .right: return "arrow.turn.up.right"
        case .destination: return "mappin.and.ellipse"
        case .liftUp, .escalatorUp, .levelUp: return "arrow.up.to.line"
        case .liftDown, .escalatorDown, .levelDown: return "arrow.down.to.line"
        case .stairsUp, .stairsDown: return "figure.stairs"
        case .transition: return "arrow.forward.to.line"
        case .turnBack: return "arrow.uturn.backward"
        }
    }
}

public struct KozmosDirectionStep: View {
    let type: DirectionType
    let instructionParts: [KozmosInstructionPart]
    var instruction: String { instructionParts.map(\.text).joined() }
    let distance: String?
    let duration: String?
    
    public init(type: DirectionType, instruction: String, distance: String? = nil, duration: String? = nil) {
        self.init(type: type, instruction: [KozmosInstructionPart(text: instruction)], distance: distance, duration: duration)
    }

    public init(type: DirectionType, instruction: [KozmosInstructionPart], distance: String? = nil, duration: String? = nil) {
        self.type = type
        self.instructionParts = instruction
        self.distance = distance
        self.duration = duration
    }

    /// What VoiceOver reads for a step: the instruction, then the distance
    /// and the duration, as one element. The arrow says nothing the
    /// instruction does not, and a system symbol left audible reads its own
    /// description — "Up", or "Remove Map Pin" for the destination.
    static func accessibilityDescription(instruction: String, distance: String?, duration: String?) -> String {
        [instruction, distance, duration].compactMap { $0 }.filter { !$0.isEmpty }.joined(separator: ", ")
    }
    
    public var body: some View {
        HStack(spacing: KozmosDimensions.primitivesLayoutSpacing150) {
            Circle()
                .fill(KozmosColors.primitivesColorsTheme500.opacity(0.1))
                .frame(width: KozmosDimensions.primitivesLayoutSizing500, height: KozmosDimensions.primitivesLayoutSizing500)
                .overlay(
                    Image(systemName: type.iconName)
                        .foregroundColor(KozmosColors.primitivesColorsTheme500)
                )
                .accessibilityHidden(true)
            
            VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing25) {
                KozmosInstructionText(parts: instructionParts)
                    .font(KozmosTypography.body)
                    .fontWeight(.medium)
                
                let metrics = [distance, duration].compactMap { $0 }.filter { !$0.isEmpty }.joined(separator: " • ")
                if !metrics.isEmpty {
                    Text(metrics)
                        .font(KozmosTypography.caption)
                        .foregroundColor(KozmosColors.primitivesColorsForeground500)
                }
            }
            Spacer()
        }
        .padding()
        .background(KozmosColors.primitivesColorsBackground0)
        .cornerRadius(KozmosDimensions.primitivesLayoutSpacing150)
        .overlay(
            RoundedRectangle(cornerRadius: KozmosDimensions.primitivesLayoutSpacing150)
                .stroke(KozmosColors.primitivesColorsBackground300, lineWidth: 1)
        )
        .kozmosInstructionAccessibility(instructionParts, suffix: [distance, duration].compactMap { $0 })
    }
}
