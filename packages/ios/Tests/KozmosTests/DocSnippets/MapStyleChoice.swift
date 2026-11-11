// Radio.mdx's SwiftUI snippet ("Cards and tiles"), word for word below
// this comment: compiled here, so a renamed or removed parameter fails in
// this target rather than in a reader's project. Change the two together.
import SwiftUI
import Kozmos

// Each card or tile is one radio, named by its title, with its description
// as the hint; the image or icon is decoration. A chosen card shows its dot,
// a chosen tile its check, and both a heavier edge: never colour alone.
struct MapStyleChoice: View {
    @State private var style = "vector"
    @State private var transition = "fade"

    var body: some View {
        VStack(spacing: 16) {
            KozmosRadioGroup {
                HStack(alignment: .top) {
                    KozmosRadioGroupItem(value: "vector", label: "Vector", description: "Drawn from map data", variant: .card, selection: $style) {
                        Image("vector-preview").resizable().scaledToFill().frame(height: 80)
                    }
                    KozmosRadioGroupItem(value: "satellite", label: "Satellite", description: "Aerial imagery", variant: .card, selection: $style) {
                        Image("satellite-preview").resizable().scaledToFill().frame(height: 80)
                    }
                }
            }
            KozmosRadioGroup {
                LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 3)) {
                    KozmosRadioGroupItem(value: "fade", label: "Fade", variant: .tile, selection: $transition) {
                        Image(systemName: "circle.lefthalf.filled")
                    }
                    KozmosRadioGroupItem(value: "slide", label: "Slide", variant: .tile, selection: $transition) {
                        Image(systemName: "arrow.right")
                    }
                    KozmosRadioGroupItem(value: "zoom", label: "Zoom", variant: .tile, selection: $transition) {
                        Image(systemName: "plus.magnifyingglass")
                    }
                }
            }
        }
    }
}
