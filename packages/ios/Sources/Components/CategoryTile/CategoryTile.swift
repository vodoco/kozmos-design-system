import SwiftUI

/// A single browsable category cell.
///
/// Mirrors the React `CategoryTile`: the tile owns presentation and selection
/// semantics only. Category identity, labels, counts, and selected state are
/// supplied by the consuming app through `KozmosCategoryPresentation`. A
/// `resultCount` draws as the system's counter at the icon square's
/// top-right; `resultCountLabel` is its spoken form and draws nothing. A
/// `tint` — the category's colours, as the chosen-category field wears
/// them — takes the icon, the selection's stroke and the counter's fill and
/// ink; the square stays neutral.
public struct KozmosCategoryTile<Icon: View>: View {
    @Environment(\.kozmosAnalytics) private var trackEvent

    private let category: KozmosCategoryPresentation
    private let tint: KozmosCategoryTint?
    private let isDisabled: Bool
    private let onSelect: (String) -> Void
    private let icon: Icon

    public init(
        category: KozmosCategoryPresentation,
        tint: KozmosCategoryTint? = nil,
        isDisabled: Bool = false,
        onSelect: @escaping (String) -> Void,
        @ViewBuilder icon: () -> Icon
    ) {
        self.category = category
        self.tint = tint
        self.isDisabled = isDisabled
        self.onSelect = onSelect
        self.icon = icon()
    }

    private var disabled: Bool { category.disabled || isDisabled }

    public var body: some View {
        Button {
            trackEvent(
                KozmosAnalyticsEvent(
                    eventName: "category_selected",
                    component: "CategoryTile",
                    properties: ["categoryId": category.id]
                )
            )
            onSelect(category.id)
        } label: {
            VStack(spacing: KozmosDimensions.primitivesLayoutSpacing75) {
                // The icon's square: 64, radius Control, the container edge;
                // the selection shows on it. The label sits under it.
                icon
                    .frame(width: KozmosDimensions.primitivesLayoutSizing300, height: KozmosDimensions.primitivesLayoutSizing300)
                    // With no tint the accent is the theme's 600, an icon and
                    // a border on a surface (decision 59).
                    .foregroundColor(tint?.accent ?? KozmosColors.primitivesColorsTheme600)
                    .frame(width: KozmosDimensions.primitivesLayoutSizing800, height: KozmosDimensions.primitivesLayoutSizing800)
                    .background(
                        category.selected
                            ? (tint?.accent ?? KozmosColors.primitivesColorsTheme600).opacity(0.05)
                            : KozmosColors.primitivesColorsBackground0
                    )
                    .clipShape(RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl, style: .continuous)
                            .stroke(
                                category.selected ? (tint?.accent ?? KozmosColors.primitivesColorsTheme600) : KozmosColors.semanticsBorderSubtle,
                                lineWidth: category.selected ? 2 : 1
                            )
                    )
                    // The count: the system's counter, brand tone, at the
                    // square's top-right, four beyond its edges so the icon
                    // stays clear. The spoken form is the presentation's
                    // `resultCountLabel`, the tile's accessibility value.
                    .overlay(alignment: .topTrailing) {
                        if let count = category.resultCount {
                            KozmosCounter("\(count)", tone: .brand, fill: tint?.fill)
                                .offset(x: 4, y: -4)
                        }
                    }
                    .accessibilityHidden(true)

                Text(category.label)
                    .font(KozmosTypography.caption2)
                    .foregroundColor(KozmosColors.primitivesColorsForeground100)
                    .multilineTextAlignment(.center)
                    .lineLimit(2)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .frame(maxWidth: .infinity)
            .padding(KozmosDimensions.primitivesLayoutSpacing50)
            .contentShape(Rectangle())
        }
        // The plain style draws a disabled tile at half, as React's
        // `disabled:opacity-50`; a second opacity here dimmed it twice, to a
        // quarter.
        .buttonStyle(.plain)
        .disabled(disabled)
        .accessibilityLabel(category.label)
        .accessibilityValue(category.resultCountLabel ?? "")
        .accessibilityAddTraits(category.selected ? [.isButton, .isSelected] : .isButton)
    }
}

public extension KozmosCategoryTile where Icon == EmptyView {
    init(
        category: KozmosCategoryPresentation,
        tint: KozmosCategoryTint? = nil,
        isDisabled: Bool = false,
        onSelect: @escaping (String) -> Void
    ) {
        self.init(category: category, tint: tint, isDisabled: isDisabled, onSelect: onSelect) {
            EmptyView()
        }
    }
}
