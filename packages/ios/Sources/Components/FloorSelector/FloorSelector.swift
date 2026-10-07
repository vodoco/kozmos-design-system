import SwiftUI

/// Layout of the floor selector, mirroring the React `FloorSelector.variant`.
public enum KozmosFloorSelectorVariant: String, CaseIterable, Sendable {
    case verticalList = "vertical-list"
    case horizontalList = "horizontal-list"
    case compactStepper = "compact-stepper"
    /// The SDK's level switcher (row 79, decision 38), for a control parked in
    /// a corner of a map, where a permanent column of every level costs more
    /// of the map than it is worth: at rest one map control showing the
    /// current level's short label; activated, it grows into a column of
    /// every level over itself, the current one outlined in the theme's
    /// primary. A choice, the escape gesture, Escape or a tap outside closes
    /// the column.
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
/// With `showResultCounts: true` (off by default), a presentation's `resultCount`
/// marks the level with a small count at its button's trailing top, so a visitor can see the answer is upstairs without
/// changing level to find out (row 69, GAP-070). Only a count above zero is
/// marked: `nil` is unknown, which is not the same as none, and a level with a
/// real zero reads as itself.
public struct KozmosFloorSelector: View {
    let floors: [KozmosFloorPresentation]
    @Binding var selectedFloor: String
    let variant: KozmosFloorSelectorVariant
    /// Explicit opt-in. Hidden counts are omitted from VoiceOver as well.
    let showResultCounts: Bool
    let label: String
    /// What the compact stepper's two buttons are called, for a visitor who
    /// cannot see them: the previous level in list order is on the up chevron,
    /// the next on the down. Hard-coded English until row 67. Only the stepper
    /// draws them; the lists name each level by its own label. The defaults
    /// are the words these buttons always said, "Floor up" and "Floor down",
    /// which React and Compose say too.
    let previousFloorLabel: String
    let nextFloorLabel: String
    /// The level the visitor is on, by the same id as `selectedFloor` (decision
    /// 38). The switcher marks it with a dot, as the SDK's level switcher does:
    /// on the closed tile while the tile shows that level, and on that level in
    /// the open column whichever level is shown. `nil` marks nothing. The
    /// product knows where the visitor is; the switcher neither works it out
    /// nor chooses a level by it. Only `.collapsible` draws it, as React's and
    /// Compose's do.
    let userFloor: String?
    /// How the dot is said, joined to the level's own label: "Level 1, your
    /// level". English until the product passes its own words.
    let userFloorLabel: String
    /// The hint VoiceOver gives on the closed switcher tile, saying what
    /// activating it does: "Shows every level". On iOS 16 and 17, which
    /// report no expanded state, it is the only sign that the tile opens a
    /// column; from iOS 18 it follows "collapsed". Not given while the column
    /// is open. English until the product passes its own words. Only
    /// `.collapsible` gives it.
    let expandHint: String
    /// How a level's result count is said, for a visitor who cannot see the
    /// marker. Joined to the level's own label: "Level 2, 3 results". A
    /// function because a count needs a plural rule, and the design system has
    /// no locale to pick one with — the product does. The default is English,
    /// singular for one, as React's and Compose's are.
    let resultCountLabel: (Int) -> String
    @Environment(\.kozmosAnalytics) private var trackEvent
    /// Someone who has asked iOS to reduce motion still needs the column; they
    /// just should not watch it spring out of the tile.
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

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

    @Environment(\.kozmosMapPopupRegion) private var popupRegion
    @Environment(\.layoutDirection) private var layoutDirection
    @State private var anchorFrame: CGRect = .zero
    @State private var isExpanded = false
    /// The map control's own size, read off the tile: the column's levels take
    /// it, so the column's bottom level lies exactly over the tile whatever
    /// size the shared map-control surface gives it. Until the tile has been
    /// measured, the map control's own square, so a column drawn open from
    /// the start is already the right size.
    @State private var tileSize = CGSize(width: KozmosMapControlButton<Text>.size,
                                         height: KozmosMapControlButton<Text>.size)
    /// Whether the open column grows down from the tile, its top level over
    /// it, rather than up: only where it has no room above the tile — parked
    /// at the top of the map — as React's and Compose's do. Decided as the
    /// column opens.
    @State private var growsDown = false
    #if os(iOS)
    /// The UIKit element over the tile, which knows where the tile is in its
    /// window and where the window's safe area begins; SwiftUI says neither.
    @StateObject private var anchor = KozmosFloorSwitcherAnchor()
    #endif
    /// Bumped when the column closes on a choice or on Escape: VoiceOver goes
    /// back to the tile, which names the level now shown.
    @State private var tileFocusRequest = 0
    /// Where VoiceOver lands when the column opens: the current level.
    @AccessibilityFocusState private var focusedLevel: String?

