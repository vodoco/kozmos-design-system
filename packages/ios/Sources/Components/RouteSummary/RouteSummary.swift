import SwiftUI

public enum KozmosRouteSummaryState {
    case active
    case preview
}

public struct KozmosRouteSummary<TransportModeIcon: View>: View {
    private let etaText: String
    private let distanceText: String?
    private let state: KozmosRouteSummaryState
    /// Nil in the route preview: the navigation layout draws no End.
    private let onEndRoute: (() -> Void)?
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
    /// The journey's actions, laid out in equal columns; nil without any.
    private var actions: AnyView? = nil
    private var locationText: String? = nil
    /// The estimate layout's words, as React's `endRouteLabel` and
    /// `startNavigationLabel`: End's accessible name and Start's label.
    private var endRouteLabel = "End route"
    private var startNavigationLabel = "Start Navigation"
    private let surface: KozmosSurfaceStyle
    /// Nil follows where the summary is: hosted in the map shell's panel,
    /// standalone elsewhere (decision 43).
    private var presentation: KozmosRoutePresentation? = nil
    private var destinationImage: String? = nil
    @Environment(\.kozmosPanelSurface) private var panelSurface

    /// The estimate layout: the time over the distance, End as an icon while
    /// the route is active, Start while it is previewed. `endRouteLabel` names
    /// the End icon button and `startNavigationLabel` is Start's label, as
    /// React's props of the same names; both come before the trailing
    /// `transportModeIcon`.
    public init(
        etaText: String,
        distanceText: String,
        state: KozmosRouteSummaryState = .active,
        onEndRoute: @escaping () -> Void,
        onStartNavigation: (() -> Void)? = nil,
        surface: KozmosSurfaceStyle = .solid,
        endRouteLabel: String = "End route",
        startNavigationLabel: String = "Start Navigation",
        @ViewBuilder transportModeIcon: () -> TransportModeIcon
    ) {
        self.etaText = etaText
        self.distanceText = distanceText
        self.state = state
        self.onEndRoute = onEndRoute
        self.onStartNavigation = onStartNavigation
        self.transportModeIcon = transportModeIcon()
        self.showsTransportModeIcon = true
        self.endRouteLabel = endRouteLabel
        self.startNavigationLabel = startNavigationLabel
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
    /// below, and `actions` after it. In the map shell's panel it is hosted,
    /// with no surface, radius, shadow or padding of its own, and standalone
    /// elsewhere, unless `presentation` says which.
    ///
    /// `actions` are the journey's: Previous and Next in static wayfinding,
    /// Go and Details in the route preview. They are laid out in equal
    /// columns in reading order, as tall as the tallest, and a KozmosButton
    /// there fills its column, its label wrapping. The host owns what they
    /// do, when they are disabled, and announcing the new step.
    ///
    /// Without `onEndRoute` there is no End: the route preview, where
    /// `locationText` is the place's line under the destination, muted. The
    /// preview has no progress: pass `progress: { EmptyView() }`.
    public init<Actions: View>(
        destination: String,
        locationText: String? = nil,
        durationText: String? = nil,
        distanceText: String? = nil,
        arrivalText: String? = nil,
        endLabel: String = "End",
        surface: KozmosSurfaceStyle = .solid,
        presentation: KozmosRoutePresentation? = nil,
        destinationImage: String? = nil,
        onEndRoute: (() -> Void)? = nil,
        @ViewBuilder progress: () -> some View,
        @ViewBuilder actions: () -> Actions = { EmptyView() }
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
        // Laid out here, where the actions' own type is known: an AnyView
        // between them and the layout would hide how many there are.
        self.actions = Actions.self == EmptyView.self ? nil : AnyView(
            KozmosEqualColumnsLayout(spacing: KozmosDimensions.primitivesLayoutSpacing100) { actions() }
                .environment(\.kozmosButtonFillsCell, true)
        )
        self.locationText = locationText
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
                if let locationText, !locationText.isEmpty {
                    VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing25) {
                        title(destination)
                        // Muted, and on glass the foreground colour (decision 48).
                        Text(locationText)
                            .font(KozmosTypography.subheadline)
                            .kozmosMutedText()
                            .fixedSize(horizontal: false, vertical: true)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                } else {
                    title(destination)
                }
                if let onEndRoute {
                    KozmosButton(endLabel, variant: .outline, emotion: .danger, size: .sm, action: onEndRoute)
                }
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
            if let actions {
                actions
            }
        }
        .modifier(KozmosRoutePanelSurface(presentation: presentation ?? (panelSurface == nil ? .standalone : .hosted),
                                          surface: surface))
    }

    private func title(_ destination: String) -> some View {
        Text(destination)
            .font(KozmosTypography.title3.weight(.semibold))
            .foregroundColor(KozmosColors.primitivesColorsForeground100)
            .fixedSize(horizontal: false, vertical: true)
            .frame(maxWidth: .infinity, alignment: .leading)
            .accessibilityAddTraits(.isHeader)
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

                if state == .active, let onEndRoute {
                    KozmosIconButton(iconName: "xmark", variant: .destructive, action: onEndRoute)
                    .accessibilityLabel(endRouteLabel)
                }
            }

            if state == .preview, let onStartNavigation {
                KozmosButton(startNavigationLabel, size: .lg, action: onStartNavigation)
                    .frame(maxWidth: .infinity)
            }
        }
        .padding(KozmosDimensions.primitivesLayoutSpacing200)
        .kozmosSurface(RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusPanel, style: .continuous), style: surface)
        .kozmosElevation(KozmosShadows.semanticsElevationOverlay)
    }
}

public extension KozmosRouteSummary where TransportModeIcon == EmptyView {
    /// The estimate layout with no transport mode; `endRouteLabel` and
    /// `startNavigationLabel` as in the init that takes one.
    init(
        etaText: String,
        distanceText: String,
        state: KozmosRouteSummaryState = .active,
        onEndRoute: @escaping () -> Void,
        onStartNavigation: (() -> Void)? = nil,
        surface: KozmosSurfaceStyle = .solid,
        endRouteLabel: String = "End route",
        startNavigationLabel: String = "Start Navigation"
    ) {
        self.etaText = etaText
        self.distanceText = distanceText
        self.state = state
        self.onEndRoute = onEndRoute
        self.onStartNavigation = onStartNavigation
        self.transportModeIcon = EmptyView()
        self.showsTransportModeIcon = false
        self.endRouteLabel = endRouteLabel
        self.startNavigationLabel = startNavigationLabel
        self.destination = nil
        self.durationText = nil
        self.arrivalText = nil
        self.endLabel = "End"
        self.progress = nil
        self.surface = surface
    }
}
