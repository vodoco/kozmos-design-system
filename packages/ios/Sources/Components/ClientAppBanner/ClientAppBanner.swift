import SwiftUI

/// Express's Client App Banner (GAP-127). Mirrors React's `ClientAppBanner`.
///
/// The customer's promotion, the app's icon, name and description, and one
/// action, with a way to dismiss it. Every word is set by the customer in
/// Pointr Cloud; Kozmos draws them. Made for the map shell's top bar, which
/// hosts what it is given with no surface of its own, so the banner draws its
/// own, as the manoeuvre card there does: the solid surface (the page's fill
/// and its subtle edge), the Container corner, and the floating elevation of
/// map chrome. 16 inside; the 48 icon 12 from the words.
///
/// Where the words and the action do not fit side by side — the words keep
/// 160 beside the icon, the web's 10rem, scaled with Dynamic Type as 10rem
/// grows with the browser's text — the action goes under the icon and the
/// words and spans them both, so the words keep the width beside the icon.
/// The icon stays the 48 square, and dismiss the system's 44 target at the
/// top trailing corner, 4 from the edges, at every text size.
///
/// VoiceOver reads a container named by the app: the promotion, the name and
/// the description, then the action, then dismiss. The icon is decoration
/// beside the name. The banner moves no focus, announces nothing and never
/// removes itself: `onDismiss` asks the product to.
public struct KozmosClientAppBanner: View {
    /// What the words keep before the action shares their line, at the
    /// default text size: the web's 10rem. It is scaled with Dynamic Type.
    static let minimumWordsWidth: CGFloat = 160
    /// The icon: the system's 48.
    static var iconSize: CGFloat { KozmosDimensions.primitivesLayoutSizing600 }
    /// Dismiss sits this far from the top and trailing edges.
    static var dismissInset: CGFloat { KozmosDimensions.primitivesLayoutSpacing50 }
    /// The system's 44 target.
    static let dismissSize: CGFloat = 44

    private let appName: String
    private let actionLabel: String
    private let promotionText: String?
    private let description: String?
    private let appIconURL: URL?
    private let dismissLabel: String
    private let onAction: () -> Void
    private let onDismiss: (() -> Void)?
    /// `minimumWordsWidth` at the reader's text size, as 10rem is the
    /// browser's: larger text puts the action under the words sooner.
    @ScaledMetric(relativeTo: .body) private var wordsWidth: CGFloat = KozmosClientAppBanner.minimumWordsWidth

    /// - Parameters:
    ///   - appName: The app's name. It names the banner's container too.
    ///   - actionLabel: The button's words, which are also its name.
    ///   - promotionText: The line above the name — "Get the app".
    ///   - description: What the app is for. Two lines at most are drawn;
    ///     VoiceOver reads all of it.
    ///   - appIconURL: The app's icon. Without one, or until it loads, the
    ///     app's initial stands in for it.
    ///   - dismissLabel: Names the dismiss button. Supply translated words.
    ///   - onAction: Pressed: the product opens the store, or the app.
    ///   - onDismiss: Pressed: the product removes the banner. Nil, there is
    ///     no dismiss button.
    public init(
        appName: String,
        actionLabel: String,
        promotionText: String? = nil,
        description: String? = nil,
        appIconURL: URL? = nil,
        dismissLabel: String = "Dismiss",
        onAction: @escaping () -> Void,
        onDismiss: (() -> Void)? = nil
    ) {
        self.appName = appName
        self.actionLabel = actionLabel
        self.promotionText = promotionText
        self.description = description
        self.appIconURL = appIconURL
        self.dismissLabel = dismissLabel
        self.onAction = onAction
        self.onDismiss = onDismiss
    }

    /// The app's first letter, whole even when it is two code units, in
    /// upper case.
    static func initial(of appName: String) -> String {
        guard let first = appName.trimmingCharacters(in: .whitespacesAndNewlines).first else { return "" }
        return String(first).localizedUppercase
    }

