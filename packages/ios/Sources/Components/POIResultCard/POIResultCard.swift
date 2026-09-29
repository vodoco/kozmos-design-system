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
    /// The words for a walk shown as a band, when `result.travelEstimate.band`
    /// is set (decision 50). English until the product gives its own, for one
    /// band or all five.
    private let travelTimeBandLabels: [KozmosTravelTimeBand: String]
    /// Draw the result's number, `result.resultIndex`, in its tab: the number
    /// its pin shows on the map. Off unless the product turns it on, for a
    /// list whose pins are numbered, as quick access's are. The card draws
    /// the number it is given and never renumbers. A featured result keeps
    /// its Featured tab and shows no number, as its pin shows its logo; a
    /// number takes the place of a badge. The number leads what VoiceOver
    /// says ("2, Burger King"); a `selectionLabel` replaces all of it.
    let numbered: Bool
    private let onSelect: (String) -> Void
    private let onAction: ((KozmosPOIResultAction, String) -> Void)?

    public init(
        poi: KozmosPOIPresentation,
        result: KozmosPOIResultPresentation,
        featuredLabel: String = "Featured",
        selectionLabel: String? = nil,
        currentFloorId: String? = nil,
        actionsLabel: String = "Actions for this result",
        travelTimeBandLabels: [KozmosTravelTimeBand: String] = [:],
        numbered: Bool = false,
        onSelect: @escaping (String) -> Void,
        onAction: ((KozmosPOIResultAction, String) -> Void)? = nil
    ) {
        self.poi = poi
        self.result = result
        self.featuredLabel = featuredLabel
        self.selectionLabel = selectionLabel
        self.currentFloorId = currentFloorId
        self.actionsLabel = actionsLabel
        self.travelTimeBandLabels = travelTimeBandLabels
        self.numbered = numbered
        self.onSelect = onSelect
        self.onAction = onAction
    }

    /// The card's one tab, and what it says decides how it looks. Featured
    /// is the CMS's word and the map acts on it too (its pin draws the logo),
    /// so it wins; then the number, which pairs the result with its pin; then
    /// the badge, which only says why the result is in the list.
    enum Tab: Equatable {
        case featured
        case number(String)
        case badge(String)

        var isNumber: Bool {
            if case .number = self { return true }
            return false
        }
    }

    /// The number drawn, when the list is numbered and the result is not
    /// featured: `resultIndex` as given.
    var numberText: String? {
        numbered && !result.featured ? "\(result.resultIndex)" : nil
    }

    var tab: Tab? {
        if result.featured { return .featured }
        if let numberText { return .number(numberText) }
        if let badge = result.badge { return .badge(badge.label) }
        return nil
    }

    /// The tab's fill, words and edge (GAP-054). Featured is the SDK's bright
    /// amber under dark words, the alert fill pair, for its words and its star
    /// (Olcay, 2026-09-29). A number is quiet at rest, the card's own fill
    /// outlined in the container edge with muted words, and filled with the
    /// primary colour when the result is selected, as the selected card's edge
    /// is. A badge is quiet: the muted fill and muted words, with no star. Each
    /// pair reads at 4.5:1 or more in both themes, as on the web.
    struct TabPaint {
        let fill: Color
        let ink: Color
        let edge: Color?
    }

    var tabPaint: TabPaint? {
        switch tab {
        case .featured:
            return TabPaint(
                fill: KozmosColors.semanticsEmotionAlertFill,
                ink: KozmosColors.semanticsEmotionAlertOnfill,
                edge: nil
            )
        case .number:
            return result.selected
                ? TabPaint(
                    fill: KozmosColors.primitivesColorsTheme600,
                    ink: KozmosColors.primitivesColorsForeground1000,
                    edge: nil
                )
                : TabPaint(
                    fill: KozmosColors.primitivesColorsBackground0,
                    ink: KozmosColors.primitivesColorsForeground400,
                    edge: KozmosColors.semanticsBorderSubtle
                )
        case .badge:
            return TabPaint(
                fill: KozmosColors.primitivesColorsBackground100,
                ink: KozmosColors.primitivesColorsForeground400,
                edge: nil
            )
        case nil:
            return nil
        }
    }

    /// What the result says about the walk: the band's words when the
    /// product set a band (decision 50), the exact minutes when it did not.
    var travelTimeText: String? {
        guard let estimate = result.travelEstimate else { return nil }
        guard let band = estimate.band else { return estimate.durationLabel }
        return travelTimeBandLabels[band] ?? Self.englishLabel(band)
    }

    /// Nearby in the success emotion's Text role, which reads at 4.5:1 or
    /// more on the card in both themes; every other band, and the exact
    /// minutes, in the card's text colour. The word is Nearby, so the colour
    /// is never the only signal.
    private var travelTimeColor: Color {
        switch result.travelEstimate?.band?.tone {
        case .success:
            return KozmosColors.semanticsEmotionSuccessText
        case .neutral, nil:
            return KozmosColors.primitivesColorsForeground100
        }
    }

    /// The bands' words, and the only English the card holds for them.
    static func englishLabel(_ band: KozmosTravelTimeBand) -> String {
        switch band {
        case .nearby: return "Nearby"
        case .oneToTwoMinutes: return "1–2 min"
        case .twoToFiveMinutes: return "2–5 min"
        case .fiveToTenMinutes: return "5–10 min"
        case .moreThanTenMinutes: return "More than 10 min"
        }
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

    var accessibilityDescription: String {
        if let selectionLabel { return selectionLabel }
        return [
            result.featured ? featuredLabel : nil,
            // The number leads the name, "2, Burger King": the tab that draws
            // it is hidden from VoiceOver, so it is heard once.
            numberText,
            poi.name,
            poi.categoryLabel,
            poi.locationLabel,
            poi.availabilityLabel,
            travelTimeText,
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
            if let tab, let paint = tabPaint {
                tabView(tab, paint)
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

                        if let travelTimeText {
                            Text(travelTimeText)
                                .font(KozmosTypography.subheadline)
                                .foregroundColor(travelTimeColor)
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
                .stroke(edgeColor, lineWidth: result.selected ? 2 : 1)
        )
        .accessibilityIdentifier(kozmosPOIResultIdentifier(poi.id))
    }

    /// The card's edge. Selected, the theme colour at 2pt, whatever else the
    /// card is: the web says selection with a ring beside the edge, and a
    /// native card has only its edge to say it with. Otherwise a featured card
    /// takes its tab's amber (Olcay, 2026-09-29), and every other card the
    /// container edge: a number and a badge never recolour it.
    var edgeColor: Color {
        if result.selected { return KozmosColors.primitivesColorsTheme500 }
        if tab == .featured { return KozmosColors.semanticsEmotionAlertFill }
        return KozmosColors.semanticsBorderSubtle
    }

    /// The one tab, at the card's leading edge. Featured and a badge are read
    /// as their words, as they always were; a number is hidden, because it
    /// leads the result's own description.
    ///
    /// A capsule with circular ends, for the clip and the outline alike: its
    /// corners never exceed half its height, which is what Android's
    /// Control-radius shape clamps to, and they are circular arcs, as
    /// Android's are. The Control radius itself is larger than half a 22pt
    /// tab, and on a one-digit number, about as wide as it is tall, the
    /// outline came out as a circle with straight stubs out of its sides and
    /// bottom (K3, the review of #167). The continuous style does the same on
    /// a capsule that nearly square, so the style is named, not left to the
    /// default.
    @ViewBuilder
    private func tabView(_ tab: Tab, _ paint: TabPaint) -> some View {
        let shape = Capsule(style: .circular)
        let words: String = {
            switch tab {
            case .featured: return featuredLabel
            case .number(let number): return number
            case .badge(let label): return label
            }
        }()
        HStack(spacing: KozmosDimensions.primitivesLayoutSpacing50) {
            if tab == .featured {
                Image(systemName: "star.fill")
                    .font(KozmosTypography.caption2)
                    .accessibilityHidden(true)
            }
            Text(words)
                .font(.caption.weight(.semibold))
        }
        .foregroundColor(paint.ink)
        .padding(.horizontal, KozmosDimensions.primitivesLayoutSpacing100)
        .padding(.vertical, KozmosDimensions.primitivesLayoutSpacing50)
        .background(paint.fill)
        .clipShape(shape)
        .overlay(shape.strokeBorder(paint.edge ?? .clear, lineWidth: 1))
        .padding(.leading, KozmosDimensions.primitivesLayoutSpacing200)
        .accessibilityHidden(tab.isNumber)
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
