// RouteSummary.mdx's SwiftUI snippet, word for word below this comment: the
// Navigation section's tab, compiled here so a renamed or removed parameter
// fails the build. RouteSummaryActions.swift holds the Route preview tab.
import SwiftUI
import Kozmos

struct NavigationSummary: View {
    var body: some View {
        KozmosRouteSummary(
            destination: "Airport Shuttles",
            durationText: "4 min",
            distanceText: "201 m",
            arrivalText: "Arrive 12:58",
            onEndRoute: {}
        ) {
            KozmosRouteProgressRail(progress: 0.16, type: .straight, label: "Step 1 of 4")
        }
    }
}