    private var shape: RoundedRectangle {
        RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusContainer, style: .continuous)
    }

    /// What dismiss takes from the trailing side: the target, the 4 beside
    /// it and the 12 before the words, so the words and the action end where
    /// they would beside it in the row.
    private var trailingPadding: CGFloat {
        onDismiss == nil
            ? KozmosDimensions.primitivesLayoutSpacing200
            : Self.dismissInset + Self.dismissSize + KozmosDimensions.primitivesLayoutSpacing150
    }

    public var body: some View {
        KozmosClientAppBannerLayout(
            spacing: KozmosDimensions.primitivesLayoutSpacing150,
            minimumWordsWidth: wordsWidth
        ) {
            KozmosClientAppBannerIcon(url: appIconURL, initial: Self.initial(of: appName), size: Self.iconSize)
            words
            // Read after the words, wherever it is placed: VoiceOver reads
            // a container by place, and beside the words the action
            // starts above their last line.
            KozmosButton(actionLabel, fillsWidth: true, action: onAction)
                .accessibilitySortPriority(-1)
        }
        .padding(.top, KozmosDimensions.primitivesLayoutSpacing200)
        .padding(.bottom, KozmosDimensions.primitivesLayoutSpacing200)
        .padding(.leading, KozmosDimensions.primitivesLayoutSpacing200)
        .padding(.trailing, trailingPadding)
        .frame(maxWidth: .infinity, alignment: .leading)
        .overlay(alignment: .topTrailing) {
            if let onDismiss {
                KozmosIconButton(iconName: "xmark", action: onDismiss)
                    .accessibilityLabel(Text(verbatim: dismissLabel))
                    // At the top it is above the words; read by place it
                    // would come second. It is read last.
                    .accessibilitySortPriority(-2)
                    .padding(Self.dismissInset)
            }
        }
        .foregroundColor(KozmosColors.primitivesColorsForeground100)
        .kozmosSurface(shape)
        .kozmosElevation(KozmosShadows.semanticsElevationFloating)
        .accessibilityElement(children: .contain)
        .accessibilityLabel(Text(verbatim: appName))
    }

    private var words: some View {
        VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing25) {
            if let promotionText, !promotionText.isEmpty {
                Text(verbatim: promotionText)
                    .font(KozmosTypography.caption.weight(.medium))
                    .kozmosMutedText()
                    .fixedSize(horizontal: false, vertical: true)
            }
            Text(verbatim: appName)
                .font(KozmosTypography.body.weight(.semibold))
                .fixedSize(horizontal: false, vertical: true)
            if let description, !description.isEmpty {
                Text(verbatim: description)
                    .font(KozmosTypography.subheadline)
                    .kozmosMutedText()
                    .lineLimit(2)
            }
        }
        .multilineTextAlignment(.leading)
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

/// The app's icon once it has loaded; until then, or without one, its
/// initial on the muted fill.
struct KozmosClientAppBannerIcon: View {
    let url: URL?
    let initial: String
    let size: CGFloat

    var body: some View {
        if let url {
            AsyncImage(url: url) { phase in
                KozmosClientAppBannerIconFace(image: phase.image, initial: initial, size: size)
            }
        } else {
            KozmosClientAppBannerIconFace(image: nil, initial: initial, size: size)
        }
    }
}

/// What the icon draws: 48, the Control corner, the subtle edge, and in it
/// the image alone, cropped to the square — nothing under it shows through
/// a transparent icon, as on the web, where the fallback goes once the image
/// loads — or, with no image, the initial on the muted fill. Hidden from
/// VoiceOver, beside the app's name.
struct KozmosClientAppBannerIconFace: View {
    let image: Image?
    let initial: String
    let size: CGFloat

