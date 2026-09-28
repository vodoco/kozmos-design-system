// RoutePreviewPanel.mdx's SwiftUI snippet, word for word below this comment:
// compiled here, and drawn and measured by KozmosMapShellHostedRouteTests.
// Change the two together.
import SwiftUI
import Kozmos

// The route preview is the sheet's whole content: under the grab handle its
// destination row starts as far down as it sits in, plus the handle's 4 points.
struct RoutePreviewSheet<MapContent: View>: View {
    let destination: String
    let options: [KozmosRouteOptionPresentation]
    let status: KozmosRouteReadiness
    let map: MapContent
    let onSelect: (String) -> Void
    let onBack: () -> Void
    let onStart: (String) -> Void

    var body: some View {
        KozmosAdaptiveMapShell(panelLabel: String(localized: "Directions")) {
            map
        } panel: {
            KozmosRoutePreviewPanel(
                destinationName: destination,
                options: options,
                status: status,
                backLabel: String(localized: "Back"),
                continueLabel: String(localized: "Start"),
                onOptionSelect: onSelect,
                onBack: onBack,
                onContinue: onStart
            )
        }
    }
}
