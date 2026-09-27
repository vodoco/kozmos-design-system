import SwiftUI

/// Characters `encodeURIComponent` leaves untouched. Matching the web escaping
/// exactly keeps the identifier identical on all three platforms.
private let kozmosPOIResultIdentifierAllowed = CharacterSet(
    charactersIn: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_.!~*'()"
)

/// Stable identifier for a POI result, shared with map markers so a pin and its
/// list row can be kept in sync from one selection ID.
///
/// Produces the same value as the web `getPOIResultDomId`.
public func kozmosPOIResultIdentifier(_ poiId: String) -> String {
    let encoded = poiId
        .addingPercentEncoding(withAllowedCharacters: kozmosPOIResultIdentifierAllowed) ?? poiId
    return "poi-result-\(encoded)"
}

/// A POI search/list result row.
///
/// Mirrors the React `POIResultCard`. Selection is reported upward only; the
/// card renders exactly the state described by `poi` and `result`.
public struct KozmosPOIResultCard: View {
    @Environment(\.kozmosAnalytics) private var trackEvent

    private let poi: KozmosPOIPresentation
    private let result: KozmosPOIResultPresentation
    private let featuredLabel: String
    private let selectionLabel: String?
    /// The floor the map shows: a result on it carries a dot before its floor.
    private let currentFloorId: String?
    private let actionsLabel: String
    private let onSelect: (String) -> Void
    private let onAction: ((KozmosPOIResultAction, String) -> Void)?

    public init(
        poi: KozmosPOIPresentation,
        result: KozmosPOIResultPresentation,
        featuredLabel: String = "Featured",
        selectionLabel: String? = nil,
        currentFloorId: String? = nil,
        actionsLabel: String = "Actions for this result",
        onSelect: @escaping (String) -> Void,
        onAction: ((KozmosPOIResultAction, String) -> Void)? = nil
    ) {
        self.poi = poi
        self.result = result
        self.featuredLabel = featuredLabel
        self.selectionLabel = selectionLabel
        self.currentFloorId = currentFloorId
        self.actionsLabel = actionsLabel
        self.onSelect = onSelect
        self.onAction = onAction
    }

    private func handleAction(_ action: KozmosPOIResultAction) {
        trackEvent(
            KozmosAnalyticsEvent(
                eventName: "poi_result_action",
                component: "POIResultCard",
                properties: [
                    "poiId": poi.id,
                    "resultIndex": result.resultIndex,
                    "action": action.rawValue
                ]
            )
        )
        onAction?(action, poi.id)
    }

    /// Shown only on the selected result: an action row on every card would
    /// be a wall of buttons, and the tap that selects is the tap that asks.
    private var visibleActions: [KozmosPOIResultActionPresentation] {
        guard result.selected, available else { return [] }
        return result.actions
    }

    var onCurrentFloor: Bool { currentFloorId != nil && result.floorId == currentFloorId }

    private var available: Bool { result.isAvailable }

    /// Three tones, not two. "Closing soon" is a reason to hurry, so it cannot
    /// look like open; the place is still open, so it is not closed either.
    private var availabilityTone: Color {
        switch poi.availability {
        case .open:
            return KozmosColors.componentsPrimaryButtonsSuccessButtonBackgroundIdle
        case .openingSoon, .closingSoon:
            return KozmosColors.componentsPrimaryButtonsAlertButtonBackgroundIdle
        default:
            return KozmosColors.primitivesColorsForeground500
        }
    }

    private var accessibilityDescription: String {
        if let selectionLabel { return selectionLabel }
        return [
            result.featured ? featuredLabel : nil,
            poi.name,
            poi.categoryLabel,
            poi.locationLabel,
            poi.availabilityLabel,
            result.travelEstimate?.durationLabel,
            available ? nil : result.unavailableReason
        ]
        .compactMap { $0 }
        .joined(separator: ", ")
    }

    /// An unavailable result is still readable, but must not be announced as an
    /// actionable button. `.isSelected` only applies to a selectable card.
    private var accessibilityTraits: AccessibilityTraits {
        guard available else { return [] }
        return result.selected ? [.isButton, .isSelected] : .isButton
    }

