import SwiftUI

public enum KozmosOverlayPosition {
    case topLeft, topRight, bottomLeft, bottomRight, topCenter, bottomCenter
    /// Logical corners: start/end follow the interface direction.
    case topStart, topEnd, bottomStart, bottomEnd

    var isTop: Bool {
        switch self {
        case .topLeft, .topRight, .topCenter, .topStart, .topEnd: return true
        default: return false
        }
    }

    func alignment(in direction: LayoutDirection) -> Alignment {
        let rtl = direction == .rightToLeft
        switch self {
        case .topLeft: return rtl ? .topTrailing : .topLeading
        case .topRight: return rtl ? .topLeading : .topTrailing
        case .bottomLeft: return rtl ? .bottomTrailing : .bottomLeading
        case .bottomRight: return rtl ? .bottomLeading : .bottomTrailing
        case .topStart: return .topLeading
        case .topEnd: return .topTrailing
        case .bottomStart: return .bottomLeading
        case .bottomEnd: return .bottomTrailing
        case .topCenter: return .top
        case .bottomCenter: return .bottom
        }
    }
}

public struct KozmosMapOverlay<Content: View>: View {
    public var position: KozmosOverlayPosition
    public var content: () -> Content
    @Environment(\.layoutDirection) private var layoutDirection

    public init(position: KozmosOverlayPosition = .topLeft, @ViewBuilder content: @escaping () -> Content) {
        self.position = position
        self.content = content
    }

    public var body: some View {
        let alignment = position.alignment(in: layoutDirection)

        // ZStack mathematically mimics `absolute z-50` bounds natively isolating domain components
        ZStack(alignment: alignment) {
            KozmosColors.primitivesColorsBackground0.opacity(0.0001) // Transparent hit box forcing strict ZStack global projection coordinates 
                .ignoresSafeArea()
                .allowsHitTesting(false) // CRITICAL: Ensures the projection layer DOES NOT intercept map gestures!
            
            content()
                .padding(.horizontal, KozmosDimensions.primitivesLayoutSpacing200)
                .padding(.top, position.isTop ? KozmosDimensions.primitivesLayoutSpacing200 : KozmosDimensions.primitivesLayoutSpacing0)
                // Adds extra structural padding to evade iOS Home Indicator AND MapKit / MapLibre compass icons
                .padding(.bottom, !position.isTop ? KozmosDimensions.primitivesLayoutSpacing600 : KozmosDimensions.primitivesLayoutSpacing200)
                .frame(maxWidth: 384) // `md:w-96` analog limits
        }
    }
}
