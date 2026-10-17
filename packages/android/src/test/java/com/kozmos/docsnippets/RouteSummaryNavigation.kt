// RouteSummary.mdx's Compose snippet, word for word below the package line:
// the Navigation section's tab, compiled here so a renamed or removed
// parameter fails the build. RouteSummaryActions.kt holds the Route preview
// tab.
package com.kozmos.docsnippets

import androidx.compose.runtime.Composable
import com.kozmos.components.directionstep.DirectionType
import com.kozmos.components.routeprogressrail.KozmosRouteProgressRail
import com.kozmos.components.routesummary.KozmosRouteSummary

@Composable
fun NavigationSummary() {
    KozmosRouteSummary(
        destination = "Airport Shuttles",
        durationText = "4 min",
        distanceText = "201 m",
        arrivalText = "Arrive 12:58",
        onEndRoute = {},
        progress = { KozmosRouteProgressRail(progress = 0.16f, type = DirectionType.Straight, label = "Step 1 of 4") }
    )
}