    var body: some View {
        let shape = RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl, style: .continuous)
        ZStack {
            if let image {
                image.resizable().scaledToFill()
            } else {
                shape.fill(KozmosColors.primitivesColorsBackground100)
                Text(verbatim: initial)
                    .font(KozmosTypography.headline)
                    .foregroundColor(KozmosColors.primitivesColorsForeground100)
            }
        }
        .frame(width: size, height: size)
        .clipShape(shape)
        .overlay(shape.strokeBorder(KozmosColors.semanticsBorderSubtle, lineWidth: 1))
        .accessibilityHidden(true)
    }
}

/// The icon, the words and the action: side by side while the words keep
/// `minimumWordsWidth` beside the icon, the action at its own width and the
/// icon and the words at the top of the line, the action centred on them;
/// past that, the icon and the words on the first line and the action under
/// them both, as wide as the line, as the web wraps it. Three children: the
/// icon, the words, the action. SwiftUI mirrors the placement right to left.
struct KozmosClientAppBannerLayout: Layout {
    let spacing: CGFloat
    let minimumWordsWidth: CGFloat

    private struct Arrangement {
        var stacked: Bool
        var icon: CGSize
        var words: CGSize
        var action: CGSize
        var size: CGSize
    }

    private func arrange(_ width: CGFloat?, _ subviews: Subviews) -> Arrangement {
        guard subviews.count == 3 else {
            return Arrangement(stacked: false, icon: .zero, words: .zero, action: .zero, size: .zero)
        }
        let icon = subviews[0].sizeThatFits(.unspecified)
        let action = subviews[2].sizeThatFits(.unspecified)
        // Where the words start: after the icon and the 12 beside it.
        let lead = icon.width + spacing
        if let width, width < lead + minimumWordsWidth + spacing + action.width {
            let wordsWidth = max(0, width - lead)
            let words = subviews[1].sizeThatFits(ProposedViewSize(width: wordsWidth, height: nil))
            let filled = subviews[2].sizeThatFits(ProposedViewSize(width: width, height: nil))
            let top = max(icon.height, words.height)
            return Arrangement(
                stacked: true,
                icon: icon,
                words: CGSize(width: wordsWidth, height: words.height),
                action: CGSize(width: width, height: filled.height),
                size: CGSize(width: width, height: top + spacing + filled.height)
            )
        }
        let wordsWidth = width.map { max(0, $0 - lead - spacing - action.width) }
        let words = subviews[1].sizeThatFits(ProposedViewSize(width: wordsWidth, height: nil))
        return Arrangement(
            stacked: false,
            icon: icon,
            words: CGSize(width: wordsWidth ?? words.width, height: words.height),
            action: action,
            size: CGSize(
                width: width ?? (lead + words.width + spacing + action.width),
                height: max(icon.height, words.height, action.height)
            )
        )
    }

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        arrange(proposal.width, subviews).size
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        guard subviews.count == 3 else { return }
        let arrangement = arrange(bounds.width, subviews)
        let lead = arrangement.icon.width + spacing
        let head = max(arrangement.icon.height, arrangement.words.height)
        // Side by side, the icon and the words are centred on the line as one,
        // and the action on its own; stacked, they start the first line.
        let headTop = arrangement.stacked ? bounds.minY : bounds.minY + (arrangement.size.height - head) / 2
        subviews[0].place(at: CGPoint(x: bounds.minX, y: headTop), anchor: .topLeading,
                          proposal: ProposedViewSize(arrangement.icon))
        subviews[1].place(at: CGPoint(x: bounds.minX + lead, y: headTop), anchor: .topLeading,
                          proposal: ProposedViewSize(arrangement.words))
        if arrangement.stacked {
            subviews[2].place(at: CGPoint(x: bounds.minX, y: bounds.minY + head + spacing), anchor: .topLeading,
                              proposal: ProposedViewSize(arrangement.action))
        } else {
            subviews[2].place(at: CGPoint(x: bounds.maxX, y: bounds.midY), anchor: .trailing,
                              proposal: ProposedViewSize(arrangement.action))
        }
    }
}
