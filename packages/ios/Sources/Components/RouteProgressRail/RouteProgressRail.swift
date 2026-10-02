import SwiftUI

/// How far along the route the visitor is, as a rail: a dot where it starts,
/// a disc carrying the current manoeuvre's arrow that travels the track, a dot
/// where it ends. Mirrors the product prototype's rail — 10-point dots, a
/// 34-point theme disc, a 6-point track.
///
/// VoiceOver hears the label the caller gives ("Step 2 of 4") and the
/// progress as a percentage; the rail updates as the route is walked.
public struct KozmosRouteProgressRail: View {
    let progress: Double
    let type: DirectionType
    let label: String

    public init(progress: Double, type: DirectionType, label: String) {
        self.progress = progress
        self.type = type
        self.label = label
    }

    static let dot: CGFloat = 10
    static let disc: CGFloat = 34
    static let track: CGFloat = 6

    /// Where the disc's leading edge sits for a progress, in a rail `width`
    /// wide: from just after the start dot to just before the end dot.
    static func discLeading(progress: Double, width: CGFloat) -> CGFloat {
        let clamped = CGFloat(normalizedProgress(progress))
        let travel = max(width - dot * 2 - disc, 0)
        return dot + travel * clamped
    }

    static func normalizedProgress(_ progress: Double) -> Double {
        progress.isFinite ? min(max(progress, 0), 1) : 0
    }

    private var clamped: Double { Self.normalizedProgress(progress) }

    public var body: some View {
        GeometryReader { geometry in
            let width = geometry.size.width
            ZStack(alignment: .leading) {
                Capsule()
                    .fill(KozmosColors.primitivesColorsBackground300)
                    .frame(width: max(width - Self.dot * 2, 0), height: Self.track)
                    .offset(x: Self.dot)
                Circle()
                    .fill(KozmosColors.primitivesColorsTheme500)
                    .frame(width: Self.dot, height: Self.dot)
                Circle()
                    .fill(KozmosColors.primitivesColorsBackground300)
                    .frame(width: Self.dot, height: Self.dot)
                    .offset(x: max(width - Self.dot, 0))
                Circle()
                    .fill(KozmosColors.primitivesColorsTheme500)
                    .frame(width: Self.disc, height: Self.disc)
                    .overlay(
                        Image(systemName: type.iconName)
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundColor(KozmosColors.primitivesColorsBackground0)
                    )
                    .offset(x: Self.discLeading(progress: clamped, width: width))
            }
            // Leading, not centred: the stack is only as wide as its widest
            // child, the track, and centring it would shift the rail by a dot.
            .frame(width: width, height: Self.disc, alignment: .leading)
        }
        .frame(height: Self.disc)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(label)
        .accessibilityValue("\(Int((clamped * 100).rounded())) percent")
        .accessibilityAddTraits(.updatesFrequently)
    }
}
