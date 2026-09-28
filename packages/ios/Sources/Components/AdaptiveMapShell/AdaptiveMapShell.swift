import SwiftUI

/// How much of the shell a docked panel takes up.
///
/// The shell's panel is not a modal sheet — the map keeps receiving touches at
/// every detent — so it carries its own detent type rather than reusing
/// SwiftUI's `PresentationDetent`, which only applies to presented sheets.
public enum KozmosMapPanelDetent: Hashable, Sendable {
    /// A peek: a fifth of the shell, or the row marked with
    /// `kozmosPanelPeekAnchor()`; with no row marked, tall enough for the
    /// whole panel header.
    case collapsed
    /// The resting height, where the map and the panel share the shell.
    case medium
    /// Nearly the whole shell, for reading a long panel.
    case large
    /// A share of the shell's height.
    case fraction(Double)
    /// An exact height in points.
    case height(CGFloat)
    /// As tall as the panel's content, between the collapsed and the large
    /// heights: for a sheet that holds a summary and a row of buttons and
    /// nothing to scroll. The shell measures the content; on its own this
    /// detent reads as medium.
    case content

    /// Outside this range there is either no map or no panel worth showing.
    static let usableFractions: ClosedRange<Double> = 0.12...0.94

    /// A collapsed panel still has to fit the grab handle and a header row.
    static let minimumCollapsedHeight: CGFloat = 112

    func height(in shellHeight: CGFloat) -> CGFloat {
        let maximum = shellHeight * CGFloat(Self.usableFractions.upperBound)
        switch self {
        // The Pointr prototype's three detents, driven and measured by
        // scripts/measure-prototype-sheet.cjs: a fifth of the frame, 54 % and 94 %.
        case .collapsed:
            // Proportional on a tall phone, but never so short on a landscape
            // or split-screen shell that the handle and header stop fitting.
            return min(max(shellHeight * 0.2, Self.minimumCollapsedHeight), shellHeight * 0.4)
        case .medium, .content:
            return shellHeight * 0.54
        case .large:
            return shellHeight * 0.94
        case .fraction(let value):
            let clamped = min(
                max(value, Self.usableFractions.lowerBound),
                Self.usableFractions.upperBound
            )
            return shellHeight * CGFloat(clamped)
        case .height(let points):
            return min(max(points, 0), maximum)
        }
    }

    /// The collapsed detent when the sheet's content marks a peek anchor
    /// (`kozmosPanelPeekAnchor()`): the anchor's bottom edge plus a margin,
    /// within a quarter and three quarters of the shell — the prototype's place
    /// card rests on its Go row.
    static func anchoredCollapsedHeight(peekBottom: CGFloat, in shellHeight: CGFloat) -> CGFloat {
        min(
            max(peekBottom + KozmosDimensions.primitivesLayoutSpacing200, shellHeight * 0.24),
            shellHeight * 0.72
        )
    }

    /// The collapsed detent when the sheet has a panel header and no peek
    /// anchor: the plain collapsed height, grown only as far as the header's
    /// bottom edge and the peek margin need, and never over three quarters of
    /// the shell (row 73). A header is not an anchor: an anchored peek's
    /// quarter-of-the-shell floor would grow the prototype's fifth under a
    /// search row that already fits in it.
    static func headerCollapsedHeight(headerBottom: CGFloat, in shellHeight: CGFloat) -> CGFloat {
        max(
            KozmosMapPanelDetent.collapsed.height(in: shellHeight),
            min(headerBottom + KozmosDimensions.primitivesLayoutSpacing200, shellHeight * 0.72)
        )
    }

    var accessibilityDescription: String {
        switch self {
        case .collapsed: return "Collapsed"
        case .content: return "Fitted to content"
        case .medium: return "Half height"
        case .large: return "Expanded"
        case .fraction(let value): return "\(Int((value * 100).rounded())) percent"
        case .height(let points): return "\(Int(points.rounded())) points"
        }
    }
}

/// Movement below this reads as a tap on the panel's grab handle rather than a
/// drag. A generic type cannot hold a static stored property, so it lives here.
private let kozmosMapPanelTapSlop: CGFloat = 6

/// Height of the shell's own top bar, so the floating controls can start below
/// it instead of underneath it.
private struct KozmosMapShellTopBarHeightKey: PreferenceKey {
    static var defaultValue: CGFloat = 0
    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) {
        value = max(value, nextValue())
    }
}

/// Size of the controls cluster, which is part of what the map has to keep
/// clear — its width when it sits in a top corner, its height when it runs
/// along the bottom.
private struct KozmosMapShellControlsSizeKey: PreferenceKey {
    static var defaultValue: CGSize = .zero
    static func reduce(value: inout CGSize, nextValue: () -> CGSize) {
        let next = nextValue()
        value = CGSize(width: max(value.width, next.width), height: max(value.height, next.height))
    }
}

struct KozmosMapShellContentPanelHeightKey: PreferenceKey {
    static var defaultValue: CGFloat = 0
    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) { value = max(value, nextValue()) }
}

