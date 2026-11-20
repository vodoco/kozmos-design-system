// Surface.mdx's SwiftUI snippet ("Implementation"), word for word below this
// comment: compiled here, so a renamed or removed parameter fails in this
// target rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// A glass card over the map, placed as a view (GAP-207): the container
// radius unless given a shape of its own.
struct CardOverTheMap: View {
    var body: some View {
        KozmosSurface(variant: .glass) {
            Text("A card over the map")
                .padding(KozmosDimensions.primitivesLayoutSpacing200)
        }
        .kozmosElevation(KozmosShadows.semanticsElevationFloating)
    }
}
