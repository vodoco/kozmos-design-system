import SwiftUI

/// A route preview with selectable options and a continue action.
///
/// Mirrors the React `RoutePreviewPanel`. The panel never changes its own
/// selected route, and continuation is disabled while the route status is
/// `calculating`, `noRoute`, `error`, or `idle`.
///
/// Standing alone it fills with the background colour, and it draws no
/// border of its own. As the content of the map shell's panel it is that
/// panel's top: its destination row tops its padding up to what the panel
/// already leaves above it (`kozmosPanelInsetTop`, `kozmosPanelClearanceTop`)
/// rather than adding to it, so the destination sits as far from the panel's
/// top as from its side and keeps the grabber's target clear (decision 14).
/// And it paints no fill there (`kozmosPanelSurface`): the panel's surface,
/// solid or glass, is the one surface (decision 43). On glass its muted
/// text, "To" and the count of options, takes the foreground colour, so it
/// reads at 4.5:1 over any map (decision 48): it reads the surface under it,
/// `kozmosSurfaceStyle`, which the panel's surface says.
public struct KozmosRoutePreviewPanel<StatusContent: View, AlertContent: View>: View {
    @Environment(\.kozmosPanelInsetTop) private var panelInsetTop
    @Environment(\.kozmosPanelClearanceTop) private var panelClearanceTop
    @Environment(\.kozmosPanelSurface) private var panelSurface

    private let destinationName: String
    private let destinationLabel: String
    private let options: [KozmosRouteOptionPresentation]
    private let status: KozmosRouteReadiness
    private let backLabel: String
    private let continueLabel: String
    private let optionsLabel: String
    private let optionsCountLabel: String?
    private let selectedRouteAnnouncement: String?
    private let onOptionSelect: (String) -> Void
    private let onBack: () -> Void
    private let onContinue: (String) -> Void
    private let statusContent: StatusContent
    private let alert: AlertContent
    private let hasStatusContent: Bool
    private let hasAlert: Bool

    public init(
        destinationName: String,
        options: [KozmosRouteOptionPresentation],
        status: KozmosRouteReadiness,
        backLabel: String,
        continueLabel: String,
        destinationLabel: String = "To",
        optionsLabel: String = "Route options",
        optionsCountLabel: String? = nil,
        selectedRouteAnnouncement: String? = nil,
        onOptionSelect: @escaping (String) -> Void,
        onBack: @escaping () -> Void,
        onContinue: @escaping (String) -> Void,
        @ViewBuilder statusContent: () -> StatusContent,
        @ViewBuilder alert: () -> AlertContent
    ) {
        self.destinationName = destinationName
        self.options = options
        self.status = status
        self.backLabel = backLabel
        self.continueLabel = continueLabel
        self.destinationLabel = destinationLabel
        self.optionsLabel = optionsLabel
        self.optionsCountLabel = optionsCountLabel
        self.selectedRouteAnnouncement = selectedRouteAnnouncement
        self.onOptionSelect = onOptionSelect
        self.onBack = onBack
        self.onContinue = onContinue
        self.statusContent = statusContent()
        self.alert = alert()
        self.hasStatusContent = StatusContent.self != EmptyView.self
        self.hasAlert = AlertContent.self != EmptyView.self
    }

    private var selectedOption: KozmosRouteOptionPresentation? {
        options.first { $0.selected && $0.available }
    }

    private var ready: Bool { status == .ready }

    /// The destination row's top padding. Hosted in the shell's panel, the
    /// space the panel leaves above it — a grabber's row — is the preview's
    /// own top: the row tops its 16 up to it rather than adding 16 to it, and
    /// keeps the clearance the panel asks for under a grabber. It padded 16
    /// under the grabber's 16-point row: the destination sat 32 from the
    /// sheet's top and 16 from its side. Outside a shell both are zero, and
    /// it keeps its 16. The options under the row keep theirs.
    private var firstRowTopPadding: CGFloat {
        let padding = KozmosDimensions.primitivesLayoutSpacing200
        return max(panelClearanceTop, padding - panelInsetTop)
    }