    private func handleSelect() {
        guard available else { return }
        trackEvent(
            KozmosAnalyticsEvent(
                eventName: "poi_result_selected",
                component: "POIResultCard",
                properties: [
                    "poiId": poi.id,
                    "resultIndex": result.resultIndex,
                    "featured": result.featured
                ]
            )
        )
        onSelect(poi.id)
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            if result.featured {
                HStack(spacing: KozmosDimensions.primitivesLayoutSpacing50) {
                    Image(systemName: "star.fill")
                        .font(KozmosTypography.caption2)
                        .accessibilityHidden(true)
                    Text(featuredLabel)
                        .font(.caption.weight(.semibold))
                }
                .foregroundColor(KozmosColors.componentsPrimaryButtonsAlertButtonForegroundContentIdle)
                .padding(.horizontal, KozmosDimensions.primitivesLayoutSpacing100)
                .padding(.vertical, KozmosDimensions.primitivesLayoutSpacing50)
                .background(KozmosColors.componentsPrimaryButtonsAlertButtonBackgroundIdle)
                .clipShape(
                    RoundedRectangle(
                        cornerRadius: KozmosDimensions.semanticsRadiusControl,
                        style: .continuous
                    )
                )
                .padding(.leading, KozmosDimensions.primitivesLayoutSpacing200)
            } else if let badge = result.badge {
                // One tab, one treatment: the prototypes draw "Popular Choice"
                // in the same amber as "Featured", so the LABEL distinguishes
                // them and the styling does not. What differs is meaning -
                // featured is the CMS's word and the map marker acts on it too.
                HStack(spacing: KozmosDimensions.primitivesLayoutSpacing50) {
                    Image(systemName: "star.fill")
                        .font(KozmosTypography.caption2)
                        .accessibilityHidden(true)
                    Text(badge.label)
                        .font(.caption.weight(.semibold))
                }
                .foregroundColor(KozmosColors.componentsPrimaryButtonsAlertButtonForegroundContentIdle)
                .padding(.horizontal, KozmosDimensions.primitivesLayoutSpacing100)
                .padding(.vertical, KozmosDimensions.primitivesLayoutSpacing50)
                .background(KozmosColors.componentsPrimaryButtonsAlertButtonBackgroundIdle)
                .clipShape(
                    RoundedRectangle(
                        cornerRadius: KozmosDimensions.semanticsRadiusControl,
                        style: .continuous
                    )
                )
                .padding(.leading, KozmosDimensions.primitivesLayoutSpacing200)
            }

            Button(action: handleSelect) {
                HStack(alignment: .center, spacing: KozmosDimensions.primitivesLayoutSpacing150) {
                    VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing25) {
                        Text(poi.name)
                            .font(KozmosTypography.body)
                            .foregroundColor(KozmosColors.primitivesColorsForeground100)
                            .lineLimit(1)

                        if let categoryLabel = poi.categoryLabel {
                            Text(categoryLabel)
                                .font(KozmosTypography.subheadline)
                                .foregroundColor(KozmosColors.primitivesColorsForeground500)
                                .lineLimit(1)
                        }

                        HStack(spacing: KozmosDimensions.primitivesLayoutSpacing75) {
                            // A dot before the floor when it is the one the map shows.
                            if onCurrentFloor {
                                Circle()
                                    .fill(KozmosColors.primitivesColorsTheme500)
                                    .frame(width: KozmosDimensions.primitivesLayoutSpacing75, height: KozmosDimensions.primitivesLayoutSpacing75)
                                    .accessibilityHidden(true)
                            }
                            Text(poi.locationLabel)
                                .font(KozmosTypography.subheadline)
                                .lineLimit(1)
                        }
                        .foregroundColor(KozmosColors.primitivesColorsForeground500)

                        if let availabilityLabel = poi.availabilityLabel {
                            Text(availabilityLabel)
                                .font(.caption.weight(.semibold))
                                .foregroundColor(availabilityTone)
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)

                    VStack(alignment: .trailing, spacing: KozmosDimensions.primitivesLayoutSpacing100) {
                        logo

                        if let travelEstimate = result.travelEstimate {
                            Text(travelEstimate.durationLabel)
                                .font(KozmosTypography.subheadline)
                                .foregroundColor(KozmosColors.primitivesColorsForeground100)
                        }
                    }
                }
                // 80 tall: the prototype's row.
                .frame(minHeight: KozmosDimensions.primitivesLayoutSizing1000 - KozmosDimensions.primitivesLayoutSpacing150 * 2)
                .padding(.horizontal, KozmosDimensions.primitivesLayoutSpacing200)
                .padding(.vertical, KozmosDimensions.primitivesLayoutSpacing150)
                // The row has no fill of its own, so without an explicit hit
                // shape only the text and the logo are tappable and the gaps
                // between them swallow taps.
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .disabled(!available)
            .opacity(available ? 1 : 0.6)
            // The collapse belongs to the SELECT ROW, not the card.
            //
            // It used to sit on the outer VStack, which flattened everything
            // inside it into one element - fine while the card was only a row,
            // and the exact SwiftUI counterpart of the nested <button> the web
            // card had: any action button added below would have been drawn on
            // screen and unreachable to VoiceOver.
            .accessibilityElement(children: .ignore)
            .accessibilityLabel(accessibilityDescription)
            .accessibilityAddTraits(accessibilityTraits)
            .accessibilityAction {
                // No-ops when unavailable; the traits above already withhold
                // the button affordance so VoiceOver does not offer the action.
                handleSelect()
            }

            if !visibleActions.isEmpty {
                Divider().overlay(KozmosColors.semanticsBorderSubtle)

                HStack(spacing: KozmosDimensions.primitivesLayoutSpacing100) {
                    ForEach(visibleActions) { entry in
                        KozmosPOIResultActionButton(entry: entry) {
                            handleAction(entry.action)
                        }
                    }
                    Spacer(minLength: 0)
                }
                .padding(.horizontal, KozmosDimensions.primitivesLayoutSpacing200)
                .padding(.vertical, KozmosDimensions.primitivesLayoutSpacing100)
                .accessibilityElement(children: .contain)
                .accessibilityLabel(actionsLabel)
            }

            if !available, let unavailableReason = result.unavailableReason {
                Divider().overlay(KozmosColors.semanticsBorderSubtle)

                Text(unavailableReason)
                    .font(KozmosTypography.caption)
                    .foregroundColor(KozmosColors.primitivesColorsForeground500)
                    .padding(.horizontal, KozmosDimensions.primitivesLayoutSpacing200)
                    .padding(.vertical, KozmosDimensions.primitivesLayoutSpacing100)
            }
        }
        .background(KozmosColors.primitivesColorsBackground0)
        .clipShape(RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl, style: .continuous)
                .stroke(
                    result.selected
                        ? KozmosColors.primitivesColorsTheme500
                        : KozmosColors.semanticsBorderSubtle,
                    lineWidth: result.selected ? 2 : 1
                )
        )
        .accessibilityIdentifier(kozmosPOIResultIdentifier(poi.id))
    }

    /// The logo when there is one, 48 at radius Control; nothing otherwise.
    @ViewBuilder
    private var logo: some View {
        if let logo = poi.logo, let url = URL(string: logo.src) {
            AsyncImage(url: url) { image in
                image.resizable().aspectRatio(contentMode: .fit)
            } placeholder: {
                KozmosColors.primitivesColorsBackground100
            }
            .frame(width: KozmosDimensions.primitivesLayoutSizing600, height: KozmosDimensions.primitivesLayoutSizing600)
            .clipShape(
                RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl, style: .continuous)
            )
            .overlay(
                RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl, style: .continuous)
                    .stroke(KozmosColors.semanticsBorderSubtle, lineWidth: 1)
            )
            .accessibilityLabel(logo.alt)
        }
    }
}

