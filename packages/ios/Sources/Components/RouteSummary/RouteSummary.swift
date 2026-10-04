import SwiftUI

public enum KozmosRouteSummaryState {
    case active
    case preview
}

public struct KozmosRouteSummary<TransportModeIcon: View>: View {
    private let etaText: String
    private let distanceText: String?
    private let state: KozmosRouteSummaryState
    private let onEndRoute: () -> Void
    private let onStartNavigation: (() -> Void)?
    private let transportModeIcon: TransportModeIcon
    private let showsTransportModeIcon: Bool
    // The navigation layout, when a destination is given: its name with End
    // beside it, the time, distance and arrival on one row, and the caller's
    // progress below. Mirrors the product prototype's navigation sheet.
    private let destination: String?
    private let durationText: String?
    private let arrivalText: String?
    private let endLabel: String
    private let progress: AnyView?
    private let surface: KozmosSurfaceStyle
    /// Nil follows where the summary is: hosted in the map shell's panel,
    /// standalone elsewhere (decision 43).
    private var presentation: KozmosRoutePresentation? = nil
    private var destinationImage: String? = nil
    @Environment(\.kozmosPanelSurface) private var panelSurface

    public init(
        etaText: String,
        distanceText: String,
        state: KozmosRouteSummaryState = .active,
        onEndRoute: @escaping () -> Void,
        onStartNavigation: (() -> Void)? = nil,
        surface: KozmosSurfaceStyle = .solid,
        @ViewBuilder transportModeIcon: () -> TransportModeIcon
    ) {
        self.etaText = etaText
        self.distanceText = distanceText
        self.state = state
        self.onEndRoute = onEndRoute
        self.onStartNavigation = onStartNavigation
        self.transportModeIcon = transportModeIcon()
        self.showsTransportModeIcon = true
        self.destination = nil
        self.durationText = nil
        self.arrivalText = nil
        self.endLabel = "End"
        self.progress = nil
        self.surface = surface
    }

    /// The navigation layout: the destination's name with End beside it in
    /// the danger outline; `durationText`, `distanceText` and `arrivalText`
    /// on one row; `progress` — a `KozmosRouteProgressRail` in the products —
    /// below. In the map shell's panel it is hosted, with no surface, radius,
    /// shadow or padding of its own, and standalone elsewhere, unless
    /// `presentation` says which.
    public init(
        destination: String,
        durationText: String? = nil,
        distanceText: String? = nil,
        arrivalText: String? = nil,
        endLabel: String = "End",
        surface: KozmosSurfaceStyle = .solid,
        presentation: KozmosRoutePresentation? = nil,
        destinationImage: String? = nil,
        onEndRoute: @escaping () -> Void,
        @ViewBuilder progress: () -> some View
    ) where TransportModeIcon == EmptyView {
        self.etaText = durationText ?? ""
        self.distanceText = distanceText
        self.state = .active
        self.onEndRoute = onEndRoute
        self.onStartNavigation = nil
        self.transportModeIcon = EmptyView()
        self.showsTransportModeIcon = false
        self.destination = destination
        self.durationText = durationText
        self.arrivalText = arrivalText
        self.endLabel = endLabel
        self.progress = AnyView(progress())
        self.surface = surface
        self.presentation = presentation
        self.destinationImage = destinationImage
    }

    public var body: some View {
        if let destination {
            navigation(destination: destination)
        } else {
            summary
        }
    }

