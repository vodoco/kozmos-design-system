import SwiftUI

public struct KozmosDialog<Content: View>: View {
    @Binding var isPresented: Bool
    let title: String?
    let description: String?
    let bodyText: String?
    let primaryActionTitle: String?
    let secondaryActionTitle: String?
    let showsCloseButton: Bool
    let onPrimaryAction: (() -> Void)?
    let onSecondaryAction: (() -> Void)?
    let content: () -> Content

    public init(
        isPresented: Binding<Bool>,
        showsCloseButton: Bool = true,
        @ViewBuilder content: @escaping () -> Content
    ) {
        self._isPresented = isPresented
        self.title = nil
        self.description = nil
        self.bodyText = nil
        self.primaryActionTitle = nil
        self.secondaryActionTitle = nil
        self.showsCloseButton = showsCloseButton
        self.onPrimaryAction = nil
        self.onSecondaryAction = nil
        self.content = content
    }

    public init(
        isPresented: Binding<Bool>,
        title: String,
        description: String? = nil,
        bodyText: String? = nil,
        primaryActionTitle: String? = nil,
        secondaryActionTitle: String? = nil,
        showsCloseButton: Bool = true,
        onPrimaryAction: (() -> Void)? = nil,
        onSecondaryAction: (() -> Void)? = nil
    ) where Content == EmptyView {
        self._isPresented = isPresented
        self.title = title
        self.description = description
        self.bodyText = bodyText
        self.primaryActionTitle = primaryActionTitle
        self.secondaryActionTitle = secondaryActionTitle
        self.showsCloseButton = showsCloseButton
        self.onPrimaryAction = onPrimaryAction
        self.onSecondaryAction = onSecondaryAction
        self.content = { EmptyView() }
    }

    public var body: some View {
        ZStack {
            if isPresented {
                KozmosColors.semanticsOverlayScrim
                    .edgesIgnoringSafeArea(.all)
                    .onTapGesture {
                        isPresented = false
                    }

                dialogSurface
                    .padding(KozmosDimensions.primitivesLayoutSpacing400)
            }
        }
        .animation(.easeInOut(duration: 0.2), value: isPresented)
    }

    private var dialogSurface: some View {
        VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing300) {
            HStack(alignment: .top, spacing: KozmosDimensions.primitivesLayoutSpacing200) {
                VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing100) {
                    if let title {
                        Text(title)
                            .font(KozmosTypography.title3)
                            .fontWeight(.semibold)
                            .foregroundColor(KozmosColors.primitivesColorsForeground100)
                    }

                    if let description {
                        Text(description)
                            .font(KozmosTypography.subheadline)
                            .foregroundColor(KozmosColors.primitivesColorsForeground400)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)

                if showsCloseButton {
                    Button {
                        withAnimation {
                            isPresented = false
                        }
                    } label: {
                        Image(systemName: "xmark")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(KozmosColors.primitivesColorsForeground500)
                            .frame(width: 44, height: 44)
                    }
                    .accessibilityLabel("Close dialog")
                }
            }

            dialogContent

            if primaryActionTitle != nil || secondaryActionTitle != nil {
                HStack(spacing: KozmosDimensions.primitivesLayoutSpacing150) {
                    Spacer()

                    if let secondaryActionTitle, let onSecondaryAction {
                        dialogActionButton(
                            title: secondaryActionTitle,
                            variant: .secondary,
                            action: onSecondaryAction
                        )
                    }

                    if let primaryActionTitle, let onPrimaryAction {
                        dialogActionButton(
                            title: primaryActionTitle,
                            variant: .primary,
                            action: onPrimaryAction
                        )
                    }
                }
            }
        }
        .padding(KozmosDimensions.primitivesLayoutSpacing300)
        .frame(maxWidth: 512)
        .background(KozmosColors.semanticsSurface0)
        .cornerRadius(KozmosDimensions.semanticsRadiusContainer)
        .overlay(
            RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusContainer)
                .stroke(KozmosColors.semanticsBorderSubtle, lineWidth: 1)
        )
        .kozmosElevation(KozmosShadows.semanticsElevationOverlay)
    }

    @ViewBuilder
    private var dialogContent: some View {
        if let bodyText {
            Text(bodyText)
                .font(KozmosTypography.body)
                .foregroundColor(KozmosColors.primitivesColorsForeground100)
        } else {
            content()
        }
    }

    private enum DialogActionVariant {
        case primary
        case secondary
    }

    private func dialogActionButton(
        title: String,
        variant: DialogActionVariant,
        action: @escaping () -> Void
    ) -> some View {
        KozmosButton(
            title,
            variant: variant == .primary ? .default : .outline,
            size: variant == .primary ? .lg : .default,
            action: action
        )
    }
}
