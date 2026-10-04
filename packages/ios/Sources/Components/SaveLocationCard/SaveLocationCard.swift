import SwiftUI

public struct KozmosSaveLocationCard: View {
    @Environment(\.kozmosAnalytics) private var trackEvent

    private let title: String
    private let description: String
    private let isSaved: Bool
    private let surface: KozmosSurfaceStyle
    private let onSaveToggle: (() -> Void)?
    private let onRouteToLocation: (() -> Void)?
    private let onEditNote: (() -> Void)?

    /// `surface` is what the card is made of, as React's `surface` prop: `.solid`
    /// (the default) or `.glass`, for a card over the map. Until 2026-09-22
    /// SwiftUI drew it solid only.
    public init(
        title: String = "Mark My Car",
        description: String = "Remember where you parked",
        isSaved: Bool = false,
        surface: KozmosSurfaceStyle = .solid,
        onSaveToggle: (() -> Void)? = nil,
        onRouteToLocation: (() -> Void)? = nil,
        onEditNote: (() -> Void)? = nil
    ) {
        self.title = title
        self.description = description
        self.isSaved = isSaved
        self.surface = surface
        self.onSaveToggle = onSaveToggle
        self.onRouteToLocation = onRouteToLocation
        self.onEditNote = onEditNote
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing200) {
            HStack(spacing: KozmosDimensions.primitivesLayoutSpacing200) {
                Image(systemName: "car.fill")
                    .font(.system(size: 22, weight: .semibold))
                    .frame(width: 48, height: 48)
                    .foregroundColor(isSaved ? KozmosColors.componentsPrimaryButtonsThemedButtonForegroundContentIdle : KozmosColors.primitivesColorsForeground100)
                    .background(isSaved ? KozmosColors.componentsPrimaryButtonsThemedButtonBackgroundIdle : KozmosColors.primitivesColorsBackground0)
                    .clipShape(Circle())
                    .overlay(Circle().stroke(KozmosColors.primitivesColorsForeground900.opacity(0.08), lineWidth: 1))

                VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing25) {
                    Text(title)
                        .font(.headline.weight(.semibold))
                        .foregroundColor(KozmosColors.primitivesColorsForeground100)

                    // Muted, and on glass the foreground colour (decision
                    // 48): the card's surface says which.
                    Text(description)
                        .font(KozmosTypography.subheadline)
                        .kozmosMutedText()
                }

                Spacer()

                if isSaved, let onEditNote {
                    Button(action: onEditNote) {
                        Image(systemName: "pencil")
                            .frame(width: 36, height: 36)
                            .foregroundColor(KozmosColors.primitivesColorsForeground500)
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("Edit location note")
                }
            }

            HStack(spacing: KozmosDimensions.primitivesLayoutSpacing150) {
                KozmosButton(isSaved ? "Remove Location" : "Save Location", variant: isSaved ? .outline : .default,
                             fillsWidth: true, leadingIconName: "marker-pin-01") {
                    trackEvent(KozmosAnalyticsEvent(eventName: "save_toggled", component: "SaveLocationCard", properties: ["isSaved": String(!isSaved)]))
                    onSaveToggle?()
                }

                if isSaved, let onRouteToLocation {
                    KozmosButton("Guide Me", emotion: .success, fillsWidth: true, leadingIconName: "navigation-pointer-01") {
                        trackEvent(KozmosAnalyticsEvent(eventName: "route_requested", component: "SaveLocationCard"))
                        onRouteToLocation()
                    }
                }
            }
        }
        .padding(KozmosDimensions.primitivesLayoutSpacing300)
        .clipShape(RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusPanel, style: .continuous))
        // The solid surface React's card sits on by default: the background
        // with the subtle border. It was the background at 90 % under a
        // near-black hairline at 8 % until 2026-09-22.
        .kozmosSurface(RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusPanel, style: .continuous), style: surface)
        .kozmosElevation(KozmosShadows.semanticsElevationOverlay)
    }
}
