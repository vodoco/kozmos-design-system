import SwiftUI

public struct KozmosMapControlsGroup: View {
    /// The SDK's 48 square (decision 40), the width the group reports. 44
    /// stays the floor of every target; this is above it.
    private static let controlSize: CGFloat = KozmosDimensions.primitivesLayoutSizing600

    @Environment(\.kozmosAnalytics) private var trackEvent

    /// One box for every mark the location control can draw, so a labelled
    /// control's text does not move when the arrow changes its shape. Scaled
    /// with the type, as the symbols in it are.
    @ScaledMetric(relativeTo: .body) private var markSize: CGFloat = KozmosDimensions.primitivesLayoutSizing300

    private let compassBearing: Double
    private let onZoomIn: (() -> Void)?
    private let onZoomOut: (() -> Void)?
    private let onCompassReset: (() -> Void)?
    private let onMyLocation: (() -> Void)?
    let zoomInLabel: String
    let zoomOutLabel: String
    let compassResetLabel: String
    private let locationState: KozmosUserLocationState
    private let locationIcons: [KozmosUserLocationState: Image]
    private let locationPresentation: KozmosMapControlButtonPresentation
    private let locationLabel: String
    private let locationStateLabel: String?
    private let locationHeadingDescription: String
    private let locationHeadingPausedDescription: String
    private let locationRevealOnChange: Bool
    private let locationLabelPlacement: KozmosMapControlButtonLabelPlacement
    private let onStepFreeChange: ((Bool) -> Void)?
    private let stepFree: Bool
    private let stepFreeLabel: String
    private let stepFreeOnLabel: String
    private let stepFreeOffLabel: String
    private let stepFreeIcon: Image?

    /// - Parameters:
    ///   - zoomInLabel: What each control is called, for a visitor who cannot
    ///     see it. Hard-coded English until row 67: a German or Japanese device
    ///     announced "Zoom in" whatever else the product had translated. The
    ///     defaults stay English because a design system has no locale of its
    ///     own — the product has one, and now has somewhere to put it.
    ///   - locationState: The mode the location control shows (row 77): a mark
    ///     for each, pressed only while the map follows the visitor, and the
    ///     system's arc while it is locating. Pair it with a localized
    ///     `locationStateLabel` — the mark alone tells a screen reader nothing.
    ///   - locationStateLabel: The state the control shows under its name: "Off",
    ///     "On". The SDK reads heading "On", as it reads following (decision
    ///     40). With no position (`.unavailable`, `.permissionDenied`) the
    ///     control draws this alone, on one line — the SDK's "No Location" —
    ///     and its name still starts what VoiceOver hears.
    ///   - locationHeadingDescription: What heading adds to the name for
    ///     VoiceOver, after the words it shows: heading reads "On" as following
    ///     does, and only its mark tells the two apart on screen. The product
    ///     translates it.
    ///   - locationHeadingPausedDescription: What a paused heading adds to the
    ///     name for VoiceOver, after the words it shows: `.headingPaused` reads
    ///     "Off", as off does, and the next press brings the turning map back
    ///     (decision 45). The product translates it.
    ///   - locationIcons: The mark for any mode, in place of the group's own.
    ///     Pass the modes you have artwork for; the others keep the group's
    ///     marks. Drawn in the control's colour.
    ///   - locationRevealOnChange: Let the location control widen to say its
    ///     new mode whenever it changes, then collapse — `KozmosMapControlButton`'s
    ///     `revealOnChange`. With `locationLabelPlacement: .stacked` this is how
    ///     the SDK's control reads: icon-only over the map, "Focus / On" for a
    ///     moment. Both are off by default, so a product that relies on a fixed
    ///     presentation sees nothing move.
    ///   - onStepFreeChange: While a route is shown, a step-free toggle takes
    ///     the location control's place: passing this draws it, and the
    ///     location control is not drawn. Called with the setting the visitor
    ///     asked for. Pass it only while the route is shown (Olcay, 2026-09-27).
    ///     It follows the location control's presentation, reveal and label
    ///     placement, so the corner reads the same either way.
    ///   - stepFree: Whether the route is step-free now. Set it once the route
    ///     it describes is the one on the map — a control that says "On" over a
    ///     route with stairs is worse than one that is a moment late.
    public init(
        compassBearing: Double = 0,
        onZoomIn: (() -> Void)? = nil,
        onZoomOut: (() -> Void)? = nil,
        onCompassReset: (() -> Void)? = nil,
        onMyLocation: (() -> Void)? = nil,
        zoomInLabel: String = "Zoom in",
        zoomOutLabel: String = "Zoom out",
        compassResetLabel: String = "Reset bearing",
        locationState: KozmosUserLocationState = .off,
        locationIcons: [KozmosUserLocationState: Image] = [:],
        locationPresentation: KozmosMapControlButtonPresentation = .iconOnly,
        locationLabel: String = "Locate me",
        locationStateLabel: String? = nil,
        locationHeadingDescription: String = "map turns with you",
        locationHeadingPausedDescription: String = "press to turn the map with you again",
        locationRevealOnChange: Bool = false,
        locationLabelPlacement: KozmosMapControlButtonLabelPlacement = .inline,
        onStepFreeChange: ((Bool) -> Void)? = nil,
        stepFree: Bool = false,
        stepFreeLabel: String = "Step-free",
        stepFreeOnLabel: String = "On",
        stepFreeOffLabel: String = "Off",
        stepFreeIcon: Image? = nil
    ) {
        self.compassBearing = compassBearing
        self.onZoomIn = onZoomIn
        self.onZoomOut = onZoomOut
        self.onCompassReset = onCompassReset
        self.onMyLocation = onMyLocation
        self.zoomInLabel = zoomInLabel
        self.zoomOutLabel = zoomOutLabel
        self.compassResetLabel = compassResetLabel
        self.locationState = locationState
        self.locationIcons = locationIcons
        self.locationPresentation = locationPresentation
        self.locationLabel = locationLabel
        self.locationStateLabel = locationStateLabel
        self.locationHeadingDescription = locationHeadingDescription
        self.locationHeadingPausedDescription = locationHeadingPausedDescription
        self.locationRevealOnChange = locationRevealOnChange
        self.locationLabelPlacement = locationLabelPlacement
        self.onStepFreeChange = onStepFreeChange
        self.stepFree = stepFree
        self.stepFreeLabel = stepFreeLabel
        self.stepFreeOnLabel = stepFreeOnLabel
        self.stepFreeOffLabel = stepFreeOffLabel
        self.stepFreeIcon = stepFreeIcon
    }

