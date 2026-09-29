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
public struct KozmosPOIResultList<EmptyStateContent: View>: View {
    private let items: [KozmosPOIResultListItem]
    private let label: String
    private let resultCountLabel: String
    private let selectedPoiId: String?
    private let featuredLabel: String
    private let currentFloorId: String?
    /// Each result's words for a walk shown as a band: the card's.
    private let travelTimeBandLabels: [KozmosTravelTimeBand: String]
    private let onSelect: (String) -> Void
    private let emptyState: EmptyStateContent

    public init(
        items: [KozmosPOIResultListItem],
        resultCountLabel: String,
        label: String = "Points of interest",
        selectedPoiId: String? = nil,
        featuredLabel: String = "Featured",
        currentFloorId: String? = nil,
        travelTimeBandLabels: [KozmosTravelTimeBand: String] = [:],
        onSelect: @escaping (String) -> Void,
        @ViewBuilder emptyState: () -> EmptyStateContent
    ) {
        self.items = items
        self.resultCountLabel = resultCountLabel
        self.label = label
        self.selectedPoiId = selectedPoiId
        self.featuredLabel = featuredLabel
        self.currentFloorId = currentFloorId
        self.travelTimeBandLabels = travelTimeBandLabels
        self.onSelect = onSelect
        self.emptyState = emptyState()
    }

    /// The card a row draws, with the list's words and its one selection.
    func card(for item: KozmosPOIResultListItem) -> KozmosPOIResultCard {
        KozmosPOIResultCard(
            poi: item.poi,
            result: item.result.selecting(selectedPoiId),
            featuredLabel: featuredLabel,
            currentFloorId: currentFloorId,
            travelTimeBandLabels: travelTimeBandLabels,
            onSelect: onSelect
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
    init(
        items: [KozmosPOIResultListItem],
        resultCountLabel: String,
        label: String = "Points of interest",
        selectedPoiId: String? = nil,
        featuredLabel: String = "Featured",
        travelTimeBandLabels: [KozmosTravelTimeBand: String] = [:],
        onSelect: @escaping (String) -> Void
    ) {
        self.init(
            items: items,
            resultCountLabel: resultCountLabel,
            label: label,
            selectedPoiId: selectedPoiId,
            featuredLabel: featuredLabel,
            travelTimeBandLabels: travelTimeBandLabels,
            onSelect: onSelect
        ) {
            EmptyView()
        }
    }
}
