import SwiftUI

/// One drawing for card, itinerary, step and progress. Physical navigation never mirrors for RTL.
struct KozmosDirectionGlyph: View {
    let type: DirectionType
    let size: CGFloat
    var body: some View {
        Group {
            switch type.mark {
            case .symbol(let name):
                Image(systemName: name).font(.system(size: size, weight: .semibold))
            case .pointr(let name):
                KozmosPointrGlyph.named(name).map {
                    $0.stroke(style: KozmosPointrGlyph.style(size: size)).frame(width: size, height: size)
                }
            }
        }
        .environment(\.layoutDirection, .leftToRight)
        .accessibilityHidden(true)
    }
}
