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
            // Decision 59: the theme appearance is the brand card, a prominent
            // fill — the theme fill, theme 500 in both themes — and on it the
            // theme foreground, white in both. It was theme 600 under
            // foreground/1000, which is black in the dark.
            content
                .foregroundColor(KozmosColors.componentsPrimaryButtonsThemedButtonForegroundContentIdle)
                .environment(\.kozmosGuidanceForeground, KozmosColors.componentsPrimaryButtonsThemedButtonForegroundContentIdle)
                .environment(\.kozmosSurfaceStyle, .solid)
                .background(shape.fill(KozmosColors.componentsPrimaryButtonsThemedButtonBackgroundIdle))
        } else {
            content.environment(\.kozmosGuidanceForeground, nil).kozmosSurface(shape, style: surface)
        }
    }
}