    public init(
        floors: [KozmosFloorPresentation],
        selectedFloor: Binding<String>,
        variant: KozmosFloorSelectorVariant = .verticalList,
        showResultCounts: Bool = false,
        label: String = "Floor selector",
        previousFloorLabel: String = "Floor up",
        nextFloorLabel: String = "Floor down",
        userFloor: String? = nil,
        userFloorLabel: String = "your level",
        expandHint: String = "Shows every level",
        resultCountLabel: @escaping (Int) -> String = { $0 == 1 ? "1 result" : "\($0) results" }
    ) {
        self.floors = floors
        self._selectedFloor = selectedFloor
        self.variant = variant
        self.showResultCounts = showResultCounts
        self.label = label
        self.previousFloorLabel = previousFloorLabel
        self.nextFloorLabel = nextFloorLabel
        self.userFloor = userFloor
        self.userFloorLabel = userFloorLabel
        self.expandHint = expandHint
        self.resultCountLabel = resultCountLabel
    }

    /// For tests and previews: the switcher's column already open.
    init(
        floors: [KozmosFloorPresentation],
        selectedFloor: Binding<String>,
        variant: KozmosFloorSelectorVariant,
        showResultCounts: Bool = false,
        label: String = "Floor selector",
        userFloor: String? = nil,
        expanded: Bool
    ) {
        self.init(floors: floors, selectedFloor: selectedFloor, variant: variant, showResultCounts: showResultCounts, label: label, userFloor: userFloor)
        self._isExpanded = State(initialValue: expanded)
    }

    /// For venues with no separate display label: the ID is rendered verbatim.
    public init(
        floors: [String],
        selectedFloor: Binding<String>,
        variant: KozmosFloorSelectorVariant = .verticalList,
        showResultCounts: Bool = false,
        label: String = "Floor selector",
        previousFloorLabel: String = "Floor up",
        nextFloorLabel: String = "Floor down",
        userFloor: String? = nil,
        userFloorLabel: String = "your level",
        expandHint: String = "Shows every level"
    ) {
        self.init(
            floors: floors.map {
                KozmosFloorPresentation(id: $0, label: $0, shortLabel: $0)
            },
            selectedFloor: selectedFloor,
            variant: variant,
            showResultCounts: showResultCounts,
            label: label,
            previousFloorLabel: previousFloorLabel,
            nextFloorLabel: nextFloorLabel,
            userFloor: userFloor,
            userFloorLabel: userFloorLabel,
            expandHint: expandHint
        )
    }

