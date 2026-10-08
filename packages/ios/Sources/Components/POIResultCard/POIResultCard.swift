import SwiftUI

/// SDK is the default; legacy supports staged migration without changing product data.
public enum KozmosPOIResultPresentationStyle: Sendable { case legacy, sdk }
/// A group owns its border and outer corners; interior rows supply only content.
public enum KozmosPOIResultAppearance: Sendable { case card, row }

/// The card supplies the outside corner. This path supplies only the inside
/// bottom-end corner and mirrors logically, including the quiet tab's edge.
private struct POIResultTabShape: Shape {
    var rightToLeft: Bool
    var edgeOnly = false
    var radius: CGFloat = KozmosDimensions.primitivesLayoutSpacing100 - 1

    func path(in rect: CGRect) -> Path {
        let inset: CGFloat = edgeOnly ? 0.5 : 0
        let end = rect.maxX - inset
        let bottom = rect.maxY - inset
        let radius = min(radius, min(rect.width, rect.height))
        var path = Path()
        path.move(to: CGPoint(x: end, y: rect.minY))
        path.addLine(to: CGPoint(x: end, y: bottom - radius))
        path.addArc(center: CGPoint(x: end - radius, y: bottom - radius), radius: radius,
                    startAngle: .zero, endAngle: .degrees(90), clockwise: false)
        path.addLine(to: CGPoint(x: rect.minX, y: bottom))
        if !edgeOnly {
            path.addLine(to: CGPoint(x: rect.minX, y: rect.minY))
            path.closeSubpath()
        }
        return rightToLeft ? path.applying(CGAffineTransform(a: -1, b: 0, c: 0, d: 1, tx: rect.minX + rect.maxX, ty: 0)) : path
    }
}

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
    @Environment(\.layoutDirection) private var layoutDirection
    @ScaledMetric(relativeTo: .caption2) private var tabHeight = KozmosDimensions.primitivesLayoutSizing200
    @State private var hovered = false

    private let poi: KozmosPOIPresentation
    private let result: KozmosPOIResultPresentation
    private let featuredLabel: String
    private let languageNotListedLabel: String
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
    /// the number it is given and never renumbers. SDK tabs combine the number
    /// with Featured or a badge. Only legacy presentation hides Featured's
    /// number and lets a number replace a badge. The number leads what VoiceOver
    /// says ("2, Burger King"); a `selectionLabel` replaces all of it.
    let numbered: Bool
    let presentationStyle: KozmosPOIResultPresentationStyle
    let appearance: KozmosPOIResultAppearance
    private var sdk: Bool { presentationStyle == .sdk }
    private let onSelect: (String) -> Void
    /// Runs an action from the selected result's row, told which action and
    /// the POI's ID. Without it the row's actions are drawn disabled.
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
        onAction: ((KozmosPOIResultAction, String) -> Void)? = nil,
        languageNotListedLabel: String = "Language not listed",
        presentationStyle: KozmosPOIResultPresentationStyle = .sdk,
        appearance: KozmosPOIResultAppearance = .card
    ) {
        self.poi = poi
        self.result = result
        self.featuredLabel = featuredLabel
        self.languageNotListedLabel = languageNotListedLabel
        self.selectionLabel = selectionLabel
        self.currentFloorId = currentFloorId
        self.actionsLabel = actionsLabel
        self.travelTimeBandLabels = travelTimeBandLabels
        self.numbered = numbered
        self.presentationStyle = presentationStyle
        self.appearance = appearance
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
        numbered && (sdk || !result.featured) ? "\(result.resultIndex)" : nil
    }

    var tab: Tab? {
        if result.featured { return .featured }
        if sdk, let badge = result.badge { return .badge(badge.label) }
        if let numberText { return .number(numberText) }
        if let badge = result.badge { return .badge(badge.label) }
        return nil
    }

    /// The tab's fill, words and edge (GAP-054). Featured is the SDK's bright
    /// amber under dark words, the alert fill pair, for its words and its star
    /// (Olcay, 2026-09-29). A number is quiet at rest, the card's own fill
    /// outlined in the container edge with muted words, and when the result
    /// is selected filled as its pin is (decision 55): the theme fill, with
    /// the theme foreground, white in both themes (decision 59). A badge is
    /// quiet: the muted fill and muted words, with no star. Each pair reads
    /// at 4.5:1 or more in both themes, as on the web.
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
                    fill: KozmosColors.componentsPrimaryButtonsThemedButtonBackgroundIdle,
                    ink: KozmosColors.componentsPrimaryButtonsThemedButtonForegroundContentIdle,
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

    /// An action runs only when it is enabled and something handles it.
    /// Without `onAction` the card still draws what the product offers, but
    /// disabled — the rule POIDetailPanel's supplementary actions follow —
    /// never an enabled button that does nothing.
    private func canRun(_ entry: KozmosPOIResultActionPresentation) -> Bool {
        !entry.disabled && onAction != nil
    }

    var onCurrentFloor: Bool { currentFloorId != nil && result.floorId == currentFloorId }

    private var available: Bool { result.isAvailable }

    /// Three tones, not two. "Closing soon" is a reason to hurry, so it cannot
    /// look like open; the place is still open, so it is not closed either.
    private var availabilityTone: Color {
        switch poi.availability {
        case .open:
            return sdk ? KozmosColors.semanticsEmotionSuccessText : KozmosColors.componentsPrimaryButtonsSuccessButtonBackgroundIdle
        case .openingSoon, .closingSoon:
            return sdk ? KozmosColors.semanticsEmotionAlertText : KozmosColors.componentsPrimaryButtonsAlertButtonBackgroundIdle
        default:
            return sdk ? KozmosColors.primitivesColorsForeground400 : KozmosColors.primitivesColorsForeground500
        }
    }

    /// One generated line about this result, or nil: an empty one is none.
    var summaryText: String? {
        guard let summary = result.summary, !summary.isEmpty else { return nil }
        return summary
    }

    /// What VoiceOver says for the select row, phrase by phrase, in the web's
    /// order. The name is in the language it is authored in and the summary
    /// in the query's, which may not be the interface's (GAP-004, GAP-125).
    var accessibilityPhrases: [KozmosSpokenPhrase] {
        if let selectionLabel {
            return [selectionLabel, languageDisclosure].compactMap { $0 }.map { KozmosSpokenPhrase($0) }
        }
        let plain: (String?) -> KozmosSpokenPhrase? = { $0.map { KozmosSpokenPhrase($0) } }
        return [
            plain(!sdk && result.featured ? featuredLabel : nil),
            // The number leads the name, "2, Burger King": the tab that draws
            // it is hidden from VoiceOver, so it is heard once.
            plain(numberText),
            plain(sdk && result.featured ? featuredLabel : nil),
            plain(sdk && !result.featured ? result.badge?.label : nil),
            KozmosSpokenPhrase(poi.name, lang: result.nameLanguage),
            plain(poi.categoryLabel),
            plain(poi.locationLabel),
            summaryText.map { KozmosSpokenPhrase($0, lang: result.summaryLanguage) },
            plain(poi.availabilityLabel),
            plain(travelTimeText),
            plain(available ? nil : result.unavailableReason),
            plain(languageDisclosure)
        ]
        .compactMap { $0 }.filter { !$0.text.isEmpty }
    }

    var accessibilityDescription: String {
        kozmosSpokenDescription(accessibilityPhrases)
    }

    var languageDisclosure: String? {
        result.languageNotListed == true ? languageNotListedLabel : nil
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
            Button(action: handleSelect) {
                VStack(alignment: .leading, spacing: 0) {
                    if sdk, let tab, let paint = tabPaint {
                        tabView(tab, paint).allowsHitTesting(false)
                    }
                HStack(alignment: .center, spacing: KozmosDimensions.primitivesLayoutSpacing150) {
                    VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing25) {
                        Text(poi.name)
                            .font(KozmosTypography.body)
                            .foregroundColor(KozmosColors.primitivesColorsForeground100)
                            .lineLimit(sdk ? nil : 1)
                            .fixedSize(horizontal: false, vertical: true)

                        if let categoryLabel = poi.categoryLabel {
                            Text(categoryLabel)
                                .font(KozmosTypography.subheadline)
                                .foregroundColor(sdk ? KozmosColors.primitivesColorsForeground400 : KozmosColors.primitivesColorsForeground500)
                                .lineLimit(1)
                        }

                        HStack(spacing: KozmosDimensions.primitivesLayoutSpacing75) {
                            // A dot before the floor when it is the one the map
                            // shows: a mark on the card, theme 600, as React's.
                            if onCurrentFloor {
                                Circle()
                                    .fill(KozmosColors.primitivesColorsTheme600)
                                    .frame(width: KozmosDimensions.primitivesLayoutSpacing75, height: KozmosDimensions.primitivesLayoutSpacing75)
                                    .accessibilityHidden(true)
                            }
                            Text(poi.locationLabel)
                                .font(KozmosTypography.subheadline)
                                .lineLimit(1)
                        }
                        .foregroundColor(sdk ? KozmosColors.primitivesColorsForeground400 : KozmosColors.primitivesColorsForeground500)

                        if let summaryText {
                            // One generated line about this result, as on the
                            // web: two lines at most, since a summary that
                            // grows moves the results below it (GAP-029).
                            Text(summaryText)
                                .font(KozmosTypography.subheadline)
                                .foregroundColor(sdk ? KozmosColors.primitivesColorsForeground400 : KozmosColors.primitivesColorsForeground500)
                                .lineLimit(2)
                                .fixedSize(horizontal: false, vertical: true)
                                .padding(.top, KozmosDimensions.primitivesLayoutSpacing25)
                        }

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
                .padding(.top, sdk || tab == nil ? KozmosDimensions.primitivesLayoutSpacing150 : tabHeight + KozmosDimensions.primitivesLayoutSpacing100)
                .padding(.bottom, KozmosDimensions.primitivesLayoutSpacing150)
                }
                // The row has no fill of its own, so without an explicit hit
                // shape only the text and the logo are tappable and the gaps
                // between them swallow taps.
                .contentShape(Rectangle())
            }
            // An unavailable result is drawn at 0.6, as React's
            // `disabled:opacity-60`, and only here: the plain style drew it
            // at half again, to 0.3.
            .buttonStyle(KozmosPlainPressButtonStyle(hoverShape: Rectangle()))
            .opacity(available ? 1 : 0.6)
            // The collapse belongs to the SELECT ROW, not the card.
            //
            // It used to sit on the outer VStack, which flattened everything
            // inside it into one element - fine while the card was only a row,
            // and the exact SwiftUI counterpart of the nested <button> the web
            // card had: any action button added below would have been drawn on
            // screen and unreachable to VoiceOver.
            .modifier(SelectRowAccessibility(
                phrases: accessibilityPhrases, traits: accessibilityTraits,
                available: available, selected: result.selected,
                identifier: kozmosPOIResultIdentifier(poi.id), select: handleSelect))
            // Outside the row's element, so that element is the one heard as
            // dimmed, as the web's disabled button is. Inside it, VoiceOver
            // heard an unavailable result as an enabled button (measured
            // 2026-09-29).
            .disabled(!available)

            if let languageDisclosure {
                Text(languageDisclosure)
                    .font(KozmosTypography.subheadline)
                    .foregroundColor(sdk ? KozmosColors.primitivesColorsForeground400 : KozmosColors.primitivesColorsForeground500)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.horizontal, KozmosDimensions.primitivesLayoutSpacing200)
                    .padding(.bottom, KozmosDimensions.primitivesLayoutSpacing150)
                    // The select row already announces this, including custom names.
                    .accessibilityHidden(true)
            }

            if !visibleActions.isEmpty {
                Divider().overlay(KozmosColors.semanticsBorderSubtle)

                ViewThatFits(in: .horizontal) {
                    HStack(spacing: KozmosDimensions.primitivesLayoutSpacing100) {
                        actionButtons
                    }
                    .fixedSize(horizontal: true, vertical: false)
                    VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing100) {
                        actionButtons
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, KozmosDimensions.primitivesLayoutSpacing200)
                .padding(.vertical, KozmosDimensions.primitivesLayoutSpacing100)
                .accessibilityElement(children: .contain)
                .accessibilityLabel(actionsLabel)
            }

            if !available, let unavailableReason = result.unavailableReason {
                Divider().overlay(KozmosColors.semanticsBorderSubtle)

                Text(unavailableReason)
                    .font(KozmosTypography.caption)
                    .foregroundColor(sdk ? KozmosColors.primitivesColorsForeground400 : KozmosColors.primitivesColorsForeground500)
                    .padding(.horizontal, KozmosDimensions.primitivesLayoutSpacing200)
                    .padding(.vertical, KozmosDimensions.primitivesLayoutSpacing100)
            }
        }
        .background(surfaceColor)
        .onHover { hovered = $0 }
        .overlay(alignment: .topLeading) {
            if !sdk, let tab, let paint = tabPaint {
                tabView(tab, paint)
                    .allowsHitTesting(false)
            }
        }
        .clipShape(RoundedRectangle(cornerRadius: appearance == .row ? 0 : KozmosDimensions.semanticsRadiusControl, style: sdk ? .circular : .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl, style: sdk ? .circular : .continuous)
                .stroke(appearance == .row ? .clear : edgeColor, lineWidth: result.selected && !sdk ? 2 : 1)
        )
        .accessibilityIdentifier(kozmosPOIResultIdentifier(poi.id))
    }

    /// The card's edge. Selected, the theme's 600 at 2pt — an edge on a
    /// surface (decision 59) — whatever else the card is: the web says
    /// selection with a ring beside the edge, and a native card has only its
    /// edge to say it with. Otherwise a featured card
    /// takes its tab's amber (Olcay, 2026-09-29), and every other card the
    /// container edge: a number and a badge never recolour it.
    var edgeColor: Color {
        if result.selected && !sdk { return KozmosColors.primitivesColorsTheme600 }
        if tab == .featured { return KozmosColors.semanticsEmotionAlertFill }
        return KozmosColors.semanticsBorderSubtle
    }

    var surfaceColor: Color {
        guard sdk else { return KozmosColors.primitivesColorsBackground0 }
        if result.selected { return KozmosColors.semanticsResultSelectedSurface }
        if hovered && available { return KozmosColors.semanticsResultHoverSurface }
        return KozmosColors.primitivesColorsBackground0
    }

    /// The one tab, at the card's leading edge. Featured and a badge are read
    /// as their words, as they always were; a number is hidden, because it
    /// leads the result's own description.
    ///
    /// Inside the top-start corner, sharing the card's outer clip and border.
    /// Only the inner bottom-end corner rounds. The one-point inner outline
    /// closes a quiet number without duplicating the card's top/start edge.
    /// Its height and the clearance before the name scale with Dynamic Type.
    @ViewBuilder
    private func tabView(_ tab: Tab, _ paint: TabPaint) -> some View {
        let radius = sdk ? KozmosDimensions.semanticsRadiusControl : KozmosDimensions.primitivesLayoutSpacing100 - 1
        let shape = POIResultTabShape(rightToLeft: layoutDirection == .rightToLeft, radius: radius)
        let words: String = {
            switch tab {
            case .featured: return featuredLabel
            case .number(let number): return number
            case .badge(let label): return label
            }
        }()
        HStack(spacing: sdk ? 7 : KozmosDimensions.primitivesLayoutSpacing50) {
            if sdk, let numberText, !tab.isNumber {
                Text(numberText).font(KozmosTypography.caption2).monospacedDigit().fixedSize()
            }
            if tab == .featured {
                Image(systemName: "star.fill")
                    .font(KozmosTypography.caption2)
                    .accessibilityHidden(true)
            }
            Text(words)
                .font(KozmosTypography.caption2)
                .lineLimit(sdk ? nil : 1)
                .fixedSize(horizontal: false, vertical: true)
        }
        .foregroundColor(paint.ink)
        .padding(.horizontal, sdk ? 10 : KozmosDimensions.primitivesLayoutSpacing75)
        .padding(.vertical, sdk ? 1 : 0)
        .frame(minHeight: sdk ? tabHeight * 1.25 : tabHeight)
        .background(paint.fill)
        .clipShape(shape)
        .overlay(POIResultTabShape(rightToLeft: layoutDirection == .rightToLeft, edgeOnly: true, radius: radius)
            .stroke(paint.edge ?? .clear, lineWidth: 1))
        .accessibilityHidden(sdk || tab.isNumber)
    }

    private var actionButtons: some View {
        ForEach(visibleActions) { entry in
            KozmosPOIResultActionButton(entry: entry, enabled: canRun(entry), showsNavigationIcon: sdk && entry.action == .navigate) {
                guard canRun(entry) else { return }
                handleAction(entry.action)
            }
        }
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

/// The select row as VoiceOver's one element for the result.
///
/// SwiftUI's label is one string, said in the interface's voice. When the
/// result's name or summary is in another language (GAP-004, GAP-125), a
/// UIKit element lies over the row and says the same words with each
/// phrase's speech language, as an instruction's parts are said
/// (SpeechLanguage.swift). Same words, same traits, same action, same
/// identifier: only the voice changes.
private struct SelectRowAccessibility: ViewModifier {
    let phrases: [KozmosSpokenPhrase]
    let traits: AccessibilityTraits
    let available: Bool
    let selected: Bool
    /// The card's identifier, which the row carries untagged. Tagged, the
    /// SwiftUI row is hidden and takes it out of the tree, so the element
    /// carries it instead and a UI test finds every row by it.
    let identifier: String
    let select: () -> Void

    @ViewBuilder
    func body(content: Content) -> some View {
        #if os(iOS)
            if phrases.contains(where: \.hasLanguage) {
                content.kozmosSpeechLanguageElement(
                    kozmosSpokenText(phrases),
                    // What SwiftUI gives the row, measured: a button, selected
                    // when it is, and a dimmed button when the result is
                    // unavailable, as the web's disabled button is heard.
                    traits: UIAccessibilityTraits.button.union(
                        available ? (selected ? .selected : []) : .notEnabled),
                    identifier: identifier,
                    activate: available ? select : nil)
            } else {
                plain(content)
            }
        #else
            plain(content)
        #endif
    }

    private func plain(_ content: Content) -> some View {
        content
            .accessibilityElement(children: .ignore)
            .accessibilityLabel(kozmosSpokenDescription(phrases))
            .accessibilityAddTraits(traits)
            .accessibilityAction {
                // No-ops when unavailable; the traits above already withhold
                // the button affordance so VoiceOver does not offer the action.
                select()
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
    /// False for a disabled action, and for any action the card has no
    /// handler for.
    let enabled: Bool
    let showsNavigationIcon: Bool
    let action: () -> Void

    var body: some View {
        KozmosButton(entry.label,
            variant: entry.primary ? .default : .outline,
            emotion: entry.primary ? .themed : .neutral,
            isDisabled: !enabled,
            leadingIconName: showsNavigationIcon ? "navigation-pointer-01" : nil,
            action: action)
            // Each action its own target, in a list row too. Borderless, not
            // plain: an outline Button draws itself at half while disabled,
            // and the plain style drew it at half again, to a quarter.
            .buttonStyle(.borderless)
    }
}
