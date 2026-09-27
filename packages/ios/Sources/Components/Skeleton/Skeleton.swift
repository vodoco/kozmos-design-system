import SwiftUI

/// A placeholder while content loads: the surface's grey, with a sheen passing
/// across it — held still when the visitor has asked for less motion (GAP-50,
/// where the shimmer ran whatever the preference said, as React's pulse did).
public struct KozmosSkeleton: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var phase: CGFloat = 0

    public init() {}
    
    public var body: some View {
        Rectangle()
            .fill(KozmosColors.primitivesColorsBackground300)
            .overlay(
                GeometryReader { geometry in
                    Rectangle()
                        .fill(
                            LinearGradient(
                                gradient: Gradient(colors: [.clear, .white.opacity(0.4), .clear]),
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .offset(x: -geometry.size.width + (geometry.size.width * 2 * phase))
                        .animation(
                            reduceMotion
                                ? nil
                                : Animation.linear(duration: 1.5)
                                    .repeatForever(autoreverses: false),
                            value: phase
                        )
                }
            )
            .mask(Rectangle())
            .onAppear {
                guard !reduceMotion else { return }
                phase = 1
            }
    }
}
