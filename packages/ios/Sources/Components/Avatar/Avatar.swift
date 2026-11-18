import SwiftUI

/// An Avatar's size, as React's `size` (decision 221).
public enum KozmosAvatarSize: Equatable, Sendable, CaseIterable {
    /// 40, the Avatar as it always was.
    case `default`
    /// 24, its initials in the caption type: for a row that keeps its own
    /// height, such as an option's media (decision 215).
    case sm

    /// Its width and height.
    public var dimension: CGFloat {
        self == .sm ? KozmosDimensions.primitivesLayoutSizing300 : KozmosDimensions.primitivesLayoutSizing500
    }
}

public struct KozmosAvatar: View {
    let imageURL: URL?
    let fallbackText: String
    let size: KozmosAvatarSize

    /// `size` is `.default`, 40, or `.sm`, 24 (decision 221).
    public init(imageURL: URL?, fallbackText: String, size: KozmosAvatarSize = .default) {
        self.imageURL = imageURL
        self.fallbackText = fallbackText
        self.size = size
    }

    private var fallbackFont: Font { size == .sm ? KozmosTypography.caption : KozmosTypography.headline }
    
    public var body: some View {
        Group {
            if let imageURL = imageURL {
                AsyncImage(url: imageURL) { image in
                    image.resizable()
                } placeholder: {
                    Text(fallbackText)
                        .font(fallbackFont)
                        .foregroundColor(KozmosColors.primitivesColorsBackground0)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .background(KozmosColors.primitivesColorsBackground500)
                }
            } else {
                Text(fallbackText)
                    .font(fallbackFont)
                    .foregroundColor(KozmosColors.primitivesColorsBackground0)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(KozmosColors.primitivesColorsBackground500)
            }
        }
        .frame(width: size.dimension, height: size.dimension)
        .clipShape(Circle())
    }
}
