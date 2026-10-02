import SwiftUI

/// One row of a POI result list, pairing a POI with its result metadata.
public struct KozmosPOIResultListItem: Identifiable, Hashable {
    public let poi: KozmosPOIPresentation
    public let result: KozmosPOIResultPresentation

    public var id: String { poi.id }

    public init(poi: KozmosPOIPresentation, result: KozmosPOIResultPresentation) {
        self.poi = poi
        self.result = result
    }
}

/// A list of POI search results.
///
/// Mirrors the React `POIResultList`. When `selectedPoiId` is supplied it wins
/// over each result's own `selected` flag, so marker and list selection stay
/// derived from a single canonical ID.
///
/// The selected result shows the actions its `result.actions` carries; one
/// pressed reaches `onAction` with the action and the POI's ID, and never
/// selects. Without `onAction` those actions are drawn disabled, as
/// POIDetailPanel draws a supplementary action it has no handler for.
public struct KozmosPOIResultList<EmptyStateContent: View>: View {
    private let items: [KozmosPOIResultListItem]
    private let label: String
    private let resultCountLabel: String
    private let selectedPoiId: String?
    private let featuredLabel: String
    private let languageNotListedLabel: String
    private let currentFloorId: String?
    /// Names each result's action row for VoiceOver: the card's.
    private let actionsLabel: String
    /// Each result's words for a walk shown as a band: the card's.
    private let travelTimeBandLabels: [KozmosTravelTimeBand: String]
    /// Number every result with its `resultIndex`, the number its pin shows:
    /// the card's `numbered`, given to every card. Off unless the product
    /// turns it on, for a list whose pins are numbered, as quick access's
    /// are. The list never renumbers: a featured result shows Featured and no
    /// number, since its pin shows its logo, so number the others in pin
    /// order.
    private let numbered: Bool
    private let onSelect: (String) -> Void
    /// Runs an action from the selected result's action row, told which
    /// action and the POI's ID.
    private let onAction: ((KozmosPOIResultAction, String) -> Void)?
    private let emptyState: EmptyStateContent

    public init(
        items: [KozmosPOIResultListItem],
        resultCountLabel: String,
        label: String = "Points of interest",
        selectedPoiId: String? = nil,
        featuredLabel: String = "Featured",
        currentFloorId: String? = nil,
        actionsLabel: String = "Actions for this result",
        travelTimeBandLabels: [KozmosTravelTimeBand: String] = [:],
        numbered: Bool = false,
        onSelect: @escaping (String) -> Void,
        onAction: ((KozmosPOIResultAction, String) -> Void)? = nil,
        languageNotListedLabel: String = "Language not listed",
        @ViewBuilder emptyState: () -> EmptyStateContent
    ) {
        self.items = items
        self.resultCountLabel = resultCountLabel
        self.label = label
        self.selectedPoiId = selectedPoiId
        self.featuredLabel = featuredLabel
        self.languageNotListedLabel = languageNotListedLabel
        self.currentFloorId = currentFloorId
        self.actionsLabel = actionsLabel
        self.travelTimeBandLabels = travelTimeBandLabels
        self.numbered = numbered
        self.onSelect = onSelect
        self.onAction = onAction
        self.emptyState = emptyState()
    }

    /// The card a row draws, with the list's words, its one selection and
    /// its handlers: an action pressed on the selected result reaches
    /// `onAction`, as React's list hands its `onAction` to every card.
    func card(for item: KozmosPOIResultListItem) -> KozmosPOIResultCard {
        KozmosPOIResultCard(
            poi: item.poi,
            result: item.result.selecting(selectedPoiId),
            featuredLabel: featuredLabel,
            currentFloorId: currentFloorId,
            actionsLabel: actionsLabel,
            travelTimeBandLabels: travelTimeBandLabels,
            numbered: numbered,
            onSelect: onSelect,
            onAction: onAction,
            languageNotListedLabel: languageNotListedLabel
        )
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing150) {
            // Announced by VoiceOver without occupying layout space, matching the
            // web implementation's visually hidden live region.
            Color.clear
                .frame(width: 0, height: 0)
                .accessibilityElement()
                .accessibilityLabel(resultCountLabel)
                .accessibilityAddTraits(.updatesFrequently)

            if items.isEmpty {
                emptyState
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
                LazyVStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing150) {
                    ForEach(items) { item in
                        card(for: item)
                    }
                }
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(label)
    }
}

public extension KozmosPOIResultList where EmptyStateContent == EmptyView {
    /// A list with no empty state of its own. It takes everything the full
    /// initialiser does apart from the empty state: `currentFloorId` too,
    /// which it used to drop.
    init(
        items: [KozmosPOIResultListItem],
        resultCountLabel: String,
        label: String = "Points of interest",
        selectedPoiId: String? = nil,
        featuredLabel: String = "Featured",
        currentFloorId: String? = nil,
        actionsLabel: String = "Actions for this result",
        travelTimeBandLabels: [KozmosTravelTimeBand: String] = [:],
        numbered: Bool = false,
        onSelect: @escaping (String) -> Void,
        onAction: ((KozmosPOIResultAction, String) -> Void)? = nil,
        languageNotListedLabel: String = "Language not listed"
    ) {
        self.init(
            items: items,
            resultCountLabel: resultCountLabel,
            label: label,
            selectedPoiId: selectedPoiId,
            featuredLabel: featuredLabel,
            currentFloorId: currentFloorId,
            actionsLabel: actionsLabel,
            travelTimeBandLabels: travelTimeBandLabels,
            numbered: numbered,
            onSelect: onSelect,
            onAction: onAction,
            languageNotListedLabel: languageNotListedLabel
        ) {
            EmptyView()
        }
    }
}
