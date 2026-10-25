import SwiftUI

public struct KozmosPOICard<ImageContent: View, DescriptionContent: View, ActionsContent: View>: View {
    @Environment(\.kozmosAnalytics) var trackEvent
    let title: String
    let category: String?
    let imageContent: ImageContent?
    let descriptionContent: DescriptionContent?
    let actionsContent: ActionsContent?
    let onClose: (() -> Void)?
    
    public init(
        title: String,
        category: String? = nil,
        @ViewBuilder imageContent: () -> ImageContent? = { AnyView?(nil) },
        @ViewBuilder descriptionContent: () -> DescriptionContent? = { AnyView?(nil) },
        @ViewBuilder actionsContent: () -> ActionsContent? = { AnyView?(nil) },
        onClose: (() -> Void)? = nil
    ) {
        self.title = title
        self.category = category
        self.imageContent = imageContent()
        self.descriptionContent = descriptionContent()
        self.actionsContent = actionsContent()
        self.onClose = onClose
    }
    
    public var body: some View {
        VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing0) {
            if let imageContent = imageContent {
                imageContent
                    .frame(height: 140)
                    .clipped()
            }
            
            VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing150) {
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing50) {
                        Text(title)
                            .font(KozmosTypography.headline)
                        
                        if let category = category {
                            Text(category)
                                .font(KozmosTypography.subheadline)
                                .foregroundColor(KozmosColors.primitivesColorsForeground400)
                        }
                    }
                    
                    Spacer()
                    
                    if let onClose = onClose {
                        Button(action: onClose) {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundColor(KozmosColors.primitivesColorsForeground400.opacity(0.6))
                        }
                    }
                }
                
                if let descriptionContent = descriptionContent {
                    descriptionContent
                }
                
                if let actionsContent = actionsContent {
                    actionsContent
                        .padding(.top, KozmosDimensions.primitivesLayoutSpacing100)
                }
            }
            .padding()
        }
        .background(KozmosColors.primitivesColorsBackground0)
        .cornerRadius(KozmosDimensions.primitivesLayoutSpacing150)
        .kozmosElevation(KozmosShadows.semanticsElevationFloating)
        .frame(width: 300)
    }
}