/// Adaptive container that layers a map, its controls, and a detail panel.
///
/// Mirrors the React `AdaptiveMapShell`. The shell owns layout, safe areas, and
/// z-ordering only.
///
/// It reports through `onCollisionInsetsChange` how much of the map its own
/// chrome is covering — the top bar, the controls column, and the panel at its
/// settled detent — merged with any `collisionInsets` the caller adds. The map
/// renderer needs those to pad its camera: layout alone cannot move SDK labels,
/// routes, attribution, or marker collision boxes. The reported insets follow
/// the detent the panel has settled on, not the live drag, so the camera does
/// not chase a moving sheet.
///
/// `panelHeader` is drawn under the sheet's grab handle and above the panel,
/// and is not scrolled with it: a search field, the assistant button, or a
/// chosen category stays put while the results under it scroll (row 73).
/// Every detent counts it — a sheet fitted to its content includes it, a peek
/// anchor in it is honoured, and with no anchor a collapsed sheet is tall
/// enough to show all of it. A vertical drag on it moves the sheet, whatever
/// the content has scrolled; a sideways one stays with the header, for a row
/// of chips that scrolls. Under the grabber it starts 4 points below the
/// grabber's row, so its first control keeps the grabber's target clear
/// (WCAG 2.5.8). In a side panel it is the panel's first row.
///
/// The panel's content is told what the panel leaves empty above it, and how
/// far its first control must keep below that — `kozmosPanelInsetTop` and
/// `kozmosPanelClearanceTop` in the environment — so a part with its own top
/// padding and no surface of its own, as `KozmosPOIDetailPanel` and
/// `KozmosBrowseCategoriesPanel` are in their sheet presentations, tops it up
/// rather than adding to it (GAP-083, decision 14). The values describe the
/// panel's top: a part a product places under its own row there is not at
/// the top, and is told so by setting both to zero.
public struct KozmosAdaptiveMapShell<Map: View, Controls: View, TopBar: View, Panel: View, MapStatusContent: View>: View {
    public enum PanelPlacement {
        case start
        case end
    }

    /// Where the floating controls sit over the map.
    public enum ControlsPlacement {
        /// In the top corner opposite the panel.
        case top
        /// Across the bottom of the map, above the panel — where a thumb
        /// reaches on a phone.
        case bottom
    }

    private let map: Map
    private let mapLabel: String
    private let mapStatus: KozmosMapReadiness
    private let mapStatusContent: MapStatusContent
    private let controls: Controls
    private let topBar: TopBar
    private let panel: Panel
    private let panelHeader: AnyView?
    private let panelLabel: String
    private let panelPlacement: PanelPlacement
    private let controlsPlacement: ControlsPlacement
    private let panelDetentBinding: Binding<KozmosMapPanelDetent>?
    private let panelDetents: [KozmosMapPanelDetent]
    private let panelSurface: KozmosSurfaceStyle
    /// The sheet's height while it is fitted to its content, as measured.
    @State private var contentPanelHeight: CGFloat = 0
    /// The bottom edge of the peek anchor — the panel header's, else the
    /// content's — from the sheet's top; zero when neither marks one.
    @State private var peekAnchorBottom: CGFloat = 0
    /// The panel header's bottom edge, from the sheet's top: the handle's row
    /// and the header. Zero with no header, or one that draws nothing.
    @State private var panelHeaderBottom: CGFloat = 0
    /// How far the content's `KozmosPanelScrollView` has scrolled.
    @State private var panelScrollOffset: CGFloat = 0
    /// What the drag in progress on the sheet's body is doing, from its first
    /// move until the finger lifts.
    @State private var bodyDrag: KozmosPanelDragKind?
    private let collisionInsets: KozmosMapCollisionInsets
    private let onCollisionInsetsChange: ((KozmosMapCollisionInsets) -> Void)?

    private let hasControls: Bool
    private let hasTopBar: Bool
    private let hasPanel: Bool
    private let hasMapStatusContent: Bool

    @Environment(\.horizontalSizeClass) private var horizontalSizeClass
    @Environment(\.layoutDirection) private var layoutDirection
    @State private var topBarHeight: CGFloat = 0
    @State private var controlsSize: CGSize = .zero
    @State private var uncontrolledDetent: KozmosMapPanelDetent?
    @State private var dragTranslation: CGFloat = 0

    /// Deliberately shallow. The handle is an affordance at the very top edge
    /// of the sheet, not a row of chrome the content has to be pushed past:
    /// the content is told the row is there (`kozmosPanelInsetTop`), so a
    /// part with its own top padding tops it up rather than stacking its
    /// padding on top of this (GAP-083).
    private static var grabberRowHeight: CGFloat { KozmosDimensions.primitivesLayoutSpacing200 }

    /// WCAG 2.5.8: a target smaller than 24 points keeps a 24-point circle on
    /// its centre clear of every other target. The grabber's row is one.
    private static var minimumTargetSpacing: CGFloat { 24 }

    /// How far the first control under the grabber's row keeps below it: half
    /// of what the row falls short of a 24-point target, 4.
    private static var grabberClearance: CGFloat { (minimumTargetSpacing - grabberRowHeight) / 2 }

    public init<PanelHeader: View>(
        mapLabel: String = "Map",
        mapStatus: KozmosMapReadiness = .ready,
        panelLabel: String = "Map details",
        panelPlacement: PanelPlacement = .end,
        controlsPlacement: ControlsPlacement = .top,
        panelDetent: Binding<KozmosMapPanelDetent>? = nil,
        panelDetents: [KozmosMapPanelDetent] = [.collapsed, .medium, .large],
        panelSurface: KozmosSurfaceStyle = .solid,
        collisionInsets: KozmosMapCollisionInsets = .zero,
        onCollisionInsetsChange: ((KozmosMapCollisionInsets) -> Void)? = nil,
        @ViewBuilder map: () -> Map,
        @ViewBuilder mapStatusContent: () -> MapStatusContent,
        @ViewBuilder controls: () -> Controls,
        @ViewBuilder topBar: () -> TopBar,
        @ViewBuilder panel: () -> Panel,
        @ViewBuilder panelHeader: () -> PanelHeader = { EmptyView() }
    ) {
        self.mapLabel = mapLabel
        self.mapStatus = mapStatus
        self.panelLabel = panelLabel
        self.panelPlacement = panelPlacement
        self.controlsPlacement = controlsPlacement
        self.panelDetentBinding = panelDetent
        self.panelDetents = panelDetents.isEmpty ? [.medium] : panelDetents
        self.panelSurface = panelSurface
        self.collisionInsets = collisionInsets
        self.onCollisionInsetsChange = onCollisionInsetsChange
        self.map = map()
        self.mapStatusContent = mapStatusContent()
        self.controls = controls()
        self.topBar = topBar()
        self.panel = panel()
        self.panelHeader = PanelHeader.self == EmptyView.self ? nil : AnyView(panelHeader())
        self.hasControls = Controls.self != EmptyView.self
        self.hasTopBar = TopBar.self != EmptyView.self
        self.hasPanel = Panel.self != EmptyView.self
        self.hasMapStatusContent = MapStatusContent.self != EmptyView.self
    }

