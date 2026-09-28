// Do not edit directly, this file was auto-generated.
import SwiftUI
#if canImport(UIKit)
import UIKit
#elseif canImport(AppKit)
import AppKit
#endif

/// The elevation roles, mirroring `Semantics.Elevation` in `packages/tokens` —
/// which aliases `shadow.sm` / `shadow.md` / `shadow.lg` / `shadow.xl` — in
/// both themes. `pnpm tokens:elevation:check` holds every number in this file
/// to `tokens-light.json` and `tokens-dark.json`.
///
/// Dark mode deepens the alpha — 0.05 / 0.1 / 0.1 / 0.16+0.08+0.12 becomes 0.3
/// / 0.4 / 0.5 / 0.4+0.2+0.3 — so a surface still reads as lifted against a
/// dark page.
public struct ShadowToken {
    public let color: Color
    public let radius: CGFloat
    public let x: CGFloat
    public let y: CGFloat

    public init(color: Color, radius: CGFloat, x: CGFloat, y: CGFloat) {
        self.color = color
        self.radius = radius
        self.x = x
        self.y = y
    }
}

/// A shadow colour that follows the appearance. Resolved at draw time, so a
/// `static let` built from it still changes when the appearance does.
func kozmosShadowColor(
    light: (Double, Double, Double, Double),
    dark: (Double, Double, Double, Double)
) -> Color {
    #if canImport(UIKit)
    return Color(UIColor { traits in
        let c = traits.userInterfaceStyle == .dark ? dark : light
        return UIColor(red: c.0, green: c.1, blue: c.2, alpha: c.3)
    })
    #elseif canImport(AppKit)
    return Color(NSColor(name: nil, dynamicProvider: { appearance in
        let c = appearance.bestMatch(from: [.aqua, .darkAqua]) == .darkAqua ? dark : light
        return NSColor(red: c.0, green: c.1, blue: c.2, alpha: c.3)
    }))
    #else
    return Color(red: light.0, green: light.1, blue: light.2, opacity: light.3)
    #endif
}

public struct KozmosShadows {
    /// Flush: casts nothing. Not a step on the scale — it is what a surface
    /// meeting an edge needs, and having it here keeps a conditional at a call
    /// site reading as a role rather than reverting to a literal.
    public static let none = ShadowToken(color: .clear, radius: 0, x: 0, y: 0)

    /// A surface lifted just off the page: cards, list rows. Barely there on
    /// purpose — the surface and its border do the work.
    public static let semanticsElevationRaised = ShadowToken(color: kozmosShadowColor(light: (0, 0, 0, 0.05), dark: (0, 0, 0, 0.3)), radius: 4, x: 0, y: 2)

    /// A control floating over content it does not belong to: map chrome, a
    /// search bar over a map, a content card presented on top of the map, a
    /// status message.
    public static let semanticsElevationFloating = ShadowToken(color: kozmosShadowColor(light: (0, 0, 0, 0.1), dark: (0, 0, 0, 0.4)), radius: 8, x: 0, y: 4)

    /// Above everything, with what is behind it dimmed or ignored: dialogs,
    /// drawers, tooltips, popovers, detail panels, and the map panels that take
    /// focus.
    public static let semanticsElevationOverlay = ShadowToken(color: kozmosShadowColor(light: (0, 0, 0, 0.1), dark: (0, 0, 0, 0.5)), radius: 16, x: 0, y: 8)

    /// A control over a map: zoom, compass, the location and step-free control,
    /// the floor tile. The SDK's own map controls cast it (decision 40): three
    /// layers, the key light first.
    ///
    /// Apply it with `kozmosElevation(_:in:fill:)`. Each layer's radius is half
    /// its CSS blur: SwiftUI's radius draws as a blur twice its size.
    public static let semanticsElevationMapControl: [ShadowToken] = [
        ShadowToken(color: kozmosShadowColor(light: (0, 0, 0, 0.16), dark: (0, 0, 0, 0.4)), radius: 4, x: 0, y: 8),
        ShadowToken(color: kozmosShadowColor(light: (0, 0, 0, 0.08), dark: (0, 0, 0, 0.2)), radius: 12, x: 0, y: 24),
        ShadowToken(color: kozmosShadowColor(light: (0, 0, 0, 0.12), dark: (0, 0, 0, 0.3)), radius: 16, x: 0, y: 0),
    ]
}

extension View {
    /// Apply an elevation role. Prefer this over a bare `.shadow(...)`: a
    /// literal is how the platform drifted to fifteen different shadows in the
    /// first place, and `pnpm tokens:elevation:check` counts what is left.
    public func kozmosElevation(_ token: ShadowToken) -> some View {
        shadow(color: token.color, radius: token.radius, x: token.x, y: token.y)
    }

    /// Apply a layered elevation role to a surface of this shape and fill.
    ///
    /// Each layer is cast by its own copy of the surface, behind the view.
    /// SwiftUI's `.shadow` shadows everything before it, shadows included, so
    /// layers stacked on one view would cast shadows of shadows. The copies are
    /// filled as the surface is, so where one shows, the surface does.
    public func kozmosElevation<S: Shape, F: ShapeStyle>(
        _ layers: [ShadowToken],
        in shape: S,
        fill: F
    ) -> some View {
        background {
            ZStack {
                ForEach(layers.indices, id: \.self) { index in
                    shape
                        .fill(fill)
                        .shadow(
                            color: layers[index].color,
                            radius: layers[index].radius,
                            x: layers[index].x,
                            y: layers[index].y
                        )
                }
            }
        }
    }
}
