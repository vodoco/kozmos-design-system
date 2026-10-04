import SwiftUI

/// Legacy spelling retained as a source-compatible alias of the shared semantic vocabulary.
public typealias DirectionType = KozmosDirectionKind

/// A direction's mark: an SF Symbol, or Pointr's wayfinding artwork by its
/// kind in `KozmosNavigationGlyphPaths`.
enum KozmosDirectionMark: Equatable {
    case symbol(String)
    case wayfinding(String)
}

extension KozmosDirectionKind {
    /// The mark React draws for each direction (2026-10-04): lifts,
    /// escalators, stairs, ramps, entry, exit, the turns, turning back and the
    /// destination are Pointr's wayfinding artwork from Pointr Maps - Express,
    /// filled; straight on, a level change, transition and walking keep the
    /// SF Symbols main drew.
    var mark: KozmosDirectionMark {
        switch self {
        case .straight: return .symbol("arrow.up")
        case .left: return .wayfinding("wf-hard-left")
        case .right: return .wayfinding("wf-hard-right")
        case .destination: return .wayfinding("wf-arriving")
        case .liftUp: return .wayfinding("lift-up")
        case .liftDown: return .wayfinding("lift-down")
        case .escalatorUp: return .wayfinding("escalator-up")
        case .escalatorDown: return .wayfinding("escalator-down")
        case .stairsUp: return .wayfinding("stairs-up")
        case .stairsDown: return .wayfinding("stairs-down")
        case .levelUp: return .symbol("arrow.up.to.line")
        case .levelDown: return .symbol("arrow.down.to.line")
        case .transition: return .symbol("arrow.forward.to.line")
        case .turnBack: return .wayfinding("wf-turn-back")
        case .walking: return .symbol("figure.walk")
        case .enter: return .wayfinding("enter")
        case .exit: return .wayfinding("exit")
        case .rampUp: return .wayfinding("ramp-up")
        case .rampDown: return .wayfinding("ramp-down")
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
                    KozmosDirectionGlyph(type: type, size: 24)
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