    /// Wide layouts float the panel beside the map; compact layouts dock it to
    /// the bottom edge, matching the web breakpoint behaviour.
    private var isRegularWidth: Bool {
        #if os(iOS)
        return horizontalSizeClass == .regular
        #else
        return true
        #endif
    }

    // MARK: - Detents

    /// A detent's height: the content-fitted one from the sheet as measured,
    /// between the collapsed and the large heights, or medium until measured;
    /// the collapsed one from a peek anchor, else from the panel header; every
    /// other detent from its own arithmetic.
    func detentHeight(_ detent: KozmosMapPanelDetent, in shellHeight: CGFloat) -> CGFloat {
        switch detent {
        case .collapsed where peekAnchorBottom > 0:
            return KozmosMapPanelDetent.anchoredCollapsedHeight(peekBottom: peekAnchorBottom, in: shellHeight)
        case .collapsed where panelHeaderBottom > 0:
            return KozmosMapPanelDetent.headerCollapsedHeight(headerBottom: panelHeaderBottom, in: shellHeight)
        case .content where contentPanelHeight > 0:
            return min(
                max(contentPanelHeight, detentHeight(.collapsed, in: shellHeight)),
                KozmosMapPanelDetent.large.height(in: shellHeight)
            )
        default:
            return detent.height(in: shellHeight)
        }
    }

    /// Whether the panel has settled on the tallest detent on offer: the only
    /// place the content is allowed to scroll under a finger.
    func isAtLargestDetent(in shellHeight: CGFloat) -> Bool {
        guard let largest = orderedDetents(in: shellHeight).last else { return true }
        return settledPanelHeight(in: shellHeight) >= detentHeight(largest, in: shellHeight) - 0.5
    }

    /// Whether the sheet's content may scroll right now: beside the map it
    /// always may; docked, only at the largest detent and with no drag moving
    /// the sheet. Mid-drag the change cancels the content's own pan, so one
    /// finger never scrolls the list and moves the sheet at once.
    func panelScrollEnabled(in shellHeight: CGFloat, docked: Bool) -> Bool {
        guard docked else { return true }
        return isAtLargestDetent(in: shellHeight) && dragTranslation == 0 && bodyDrag != .sheet
    }

    /// The detent set in ascending height order, with duplicates removed.
    func orderedDetents(in shellHeight: CGFloat) -> [KozmosMapPanelDetent] {
        var seen = Set<CGFloat>()
        return panelDetents
            .sorted { detentHeight($0, in: shellHeight) < detentHeight($1, in: shellHeight) }
            .filter { seen.insert(detentHeight($0, in: shellHeight).rounded()).inserted }
    }

    /// The detent the panel has settled on — the caller's if it is controlling
    /// the panel, otherwise the shell's own.
    func activeDetent(in shellHeight: CGFloat) -> KozmosMapPanelDetent {
        if let panelDetentBinding { return panelDetentBinding.wrappedValue }
        if let uncontrolledDetent { return uncontrolledDetent }
        let ordered = orderedDetents(in: shellHeight)
        if ordered.contains(.medium) { return .medium }
        return ordered.isEmpty ? .medium : ordered[ordered.count / 2]
    }

    private func setDetent(_ detent: KozmosMapPanelDetent) {
        if let panelDetentBinding {
            panelDetentBinding.wrappedValue = detent
        } else {
            uncontrolledDetent = detent
        }
    }

    /// The height the panel rests at, ignoring any drag in progress.
    func settledPanelHeight(in shellHeight: CGFloat) -> CGFloat {
        let ordered = orderedDetents(in: shellHeight)
        let height = detentHeight(activeDetent(in: shellHeight), in: shellHeight)
        guard let first = ordered.first, let last = ordered.last else { return height }
        return min(max(height, detentHeight(first, in: shellHeight)), detentHeight(last, in: shellHeight))
    }

    /// The height to draw right now, following the finger between detents.
    private func livePanelHeight(in shellHeight: CGFloat) -> CGFloat {
        let ordered = orderedDetents(in: shellHeight)
        let smallest = ordered.first.map { detentHeight($0, in: shellHeight) } ?? settledPanelHeight(in: shellHeight)
        let largest = ordered.last.map { detentHeight($0, in: shellHeight) } ?? settledPanelHeight(in: shellHeight)
        // Dragging up is a negative translation, and makes the panel taller.
        return min(max(settledPanelHeight(in: shellHeight) - dragTranslation, smallest), largest)
    }

    /// The detent closest to a height, used to snap a drag once it ends.
    func nearestDetent(to height: CGFloat, in shellHeight: CGFloat) -> KozmosMapPanelDetent? {
        orderedDetents(in: shellHeight).min {
            abs(detentHeight($0, in: shellHeight) - height) < abs(detentHeight($1, in: shellHeight) - height)
        }
    }

    /// Where the offered detents place this one. A caller can bind a detent
    /// that is not in the set, and a set can collapse two detents that resolve
    /// to the same height, so an exact match is not guaranteed — fall back to
    /// whichever offered detent it sits closest to, or the handle goes dead.
    private func detentIndex(of detent: KozmosMapPanelDetent, in shellHeight: CGFloat) -> Int? {
        let ordered = orderedDetents(in: shellHeight)
        if let exact = ordered.firstIndex(of: detent) { return exact }
        guard let nearest = nearestDetent(to: detentHeight(detent, in: shellHeight), in: shellHeight) else {
            return nil
        }
        return ordered.firstIndex(of: nearest)
    }

    private var controlsAlignment: Alignment {
        switch controlsPlacement {
        case .top:
            return panelPlacement == .end ? .topLeading : .topTrailing
        case .bottom:
            // Full width, bottom aligned: the caller decides which corner each
            // control sits in, or spreads them across both.
            return .bottom
        }
    }

