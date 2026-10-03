import SwiftUI

/// One drawing for card, itinerary, step and progress. Physical navigation never mirrors for RTL.
struct KozmosDirectionGlyph: View {
    let type: DirectionType
    let size: CGFloat
    var body: some View {
        Group {
            if let path = KozmosNavigationGlyphPaths.path(type.rawValue) {
                path.applying(CGAffineTransform(scaleX: size / 24, y: size / 24))
                    .stroke(style: StrokeStyle(lineWidth: size / 12, lineCap: .round, lineJoin: .round))
                    .frame(width: size, height: size)
            } else {
                Image(systemName: type.iconName).font(.system(size: size, weight: .semibold))
            }
        }
        .environment(\.layoutDirection, .leftToRight)
        .accessibilityHidden(true)
    }
}