/// One action on a selected result.
///
/// Its own View rather than an inline chain: SwiftUI's type checker gave up on
/// the styling when it lived inside the card's body, and splitting the
/// expression is the fix the compiler itself asks for.
private struct KozmosPOIResultActionButton: View {
    let entry: KozmosPOIResultActionPresentation
    let action: () -> Void

    private var foreground: Color {
        entry.primary
            ? KozmosColors.componentsPrimaryButtonsThemedButtonForegroundContentIdle
            : KozmosColors.primitivesColorsForeground0
    }

    private var background: Color {
        entry.primary
            ? KozmosColors.componentsPrimaryButtonsThemedButtonBackgroundIdle
            : KozmosColors.primitivesColorsBackground0
    }

    private var border: Color {
        entry.primary ? Color.clear : KozmosColors.semanticsBorderSubtle
    }

    private var shape: RoundedRectangle {
        RoundedRectangle(
            cornerRadius: KozmosDimensions.semanticsRadiusControl,
            style: .continuous
        )
    }

    var body: some View {
        Button(entry.label, action: action)
            .buttonStyle(.plain)
            .font(.subheadline.weight(.semibold))
            .foregroundColor(foreground)
            .padding(.horizontal, KozmosDimensions.primitivesLayoutSpacing200)
            .padding(.vertical, KozmosDimensions.primitivesLayoutSpacing100)
            .background(background)
            .clipShape(shape)
            .overlay(shape.stroke(border, lineWidth: 1))
            .disabled(entry.disabled)
            .opacity(entry.disabled ? 0.6 : 1)
    }
}