    private func select(_ floor: KozmosFloorPresentation) {
        guard !floor.disabled, floors.contains(where: { $0.id == floor.id && !$0.disabled }) else { return }
        if variant == .collapsible {
            close(returningFocus: true)
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

    /// Opens or closes the switcher's column.
    private func setExpanded(_ open: Bool) {
        guard open != isExpanded else { return }
        if open && (floors.isEmpty || popupFrame == nil) { return }
        #if os(iOS)
        if open { growsDown = (popupFrame?.minY ?? 0) >= anchorFrame.minY - Self.columnInset }
        #endif
        if open, let floor = selectedPresentation {
            trackEvent(
                KozmosAnalyticsEvent(
                    eventName: "floor_selector_expanded",
                    component: "FloorSelector",
                    properties: ["floor": floor.id]
                )
            )
        }
        withAnimation(reduceMotion ? nil : .spring(response: 0.3, dampingFraction: 0.85)) { isExpanded = open }
    }

    /// Closes the column; after a choice or Escape, VoiceOver goes back to the
    /// tile. Not after a tap outside: whatever the visitor touched is where
    /// they are.
    private func close(returningFocus: Bool) {
        setExpanded(false)
        if returningFocus { tileFocusRequest += 1 }
    }

    var selectedIndex: Int? {
        floors.firstIndex { $0.id == selectedFloor }
    }

    /// Decorative direction cues, never independent stepping buttons.
    var availableAbove: Bool {
        guard let index = floors.firstIndex(where: { $0.id == selectedFloor }) else { return false }
        return floors[..<index].contains { !$0.disabled }
    }

    var availableBelow: Bool {
        guard let index = floors.firstIndex(where: { $0.id == selectedFloor }) else { return false }
        return floors.dropFirst(index + 1).contains { !$0.disabled }
    }

    private var selectedPresentation: KozmosFloorPresentation? {
        if let floor = floors.first(where: { $0.id == selectedFloor }) { return floor }
        // The host owns selection. A stale ID is not the first floor, and
        // cannot become a selectable option merely because we display it.
        guard !selectedFloor.isEmpty else { return nil }
        return KozmosFloorPresentation(
            id: selectedFloor, label: selectedFloor, shortLabel: selectedFloor, disabled: true
        )
    }

    /// Whether the closed tile shows the level the visitor is on: it carries
    /// the dot only then.
    var tileShowsUserFloor: Bool {
        guard let userFloor, let shown = selectedPresentation else { return false }
        return shown.id == userFloor
    }

    /// What VoiceOver calls the closed tile: the level it shows, and whether
    /// the visitor is on it. No count: the tile marks none.
    var tileLabel: String {
        guard let shown = selectedPresentation else { return selectedFloor }
        return tileShowsUserFloor ? "\(shown.label), \(userFloorLabel)" : shown.label
    }

    public var body: some View {
        if variant == .collapsible {
            switcher
        } else {
            container
                .padding(KozmosDimensions.primitivesLayoutSpacing75)
                .background(KozmosColors.primitivesColorsBackground0.opacity(0.9))
                .cornerRadius(KozmosDimensions.semanticsRadiusPanel)
                .kozmosElevation(KozmosShadows.semanticsElevationFloating)
                .accessibilityElement(children: .contain)
                .accessibilityLabel(label)
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
            // Drawn by `switcher`, not in a panel of its own.
            EmptyView()
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
                // Decision 59: the selected level is a prominent fill — the
                // theme fill, with the theme foreground on it, white in both
                // themes (background/0 turned black on it in the dark).
                .background(isSelected ? KozmosColors.componentsPrimaryButtonsThemedButtonBackgroundIdle : Color.clear)
                .foregroundColor(
                    isSelected
                        ? KozmosColors.componentsPrimaryButtonsThemedButtonForegroundContentIdle
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

    // MARK: - The switcher (row 79, decision 38)

    /// How far the column's levels sit inside its edge, and apart. The
    /// column's corner is the map control's Control corner grown by it, so
    /// the levels' corners stay concentric with it.
    private static let columnInset = KozmosDimensions.primitivesLayoutSpacing50

    /// The open column's height: a tile per level, `columnInset` apart and
    /// around them.
    private var columnHeight: CGFloat {
        let levels = CGFloat(floors.count)
        return levels * tileSize.height + (levels + 1) * Self.columnInset
    }

    /// How far the column, grown up from the tile, reaches above the tile's
    /// top: the room it needs there.
    private var columnReachAboveTile: CGFloat {
        columnHeight - tileSize.height - Self.columnInset
    }

    /// The open column in the tile's own coordinates — one tile wide and a
    /// tile per level, `columnInset` apart and around them, its bottom level
    /// on the tile, or its top one where it grows down — so the watch can
    /// tell a tap on it from a tap outside. Worked out from the numbers the
    /// column is laid out with rather than measured: a preference from the
    /// column, which opens inside an overlay on a spring, never reached the
    /// switcher (measured on iOS 26.5). The same both ways round: the column
    /// reaches past the tile equally on either side.
    private var popupFrame: CGRect? {
        guard popupRegion?.available != false, !floors.isEmpty, anchorFrame.width > 0 else { return nil }
        #if os(iOS)
        let bounds = popupRegion?.bounds ?? anchor.visibleBounds
        #else
        // Standalone macOS keeps the previous unbounded presentation; an embedded
        // shell provides real bounds. Never invent a desktop/window size.
        guard let bounds = popupRegion?.bounds else {
            return CGRect(x: anchorFrame.minX - Self.columnInset,
                          y: anchorFrame.maxY + Self.columnInset - columnHeight,
                          width: tileSize.width + 2 * Self.columnInset, height: columnHeight)
        }
        #endif
        return kozmosFloorPopupFrame(anchor: anchorFrame, bounds: bounds, desiredHeight: columnHeight,
                                    inset: Self.columnInset, rtl: layoutDirection == .rightToLeft,
                                    allowHorizontalShift: popupRegion != nil)
    }

    var columnFrameOverTile: CGRect {
        guard let frame = popupFrame else { return .zero }
        return frame.offsetBy(dx: -anchorFrame.minX, dy: -anchorFrame.minY)
    }

    /// The closed tile, with the column over it while it is open.
    @ViewBuilder
    private var switcher: some View {
        if let shown = selectedPresentation {
            tile(shown)
                // The tile is called by this name already: as a hint too,
                // it would be read twice.
                .kozmosTooltip(shown.label, side: .left, isAccessibilityHint: false)
                 .overlay(alignment: .top) {
                    column
                        .offset(x: columnFrameOverTile.midX - tileSize.width / 2,
                                y: columnFrameOverTile.minY)
                }
                .onPreferenceChange(KozmosFloorAnchorFrameKey.self) { anchorFrame = $0 }
                .onChange(of: popupFrame) { frame in
                    if frame == nil && isExpanded { focusedLevel = nil; close(returningFocus: false) }
                }
                .onPreferenceChange(KozmosFloorTileSizeKey.self) { if let measured = $0 { tileSize = measured } }
                .accessibilityElement(children: .contain)
                .accessibilityLabel(label)
        }
    }

    /// The closed state: the map's own control, `KozmosMapControlButton`,
    /// showing the level's short label — the SDK's level switcher tile. It is
    /// drawn by the map control itself, not a lookalike, so it follows the
    /// shared map-control surface wherever that goes, the location control
    /// beside it with it. It marks no result count: it is the level in view.
    @ViewBuilder
    private func tile(_ floor: KozmosFloorPresentation) -> some View {
        let control = KozmosMapControlButton(label: tileLabel, action: { setExpanded(!isExpanded) }) {
            VStack(spacing: 0) {
                directionCue("chevron.up", visible: availableAbove)
                Text(floor.shortLabel)
                    .font(KozmosTypography.subheadline)
                    .bold()
                    .lineLimit(1)
                    .minimumScaleFactor(0.5)
                directionCue("chevron.down", visible: availableBelow)
            }
        }
        .overlay(alignment: .topTrailing) {
            if tileShowsUserFloor { userFloorDot }
        }
        .background(
            GeometryReader { proxy in
                Color.clear.preference(key: KozmosFloorTileSizeKey.self, value: proxy.size)
                    .preference(key: KozmosFloorAnchorFrameKey.self, value: proxy.frame(in: .global))
            }
        )
        #if os(iOS)
        control
            // VoiceOver is given the UIKit element laid over the tile instead:
            // it can say whether the column is open, which SwiftUI has no
            // modifier for.
            .accessibilityHidden(true)
            .overlay(
                KozmosFloorSwitcherElement(
                    anchor: anchor,
                    label: tileLabel,
                    hint: expandHint,
                    isExpanded: isExpanded,
                    columnFrame: isExpanded ? columnFrameOverTile : .zero,
                    focusRequest: tileFocusRequest,
                    toggle: { setExpanded(!isExpanded) },
                    escape: { close(returningFocus: true) },
                    tappedOutside: { close(returningFocus: false) }
                )
            )
        #else
        control
            .accessibilityHint(expandHint)
        #endif
    }

    private func directionCue(_ symbol: String, visible: Bool) -> some View {
        Image(systemName: symbol)
            .resizable()
            .scaledToFit()
            .frame(width: KozmosDimensions.primitivesLayoutSizing200,
                   height: KozmosDimensions.primitivesLayoutSpacing75)
            .opacity(visible ? 1 : 0)
            .accessibilityHidden(true)
    }

    /// The open state: every level in a column over the tile, top floor first,
    /// its bottom level where the tile was — or its top one, where there is no
    /// room above the tile — the tile grows into it. It wears the map-control
    /// surface its tile does (decision 40): the page's own surface, opaque, no
    /// edge, and the map controls' elevation. Its corner is the Control corner
    /// grown by the column's inset, so the levels' corners stay concentric.
    @ViewBuilder
    private var column: some View {
        if variant == .collapsible, isExpanded, let popupFrame {
            let edge = RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl + Self.columnInset,
                                        style: .continuous)
            let surface = KozmosColors.primitivesColorsBackground0
            ScrollViewReader { reader in
                ScrollView(.vertical) {
                    VStack(spacing: Self.columnInset) {
                        ForEach(floors) { floor in columnLevel(floor).id(floor.id) }
                    }
                    .padding(Self.columnInset)
                }
                .onAppear { reader.scrollTo(selectedFloor, anchor: .center); focusedLevel = selectedFloor }
            }
            .frame(width: popupFrame.width, height: popupFrame.height)
            .background(surface, in: edge)
            .kozmosElevation(KozmosShadows.semanticsElevationMapControl, in: edge, fill: surface)
            .accessibilityElement(children: .contain)
            .accessibilityLabel(label)
            .accessibilityAction(.escape) { close(returningFocus: true) }
            // Escape on a hardware keyboard, as the escape gesture above.
            .background(
                Button { close(returningFocus: true) } label: { EmptyView() }
                    .keyboardShortcut(.cancelAction)
                    .opacity(0)
                    .accessibilityHidden(true)
            )
            .transition(
                reduceMotion
                    ? .opacity
                    : .opacity.combined(with: .scale(scale: 0.92, anchor: growsDown ? .topTrailing : .bottomTrailing))
            )
        }
    }

    /// One level of the column, the tile's size: its short label, as the
    /// tile shows it. The board's states: the current level outlined in the
    /// theme's primary, its label in the primary; a closed level on the muted
    /// surface in the muted ink. The visitor's dot at the top trailing corner,
    /// a result count at the bottom one, so neither covers the other.
    private func columnLevel(_ floor: KozmosFloorPresentation) -> some View {
        let isCurrent = floor.id == selectedFloor
        let shape = RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl, style: .continuous)
        return Button {
            select(floor)
        } label: {
            Text(floor.shortLabel)
                .font(KozmosTypography.subheadline)
                .bold()
                .lineLimit(1)
                .minimumScaleFactor(0.5)
                .foregroundColor(
                    isCurrent
                        ? KozmosColors.primitivesColorsTheme600
                        : floor.disabled
                            ? KozmosColors.primitivesColorsForeground400
                            : KozmosColors.primitivesColorsForeground100
                )
                .frame(width: tileSize.width, height: tileSize.height)
                .background(floor.disabled ? KozmosColors.primitivesColorsBackground100 : Color.clear, in: shape)
                .overlay {
                    if isCurrent { shape.strokeBorder(KozmosColors.primitivesColorsTheme600, lineWidth: 1) }
                }
                .overlay(alignment: .topTrailing) {
                    if floor.id == userFloor { userFloorDot }
                }
                .overlay(alignment: .bottomTrailing) { resultMarker(for: floor) }
                .contentShape(shape)
        }
        .buttonStyle(.plain)
        .disabled(floor.disabled)
        .accessibilityLabel(spokenLabel(floor))
        // The label starts with this name: as a hint too, VoiceOver read
        // every level twice.
        .kozmosTooltip(floor.label, side: .left, isAccessibilityHint: false)
        .accessibilityAddTraits(isCurrent ? [.isButton, .isSelected] : .isButton)
        #if os(iOS)
        // VoiceOver lands on the current level when the column opens. iOS
        // only: on a Mac `ImageRenderer` draws no column at all once a level
        // carries this (measured), and VoiceOver on a Mac is not what the
        // switcher is for.
        .accessibilityFocused($focusedLevel, equals: floor.id)
        #endif
    }

    /// The visitor's level (decision 38): a dot in the theme's primary with a
    /// halo of the surface, at the top trailing corner, as the SDK's level
    /// switcher marks it — 10pt across, 4pt in, as React's is. Hidden from
    /// VoiceOver: the level's name says it.
    private var userFloorDot: some View {
        Circle()
            .fill(KozmosColors.primitivesColorsTheme600)
            .padding(2)
            .background(KozmosColors.primitivesColorsBackground0, in: Circle())
            .frame(width: 10, height: 10)
            .padding(KozmosDimensions.primitivesLayoutSpacing50)
            .accessibilityHidden(true)
    }

    /// The next selectable floor in list order, skipping any that are closed.
    func reachableIndex(step: Int) -> Int? {
        guard let selectedIndex, step == -1 || step == 1 else { return nil }
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
    /// levels are listed — the two lists and the switcher's open column. The
    /// stepper shows one level at a time, so a marker on the level already in
    /// view says nothing; the switcher's closed tile shows that level too, and
    /// is drawn without one.
    func markedResultCount(_ floor: KozmosFloorPresentation) -> Int? {
        guard showResultCounts, variant != .compactStepper, let count = floor.resultCount, count > 0 else { return nil }
        return count
    }

    /// What assistive technology hears for a level: its label, whether the
    /// visitor is on it where the switcher marks that, and the count its
    /// button marks in the product's words — "Level 2, your level, 3 results".
    /// Said here, on the button, so the marks themselves are hidden: hearing
    /// "3" after that is noise. Only the switcher draws the dot, so only it
    /// says it.
    func spokenLabel(_ floor: KozmosFloorPresentation) -> String {
        var parts = [floor.label]
        if variant == .collapsible, let userFloor, floor.id == userFloor {
            parts.append(userFloorLabel)
        }
        if let count = markedResultCount(floor) {
            parts.append(resultCountLabel(count))
        }
        return parts.joined(separator: ", ")
    }

    /// The count, drawn once and said once: a pill in the theme fill, with
    /// the theme foreground on it (decision 59), in the square's trailing
    /// top corner, which mirrors in Arabic. Inside the
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
                .background(KozmosColors.componentsPrimaryButtonsThemedButtonBackgroundIdle, in: Capsule())
                .foregroundColor(KozmosColors.componentsPrimaryButtonsThemedButtonForegroundContentIdle)
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

/// The switcher's tile's size, read off the map control. Nil where nothing
/// measured it, and the first measure kept: the open column beside the tile
/// sets no size, and taking the last value let its default overwrite the
/// tile's the moment the column opened (measured, once the map control
/// became 48 and the default no longer matched it).
private struct KozmosFloorTileSizeKey: PreferenceKey {
    static let defaultValue: CGSize? = nil
    static func reduce(value: inout CGSize?, nextValue: () -> CGSize?) { value = value ?? nextValue() }
}

#if os(iOS)
import UIKit

/// The switcher's tile as VoiceOver hears it, and the watch for a tap outside
/// its open column.
///
/// SwiftUI has no modifier for whether a control's list is open: its own
/// `DisclosureGroup` reports no expanded status to VoiceOver on iOS 26.5
/// (measured, 2026-09-28). UIKit does, as `accessibilityExpandedStatus`
/// (iOS 18), so the tile is given to VoiceOver as this view laid over it,
/// which says "collapsed" or "expanded" in the visitor's own language. It
/// takes no touches — they reach the map control underneath — and acts only
/// for VoiceOver: activation opens or closes the column, the escape gesture
/// closes it.
///
/// While the column is open it also watches its window for a tap outside the
/// tile and the column, which SwiftUI cannot hear beyond a view's own bounds.
/// The watch takes nothing from the tap: a tap on the map still reaches the
/// map, as a press outside Radix's popover still reaches what it landed on.
struct KozmosFloorSwitcherElement: UIViewRepresentable {
    let anchor: KozmosFloorSwitcherAnchor
    let label: String
    /// Heard while the column is closed: what activating the tile does.
    let hint: String
    let isExpanded: Bool
    let columnFrame: CGRect
    let focusRequest: Int
    let toggle: () -> Void
    let escape: () -> Void
    let tappedOutside: () -> Void

    func makeUIView(context: Context) -> ElementView {
        let view = ElementView(focusRequest: focusRequest)
        anchor.view = view
        view.boundsChanged = { [weak anchor] bounds in
            DispatchQueue.main.async {
                guard let anchor, anchor.visibleBounds != bounds else { return }
                anchor.visibleBounds = bounds
            }
        }
        return view
    }

    func updateUIView(_ view: ElementView, context: Context) {
        anchor.view = view
        view.accessibilityLabel = label
        view.accessibilityHint = isExpanded ? nil : hint
        view.toggle = toggle
        view.escape = escape
        view.tappedOutside = tappedOutside
        view.columnFrame = columnFrame
        view.isExpanded = isExpanded
        if view.focusRequest != focusRequest {
            view.focusRequest = focusRequest
            view.takeVoiceOverFocus()
        }
    }

    final class ElementView: UIView, UIGestureRecognizerDelegate {
        var boundsChanged: (CGRect) -> Void = { _ in }
        var toggle: () -> Void = {}
        var escape: () -> Void = {}
        var tappedOutside: () -> Void = {}
        /// The open column, in this view's coordinates, which are the tile's.
        var columnFrame: CGRect = .zero
        var focusRequest: Int
        var isExpanded = false {
            didSet {
                guard isExpanded != oldValue else { return }
                if #available(iOS 18.0, *) { accessibilityExpandedStatus = isExpanded ? .expanded : .collapsed }
                watchForTapsOutside()
            }
        }
        private var watch: UITapGestureRecognizer?

        init(focusRequest: Int) {
            self.focusRequest = focusRequest
            super.init(frame: .zero)
            backgroundColor = .clear
            isUserInteractionEnabled = false
            isAccessibilityElement = true
            accessibilityTraits = .button
            if #available(iOS 18.0, *) { accessibilityExpandedStatus = .collapsed }
        }

        required init?(coder: NSCoder) { nil }

        override func accessibilityActivate() -> Bool {
            toggle()
            return true
        }

        override func accessibilityPerformEscape() -> Bool {
            guard isExpanded else { return false }
            escape()
            return true
        }

        override func didMoveToWindow() {
            super.didMoveToWindow()
            watchForTapsOutside()
            reportBounds()
        }

        override func layoutSubviews() {
            super.layoutSubviews()
            reportBounds()
        }

        override func safeAreaInsetsDidChange() {
            super.safeAreaInsetsDidChange()
            reportBounds()
        }

        private func reportBounds() {
            boundsChanged(window.map { $0.bounds.inset(by: $0.safeAreaInsets) } ?? .zero)
        }

        /// Watches the window while the column is open, and nothing otherwise.
        private func watchForTapsOutside() {
            let host = isExpanded ? window : nil
            if let watch, watch.view === host { return }
            if let watch { watch.view?.removeGestureRecognizer(watch) }
            watch = nil
            guard let host else { return }
            let tap = UITapGestureRecognizer(target: self, action: #selector(tapped))
            tap.cancelsTouchesInView = false
            tap.delaysTouchesEnded = false
            tap.delegate = self
            host.addGestureRecognizer(tap)
            watch = tap
        }

        /// The watch's action: a tap outside closes the column.
        @objc func tapped() { tappedOutside() }

        /// Outside both the tile and its column, in this view's coordinates.
        func isOutside(_ point: CGPoint) -> Bool {
            !bounds.contains(point) && !columnFrame.contains(point)
        }

        /// How far the tile's top is below the top of its window's safe area:
        /// the room a column grown up from the tile has. Unbounded out of a
        /// window.
        var roomAbove: CGFloat {
            guard let window else { return .greatestFiniteMagnitude }
            return convert(bounds, to: window).minY - window.safeAreaInsets.top
        }

        func gestureRecognizer(_ gestureRecognizer: UIGestureRecognizer, shouldReceive touch: UITouch) -> Bool {
            isOutside(touch.location(in: self))
        }

        func gestureRecognizer(
            _ gestureRecognizer: UIGestureRecognizer,
            shouldRecognizeSimultaneouslyWith otherGestureRecognizer: UIGestureRecognizer
        ) -> Bool {
            true
        }

        /// VoiceOver back on the tile once the column has gone, where it hears
        /// the level now shown.
        func takeVoiceOverFocus() {
            DispatchQueue.main.async { [weak self] in
                guard let self, self.window != nil else { return }
                UIAccessibility.post(notification: .layoutChanged, argument: self)
            }
        }
    }
}

/// The switcher's hold on its UIKit element, kept in its state, so that as the
/// column opens it can ask how much room there is above the tile.
@MainActor
final class KozmosFloorSwitcherAnchor: ObservableObject {
    weak var view: KozmosFloorSwitcherElement.ElementView?

    /// The room above the tile in its window; unbounded before the tile is in
    /// one, so the column grows up, as it always has.
    var roomAbove: CGFloat { view?.roomAbove ?? .greatestFiniteMagnitude }
    @Published var visibleBounds: CGRect = .zero
}
#endif
