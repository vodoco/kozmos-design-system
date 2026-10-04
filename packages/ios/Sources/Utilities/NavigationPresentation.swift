import SwiftUI

public enum KozmosRoutePresentation: Sendable { case standalone, hosted }

/// Hosted content leaves panel material and all outer padding to its container.
struct KozmosRoutePanelSurface: ViewModifier {
    let presentation: KozmosRoutePresentation
    let surface: KozmosSurfaceStyle
    @ViewBuilder func body(content: Content) -> some View {
        if presentation == .hosted { content } else {
            content.padding(KozmosDimensions.primitivesLayoutSpacing200)
                .kozmosSurface(RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusPanel, style: .continuous), style: surface)
                .kozmosElevation(KozmosShadows.semanticsElevationOverlay)
        }
    }
}

struct KozmosDestinationImage: View {
    let source: String
    var body: some View {
        AsyncImage(url: URL(string: source)) { phase in
            if let image = phase.image { image.resizable().scaledToFill() } else {
                Image(systemName: "mappin").font(.system(size: 20))
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
        .frame(width: 48, height: 48)
        .foregroundColor(KozmosColors.primitivesColorsForeground100)
        .background(KozmosColors.primitivesColorsBackground100)
        .clipShape(RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl))
        .accessibilityHidden(true)
    }
}
