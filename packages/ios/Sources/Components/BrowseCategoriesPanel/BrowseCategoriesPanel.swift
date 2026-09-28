import SwiftUI

/// A scrollable grid of browsable categories with optional search and actions.
///
/// Mirrors the React `BrowseCategoriesPanel`. The panel renders whatever
/// categories it is given; filtering, searching, and result counts belong to
/// the consuming app.
///
/// In its sheet presentation, which paints no surface of its own, the panel
/// is the top of the map shell's panel when it is that panel's content: its
/// first row — the search row, or the tiles when there is none — tops its
/// padding up to what the panel already leaves above it
/// (`kozmosPanelInsetTop`, `kozmosPanelClearanceTop`) rather than adding to
/// it, so the search field sits as far from the panel's top as from its side
/// and keeps the grabber's target clear (decision 14).
public struct KozmosBrowseCategoriesPanel<Icon: View, Search: View, Actions: View, EmptyStateContent: View>: View {
    /// Where the panel is drawn: on its own, with its own surface and a rule
    /// under the search row; or inside the shell's sheet, which draws the
    /// surface, where the search row sits straight over the grid as the
    /// prototype's does.
    public enum Presentation: Sendable {
        case panel
        case sheet
    }

    @Environment(\.kozmosPanelInsetTop) private var panelInsetTop
    @Environment(\.kozmosPanelClearanceTop) private var panelClearanceTop

    private let categories: [KozmosCategoryPresentation]
    private let presentation: Presentation
    private let label: String
    private let onSelect: (String) -> Void
    private let renderIcon: (KozmosCategoryPresentation) -> Icon
    /// A category's colours for its tile, or nil for the theme's.
    private let tint: (KozmosCategoryPresentation) -> KozmosCategoryTint?
    private let search: Search
    private let actions: Actions
    private let emptyState: EmptyStateContent
    private let hasSearch: Bool
    private let hasActions: Bool

    // Four across, gap 8: the prototype's grid of icon squares.
    // Cells align at the top: a one-line label beside a two-line one keeps
    // its square on the same edge instead of dropping by half a line.
    private let columns = Array(
        repeating: GridItem(.flexible(), spacing: KozmosDimensions.primitivesLayoutSpacing100, alignment: .top),
        count: 4
    )

    public init(
        categories: [KozmosCategoryPresentation],
        label: String = "Browse categories",
        presentation: Presentation = .panel,
        onSelect: @escaping (String) -> Void,
        @ViewBuilder renderIcon: @escaping (KozmosCategoryPresentation) -> Icon,
        tint: @escaping (KozmosCategoryPresentation) -> KozmosCategoryTint? = { _ in nil },
        @ViewBuilder search: () -> Search,
        @ViewBuilder actions: () -> Actions,
        @ViewBuilder emptyState: () -> EmptyStateContent
    ) {
        self.categories = categories
        self.presentation = presentation
        self.label = label
        self.onSelect = onSelect
        self.renderIcon = renderIcon
        self.tint = tint
        self.search = search()
        self.actions = actions()
        self.emptyState = emptyState()
        self.hasSearch = Search.self != EmptyView.self
        self.hasActions = Actions.self != EmptyView.self
    }

    /// The first row's top padding: the search row's, or the tiles' when there
    /// is none. Hosted in the shell's panel in the sheet presentation, the
    /// space the panel leaves above it — a grabber's row — is the browser's
    /// own top: the row tops its 16 up to it rather than adding 16 to it, and
    /// keeps the clearance the panel asks for under a grabber. It padded 16
    /// under the grabber's 16-point row: the search field sat 32 from the
    /// sheet's top and 16 from its side. The panel presentation draws a
    /// surface of its own, and that space lies outside it: it keeps its 16.
    private var firstRowTopPadding: CGFloat {
        let padding = KozmosDimensions.primitivesLayoutSpacing200
        guard presentation == .sheet else { return padding }
        return max(panelClearanceTop, padding - panelInsetTop)
    }

    public var body: some View {
        VStack(spacing: 0) {
            if hasSearch || hasActions {
                HStack(spacing: KozmosDimensions.primitivesLayoutSpacing100) {
                    if hasSearch {
                        search.frame(maxWidth: .infinity, alignment: .leading)
                    }
                    if hasActions {
                        actions.layoutPriority(1)
                    }
                }
                .padding([.horizontal, .bottom], KozmosDimensions.primitivesLayoutSpacing200)
                .padding(.top, firstRowTopPadding)

                // The container edge's role, as React's border-b draws it and
                // as the prototype draws every rule (a light grey). It was
                // foreground/300, a text colour, until 2026-09-22.
                if presentation == .panel {
                    Divider().overlay(KozmosColors.semanticsBorderSubtle)
                }
            }

            // In a sheet the grid scrolls only at the largest detent, as the
            // prototype's does; the sheet grows first. The padding is the
            // content's, not the scroll view's, so the scroll view reaches
            // the sheet's bottom edge and can run under the home indicator.
            KozmosPanelScrollView {
                Group {
                if categories.isEmpty {
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
                    // Rows 12 apart, columns 8: the prototype's grid.
                    LazyVGrid(columns: columns, spacing: KozmosDimensions.primitivesLayoutSpacing150) {
                        ForEach(categories) { category in
                            KozmosCategoryTile(category: category, tint: tint(category), onSelect: onSelect) {
                                renderIcon(category)
                            }
                        }
                    }
                }
                }
                // Under the search row the tiles sit under that row, not
                // under whatever the panel leaves: they keep their 16.
                .padding([.horizontal, .bottom], KozmosDimensions.primitivesLayoutSpacing200)
                .padding(.top, hasSearch || hasActions ? KozmosDimensions.primitivesLayoutSpacing200 : firstRowTopPadding)
            }
        }
        .frame(maxWidth: .infinity)
        .background(presentation == .panel ? KozmosColors.primitivesColorsBackground0 : Color.clear)
        .accessibilityElement(children: .contain)
        .accessibilityLabel(label)
    }
}

public extension KozmosBrowseCategoriesPanel where Search == EmptyView, Actions == EmptyView {
    init(
        categories: [KozmosCategoryPresentation],
        label: String = "Browse categories",
        presentation: Presentation = .panel,
        onSelect: @escaping (String) -> Void,
        @ViewBuilder renderIcon: @escaping (KozmosCategoryPresentation) -> Icon,
        tint: @escaping (KozmosCategoryPresentation) -> KozmosCategoryTint? = { _ in nil },
        @ViewBuilder emptyState: () -> EmptyStateContent
    ) {
        self.init(
            categories: categories,
            label: label,
            presentation: presentation,
            onSelect: onSelect,
            renderIcon: renderIcon,
            tint: tint,
            search: { EmptyView() },
            actions: { EmptyView() },
            emptyState: emptyState
        )
    }
}
