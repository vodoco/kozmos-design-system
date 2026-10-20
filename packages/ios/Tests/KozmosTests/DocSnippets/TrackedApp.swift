// AnalyticsProvider.mdx's SwiftUI snippet, word for word below this comment:
// compiled here, so a renamed or removed parameter fails in this target
// rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// The events of the parts inside arrive in batches, each 2000ms after its
// first event by default, and what is left when this view leaves the
// hierarchy. onDispatch is called on the main thread.
struct TrackedApp<Content: View>: View {
    let send: ([KozmosAnalyticsEvent]) -> Void
    @ViewBuilder let content: Content

    var body: some View {
        content.kozmosAnalytics(onDispatch: send)
    }
}
