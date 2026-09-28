import SwiftUI

/// What a surface is made of. Solid — the background colour with the subtle
/// border — is the default everywhere; glass, the glass surface role
/// composed from `Semantics.Effect.glass`, is a choice a product makes per
/// surface.
public enum KozmosSurfaceStyle: Sendable {
    case solid
    case glass
}

/// A surface in `shape`. Solid is the background colour with the subtle
/// border. Glass is the background colour at the token's opacity over the
/// system's thin material, which blurs what shows through — its blur and
/// saturation are the system's, where the web draws the token's numbers —
/// and an edge at the token's border opacity, light in both themes. With
/// Reduce Transparency on, glass is solid: a preference, not a look.
///
/// Glass is not the system's own (`glassEffect`, iOS 26): a hosted snapshot
/// renders it black, so every surface on it would be invisible to the
/// package's pixel tests and to CI's simulator step.
public struct KozmosSurface<S: InsettableShape>: ViewModifier {
    let shape: S
    let style: KozmosSurfaceStyle
    /// Tests set this; products leave it to the environment.
    let reduceTransparencyOverride: Bool?
    @Environment(\.accessibilityReduceTransparency) private var environmentReduceTransparency

    public init(shape: S, style: KozmosSurfaceStyle = .solid) {
        self.shape = shape
        self.style = style
        self.reduceTransparencyOverride = nil
    }

    init(shape: S, style: KozmosSurfaceStyle, reduceTransparency: Bool?) {
        self.shape = shape
        self.style = style
        self.reduceTransparencyOverride = reduceTransparency
    }

    private var reduceTransparency: Bool { reduceTransparencyOverride ?? environmentReduceTransparency }
    private var glass: GlassEffectToken { KozmosEffects.semanticsEffectGlass }
    private var effectiveStyle: KozmosSurfaceStyle { style == .glass && reduceTransparency ? .solid : style }

    public func body(content: Content) -> some View {
        switch effectiveStyle {
        case .solid:
            content
                .background(shape.fill(KozmosColors.primitivesColorsBackground0))
                .overlay(shape.strokeBorder(KozmosColors.semanticsBorderSubtle, lineWidth: 1))
        case .glass:
            content
                .background(
                    ZStack {
                        shape.fill(.ultraThinMaterial)
                        shape.fill(KozmosColors.primitivesColorsBackground0.opacity(glass.opacity))
                    }
                )
                .clipShape(shape)
                .overlay(shape.strokeBorder(Color.white.opacity(glass.borderOpacity), lineWidth: 1))
        }
    }
}

extension View {
    /// A surface in `shape`: solid by default, or the glass role.
    public func kozmosSurface<S: InsettableShape>(_ shape: S, style: KozmosSurfaceStyle = .solid) -> some View {
        modifier(KozmosSurface(shape: shape, style: style))
    }
}
