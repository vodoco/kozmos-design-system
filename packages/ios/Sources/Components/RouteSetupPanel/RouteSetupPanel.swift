import SwiftUI

/// Hosted route setup. The host owns point validation, requests, cancellation, focus and dismissal.
public struct KozmosRouteSetupPanel<Content: View>: View {
    private let ready: Bool
    private let pending: Bool
    private let title: String
    private let description: String?
    private let continueLabel: String
    private let closeLabel: String
    private let presentation: KozmosRoutePresentation
    private let surface: KozmosSurfaceStyle
    private let onContinue: () -> Void
    private let onClose: () -> Void
    private let content: Content

    public init(ready: Bool, pending: Bool = false, title: String = "Set up a route", description: String? = nil,
                continueLabel: String = "Continue", closeLabel: String = "Close route setup",
                presentation: KozmosRoutePresentation = .hosted, surface: KozmosSurfaceStyle = .solid,
                onContinue: @escaping () -> Void, onClose: @escaping () -> Void, @ViewBuilder content: () -> Content) {
        self.ready = ready; self.pending = pending; self.title = title; self.description = description
        self.continueLabel = continueLabel; self.closeLabel = closeLabel
        self.presentation = presentation; self.surface = surface; self.onContinue = onContinue; self.onClose = onClose
        self.content = content()
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing200) {
            HStack(alignment: .top, spacing: KozmosDimensions.primitivesLayoutSpacing150) {
                Text(title).font(KozmosTypography.title3.weight(.semibold)).accessibilityAddTraits(.isHeader)
                    .fixedSize(horizontal: false, vertical: true).frame(maxWidth: .infinity, alignment: .leading)
                KozmosIconButton(iconName: "xmark", variant: .outline, action: onClose).accessibilityLabel(closeLabel)
            }
            if let description, !description.isEmpty { Text(description).font(KozmosTypography.subheadline).kozmosMutedText() }
            content
            KozmosButton(continueLabel, isDisabled: !ready || pending, fillsWidth: true) {
                if ready && !pending { onContinue() }
            }
        }
        .foregroundColor(KozmosColors.primitivesColorsForeground100)
        .frame(maxWidth: .infinity, alignment: .leading)
        .modifier(KozmosRoutePanelSurface(presentation: presentation, surface: surface))
    }
}