    public var body: some View {
        VStack(spacing: 0) {
            VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing50) {
                Text(destinationLabel.uppercased())
                    .font(.caption.weight(.semibold))
                    .kozmosMutedText()

                Text(destinationName)
                    .font(.title3.weight(.semibold))
                    .foregroundColor(KozmosColors.primitivesColorsForeground100)
                    .lineLimit(1)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding([.horizontal, .bottom], KozmosDimensions.primitivesLayoutSpacing200)
            .padding(.top, firstRowTopPadding)

            Divider().overlay(KozmosColors.semanticsBorderSubtle)

            ScrollView {
                VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing150) {
                    if let selectedRouteAnnouncement {
                        Color.clear
                            .frame(width: 0, height: 0)
                            .accessibilityElement()
                            .accessibilityLabel(selectedRouteAnnouncement)
                            .accessibilityAddTraits(.updatesFrequently)
                    }

                    if status != .ready, hasStatusContent {
                        statusContent
                            .frame(maxWidth: .infinity)
                            .padding(KozmosDimensions.primitivesLayoutSpacing300)
                            .background(KozmosColors.primitivesColorsBackground100.opacity(0.4))
                            .clipShape(RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusPanel, style: .continuous))
                            .overlay(
                                RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusPanel, style: .continuous)
                                    .strokeBorder(
                                        KozmosColors.semanticsBorderSubtle,
                                        style: StrokeStyle(lineWidth: 1, dash: [4, 4])
                                    )
                            )
                    } else {
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(alignment: .top, spacing: KozmosDimensions.primitivesLayoutSpacing150) {
                                ForEach(options) { option in
                                    KozmosRouteOptionCard(option: option, onSelect: onOptionSelect)
                                        .frame(width: 208)
                                }
                            }
                        }
                        .accessibilityElement(children: .contain)
                        .accessibilityLabel(optionsLabel)

                        if options.count > 1, let optionsCountLabel {
                            Text(optionsCountLabel)
                                .font(KozmosTypography.caption)
                                .kozmosMutedText()
                        }
                    }

                    if hasAlert {
                        alert
                            .font(KozmosTypography.subheadline)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(KozmosDimensions.primitivesLayoutSpacing150)
                            .background(KozmosColors.primitivesColorsEmotionalAlert500.opacity(0.15))
                            .clipShape(
                                RoundedRectangle(
                                    cornerRadius: KozmosDimensions.semanticsRadiusControl,
                                    style: .continuous
                                )
                            )
                    }
                }
                .padding(KozmosDimensions.primitivesLayoutSpacing200)
            }

            Divider().overlay(KozmosColors.semanticsBorderSubtle)

            HStack(spacing: KozmosDimensions.primitivesLayoutSpacing150) {
                KozmosIconButton(iconName: "arrow.left", variant: .outline, action: onBack)
                    .accessibilityLabel(backLabel)

                KozmosButton(
                    continueLabel,
                    isDisabled: !ready || selectedOption == nil,
                    isLoading: status == .calculating
                ) {
                    if let selectedOption { onContinue(selectedOption.id) }
                }
                .frame(maxWidth: .infinity)
            }
            .padding(KozmosDimensions.primitivesLayoutSpacing200)
        }
        .frame(maxWidth: .infinity)
        // The background colour standing alone, and no fill on the shell's
        // panel, whose surface is the one surface (decision 43). On a glass
        // sheet it was an opaque block, and a square one: it covered the
        // panel's rounded top corners.
        .background(panelSurface == nil ? KozmosColors.primitivesColorsBackground0 : Color.clear)
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Route preview")
    }
}

public extension KozmosRoutePreviewPanel where AlertContent == EmptyView {
    init(
        destinationName: String,
        options: [KozmosRouteOptionPresentation],
        status: KozmosRouteReadiness,
        backLabel: String,
        continueLabel: String,
        destinationLabel: String = "To",
        optionsLabel: String = "Route options",
        optionsCountLabel: String? = nil,
        selectedRouteAnnouncement: String? = nil,
        onOptionSelect: @escaping (String) -> Void,
        onBack: @escaping () -> Void,
        onContinue: @escaping (String) -> Void,
        @ViewBuilder statusContent: () -> StatusContent
    ) {
        self.init(
            destinationName: destinationName,
            options: options,
            status: status,
            backLabel: backLabel,
            continueLabel: continueLabel,
            destinationLabel: destinationLabel,
            optionsLabel: optionsLabel,
            optionsCountLabel: optionsCountLabel,
            selectedRouteAnnouncement: selectedRouteAnnouncement,
            onOptionSelect: onOptionSelect,
            onBack: onBack,
            onContinue: onContinue,
            statusContent: statusContent,
            alert: { EmptyView() }
        )
    }
}

public extension KozmosRoutePreviewPanel where StatusContent == EmptyView, AlertContent == EmptyView {
    init(
        destinationName: String,
        options: [KozmosRouteOptionPresentation],
        status: KozmosRouteReadiness,
        backLabel: String,
        continueLabel: String,
        destinationLabel: String = "To",
        optionsLabel: String = "Route options",
        optionsCountLabel: String? = nil,
        selectedRouteAnnouncement: String? = nil,
        onOptionSelect: @escaping (String) -> Void,
        onBack: @escaping () -> Void,
        onContinue: @escaping (String) -> Void
    ) {
        self.init(
            destinationName: destinationName,
            options: options,
            status: status,
            backLabel: backLabel,
            continueLabel: continueLabel,
            destinationLabel: destinationLabel,
            optionsLabel: optionsLabel,
            optionsCountLabel: optionsCountLabel,
            selectedRouteAnnouncement: selectedRouteAnnouncement,
            onOptionSelect: onOptionSelect,
            onBack: onBack,
            onContinue: onContinue,
            statusContent: { EmptyView() },
            alert: { EmptyView() }
        )
    }
}
