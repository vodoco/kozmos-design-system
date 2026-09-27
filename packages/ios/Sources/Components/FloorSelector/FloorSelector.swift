import SwiftUI

/// Layout of the floor selector, mirroring the React `FloorSelector.variant`.
public enum KozmosFloorSelectorVariant: String, CaseIterable, Sendable {
    case verticalList = "vertical-list"
    case horizontalList = "horizontal-list"
    case compactStepper = "compact-stepper"
    /// Shows the current level only, and opens the full list when touched.
    /// For a control parked in a corner of a map, where a permanent column of
    /// every level costs more of the map than it is worth.
    case collapsible = "collapsible"
}

/// Switches the active level of a venue.
///
/// Mirrors the React `FloorSelector` API. `selectedFloor` is the canonical
/// floor ID, never a display label, and the component reports selection rather
/// than deriving it.
///
/// Pass `[KozmosFloorPresentation]` so the button shows the level's
/// `shortLabel` while selection and analytics stay keyed on its `id`, and so
/// assistive technology hears the full `label`. The `[String]` initializer is
/// for venues whose IDs are already the labels — it shows each ID as-is.
///
/// A presentation's `resultCount` marks the level with a small count at its
/// button's trailing top, so a visitor can see the answer is upstairs without
/// changing level to find out (row 69, GAP-070). Only a count above zero is
/// marked: `nil` is unknown, which is not the same as none, and a level with a
/// real zero reads as itself.
public struct KozmosFloorSelector: View {
    let floors: [KozmosFloorPresentation]
    @Binding var selectedFloor: String
    let variant: KozmosFloorSelectorVariant
    let label: String
    /// What the compact stepper's two buttons are called, for a visitor who
    /// cannot see them: the previous level in list order is on the up chevron,
    /// the next on the down. Hard-coded English until row 67. Only the stepper
    /// draws them; the lists name each level by its own label. The defaults
    /// are the words these buttons always said — React's read "Previous floor"
    /// and "Next floor".
    let previousFloorLabel: String
    let nextFloorLabel: String
    /// How a level's result count is said, for a visitor who cannot see the
    /// marker. Joined to the level's own label: "Level 2, 3 results". A
    /// function because a count needs a plural rule, and the design system has
    /// no locale to pick one with — the product does. The default is English,
    /// singular for one, where React's reads "1 results".
    let resultCountLabel: (Int) -> String
    @Environment(\.kozmosAnalytics) private var trackEvent

    /// A fixed 40pt button truncates every level to an ellipsis once Dynamic
    /// Type is turned up, which leaves the control unreadable — and a floor
    /// selector whose floors cannot be told apart is not a control at all. The
    /// target scales with the type it has to hold.
    @ScaledMetric(relativeTo: .subheadline)
    private var controlSize: CGFloat = KozmosDimensions.primitivesLayoutSizing500

    /// The result marker, React's 16 with a 10pt count and 4 either side of
    /// it, scaling with the button it sits in so that it keeps its share of
    /// the square.
    @ScaledMetric(relativeTo: .subheadline)
    private var markerSize: CGFloat = KozmosDimensions.primitivesLayoutSizing200
    @ScaledMetric(relativeTo: .subheadline)
    private var markerTextSize: CGFloat = 10
    @ScaledMetric(relativeTo: .subheadline)
    private var markerPadding: CGFloat = KozmosDimensions.primitivesLayoutSpacing50

    @State private var isExpanded = false

    public init(
        floors: [KozmosFloorPresentation],
        selectedFloor: Binding<String>,
        variant: KozmosFloorSelectorVariant = .verticalList,
        label: String = "Floor selector",
        previousFloorLabel: String = "Floor up",
        nextFloorLabel: String = "Floor down",
        resultCountLabel: @escaping (Int) -> String = { $0 == 1 ? "1 result" : "\($0) results" }
    ) {
        self.floors = floors
        self._selectedFloor = selectedFloor
        self.variant = variant
        self.label = label
        self.previousFloorLabel = previousFloorLabel
        self.nextFloorLabel = nextFloorLabel
        self.resultCountLabel = resultCountLabel
    }

    /// For tests and previews: the collapsible list already open.
    init(
        floors: [KozmosFloorPresentation],
        selectedFloor: Binding<String>,
        variant: KozmosFloorSelectorVariant,
        label: String = "Floor selector",
        expanded: Bool
    ) {
        self.init(floors: floors, selectedFloor: selectedFloor, variant: variant, label: label)
        self._isExpanded = State(initialValue: expanded)
    }