    private func navigation(destination: String) -> some View {
        VStack(spacing: KozmosDimensions.primitivesLayoutSpacing150) {
            HStack(alignment: .center, spacing: KozmosDimensions.primitivesLayoutSpacing150) {
                if let destinationImage, !destinationImage.isEmpty { KozmosDestinationImage(source: destinationImage) }
                Text(destination)
                    .font(KozmosTypography.title3.weight(.semibold))
                    .foregroundColor(KozmosColors.primitivesColorsForeground100)
                    .fixedSize(horizontal: false, vertical: true)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .accessibilityAddTraits(.isHeader)
                KozmosButton(endLabel, variant: .outline, emotion: .danger, size: .sm, action: onEndRoute)
            }
            if [durationText, distanceText, arrivalText].contains(where: { !($0 ?? "").isEmpty }) {
                ViewThatFits(in: .horizontal) {
                    HStack(alignment: .firstTextBaseline, spacing: KozmosDimensions.primitivesLayoutSpacing150) {
                        navigationMetrics
                        if let arrivalText, !arrivalText.isEmpty {
                            Spacer(minLength: KozmosDimensions.primitivesLayoutSpacing150)
                            Text(arrivalText).font(KozmosTypography.subheadline).fixedSize()
                        }
                    }
                    VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing50) {
                        navigationMetrics
                        if let arrivalText, !arrivalText.isEmpty { Text(arrivalText).font(KozmosTypography.subheadline) }
                    }
                }
                .foregroundColor(KozmosColors.primitivesColorsForeground100)
                .frame(maxWidth: .infinity, alignment: .leading)
                .accessibilityElement(children: .combine)
            }
            if let progress {
                progress
            }
        }
        .modifier(KozmosRoutePanelSurface(presentation: presentation ?? (panelSurface == nil ? .standalone : .hosted),
                                          surface: surface))
    }

    @ViewBuilder private var navigationMetrics: some View {
        if let durationText, !durationText.isEmpty {
            Text(durationText).font(KozmosTypography.subheadline.weight(.semibold))
                .foregroundColor(KozmosColors.primitivesColorsForeground100)
        }
        if let distanceText, !distanceText.isEmpty {
            Text(distanceText).font(KozmosTypography.subheadline).foregroundColor(KozmosColors.primitivesColorsForeground100)
        }
    }

    private var summary: some View {
        VStack(spacing: KozmosDimensions.primitivesLayoutSpacing200) {
            HStack(spacing: KozmosDimensions.primitivesLayoutSpacing150) {
                if showsTransportModeIcon {
                    transportModeIcon
                        .frame(width: 40, height: 40)
                        .foregroundColor(KozmosColors.primitivesColorsTheme500)
                        .background(KozmosColors.primitivesColorsTheme500.opacity(0.12))
                        .clipShape(Circle())
                        // The words beside it carry the meaning.
                        .accessibilityHidden(true)
                }

                VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing25) {
                    Text(etaText)
                        .font(.title3.weight(.bold))
                        .foregroundColor(KozmosColors.primitivesColorsForeground100)

                    // Muted, and on glass the foreground colour (decision
                    // 48): the card's surface says which.
                    Text(distanceText ?? "")
                        .font(.subheadline.weight(.medium))
                        .kozmosMutedText()
                }

                Spacer()

                if state == .active {
                    KozmosIconButton(iconName: "xmark", variant: .destructive, action: onEndRoute)
                    .accessibilityLabel("End route")
                }
            }

            if state == .preview, let onStartNavigation {
                KozmosButton("Start Navigation", size: .lg, action: onStartNavigation)
                    .frame(maxWidth: .infinity)
            }
        }
        .padding(KozmosDimensions.primitivesLayoutSpacing200)
        .kozmosSurface(RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusPanel, style: .continuous), style: surface)
        .kozmosElevation(KozmosShadows.semanticsElevationOverlay)
    }
}

public extension KozmosRouteSummary where TransportModeIcon == EmptyView {
    init(
        etaText: String,
        distanceText: String,
        state: KozmosRouteSummaryState = .active,
        onEndRoute: @escaping () -> Void,
        onStartNavigation: (() -> Void)? = nil,
        surface: KozmosSurfaceStyle = .solid
    ) {
        self.etaText = etaText
        self.distanceText = distanceText
        self.state = state
        self.onEndRoute = onEndRoute
        self.onStartNavigation = onStartNavigation
        self.transportModeIcon = EmptyView()
        self.showsTransportModeIcon = false
        self.destination = nil
        self.durationText = nil
        self.arrivalText = nil
        self.endLabel = "End"
        self.progress = nil
        self.surface = surface
    }
}
