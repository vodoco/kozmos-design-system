import SwiftUI

/// Theme guidance is opaque; background guidance uses the requested surface material.
public enum KozmosManoeuvreAppearance: Sendable {
    case theme, background
}

private struct KozmosGuidanceForegroundKey: EnvironmentKey {
    static let defaultValue: Color? = nil
}

extension EnvironmentValues {
    var kozmosGuidanceForeground: Color? {
        get { self[KozmosGuidanceForegroundKey.self] }
        set { self[KozmosGuidanceForegroundKey.self] = newValue }
    }
}

struct KozmosGuidanceSurface: ViewModifier {
    let appearance: KozmosManoeuvreAppearance
    let surface: KozmosSurfaceStyle
    private var shape: RoundedRectangle {
        RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusContainer, style: .continuous)
    }
    func body(content: Content) -> some View {
        if appearance == .theme {
            content
                .foregroundColor(KozmosColors.primitivesColorsForeground1000)
                .environment(\.kozmosGuidanceForeground, KozmosColors.primitivesColorsForeground1000)
                .environment(\.kozmosSurfaceStyle, .solid)
                .background(shape.fill(KozmosColors.primitivesColorsTheme600))
        } else {
            content.environment(\.kozmosGuidanceForeground, nil).kozmosSurface(shape, style: surface)
        }
    }
}
