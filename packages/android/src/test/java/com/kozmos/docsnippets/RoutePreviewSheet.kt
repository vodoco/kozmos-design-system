// RoutePreviewPanel.mdx's Compose snippet, word for word below the package
// line: compiled here, and drawn and measured by
// KozmosAdaptiveMapShellHostedRouteTest. Change the two together.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import com.kozmos.components.adaptivemapshell.KozmosAdaptiveMapShell
import com.kozmos.components.routepreviewpanel.KozmosRoutePreviewPanel
import com.kozmos.contracts.KozmosRouteOptionPresentation
import com.kozmos.contracts.KozmosRouteReadiness

// The route preview is the sheet's whole content: under the handle its
// destination row starts as far down as it sits in, plus the handle's 4dp.
@Composable
fun RoutePreviewSheet(
    destination: String,
    options: List<KozmosRouteOptionPresentation>,
    status: KozmosRouteReadiness,
    map: @Composable () -> Unit,
    onSelect: (String) -> Unit,
    onBack: () -> Unit,
    onStart: (String) -> Unit
) {
    KozmosAdaptiveMapShell(
        map = map,
        panelLabel = "Directions",
        panel = {
            KozmosRoutePreviewPanel(
                destinationName = destination,
                options = options,
                status = status,
                backLabel = "Back",
                continueLabel = "Start",
                onOptionSelect = onSelect,
                onBack = onBack,
                onContinue = onStart
            )
        }
    )
}