    public var body: some View {
        VStack(spacing: KozmosDimensions.primitivesLayoutSpacing100) {
            // Zoom: one surface, its two controls its segments — the map
            // controls' surface, corner and shadows, and no edge round it.
            VStack(spacing: 0) {
                controlButton(
                    systemName: "plus",
                    accessibilityLabel: zoomInLabel,
                    actionName: "zoom_in",
                    action: onZoomIn
                )

                // A `Divider` here would stretch the whole group across the
                // map: it is horizontally greedy, and nothing else in the
                // stack constrains the width. The hairline is the container
                // edge's role, as React's and Compose's are.
                Rectangle()
                    .fill(KozmosColors.semanticsBorderSubtle)
                    .frame(width: Self.controlSize, height: 1)

                controlButton(
                    systemName: "minus",
                    accessibilityLabel: zoomOutLabel,
                    actionName: "zoom_out",
                    action: onZoomOut
                )
            }
            .background(surfaceColor)
            .clipShape(controlShape)
            .kozmosElevation(KozmosShadows.semanticsElevationMapControl, in: controlShape, fill: surfaceColor)

            if let onCompassReset {
                controlButton(
                    systemName: "safari",
                    accessibilityLabel: compassResetLabel,
                    actionName: "compass_reset",
                    action: onCompassReset
                )
                .rotationEffect(.degrees(compassBearing))
                .background(surfaceColor)
                .clipShape(controlShape)
                .kozmosElevation(KozmosShadows.semanticsElevationMapControl, in: controlShape, fill: surfaceColor)
            }

            if let control = modeControl {
                KozmosMapControlButton(
                    label: control.label,
                    stateLabel: control.stateLabel,
                    stateDescription: control.stateDescription,
                    showsLabel: control.showsLabel,
                    presentation: control.presentation,
                    labelPlacement: control.labelPlacement,
                    revealOnChange: control.revealOnChange,
                    pressed: control.pressed,
                    isLoading: control.isLoading
                ) {
                    trackEvent(
                        KozmosAnalyticsEvent(
                            eventName: control.eventName,
                            component: "MapControlsGroup",
                            properties: control.eventProperties
                        )
                    )
                    control.action()
                } icon: {
                    control.icon
                        .frame(width: markSize, height: markSize)
                }
                // Step-free arriving in the location control's place is a new
                // control, not the old one changing state, so it never reveals
                // on arrival — as on Compose, where the two are separate calls.
                .id(control.kind)
            }
        }
    }

    /// The page's own surface, opaque, as the SDK's is. It was 88% of it.
    private var surfaceColor: Color {
        KozmosColors.primitivesColorsBackground0
    }