    private var showsGrabber: Bool { drawsGrabber(isRegularWidth: isRegularWidth) }

    /// Whether the docked sheet draws its grabber: by the detents on offer —
    /// one offers nothing to move between — not by their heights. The width
    /// class is an argument so the rule can be tested, as the insets' is.
    func drawsGrabber(isRegularWidth: Bool) -> Bool {
        hasPanel && !isRegularWidth && panelDetents.count > 1
    }

    /// What the panel leaves empty above its content, and how far the
    /// content's first control must still sit below that (GAP-083): handed to
    /// the content as `kozmosPanelInsetTop` and `kozmosPanelClearanceTop`, so a
    /// part with its own top padding tops it up rather than adding to it.
    /// Under a grabber, its 16-point row, and half of what the row falls short
    /// of a 24-point target, 4, so the grabber keeps its spacing. Nothing with
    /// no grabber, under a panel header, which sits there instead, or beside
    /// the map, where a native side panel starts its content at its top edge
    /// (the web's leaves 16 above it).
    func panelContentTop(isRegularWidth: Bool) -> (inset: CGFloat, clearance: CGFloat) {
        guard drawsGrabber(isRegularWidth: isRegularWidth), panelHeader == nil else { return (0, 0) }
        return (Self.grabberRowHeight, Self.grabberClearance)
    }

    /// How far the panel header starts below the grabber's row: the
    /// grabber's clearance, so the search field a header usually starts with
    /// keeps the grabber's target its WCAG 2.5.8 spacing — as the web's header
    /// has since #109, and as the panel's content keeps it when no header sits
    /// there (decision 14). It sat flush under the row, 8 from the grabber's
    /// centre. Nothing with no grabber, and beside the map, where the header
    /// is the panel's first row.
    func panelHeaderTop(isRegularWidth: Bool) -> CGFloat {
        guard drawsGrabber(isRegularWidth: isRegularWidth), panelHeader != nil else { return 0 }
        return Self.grabberClearance
    }

    /// The panel's content, told what the panel leaves above it.
    private var hostedPanel: some View {
        let top = panelContentTop(isRegularWidth: isRegularWidth)
        return panel
            .environment(\.kozmosPanelInsetTop, top.inset)
            .environment(\.kozmosPanelClearanceTop, top.clearance)
    }

    // MARK: - Collision insets

    /// What the shell's own chrome is covering, merged with the caller's own
    /// insets. Each edge takes whichever is larger.
    ///
    /// `KozmosMapCollisionInsets` names physical edges, because that is what a
    /// map camera's padding is — so the panel's placement has to be resolved
    /// against the reading direction before it becomes a left or a right. In a
    /// right-to-left layout a panel at `.end` sits on the physical left, and
    /// the controls opposite it on the physical right.
    ///
    /// The width class is an argument for the same reason the size and the
    /// direction are: so the geometry can be tested. `swift test` runs on
    /// macOS, where the environment reports no size class and the shell would
    /// float the panel beside the map — every test would see the side-docked
    /// layout, with the bottom inset at 0 where the docked panel's height was
    /// expected. The body passes `isRegularWidth`; the tests pin compact.
    func resolvedCollisionInsets(
        in size: CGSize,
        layoutDirection: LayoutDirection,
        isRegularWidth: Bool,
        safeArea: EdgeInsets = EdgeInsets()
    ) -> KozmosMapCollisionInsets {
        let edgePadding = KozmosDimensions.primitivesLayoutSpacing200
        let sidePanelWidth = floatingPanelOccupancy(in: size, isRegularWidth: isRegularWidth)
        let dockedPanel = dockedPanelHeight(in: size, isRegularWidth: isRegularWidth)
        let inCorner = hasControls && controlsPlacement == .top
        let controlsColumn = inCorner ? controlsSize.width + edgePadding * 2 : 0
        let controlsBand = hasControls && controlsPlacement == .bottom
            ? controlsSize.height + edgePadding * 2
            : 0
        let panelOnPhysicalRight = (panelPlacement == .end) == (layoutDirection == .leftToRight)

        // The map runs under the safe areas; the camera keeps out of them.
        let safeLeft = layoutDirection == .leftToRight ? safeArea.leading : safeArea.trailing
        let safeRight = layoutDirection == .leftToRight ? safeArea.trailing : safeArea.leading
        let top = max(collisionInsets.top, Double(topBarInset + safeArea.top))
        let right = max(
            collisionInsets.right,
            Double((panelOnPhysicalRight ? sidePanelWidth : controlsColumn) + safeRight)
        )
        let bottom = max(
            collisionInsets.bottom,
            Double(dockedPanel > 0 ? dockedPanel + controlsBand : controlsBand + safeArea.bottom)
        )
        let left = max(
            collisionInsets.left,
            Double((panelOnPhysicalRight ? controlsColumn : sidePanelWidth) + safeLeft)
        )

        // Opposing edges saturate at the map's size, as React's
        // `resolveMapInsets` does: a map covered from edge to edge has no
        // usable camera area, not a negative one. Without this, a tall
        // detent under bottom controls reported more bottom and top inset
        // than the map had height, and a camera centred in that viewport
        // lands above the map.
        let width = Double(max(size.width, 0))
        let height = Double(max(size.height, 0))
        let clampedLeft = min(left, width)
        let clampedTop = min(top, height)
        return KozmosMapCollisionInsets(
            top: clampedTop,
            right: min(right, width - clampedLeft),
            bottom: min(bottom, height - clampedTop),
            left: clampedLeft
        )
    }

    /// How much of the shell the docked panel is covering, at its settled
    /// detent — zero when the panel floats beside the map instead.
    private func dockedPanelHeight(in size: CGSize, isRegularWidth: Bool) -> CGFloat {
        hasPanel && !isRegularWidth ? settledPanelHeight(in: size.height) : 0
    }

    /// The width a floating panel takes from its side of the shell, gutters
    /// included — zero when the panel is docked to the bottom.
    func floatingPanelOccupancy(in size: CGSize, isRegularWidth: Bool) -> CGFloat {
        guard hasPanel, isRegularWidth else { return 0 }
        return min(416, size.width * 0.42) + KozmosDimensions.primitivesLayoutSpacing200 * 2
    }

