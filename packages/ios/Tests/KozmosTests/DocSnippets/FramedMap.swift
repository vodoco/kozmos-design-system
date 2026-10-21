// MapView.mdx's SwiftUI snippet, word for word below this comment: compiled
// here, so a renamed or removed parameter fails in this target rather than
// in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// The frame your map renderer sits in: a fill, a 1pt border, the control
// radius and a 400pt floor, always. There is no fill variant for a map that
// is the whole screen, and the frame names nothing: React's mapLabel and
// region have no counterpart.
struct FramedMap<Renderer: View>: View {
    let renderer: Renderer

    var body: some View {
        KozmosMapView {
            renderer
        }
    }
}