    /// The Control corner, the SDK's 16. The zoom pair and the compass wore
    /// the Container's 20.
    private var controlShape: RoundedRectangle {
        RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl, style: .continuous)
    }

    private func controlButton(
        systemName: String,
        accessibilityLabel: String,
        actionName: String,
        action: (() -> Void)?
    ) -> some View {
        Button {
            trackEvent(KozmosAnalyticsEvent(eventName: actionName, component: "MapControlsGroup"))
            action?()
        } label: {
            Image(systemName: systemName)
                .font(.system(size: 18, weight: .semibold))
                .frame(width: Self.controlSize, height: Self.controlSize)
                .foregroundColor(KozmosColors.primitivesColorsForeground100)
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel(accessibilityLabel)
    }
}

extension KozmosMapControlsGroup {
    /// The toggle at the foot of the group, decided before any of it is drawn.
    ///
    /// Kept apart from the view, as `KozmosMapControlButtonAppearance` is,
    /// because this is what row 77 changed and it can be tested without
    /// rendering: which control stands there — step-free while a route is
    /// shown, the location control otherwise — what it is called, which mark
    /// it draws, and whether it reads as on.
    struct ModeControl {
        enum Kind: Hashable {
            case location
            case stepFree
        }

        let kind: Kind
        let label: String
        let stateLabel: String?
        /// What heading adds to the name for VoiceOver; nil otherwise.
        let stateDescription: String?
        /// Off with no position: the SDK's "No Location" reads alone.
        let showsLabel: Bool
        let icon: Image
        let pressed: Bool
        let isLoading: Bool
        let presentation: KozmosMapControlButtonPresentation
        let labelPlacement: KozmosMapControlButtonLabelPlacement
        let revealOnChange: Bool
        let eventName: String
        let eventProperties: [String: Any]?
        let action: () -> Void
    }

    /// The location control's mark for each mode, in SF Symbols — native
    /// draws the platform's own glyphs, as `KozmosIcon` does, not Pointr's
    /// artwork. Each is the nearest to the Location Tracking Buttons revamp
    /// (Figma `ce7phRJR1sCkH6zT8EMH8I`, `1:237`), and they are Apple's own
    /// tracking button's:
    ///
    /// - the outline arrow while the map is not following: off, and stale,
    ///   whose last-known fix is not following anything. Locating keeps it
    ///   too, under the button's spinner;
    /// - the filled arrow while the map follows — the revamp's solid pointer
    ///   and its cone;
    /// - the arrow pointing north over a line while the map turns with the
    ///   visitor — the revamp's upright pointer and turning arc — and the same
    ///   in outline while heading is paused, the revamp's rotational Off
    ///   (decision 45);
    /// - the arrow struck through when there is no position to show.
    static func locationSymbol(for state: KozmosUserLocationState) -> String {
        switch state {
        case .off, .locating, .stale:
            return "location"
        case .following:
            return "location.fill"
        case .heading:
            return "location.north.line.fill"
        case .headingPaused:
            return "location.north.line"
        case .permissionDenied, .unavailable:
            return "location.slash"
        }
    }

    /// The wheelchair `KozmosRouteOptionCard` draws for a step-free route.
    static let stepFreeSymbol = "figure.roll"

    var modeControl: ModeControl? {
        if let onStepFreeChange {
            let stepFree = stepFree
            return ModeControl(
                kind: .stepFree,
                label: stepFreeLabel,
                stateLabel: stepFree ? stepFreeOnLabel : stepFreeOffLabel,
                stateDescription: nil,
                showsLabel: true,
                icon: stepFreeIcon ?? Image(systemName: Self.stepFreeSymbol),
                pressed: stepFree,
                isLoading: false,
                presentation: locationPresentation,
                labelPlacement: locationLabelPlacement,
                revealOnChange: locationRevealOnChange,
                eventName: "step_free_toggled",
                eventProperties: ["stepFree": !stepFree],
                action: { onStepFreeChange(!stepFree) }
            )
        }

        guard let onMyLocation else { return nil }
        return ModeControl(
            kind: .location,
            label: locationLabel,
            stateLabel: locationStateLabel,
            // Heading reads "On", as following does and as the SDK's control
            // does (decision 40); its mark tells them apart on screen, and
            // this after the words tells VoiceOver. A paused heading reads
            // "Off", as off does, and says the next press brings it back
            // (decision 45).
            stateDescription: locationState == .heading
                ? locationHeadingDescription
                : locationState == .headingPaused ? locationHeadingPausedDescription : nil,
            // With no position the SDK reads "No Location" alone, on one line.
            showsLabel: !(locationState == .unavailable || locationState == .permissionDenied),
            icon: locationIcons[locationState] ?? Image(systemName: Self.locationSymbol(for: locationState)),
            // It was pressed whatever the state until row 77, so a map that was
            // not following at all drew a control that said it was.
            pressed: locationState == .following || locationState == .heading,
            isLoading: locationState == .locating,
            presentation: locationPresentation,
            labelPlacement: locationLabelPlacement,
            revealOnChange: locationRevealOnChange,
            eventName: "my_location_triggered",
            eventProperties: nil,
            action: onMyLocation
        )
    }
}