    /// The width the top bar and the controls are laid out in: the map beside
    /// a floating panel, or the whole shell when the panel is docked. Chrome
    /// laid out across the whole shell went under a floating panel, which is
    /// above it — a trailing-anchored control cluster vanished on an iPad, and
    /// a centred top bar lost its trailing third. React's shell lays both out
    /// in the map area beside the panel; this is that area's width.
    func chromeWidth(in size: CGSize, isRegularWidth: Bool) -> CGFloat {
        max(size.width - floatingPanelOccupancy(in: size, isRegularWidth: isRegularWidth), 0)
    }

    /// Which side of the shell the chrome keeps when a panel floats: the side
    /// the panel is not on. Logical, so it mirrors with the panel.
    private var chromeSide: Alignment {
        panelPlacement == .end ? .leading : .trailing
    }

    /// How far down the top bar pushes anything sharing the top edge. Zero when
    /// the slot renders nothing, so a caller passing a conditional top bar does
    /// not permanently reserve the shell's padding for an empty view.
    private var topBarInset: CGFloat {
        guard hasTopBar, topBarHeight > 0 else { return 0 }
        return topBarHeight + KozmosDimensions.primitivesLayoutSpacing200
    }

    // MARK: - Body

    public var body: some View {
        // Edge to edge, as the prototype's screen: the map runs under the
        // status bar and the home indicator and the sheet's surface reaches
        // the bottom edge, while the chrome and the sheet's content keep the
        // safe areas the outer reader saw. The detents are shares of the
        // whole height, as the prototype's are of its frame.
        GeometryReader { outer in
            shell(safeArea: outer.safeAreaInsets)
                // The container's safe areas only: the keyboard's region still
                // insets the shell, so the sheet rises above the keyboard and
                // a picker's rows stay reachable while a field is focused.
                .ignoresSafeArea(.container)
        }
        .frame(minHeight: 448)
    }

    private func shell(safeArea: EdgeInsets) -> some View {
        GeometryReader { geometry in
            let insets = resolvedCollisionInsets(
                in: geometry.size,
                layoutDirection: layoutDirection,
                isRegularWidth: isRegularWidth,
                safeArea: safeArea
            )

            ZStack(alignment: .topLeading) {
                map
                    .frame(width: geometry.size.width, height: geometry.size.height)
                    .accessibilityElement(children: .contain)
                    .accessibilityLabel(mapLabel)

                if mapStatus != .ready, hasMapStatusContent {
                    mapStatusContent
                        .frame(width: geometry.size.width, height: geometry.size.height)
                        .background(KozmosColors.primitivesColorsBackground0.opacity(0.8))
                        .accessibilityAddTraits(.updatesFrequently)
                        .zIndex(2)
                }

                let chromeWidth = chromeWidth(in: geometry.size, isRegularWidth: isRegularWidth)

                if hasTopBar {
                    topBar
                        .frame(maxWidth: 672)
                        .frame(width: chromeWidth, alignment: .center)
                        // Measured before the padding, so a slot that renders
                        // nothing measures nothing.
                        .background(
                            GeometryReader { proxy in
                                Color.clear.preference(
                                    key: KozmosMapShellTopBarHeightKey.self,
                                    value: proxy.size.height
                                )
                            }
                        )
                        .padding(.top, topBarHeight > 0 ? KozmosDimensions.primitivesLayoutSpacing200 + safeArea.top : 0)
                        .padding(.leading, safeArea.leading)
                        .padding(.trailing, safeArea.trailing)
                        .frame(width: geometry.size.width, alignment: chromeSide)
                        .zIndex(3)
                }

                if hasControls {
                    controls
                        .background(
                            GeometryReader { proxy in
                                Color.clear.preference(
                                    key: KozmosMapShellControlsSizeKey.self,
                                    value: proxy.size
                                )
                            }
                        )
                        .padding(KozmosDimensions.primitivesLayoutSpacing200)
                        // The top bar shares this edge, so the controls clear
                        // whatever it occupies rather than sitting under it;
                        // the status bar likewise.
                        .padding(.top, topBarInset + safeArea.top)
                        .padding(.leading, safeArea.leading)
                        .padding(.trailing, safeArea.trailing)
                        .padding(.bottom, hasPanel && !isRegularWidth ? 0 : safeArea.bottom)
                        // Bounded by the band left above the panel rather than
                        // the whole shell. Controls that overflowed used to
                        // disappear behind the panel with no way for the caller
                        // to know; the slot is proposed the space it really
                        // has, so a `ViewThatFits` in it can adapt.
                        .frame(
                            width: chromeWidth,
                            height: max(
                                geometry.size.height - dockedPanelHeight(in: geometry.size, isRegularWidth: isRegularWidth),
                                0
                            ),
                            alignment: controlsAlignment
                        )
                        .frame(width: geometry.size.width, alignment: chromeSide)
                        .zIndex(3)
                }

                if hasPanel {
                    panelContainer(in: geometry, safeArea: safeArea)
                        .zIndex(4)
                }
            }
            .frame(width: geometry.size.width, height: geometry.size.height)
            .onPreferenceChange(KozmosMapShellTopBarHeightKey.self) { topBarHeight = $0 }
            .onPreferenceChange(KozmosMapShellControlsSizeKey.self) { controlsSize = $0 }
            .onPreferenceChange(KozmosMapShellContentPanelHeightKey.self) { contentPanelHeight = $0 }
            .onPreferenceChange(KozmosMapShellPeekBottomKey.self) { peekAnchorBottom = $0 }
            .onPreferenceChange(KozmosMapShellPanelHeaderBottomKey.self) { panelHeaderBottom = $0 }
            .onPreferenceChange(KozmosPanelScrollOffsetKey.self) { panelScrollOffset = $0 }
            .onAppear { onCollisionInsetsChange?(insets) }
            .onChange(of: insets) { onCollisionInsetsChange?($0) }
        }
        .background(KozmosColors.primitivesColorsBackground100)
        .clipped()
    }

