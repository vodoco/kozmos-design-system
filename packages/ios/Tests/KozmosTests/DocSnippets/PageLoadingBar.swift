// Progress.mdx's SwiftUI snippet ("At the top of the page"), word for word
// below this comment: compiled here, so a renamed or removed parameter fails
// in this target rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// The screen's loading bar: 4 tall, edge to edge, at the top while the
// content loads. VoiceOver hears "Loading" once as it appears; under
// Reduce Motion the segment stands still.
struct PageLoadingBar: View {
    let isLoading: Bool

    var body: some View {
        List {
            Text("Map content")
        }
        .overlay(alignment: .top) {
            if isLoading {
                KozmosProgress(placement: .top, label: "Loading the map")
            }
        }
    }
}
