import SwiftUI

public struct KozmosToast: View {
    @Binding var isPresented: Bool
    let title: String
    let description: String?
    let actionTitle: String?
    let showsCloseButton: Bool
    let autoDismissAfter: TimeInterval?
    let onAction: (() -> Void)?

    public init(isPresented: Binding<Bool>, message: String) {
        self.init(isPresented: isPresented, title: message, autoDismissAfter: 3)
    }

    public init(
        isPresented: Binding<Bool>,
        title: String,
        description: String? = nil,
        actionTitle: String? = nil,
        showsCloseButton: Bool = true,
        autoDismissAfter: TimeInterval? = 3,
        onAction: (() -> Void)? = nil
    ) {
        self._isPresented = isPresented
        self.title = title
        self.description = description
        self.actionTitle = actionTitle
        self.showsCloseButton = showsCloseButton
        self.autoDismissAfter = autoDismissAfter
        self.onAction = onAction
    }

    public var body: some View {
        ZStack {
            if isPresented {
                VStack {
                    Spacer()
                    toastSurface
                        .padding(.horizontal, KozmosDimensions.primitivesLayoutSpacing300)
                        .padding(.bottom, KozmosDimensions.primitivesLayoutSpacing600)
                        .transition(.move(edge: .bottom).combined(with: .opacity))
                        .onAppear(perform: scheduleAutoDismiss)
                }
                .edgesIgnoringSafeArea(.bottom)
                .zIndex(1)
            }
        }
    }

    private var toastSurface: some View {
        HStack(alignment: .center, spacing: KozmosDimensions.primitivesLayoutSpacing200) {
            VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing50) {
                Text(title)
                    .font(KozmosTypography.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(KozmosColors.primitivesColorsForeground100)

                if let description {
                    Text(description)
                        .font(KozmosTypography.subheadline)
                        .foregroundColor(KozmosColors.primitivesColorsForeground500)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            if let actionTitle, let onAction {
                Button(action: onAction) {
                    Text(actionTitle)
                        .font(KozmosTypography.subheadline)
                        .fontWeight(.semibold)
                        // Theme-coloured words on a surface: 600 (decision 59).
                        .foregroundColor(KozmosColors.primitivesColorsTheme600)
                        .padding(.horizontal, KozmosDimensions.primitivesLayoutSpacing150)
                        .frame(minHeight: 44)
                }
            }

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
                .accessibilityLabel("Dismiss notification")
            }
        }
        .padding(.leading, KozmosDimensions.primitivesLayoutSpacing300)
        .padding(.trailing, showsCloseButton ? KozmosDimensions.primitivesLayoutSpacing100 : KozmosDimensions.primitivesLayoutSpacing300)
        .padding(.vertical, KozmosDimensions.primitivesLayoutSpacing200)
        .frame(maxWidth: 420)
        .background(KozmosColors.primitivesColorsBackground0)
        .cornerRadius(KozmosDimensions.semanticsRadiusControl)
        .overlay(
            RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl)
                .stroke(KozmosColors.semanticsBorderSubtle, lineWidth: 1)
        )
        .kozmosElevation(KozmosShadows.semanticsElevationFloating)
    }

    private func scheduleAutoDismiss() {
        guard let autoDismissAfter else { return }

        DispatchQueue.main.asyncAfter(deadline: .now() + autoDismissAfter) {
            withAnimation {
                isPresented = false
            }
        }
    }
}