    // MARK: - Panel

    @ViewBuilder
    private func panelContainer(in geometry: GeometryProxy, safeArea: EdgeInsets) -> some View {
        if isRegularWidth {
            // Beside the map the header is the panel's first row, and the
            // panel takes the rest.
            VStack(spacing: 0) {
                if let panelHeader {
                    panelHeader.fixedSize(horizontal: false, vertical: true)
                }
                hostedPanel.frame(maxHeight: .infinity)
            }
            .frame(width: min(416, geometry.size.width * 0.42))
            .frame(maxHeight: .infinity)
            .kozmosSurface(
                RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusPanel, style: .continuous),
                style: panelSurface
            )
            .shadow(color: KozmosColors.primitivesColorsForeground900.opacity(0.18), radius: 24, x: 0, y: 12)
            .padding(KozmosDimensions.primitivesLayoutSpacing200)
            .padding(EdgeInsets(top: safeArea.top, leading: safeArea.leading, bottom: safeArea.bottom, trailing: safeArea.trailing))
            .frame(
                width: geometry.size.width,
                height: geometry.size.height,
                alignment: panelPlacement == .end ? .trailing : .leading
            )
            .accessibilityElement(children: .contain)
            .accessibilityLabel(panelLabel)
        } else {
            let fitted = activeDetent(in: geometry.size.height) == .content && dragTranslation == 0
            Group {
                if fitted {
                    // Fitted to its content in one layout pass: the layout
                    // proposes the large height and takes what the content
                    // needs. The measured height feeds the detent maths — the
                    // insets, the snapping — a frame later.
                    KozmosCappedHeightLayout(cap: KozmosMapPanelDetent.large.height(in: geometry.size.height)) {
                        VStack(spacing: 0) {
                            if showsGrabber {
                                grabber(in: geometry.size.height)
                            }
                            sheetHeader(safeArea: safeArea)
                            hostedPanel
                                .environment(\.kozmosPanelScrollEnabled, panelScrollEnabled(in: geometry.size.height, docked: true))
                                // Fitted content never scrolls, so the safe
                                // areas are plain padding here: a safe-area
                                // inset would take the whole proposal and the
                                // sheet would stop fitting.
                                .padding(.bottom, safeArea.bottom)
                                .padding(.leading, safeArea.leading)
                                .padding(.trailing, safeArea.trailing)
                                .frame(maxWidth: .infinity, alignment: .top)
                        }
                    }
                    .frame(width: geometry.size.width, alignment: .top)
                    .background(
                        GeometryReader { proxy in
                            Color.clear.preference(key: KozmosMapShellContentPanelHeightKey.self, value: proxy.size.height)
                        }
                    )
                } else {
                    VStack(spacing: 0) {
                        if showsGrabber {
                            grabber(in: geometry.size.height)
                        }
                        sheetHeader(safeArea: safeArea)

                        hostedPanel
                            .environment(\.kozmosPanelScrollEnabled, panelScrollEnabled(in: geometry.size.height, docked: true))
                            .modifier(KozmosSheetSafeArea(safeArea: safeArea))
                            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
                    }
                    // An explicit height rather than a cap: the panel is laid
                    // out at whatever the detent gives it, so a footer stays on
                    // the sheet's bottom edge at every detent instead of
                    // falling off the screen.
                    .frame(
                        width: geometry.size.width,
                        height: livePanelHeight(in: geometry.size.height),
                        alignment: .top
                    )
                    // A detent the host sets — the field's focus opening the
                    // sheet — moves on the standard motion like a snap does.
                    // Keyed on the detent, not its height: a measurement
                    // refining the same detent (an anchor, a content height)
                    // lands at once, so the render tests and the peek see the
                    // settled height in their first frame.
                    .animation(KozmosMotion.standard, value: activeDetent(in: geometry.size.height))
                }
            }
            // The peek anchor, resolved where the sheet's top is zero: its
            // bottom edge becomes the collapsed detent (`anchoredCollapsedHeight`).
            // An anchor in the panel header outranks one in the content, as
            // React's `measurePeekBottom` has it. The header's own bottom edge
            // is not an anchor: it sets the least the collapsed detent may be
            // (`headerCollapsedHeight`) and where a drag is the header's.
            .overlayPreferenceValue(KozmosMapShellPeekAnchorKey.self) { anchors in
                GeometryReader { proxy in
                    let header = anchors.headerBounds.map { proxy[$0] }
                    Color.clear
                        .preference(
                            key: KozmosMapShellPeekBottomKey.self,
                            value: (anchors.header ?? anchors.content).map { proxy[$0].maxY } ?? 0
                        )
                        // A header that draws nothing — a builder whose `if`
                        // came out false — is no header.
                        .preference(
                            key: KozmosMapShellPanelHeaderBottomKey.self,
                            value: header.map { $0.height > 0 ? $0.maxY : 0 } ?? 0
                        )
                }
                .allowsHitTesting(false)
            }
            .kozmosSurface(
                KozmosPanelShape(radius: KozmosDimensions.semanticsRadiusPanel, roundsBottom: false),
                style: panelSurface
            )
            .shadow(color: KozmosColors.primitivesColorsForeground900.opacity(0.18), radius: 24, x: 0, y: -8)
            // The whole sheet drags, not only its handle: the prototype's
            // rule, with the content's scroll handed off by `KozmosPanelDragKind`.
            // On iOS a UIKit pan recogniser, which can fail for a drag the
            // content keeps and cancel the touches of a tile the sheet's drag
            // started on; elsewhere SwiftUI's drag, simultaneous with the
            // content's own gestures.
            .background(bodyDragCatcher(in: geometry))
            .simultaneousGesture(bodyDragGesture(in: geometry), including: Self.usesUIKitPan ? .subviews : .all)
            .frame(
                width: geometry.size.width,
                height: geometry.size.height,
                alignment: .bottom
            )
            .accessibilityElement(children: .contain)
            .accessibilityLabel(panelLabel)
        }
    }

    #if canImport(UIKit)
    private static var usesUIKitPan: Bool { true }

    @ViewBuilder private func bodyDragCatcher(in geometry: GeometryProxy) -> some View {
        let shellHeight = geometry.size.height
        KozmosSheetPanCatcher(
            shouldBegin: { start, translation in
                let kind = sheetDragKind(startingAt: start.y, translation: translation, in: shellHeight)
                guard kind == .sheet else { return false }
                bodyDrag = .sheet
                return true
            },
            changed: { translation in
                dragTranslation = translation
            },
            ended: { translation, velocity in
                bodyDrag = nil
                withAnimation(KozmosMotion.standard) {
                    dragTranslation = 0
                    // The fling's velocity, projected 120 ms on, so a fast short
                    // drag still lands on the detent it was aiming for.
                    let target = settledPanelHeight(in: shellHeight) - translation - velocity * 0.12
                    if let nearest = nearestDetent(to: target, in: shellHeight) {
                        setDetent(nearest)
                    }
                }
            }
        )
    }
    #else
    private static var usesUIKitPan: Bool { false }

    @ViewBuilder private func bodyDragCatcher(in geometry: GeometryProxy) -> some View { EmptyView() }
    #endif

    /// What a drag that starts `startY` points below the sheet's top does:
    /// the prototype's rule, with the handle's row and the panel header
    /// placed. The header does not scroll, so a drag that starts on it is the
    /// sheet's whatever the content under it has scrolled — at the largest
    /// detent a scrolled list used to claim it (row 73) — while a sideways one
    /// stays with the header, for a row of chips that scrolls.
    func sheetDragKind(startingAt startY: CGFloat, translation: CGSize, in shellHeight: CGFloat) -> KozmosPanelDragKind {
        KozmosPanelDragKind.decide(
            startsInHandle: showsGrabber && startY < Self.grabberRowHeight,
            translation: translation,
            atLargestDetent: isAtLargestDetent(in: shellHeight),
            scrollOffset: startY < panelHeaderBottom ? 0 : panelScrollOffset
        )
    }

    /// A drag anywhere on the sheet. What it does is decided at its first move
    /// and held until the finger lifts: the handle's own gesture keeps a drag
    /// that starts on the handle; a sideways move, or a scroll at the largest
    /// detent, is the content's; anything else moves the sheet and snaps it,
    /// as the handle's drag does.
    private func bodyDragGesture(in geometry: GeometryProxy) -> some Gesture {
        let shellHeight = geometry.size.height
        // The sheet's top when the drag begins, in the global space the
        // translation is measured in — the settled height, not the live one,
        // because the live one moves with the drag it is deciding about.
        let sheetTop = geometry.frame(in: .global).minY + shellHeight - settledPanelHeight(in: shellHeight)
        return DragGesture(minimumDistance: kozmosMapPanelTapSlop, coordinateSpace: .global)
            .onChanged { value in
                if bodyDrag == nil {
                    bodyDrag = sheetDragKind(
                        startingAt: value.startLocation.y - sheetTop,
                        translation: value.translation,
                        in: shellHeight
                    )
                }
                guard bodyDrag == .sheet else { return }
                dragTranslation = value.translation.height
            }
            .onEnded { value in
                let kind = bodyDrag
                bodyDrag = nil
                guard kind == .sheet else { return }
                withAnimation(KozmosMotion.standard) {
                    dragTranslation = 0
                    let target = settledPanelHeight(in: shellHeight) - value.predictedEndTranslation.height
                    if let nearest = nearestDetent(to: target, in: shellHeight) {
                        setDetent(nearest)
                    }
                }
            }
    }

    /// The panel header in the docked sheet: under the handle, above the
    /// panel, and outside whatever the panel scrolls. It keeps its own height
    /// at every detent — a short sheet clips it rather than squashing it —
    /// and the side safe areas, as the panel does. Its box, and a peek anchor
    /// marked in it, are handed up as the header's. Under the grabber it
    /// starts the grabber's clearance below the grabber's row
    /// (`panelHeaderTop`); the clearance lies outside the box it hands up,
    /// so a header that draws nothing is still no header to the detents, and
    /// the box's bottom edge is measured where the clearance puts it.
    @ViewBuilder
    private func sheetHeader(safeArea: EdgeInsets) -> some View {
        if let panelHeader {
            panelHeader
                .padding(.leading, safeArea.leading)
                .padding(.trailing, safeArea.trailing)
                .frame(maxWidth: .infinity)
                .fixedSize(horizontal: false, vertical: true)
                .transformAnchorPreference(key: KozmosMapShellPeekAnchorKey.self, value: .bounds) { anchors, bounds in
                    anchors = KozmosPanelPeekAnchors(header: anchors.content, headerBounds: bounds)
                }
                .padding(.top, panelHeaderTop(isRegularWidth: isRegularWidth))
        }
    }

    private func grabber(in shellHeight: CGFloat) -> some View {
        let detent = activeDetent(in: shellHeight)

        return Capsule()
            // A background-scale grey: the handle is a passive affordance, and
            // a foreground grey reads as content.
            .fill(KozmosColors.primitivesColorsBackground300)
            .frame(width: KozmosDimensions.primitivesLayoutSizing500, height: 4)
            .padding(.top, KozmosDimensions.primitivesLayoutSpacing75)
            .frame(maxWidth: .infinity)
            .frame(height: Self.grabberRowHeight, alignment: .top)
            // The whole row is the target: a 5pt capsule is not a hit area.
            .contentShape(Rectangle())
            // One gesture handles both the drag and the tap. Two separate
            // recognisers on the same view fight, and the tap wins.
            //
            // The coordinate space has to be global: the handle is inside the
            // panel it resizes, so a local space would move with every frame of
            // the drag and feed back into the translation it is measuring.
            .gesture(
                DragGesture(minimumDistance: 0, coordinateSpace: .global)
                    .onChanged { value in
                        dragTranslation = value.translation.height
                    }
                    .onEnded { value in
                        withAnimation(KozmosMotion.standard) {
                            dragTranslation = 0

                            if abs(value.translation.height) < kozmosMapPanelTapSlop {
                                setDetent(cycledDetent(from: detent, in: shellHeight))
                                return
                            }

                            // Predicted translation carries the flick's
                            // velocity, so a fast short drag still lands on the
                            // detent the visitor was aiming for.
                            let target = settledPanelHeight(in: shellHeight)
                                - value.predictedEndTranslation.height
                            if let nearest = nearestDetent(to: target, in: shellHeight) {
                                setDetent(nearest)
                            }
                        }
                    }
            )
            .accessibilityElement()
            .accessibilityLabel("Panel height")
            .accessibilityValue(detent.accessibilityDescription)
            .accessibilityHint("Swipe up or down to resize the panel")
            .accessibilityAdjustableAction { direction in
                let step = direction == .increment ? 1 : -1
                withAnimation(KozmosMotion.standard) {
                    setDetent(steppedDetent(from: detent, by: step, in: shellHeight))
                }
            }
    }

    /// Tapping the handle walks up the detents and wraps back to the shortest.
    private func cycledDetent(
        from detent: KozmosMapPanelDetent,
        in shellHeight: CGFloat
    ) -> KozmosMapPanelDetent {
        let ordered = orderedDetents(in: shellHeight)
        guard let index = detentIndex(of: detent, in: shellHeight) else { return detent }
        return ordered[(index + 1) % ordered.count]
    }

    /// VoiceOver's increment and decrement move one detent without wrapping.
    private func steppedDetent(
        from detent: KozmosMapPanelDetent,
        by step: Int,
        in shellHeight: CGFloat
    ) -> KozmosMapPanelDetent {
        let ordered = orderedDetents(in: shellHeight)
        guard let index = detentIndex(of: detent, in: shellHeight) else { return detent }
        let target = min(max(index + step, 0), ordered.count - 1)
        return ordered[target]
    }
}

