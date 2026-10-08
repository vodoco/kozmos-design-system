import SwiftUI

public struct KozmosPagination<Content: View>: View {
    let content: Content
    
    public init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }
    
    public var body: some View {
        HStack(spacing: KozmosDimensions.primitivesLayoutSpacing50) {
            content
        }
    }
}

public struct KozmosPaginationLink: View {
    let isActive: Bool
    let text: String
    let action: () -> Void
    @Environment(\.kozmosAnalytics) var trackEvent
    
    public init(text: String, isActive: Bool = false, action: @escaping () -> Void) {
        self.text = text
        self.isActive = isActive
        self.action = action
    }
    
    public var body: some View {
        Button(action: {
            trackEvent(KozmosAnalyticsEvent(eventName: "page_changed", component: "Pagination"))
            action()
        }) {
            Text(text)
                .font(KozmosTypography.subheadline)
                .frame(minWidth: 36, minHeight: 36)
                // The active page's words, edge and tint are theme 600, as
                // React's (decision 59).
                .background(isActive ? KozmosColors.primitivesColorsTheme600.opacity(0.1) : Color.clear)
                .foregroundColor(isActive ? KozmosColors.primitivesColorsTheme600 : KozmosColors.primitivesColorsForeground100)
                .cornerRadius(KozmosDimensions.semanticsRadiusControl)
                .overlay(
                    RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl)
                        .stroke(isActive ? KozmosColors.primitivesColorsTheme600 : Color.clear, lineWidth: 1)
                )
        }
        .buttonStyle(PlainButtonStyle())
    }
}

public struct KozmosPaginationPrevious: View {
    let action: () -> Void
    
    public init(action: @escaping () -> Void) {
        self.action = action
    }
    
    public var body: some View {
        Button(action: action) {
            HStack(spacing: KozmosDimensions.primitivesLayoutSpacing50) {
                Image(systemName: "chevron.backward")
                    .font(KozmosTypography.caption)
                Text("Previous")
                    .font(KozmosTypography.subheadline)
            }
            .padding(.horizontal, KozmosDimensions.primitivesLayoutSpacing100)
            .frame(minHeight: 36)
            .foregroundColor(KozmosColors.primitivesColorsForeground100)
        }
    }
}

public struct KozmosPaginationNext: View {
    let action: () -> Void
    
    public init(action: @escaping () -> Void) {
        self.action = action
    }
    
    public var body: some View {
        Button(action: action) {
            HStack(spacing: KozmosDimensions.primitivesLayoutSpacing50) {
                Text("Next")
                    .font(KozmosTypography.subheadline)
                Image(systemName: "chevron.forward")
                    .font(KozmosTypography.caption)
            }
            .padding(.horizontal, KozmosDimensions.primitivesLayoutSpacing100)
            .frame(minHeight: 36)
            .foregroundColor(KozmosColors.primitivesColorsForeground100)
        }
    }
}

public struct KozmosPaginationEllipsis: View {
    public init() {}
    
    public var body: some View {
        Image(systemName: "ellipsis")
            .foregroundColor(KozmosColors.primitivesColorsForeground500)
            .frame(width: 36, height: 36)
    }
}
