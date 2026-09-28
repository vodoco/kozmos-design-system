import SwiftUI

/// What a surface is made of. Solid — the background colour with the subtle
/// border — is the default everywhere; glass, the glass surface role
/// composed from `Semantics.Effect.glass`, is a choice a product makes per
/// surface.
public enum KozmosSurfaceStyle: Sendable {
    case solid
    case glass
}

private struct KozmosSurfaceStyleKey: EnvironmentKey {
    static let defaultValue: KozmosSurfaceStyle? = nil
}

public extension EnvironmentValues {
    /// The Kozmos surface the content is drawn on, as the nearest
    /// `kozmosSurface(_:style:)` says it, and as the map shell's panel and a
    /// details card's bordered presentations say it; nil where there is
    /// none. On glass, text that is muted elsewhere takes the foreground
    /// colour, so it reads at 4.5:1 over whatever shows through (decision
    /// 48), as the web's glass surface says with
    /// `--kozmos-surface-muted-foreground`.
    var kozmosSurfaceStyle: KozmosSurfaceStyle? {
        get { self[KozmosSurfaceStyleKey.self] }
        set { self[KozmosSurfaceStyleKey.self] = newValue }
    }
}

/// Text that is muted elsewhere, as it is drawn on `surface` (decision 48):
/// on glass the foreground colour, so it reads at 4.5:1 over any map, where
/// muted it read under 3:1 over a saturated one; elsewhere `muted`, the
/// muted colour unless the text has its own.
func kozmosMutedForeground(
    on surface: KozmosSurfaceStyle?, muted: Color = KozmosColors.primitivesColorsForeground500
) -> Color {
    surface == .glass ? KozmosColors.primitivesColorsForeground100 : muted
}

/// Text that is muted elsewhere, drawn on the surface under it: on glass the
/// foreground colour (decision 48), elsewhere `muted`. It reads
/// `kozmosSurfaceStyle` where the text is, so it follows the card or panel
/// it sits in without being told.
struct KozmosMutedText: ViewModifier {
    @Environment(\.kozmosSurfaceStyle) private var surface
    let muted: Color

    func body(content: Content) -> some View {
        content.foregroundColor(kozmosMutedForeground(on: surface, muted: muted))
    }
}

extension View {
    /// Draws this text muted, or in the foreground colour on glass (decision
    /// 48). `muted` is its colour elsewhere.
    func kozmosMutedText(_ muted: Color = KozmosColors.primitivesColorsForeground500) -> some View {
        modifier(KozmosMutedText(muted: muted))
    }
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
        // What the content holds is drawn on this surface: its muted text
        // reads it (decision 48). The style as asked, not as drawn: with
        // transparency reduced glass is solid, and its text stays in the
        // foreground colour, as the web's does.
        let content = content.environment(\.kozmosSurfaceStyle, style)
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