public extension KozmosAdaptiveMapShell where TopBar == EmptyView {
    init<PanelHeader: View>(
        mapLabel: String = "Map",
        mapStatus: KozmosMapReadiness = .ready,
        panelLabel: String = "Map details",
        panelPlacement: PanelPlacement = .end,
        controlsPlacement: ControlsPlacement = .top,
        panelDetent: Binding<KozmosMapPanelDetent>? = nil,
        panelDetents: [KozmosMapPanelDetent] = [.collapsed, .medium, .large],
        panelSurface: KozmosSurfaceStyle = .solid,
        collisionInsets: KozmosMapCollisionInsets = .zero,
        onCollisionInsetsChange: ((KozmosMapCollisionInsets) -> Void)? = nil,
        @ViewBuilder map: () -> Map,
        @ViewBuilder mapStatusContent: () -> MapStatusContent,
        @ViewBuilder controls: () -> Controls,
        @ViewBuilder panel: () -> Panel,
        @ViewBuilder panelHeader: () -> PanelHeader = { EmptyView() }
    ) {
        self.init(
            mapLabel: mapLabel,
            mapStatus: mapStatus,
            panelLabel: panelLabel,
            panelPlacement: panelPlacement,
            controlsPlacement: controlsPlacement,
            panelDetent: panelDetent,
            panelDetents: panelDetents,
            panelSurface: panelSurface,
            collisionInsets: collisionInsets,
            onCollisionInsetsChange: onCollisionInsetsChange,
            map: map,
            mapStatusContent: mapStatusContent,
            controls: controls,
            topBar: { EmptyView() },
            panel: panel,
            panelHeader: panelHeader
        )
    }
}