    /// For venues with no separate display label: the ID is rendered verbatim.
    public init(
        floors: [String],
        selectedFloor: Binding<String>,
        variant: KozmosFloorSelectorVariant = .verticalList,
        label: String = "Floor selector",
        previousFloorLabel: String = "Floor up",
        nextFloorLabel: String = "Floor down"
    ) {
        self.init(
            floors: floors.map {
                KozmosFloorPresentation(id: $0, label: $0, shortLabel: $0)
            },
            selectedFloor: selectedFloor,
            variant: variant,
            label: label,
            previousFloorLabel: previousFloorLabel,
            nextFloorLabel: nextFloorLabel
        )
    }

    private func select(_ floor: KozmosFloorPresentation) {
        guard !floor.disabled else { return }
        if variant == .collapsible {
            withAnimation(.spring(response: 0.3, dampingFraction: 0.85)) { isExpanded = false }
        }
        trackEvent(
            KozmosAnalyticsEvent(
                eventName: "floor_selected",
                component: "FloorSelector",
                properties: ["floor": floor.id]
            )
        )
        withAnimation { selectedFloor = floor.id }
    }

    var selectedIndex: Int {
        floors.firstIndex { $0.id == selectedFloor } ?? 0
    }

    private var selectedPresentation: KozmosFloorPresentation? {
        floors.first { $0.id == selectedFloor } ?? floors.first
    }

    /// While the list is open the closed control would only repeat the level
    /// already highlighted in it, so it is hidden — but it keeps its space, or
    /// the control would change size and move the map after all.
    private var baseIsHidden: Bool {
        variant == .collapsible && isExpanded
    }

    public var body: some View {
        container
            .opacity(baseIsHidden ? 0 : 1)
            // Invisible is not enough: at opacity zero the pill would still be
            // an element VoiceOver could land on behind the open list.
            .accessibilityHidden(baseIsHidden)
            .padding(KozmosDimensions.primitivesLayoutSpacing75)
            .background(baseIsHidden ? Color.clear : KozmosColors.primitivesColorsBackground0.opacity(0.9))
            .cornerRadius(KozmosDimensions.semanticsRadiusPanel)
            .kozmosElevation(baseIsHidden ? KozmosShadows.none : KozmosShadows.semanticsElevationFloating)
            // Overlaid rather than stacked, so opening the list does not change
            // what this control measures. A map shell reports the space its
            // chrome covers, and a camera that re-frames every time a picker
            // opens is worse than one that ignores it. Trailing-aligned: the
            // list is wider than the control it opens from, and grows away
            // from the map's edge the control sits at.
            .overlay(alignment: .bottomTrailing) { expandedList }
            .accessibilityElement(children: .contain)
            .accessibilityLabel(label)
    }

