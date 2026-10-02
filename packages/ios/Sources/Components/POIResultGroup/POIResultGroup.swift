import SwiftUI

/// Product-ordered branches with independent selection and expansion. Never reorders or renumbers.
public struct KozmosPOIResultGroup: View {
    private let items: [KozmosPOIResultListItem]
    private let label: String?
    private let collapsedCount: Int
    private let expanded: Bool?
    private let onExpandedChange: ((Bool) -> Void)?
    private let showMoreLabel: (Int) -> String
    private let hideLabel: String
    private let expandedLabel: String
    private let collapsedLabel: String
    private let selectedPoiId: String?
    private let numbered: Bool
    private let featuredLabel: String
    private let languageNotListedLabel: String
    private let actionsLabel: String
    private let currentFloorId: String?
    private let travelTimeBandLabels: [KozmosTravelTimeBand: String]
    private let presentationStyle: KozmosPOIResultPresentationStyle
    private let onSelect: (String) -> Void
    private let onAction: ((KozmosPOIResultAction, String) -> Void)?
    @State private var uncontrolledExpanded: Bool
    @State private var hovered = false

    public init(items: [KozmosPOIResultListItem], label: String? = nil,
                collapsedCount: Int = 1, defaultExpanded: Bool = false, expanded: Bool? = nil,
                onExpandedChange: ((Bool) -> Void)? = nil,
                showMoreLabel: @escaping (Int) -> String = { "Show \($0) more" }, hideLabel: String = "Hide",
                expandedLabel: String = "Expanded", collapsedLabel: String = "Collapsed",
                selectedPoiId: String? = nil, numbered: Bool = false, featuredLabel: String = "Featured",
                languageNotListedLabel: String = "Language not listed", actionsLabel: String = "Actions for this result",
                currentFloorId: String? = nil, travelTimeBandLabels: [KozmosTravelTimeBand: String] = [:],
                presentationStyle: KozmosPOIResultPresentationStyle = .sdk,
                onSelect: @escaping (String) -> Void, onAction: ((KozmosPOIResultAction, String) -> Void)? = nil) {
        self.items = items
        self.label = label
        self.collapsedCount = max(0, min(collapsedCount, items.count))
        self.expanded = expanded
        self.onExpandedChange = onExpandedChange
        self.showMoreLabel = showMoreLabel
        self.hideLabel = hideLabel
        self.expandedLabel = expandedLabel
        self.collapsedLabel = collapsedLabel
        self.selectedPoiId = selectedPoiId
        self.numbered = numbered
        self.featuredLabel = featuredLabel
        self.languageNotListedLabel = languageNotListedLabel
        self.actionsLabel = actionsLabel
        self.currentFloorId = currentFloorId
        self.travelTimeBandLabels = travelTimeBandLabels
        self.presentationStyle = presentationStyle
        self.onSelect = onSelect
        self.onAction = onAction
        self._uncontrolledExpanded = State(initialValue: defaultExpanded)
    }

    var open: Bool { expanded ?? uncontrolledExpanded }
    var hiddenCount: Int { items.count - collapsedCount }
    var shownItems: [KozmosPOIResultListItem] { open ? items : Array(items.prefix(collapsedCount)) }

    func card(for item: KozmosPOIResultListItem) -> KozmosPOIResultCard {
        KozmosPOIResultCard(poi: item.poi, result: item.result.selecting(selectedPoiId), featuredLabel: featuredLabel,
            currentFloorId: currentFloorId, actionsLabel: actionsLabel, travelTimeBandLabels: travelTimeBandLabels,
            numbered: numbered, onSelect: onSelect, onAction: onAction, languageNotListedLabel: languageNotListedLabel,
            presentationStyle: presentationStyle, appearance: .row)
    }

    private func toggle() {
        let next = !open
        if expanded == nil { uncontrolledExpanded = next }
        onExpandedChange?(next)
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            ForEach(Array(shownItems.enumerated()), id: \.element.id) { index, item in
                if index > 0 { Divider().overlay(KozmosColors.semanticsBorderSubtle) }
                card(for: item)
            }
            if hiddenCount > 0 {
                Divider().overlay(KozmosColors.semanticsBorderSubtle)
                Button(action: toggle) {
                    HStack(spacing: 6) {
                        Text(open ? hideLabel : showMoreLabel(hiddenCount))
                            .fixedSize(horizontal: false, vertical: true)
                        Image(systemName: "chevron.down").rotationEffect(.degrees(open ? 180 : 0)).accessibilityHidden(true)
                    }
                    .font(KozmosTypography.subheadline)
                    .foregroundColor(KozmosColors.primitivesColorsForeground400)
                    .padding(.horizontal, 16).padding(.vertical, 12)
                    .frame(maxWidth: .infinity, minHeight: 44)
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .background(hovered ? KozmosColors.semanticsResultHoverSurface : KozmosColors.semanticsResultSelectedSurface)
                .onHover { hovered = $0 }
                .accessibilityValue(open ? expandedLabel : collapsedLabel)
            }
        }
        .background(KozmosColors.primitivesColorsBackground0)
        .clipShape(RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl, style: .circular))
        .overlay(RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl, style: .circular)
            .stroke(KozmosColors.semanticsBorderSubtle, lineWidth: 1))
        .accessibilityElement(children: .contain)
        .accessibilityLabel(label ?? "")
    }
}
