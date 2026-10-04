import SwiftUI

/// Legacy spelling retained as a source-compatible alias of the shared semantic vocabulary.
public typealias DirectionType = KozmosDirectionKind

/// A direction's mark: an SF Symbol, or a Pointr outline SF Symbols has no match for.
enum KozmosDirectionMark: Equatable {
    case symbol(String)
    case pointr(String)
}

extension KozmosDirectionKind {
    /// Only approved marks (D5, 2026-10-04): the SF Symbols main drew, with a
    /// level change by any means showing its direction of travel and the words
    /// naming the lift, escalator or stairs; the walking figure; and Pointr's
    /// LogIn01, LogOut01, ArrowUpRight and ArrowDownRight, as React draws them.
    /// The original transport artwork awaits design approval: `KozmosIcon`
    /// draws it by name, and no direction does.
    var mark: KozmosDirectionMark {
        switch self {
        case .straight: return .symbol("arrow.up")
        case .left: return .symbol("arrow.turn.up.left")
        case .right: return .symbol("arrow.turn.up.right")
        case .destination: return .symbol("mappin.and.ellipse")
        case .liftUp, .escalatorUp, .stairsUp, .levelUp: return .symbol("arrow.up.to.line")
        case .liftDown, .escalatorDown, .stairsDown, .levelDown: return .symbol("arrow.down.to.line")
        case .transition: return .symbol("arrow.forward.to.line")
        case .turnBack: return .symbol("arrow.uturn.backward")
        case .walking: return .symbol("figure.walk")
        case .enter: return .pointr("log-in-01")
        case .exit: return .pointr("log-out-01")
        case .rampUp: return .pointr("arrow-up-right")
        case .rampDown: return .pointr("arrow-down-right")
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