    /// The full list, floating above the closed control: every level's short
    /// label in its square with the level's name beside it, the current one
    /// filled. A column of "L1, L2" alone told a visitor nothing they could
    /// not read off the closed pill.
    @ViewBuilder
    private var expandedList: some View {
        if variant == .collapsible, isExpanded {
            VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing100) {
                ForEach(floors) { floor in
                    namedFloorButton(floor)
                }
            }
            .padding(KozmosDimensions.primitivesLayoutSpacing75)
            // Opaque, unlike the closed control: the named rows make the list
            // wide enough to cover the map's other controls, and a zoom button
            // showing through a translucent row read as part of it.
            .background(KozmosColors.primitivesColorsBackground0)
            .cornerRadius(KozmosDimensions.semanticsRadiusPanel)
            .kozmosElevation(KozmosShadows.semanticsElevationFloating)
            .fixedSize()
            .offset(
                y: -(controlSize
                     + KozmosDimensions.primitivesLayoutSpacing75 * 2
                     + KozmosDimensions.primitivesLayoutSpacing100)
            )
            .transition(.opacity.combined(with: .scale(scale: 0.92, anchor: .bottom)))
        }
    }

    @ViewBuilder
    private var container: some View {
        switch variant {
        case .verticalList:
            VStack(spacing: KozmosDimensions.primitivesLayoutSpacing100) {
                ForEach(floors) { floor in
                    floorButton(floor)
                }
            }
        case .horizontalList:
            HStack(spacing: KozmosDimensions.primitivesLayoutSpacing100) {
                ForEach(floors) { floor in
                    floorButton(floor)
                }
            }
        case .compactStepper:
            VStack(spacing: KozmosDimensions.primitivesLayoutSpacing100) {
                stepperButton(systemImage: "chevron.up", step: -1)
                if let selectedPresentation {
                    floorButton(selectedPresentation)
                }
                stepperButton(systemImage: "chevron.down", step: 1)
            }
        case .collapsible:
            // Only ever the current level. The list that opens is an overlay,
            // not part of this footprint — see `expandedList`.
            if let selectedPresentation {
                collapsedButton(selectedPresentation)
            }
        }
    }

    private func floorButton(_ floor: KozmosFloorPresentation) -> some View {
        let isSelected = floor.id == selectedFloor
        return Button {
            select(floor)
        } label: {
            Text(floor.shortLabel)
                .font(KozmosTypography.subheadline)
                .bold()
                .lineLimit(1)
                .minimumScaleFactor(0.7)
                .frame(width: controlSize, height: controlSize)
                .background(isSelected ? KozmosColors.primitivesColorsTheme500 : Color.clear)
                .foregroundColor(
                    isSelected
                        ? KozmosColors.primitivesColorsBackground0
                        : KozmosColors.primitivesColorsForeground100
                )
                .cornerRadius(KozmosDimensions.semanticsRadiusPanel)
                .overlay(alignment: .topTrailing) { resultMarker(for: floor) }
                // An unselected button is transparent, so without an explicit
                // hit shape only the glyph itself would accept a tap.
                .contentShape(
                    RoundedRectangle(
                        cornerRadius: KozmosDimensions.semanticsRadiusPanel,
                        style: .continuous
                    )
                )
        }
        .buttonStyle(.plain)
        .disabled(floor.disabled)
        .opacity(floor.disabled ? 0.4 : 1)
        // The button shows the short label; assistive technology gets the full
        // one, which is the only place the level is spelled out — and the
        // result count with it, where the button marks one.
        .accessibilityLabel(spokenLabel(floor))
        .accessibilityAddTraits(isSelected ? [.isButton, .isSelected] : .isButton)
    }

    /// A row of the open list: the short label in its square, the name beside
    /// it when the venue gives one. One button, so a tap anywhere on the row
    /// selects, and assistive technology hears the name once.
    private func namedFloorButton(_ floor: KozmosFloorPresentation) -> some View {
        let isSelected = floor.id == selectedFloor
        return Button {
            select(floor)
        } label: {
            HStack(spacing: KozmosDimensions.primitivesLayoutSpacing100) {
                Text(floor.shortLabel)
                    .font(KozmosTypography.subheadline)
                    .bold()
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)
                    .frame(width: controlSize, height: controlSize)
                    .background(isSelected ? KozmosColors.primitivesColorsTheme500 : Color.clear)
                    .foregroundColor(
                        isSelected
                            ? KozmosColors.primitivesColorsBackground0
                            : KozmosColors.primitivesColorsForeground100
                    )
                    .cornerRadius(KozmosDimensions.semanticsRadiusPanel)
                    .overlay(alignment: .topTrailing) { resultMarker(for: floor) }
                if floor.label != floor.shortLabel {
                    Text(floor.label)
                        .font(KozmosTypography.subheadline)
                        .fontWeight(isSelected ? .semibold : .regular)
                        .foregroundColor(KozmosColors.primitivesColorsForeground100)
                        .lineLimit(1)
                        .padding(.trailing, KozmosDimensions.primitivesLayoutSpacing100)
                }
            }
            .contentShape(
                RoundedRectangle(
                    cornerRadius: KozmosDimensions.semanticsRadiusPanel,
                    style: .continuous
                )
            )
        }
        .buttonStyle(.plain)
        .disabled(floor.disabled)
        .opacity(floor.disabled ? 0.4 : 1)
        .accessibilityLabel(spokenLabel(floor))
        .accessibilityAddTraits(isSelected ? [.isButton, .isSelected] : .isButton)
    }

    /// The closed state: the level you are on, and a way in to the rest.
    private func collapsedButton(_ floor: KozmosFloorPresentation) -> some View {
        Button {
            trackEvent(
                KozmosAnalyticsEvent(
                    eventName: "floor_selector_expanded",
                    component: "FloorSelector",
                    properties: ["floor": floor.id]
                )
            )
            withAnimation(.spring(response: 0.3, dampingFraction: 0.85)) { isExpanded = true }
        } label: {
            Text(floor.shortLabel)
                .font(KozmosTypography.subheadline)
                .bold()
                .lineLimit(1)
                .minimumScaleFactor(0.7)
                .frame(width: controlSize, height: controlSize)
                .background(KozmosColors.primitivesColorsTheme500)
                .foregroundColor(KozmosColors.primitivesColorsBackground0)
                .cornerRadius(KozmosDimensions.semanticsRadiusPanel)
                .contentShape(
                    RoundedRectangle(
                        cornerRadius: KozmosDimensions.semanticsRadiusPanel,
                        style: .continuous
                    )
                )
        }
        .buttonStyle(.plain)
        .accessibilityLabel(floor.label)
        .accessibilityHint("Shows every level")
        .accessibilityAddTraits(.isButton)
    }

    /// The next selectable floor in list order, skipping any that are closed.
    func reachableIndex(step: Int) -> Int? {
        guard !floors.isEmpty else { return nil }
        var candidate = selectedIndex + step
        while floors.indices.contains(candidate) {
            if !floors[candidate].disabled { return candidate }
            candidate += step
        }
        return nil
    }

    /// The count a level's button marks, or nil for none (row 69, GAP-070).
    ///
    /// Only a count above zero: `nil` is unknown, which is not the same as
    /// none, and a level with a real zero reads as itself. Only where the
    /// levels are listed — the two lists and the collapsible's open list. The
    /// stepper shows one level at a time, so a marker on the level already in
    /// view says nothing; the collapsible's closed pill shows that level too,
    /// and is drawn without one.
    func markedResultCount(_ floor: KozmosFloorPresentation) -> Int? {
        guard variant != .compactStepper, let count = floor.resultCount, count > 0 else { return nil }
        return count
    }

    /// What assistive technology hears for a level: its label, and the count
    /// its button marks in the product's words — "Level 2, 3 results". Said
    /// here, on the button, so the marker itself is hidden: hearing "3" after
    /// that is noise.
    func spokenLabel(_ floor: KozmosFloorPresentation) -> String {
        guard let count = markedResultCount(floor) else { return floor.label }
        return "\(floor.label), \(resultCountLabel(count))"
    }

    /// The count, drawn once and said once: a pill in the theme's primary in
    /// the square's trailing top corner, which mirrors in Arabic. Inside the
    /// square, not proud of it, as React's is since c36a970d — here the
    /// control's rounded clip would take the corner off a marker hanging over
    /// the end levels' squares. Flush with the corner rather than React's 2px
    /// in: that inset is on a 44px button, and on a 40pt square it lays the
    /// marker over the top of the level's label. A plain number, as the
    /// category tile's counter is.
    @ViewBuilder
    private func resultMarker(for floor: KozmosFloorPresentation) -> some View {
        if let count = markedResultCount(floor) {
            Text(verbatim: String(count))
                .font(.system(size: markerTextSize, weight: .semibold))
                .monospacedDigit()
                .lineLimit(1)
                .padding(.horizontal, markerPadding)
                .frame(minWidth: markerSize, minHeight: markerSize)
                .background(KozmosColors.primitivesColorsTheme600, in: Capsule())
                .foregroundColor(KozmosColors.primitivesColorsForeground1000)
                .accessibilityHidden(true)
        }
    }

    /// What a stepper button is called: `previousFloorLabel` for a step back
    /// through the list, `nextFloorLabel` for a step on.
    func stepperLabel(step: Int) -> String {
        step < 0 ? previousFloorLabel : nextFloorLabel
    }

    /// Steps through the floor list. `step` is in list order, so -1 is the
    /// entry above the current one.
    private func stepperButton(systemImage: String, step: Int) -> some View {
        let target = reachableIndex(step: step)

        return Button {
            if let target { select(floors[target]) }
        } label: {
            Image(systemName: systemImage)
                .font(.system(size: 14, weight: .bold))
                .frame(width: controlSize, height: controlSize)
                .foregroundColor(KozmosColors.primitivesColorsForeground500)
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .disabled(target == nil)
        .opacity(target == nil ? 0.4 : 1)
        .accessibilityLabel(stepperLabel(step: step))
    }
}
