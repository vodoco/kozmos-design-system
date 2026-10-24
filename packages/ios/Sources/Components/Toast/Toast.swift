import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

/// What a toast tells VoiceOver as it appears.
struct KozmosToastAnnouncement: Equatable {
    let message: String
    /// Queued behind current speech (polite), or said over it (assertive).
    let queued: Bool
}

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
                        .onAppear {
                            Self.post(Self.announcement(title: title, description: description))
                            scheduleAutoDismiss()
                        }
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
                        .foregroundColor(KozmosColors.primitivesColorsForeground400)
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

    /// What VoiceOver is told as the toast appears: its title and its
    /// description, a line apart, said over what VoiceOver is saying rather
    /// than queued behind it, as React's default (foreground) Radix toast is
    /// announced through an assertive live region. It posted nothing until
    /// 2026-10-21, so a toast came and went in silence.
    static func announcement(title: String, description: String?) -> KozmosToastAnnouncement {
        let words = [title, description].compactMap { $0 }.filter { !$0.isEmpty }
        return KozmosToastAnnouncement(message: words.joined(separator: "\n"), queued: false)
    }

    /// Where the announcement goes: VoiceOver, or a test's record of it.
    @MainActor static var post: (KozmosToastAnnouncement) -> Void = { announcement in
        #if canImport(UIKit)
        UIAccessibility.post(
            notification: .announcement,
            argument: NSAttributedString(
                string: announcement.message,
                attributes: [.accessibilitySpeechQueueAnnouncement: announcement.queued]
            )
        )
        #endif
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
