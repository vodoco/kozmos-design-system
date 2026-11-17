import SwiftUI

/// How large a dialog is, as React's `DialogContent size`.
public enum KozmosDialogSize: String, CaseIterable, Sendable {
    /// At most 512 wide, as tall as its content, 32 from the window's edges.
    case `default`
    /// The window less 16 on each side (decision 202, GAP-259), for media
    /// shown large: the header keeps its height and the content takes the
    /// rest.
    case full
}

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
    let size: KozmosDialogSize
    let content: () -> Content
    /// Above the title (decision 195, GAP-214): set by `media(label:bleeds:_:)`.
    var media: AnyView?
    var mediaLabel: String?
    var mediaBleeds = false

    public init(
        isPresented: Binding<Bool>,
        showsCloseButton: Bool = true,
        size: KozmosDialogSize = .default,
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
        self.size = size
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
        onSecondaryAction: (() -> Void)? = nil,
        size: KozmosDialogSize = .default
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
        self.size = size
        self.content = { EmptyView() }
    }

    /// Media above the title, an illustration or a photo (decision 195,
    /// GAP-214), as React's `DialogHeader media`.
    ///
    /// - Parameters:
    ///   - label: Its name, read as an image. Left out, the media is
    ///     decorative and VoiceOver skips it.
    ///   - bleeds: True reaches the dialog's edges and top corners, past its
    ///     24 of padding; false keeps it inside the padding. The close button
    ///     stays in the dialog's top corner, on its own surface, over the
    ///     media.
    public func media<Media: View>(
        label: String? = nil,
        bleeds: Bool = false,
        @ViewBuilder _ media: () -> Media
    ) -> KozmosDialog {
        var dialog = self
        dialog.media = AnyView(media())
        dialog.mediaLabel = label
        dialog.mediaBleeds = bleeds
        return dialog
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
                    // Full is the window less 16 each side (decision 202).
                    .padding(size == .full
                        ? KozmosDimensions.primitivesLayoutSpacing200
                        : KozmosDimensions.primitivesLayoutSpacing400)
            }
        }
        .animation(.easeInOut(duration: 0.2), value: isPresented)
    }

    private var dialogSurface: some View {
        VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing300) {
            VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing200) {
            if let media {
                mediaView(media)
            }
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

                if showsCloseButton && media == nil {
                    closeButton
                }
            }
            }

            if size == .full {
                // The content takes what the header and actions leave.
                dialogContent
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            } else {
                dialogContent
            }

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
        .frame(
            maxWidth: size == .full ? .infinity : 512,
            maxHeight: size == .full ? .infinity : nil,
            alignment: .topLeading
        )
        .background(KozmosColors.semanticsSurface0)
        .cornerRadius(KozmosDimensions.semanticsRadiusContainer)
        .overlay(
            RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusContainer)
                .stroke(KozmosColors.semanticsBorderSubtle, lineWidth: 1)
        )
        .overlay(alignment: .topTrailing) {
            // Over media the close keeps the dialog's top corner, 24 in, on
            // a surface of its own so it reads over any picture.
            if showsCloseButton && media != nil {
                closeButton
                    .background(Circle().fill(KozmosColors.semanticsSurface0))
                    .overlay(Circle().stroke(KozmosColors.semanticsBorderSubtle, lineWidth: 1))
                    .padding(KozmosDimensions.primitivesLayoutSpacing300)
            }
        }
        .kozmosElevation(KozmosShadows.semanticsElevationOverlay)
    }

    private var closeButton: some View {
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

    /// The media, inside the padding or, bleeding, out to the dialog's edges
    /// and top corners, where the surface's own corner clips it. Named, it is
    /// one image to VoiceOver; unnamed, it is hidden.
    @ViewBuilder
    private func mediaView(_ media: AnyView) -> some View {
        let placed = media
            .frame(maxWidth: .infinity)
            .padding(.horizontal, mediaBleeds ? -KozmosDimensions.primitivesLayoutSpacing300 : 0)
            .padding(.top, mediaBleeds ? -KozmosDimensions.primitivesLayoutSpacing300 : 0)
        if let mediaLabel {
            placed
                .accessibilityElement(children: .ignore)
                .accessibilityLabel(mediaLabel)
                .accessibilityAddTraits(.isImage)
        } else {
            placed.accessibilityHidden(true)
        }
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
