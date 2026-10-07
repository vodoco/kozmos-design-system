// RouteSummary.mdx's SwiftUI snippets, word for word below this comment:
// compiled here, and laid out and measured by KozmosRouteSummaryActionsTests.
// Change the two together.
import SwiftUI
import Kozmos

// Static wayfinding: Previous and Next in the summary's actions. The host
// owns the step, disables the ends, and says the new step through its
// announcer, the one announcement owner.
struct StepByStepSummary: View {
    let steps: [String]
    let onEnd: () -> Void
    @State private var step = 0

    var body: some View {
        VStack(spacing: 0) {
            KozmosRouteSummary(
                destination: "Airport Shuttles",
                durationText: "4 min",
                distanceText: "201 m",
                onEndRoute: onEnd
            ) {
                KozmosRouteProgressRail(
                    progress: Double(step) / Double(max(steps.count - 1, 1)),
                    type: .straight,
                    label: steps[step]
                )
            } actions: {
                KozmosButton("Previous", variant: .outline, isDisabled: step == 0) { step -= 1 }
                KozmosButton("Next", isDisabled: step == steps.count - 1) { step += 1 }
            }
            KozmosNavigationAnnouncer(message: steps[step])
        }
    }
}

// The route preview: no End, the place's line under the destination, and
// Go and Details. The preview has no progress.
struct RoutePreviewSummary: View {
    let onGo: () -> Void
    let onDetails: () -> Void

    var body: some View {
        KozmosRouteSummary(
            destination: "Tessel Shoes",
            locationText: "Store · Level 1 · Harbour Point Mall",
            durationText: "3 min",
            distanceText: "205 m",
            progress: { EmptyView() },
            actions: {
                KozmosButton("Go", action: onGo)
                KozmosButton("Details", variant: .outline, action: onDetails)
            }
        )
    }
}