public extension KozmosAdaptiveMapShell
where TopBar == EmptyView, MapStatusContent == EmptyView, Controls == EmptyView {
    init<PanelHeader: View>(
        mapLabel: String = "Map",
        panelLabel: String = "Map details",
        panelPlacement: PanelPlacement = .end,
        controlsPlacement: ControlsPlacement = .top,
        panelDetent: Binding<KozmosMapPanelDetent>? = nil,
        panelDetents: [KozmosMapPanelDetent] = [.collapsed, .medium, .large],
        panelSurface: KozmosSurfaceStyle = .solid,
        collisionInsets: KozmosMapCollisionInsets = .zero,
        onCollisionInsetsChange: ((KozmosMapCollisionInsets) -> Void)? = nil,
        @ViewBuilder map: () -> Map,
        @ViewBuilder panel: () -> Panel,
        @ViewBuilder panelHeader: () -> PanelHeader = { EmptyView() }
    ) {
        self.init(
            mapLabel: mapLabel,
            mapStatus: .ready,
            panelLabel: panelLabel,
            panelPlacement: panelPlacement,
            controlsPlacement: controlsPlacement,
            panelDetent: panelDetent,
            panelDetents: panelDetents,
            panelSurface: panelSurface,
            collisionInsets: collisionInsets,
            onCollisionInsetsChange: onCollisionInsetsChange,
            map: map,
            mapStatusContent: { EmptyView() },
            controls: { EmptyView() },
            topBar: { EmptyView() },
            panel: panel,
            panelHeader: panelHeader
        )
    }
}

/// The docked sheet's content keeps the bottom and side safe areas as its own,
/// so a summary sits above the home indicator while a `KozmosPanelScrollView`
/// runs under it with its content inset — the sheet's surface itself reaches
/// the edge.
private struct KozmosSheetSafeArea: ViewModifier {
    let safeArea: EdgeInsets

    func body(content: Content) -> some View {
        content
            .safeAreaInset(edge: .bottom, spacing: 0) { Color.clear.frame(height: safeArea.bottom) }
            .safeAreaInset(edge: .leading, spacing: 0) { Color.clear.frame(width: safeArea.leading) }
            .safeAreaInset(edge: .trailing, spacing: 0) { Color.clear.frame(width: safeArea.trailing) }
    }
}
