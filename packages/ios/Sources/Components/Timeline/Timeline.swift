import SwiftUI

public enum KozmosTimelineDensity {
    case `default`
    case compact

    var contentSpacing: CGFloat {
        switch self {
        case .default:
            return KozmosDimensions.primitivesLayoutSpacing50
        case .compact:
            return KozmosDimensions.primitivesLayoutSpacing25
        }
    }

    var itemBottomPadding: CGFloat {
        switch self {
        case .default:
            return KozmosDimensions.primitivesLayoutSpacing400
        case .compact:
            return KozmosDimensions.primitivesLayoutSpacing200
        }
    }
}

private struct KozmosTimelineDensityKey: EnvironmentKey {
    static let defaultValue: KozmosTimelineDensity = .default
}

private extension EnvironmentValues {
    var kozmosTimelineDensity: KozmosTimelineDensity {
        get { self[KozmosTimelineDensityKey.self] }
        set { self[KozmosTimelineDensityKey.self] = newValue }
    }
}

public struct TimelineItem: Identifiable {
    public let id = UUID()
    public let time: String
    public let title: String
    public let description: String
    
    public init(time: String, title: String, description: String) {
        self.time = time
        self.title = title
        self.description = description
    }
}

public struct KozmosTimeline<Content: View>: View {
    let content: Content
    let density: KozmosTimelineDensity
    
    public init(
        density: KozmosTimelineDensity = .default,
        @ViewBuilder content: () -> Content
    ) {
        self.density = density
        self.content = content()
    }
    
    public var body: some View {
        VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing0) {
            content
        }
        .environment(\.kozmosTimelineDensity, density)
        .padding()
    }
}

public struct KozmosTimelineItem<Content: View>: View {
    @Environment(\.kozmosTimelineDensity) private var density

    let content: Content
    let isLast: Bool
    
    public init(isLast: Bool = false, @ViewBuilder content: () -> Content) {
        self.isLast = isLast
        self.content = content()
    }
    
    public var body: some View {
        HStack(alignment: .top, spacing: KozmosDimensions.primitivesLayoutSpacing200) {
            VStack(spacing: KozmosDimensions.primitivesLayoutSpacing0) {
                // The dot is a mark on the surface, theme 600 as React's, and
                // its halo a quiet tint of the same base (decision 59).
                Circle()
                    .fill(KozmosColors.primitivesColorsTheme600)
                    .frame(width: 12, height: 12)
                    .background(
                        Circle()
                            .fill(KozmosColors.primitivesColorsTheme600.opacity(0.2))
                            .frame(width: KozmosDimensions.primitivesLayoutSizing300, height: KozmosDimensions.primitivesLayoutSizing300)
                    )
                
                if !isLast {
                    Rectangle()
                        .fill(KozmosColors.primitivesColorsBackground300)
                        .frame(width: 2)
                        .frame(maxHeight: .infinity)
                        .padding(.top, KozmosDimensions.primitivesLayoutSpacing50)
                }
            }
            .frame(width: KozmosDimensions.primitivesLayoutSizing300)
            
            VStack(alignment: .leading, spacing: density.contentSpacing) {
                content
            }
            .padding(.bottom, !isLast ? density.itemBottomPadding : KozmosDimensions.primitivesLayoutSpacing0)
        }
        .fixedSize(horizontal: false, vertical: true)
    }
}

public struct KozmosTimelineTime: View {
    let time: String
    
    public init(_ time: String) {
        self.time = time
    }
    
    public var body: some View {
        Text(time)
            .font(KozmosTypography.caption)
            .foregroundColor(KozmosColors.primitivesColorsForeground500)
    }
}

public struct KozmosTimelineTitle: View {
    let title: String
    
    public init(_ title: String) {
        self.title = title
    }
    
    public var body: some View {
        Text(title)
            .font(KozmosTypography.headline)
            .foregroundColor(KozmosColors.primitivesColorsForeground100)
    }
}

public struct KozmosTimelineDescription: View {
    let description: String
    
    public init(_ description: String) {
        self.description = description
    }
    
    public var body: some View {
        Text(description)
            .font(KozmosTypography.body)
            .foregroundColor(KozmosColors.primitivesColorsForeground500)
            .fixedSize(horizontal: false, vertical: true)
    }
}
