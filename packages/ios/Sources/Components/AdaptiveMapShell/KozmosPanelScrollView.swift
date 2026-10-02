import SwiftUI

// The sheet's content and the shell that holds it share four things here: whether
// the content may scroll, how far it has scrolled, where its peek ends, and what
// the panel leaves above the content. The Pointr prototype's rule, driven and
// measured by scripts/measure-prototype-sheet.cjs: the content scrolls
// under a finger only at the largest detent; below it an upward drag grows the
// sheet first; at the largest detent a downward drag empties the scroll before
// the sheet moves.

/// Whether the sheet's content may scroll. The shell sets it false below the
/// largest detent and while the sheet is being dragged; outside a shell it is
/// true and a `KozmosPanelScrollView` is a plain scroll view.
struct KozmosPanelScrollEnabledKey: EnvironmentKey {
    static let defaultValue = true
}

/// Side panels fit short scrolling content but still cap long lists.
struct KozmosPanelFitsContentKey: EnvironmentKey {
    static let defaultValue = false
}

extension EnvironmentValues {
    var kozmosPanelFitsContent: Bool {
        get { self[KozmosPanelFitsContentKey.self] }
        set { self[KozmosPanelFitsContentKey.self] = newValue }
    }
}

private struct KozmosScrollContentHeightKey: PreferenceKey {
    static var defaultValue: CGFloat = 0
    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) { value = max(value, nextValue()) }
}

public extension EnvironmentValues {
    var kozmosPanelScrollEnabled: Bool {
        get { self[KozmosPanelScrollEnabledKey.self] }
        set { self[KozmosPanelScrollEnabledKey.self] = newValue }
    }
}

struct KozmosPanelInsetTopKey: EnvironmentKey {
    static let defaultValue: CGFloat = 0
}

struct KozmosPanelClearanceTopKey: EnvironmentKey {
    static let defaultValue: CGFloat = 0
}

public extension EnvironmentValues {
    /// What the shell's panel leaves empty above its content (GAP-083): the
    /// grabber's 16-point row, the 16-point gap below a `panelHeader`, or
    /// the shell's 16-point top inset when neither is present (including
    /// beside the map). A part with its own top padding and no
    /// surface of its own tops it up to what it needs rather than adding to
    /// it, as `KozmosPOIDetailPanel` and `KozmosBrowseCategoriesPanel` do in
    /// their sheet presentations and `KozmosRoutePreviewPanel` does; a part
    /// that draws its own bordered surface keeps its padding inside the
    /// border, since this space lies outside it. Zero outside a shell. It
    /// describes the panel's top: a product that puts such a part under a row
    /// of its own sets this and `kozmosPanelClearanceTop` to zero for it, or
    /// the part tops up to a space that is not above it.
    var kozmosPanelInsetTop: CGFloat {
        get { self[KozmosPanelInsetTopKey.self] }
        set { self[KozmosPanelInsetTopKey.self] = newValue }
    }

    /// How far the panel content's first control must still sit below
    /// `kozmosPanelInsetTop` (GAP-083): 4 points under a grabber — half of
    /// what its 16-point row falls short of 24 — so the grabber's target keeps
    /// its WCAG 2.5.8 spacing; zero everywhere else. It is also how far below
    /// the row the 24-point circle on the grabber's centre reaches, so a part
    /// that knows where its controls sit across the panel may keep it only
    /// where they would meet that circle: `KozmosPOIDetailPanel`'s header does
    /// (decision 51).
    var kozmosPanelClearanceTop: CGFloat {
        get { self[KozmosPanelClearanceTopKey.self] }
        set { self[KozmosPanelClearanceTopKey.self] = newValue }
    }
}

struct KozmosPanelSurfaceKey: EnvironmentKey {
    static let defaultValue: KozmosSurfaceStyle? = nil
}

public extension EnvironmentValues {
    /// The surface of the shell's panel under what it hosts, a sheet's or a
    /// side panel's, solid or glass; nil outside a shell. The panel's surface
    /// is the one surface (decision 43): a part that fills its own box
    /// standing alone, as `KozmosRoutePreviewPanel` does, paints no fill on
    /// it, so a glass panel shows through it and a solid one looks as it
    /// did, its fill being the same background colour. A part that draws a
    /// bordered card of its own, as `KozmosPOIDetailPanel`'s panel
    /// presentation does, keeps it. Set for the panel's header and its
    /// content alike.
    var kozmosPanelSurface: KozmosSurfaceStyle? {
        get { self[KozmosPanelSurfaceKey.self] }
        set { self[KozmosPanelSurfaceKey.self] = newValue }
    }
}

/// How far the sheet's content has scrolled from its top, in points; zero at
/// the top. The shell reads it to decide whether a downward drag scrolls the
/// content back or moves the sheet.
struct KozmosPanelScrollOffsetKey: PreferenceKey {
    static var defaultValue: CGFloat = 0
    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) { value = max(value, nextValue()) }
}

/// What the sheet's smallest detent reads, as anchors the shell resolves in
/// the sheet's own space: the row the content marks, the row the panel header
/// marks, and the panel header's own box (row 73).
struct KozmosPanelPeekAnchors {
    var content: Anchor<CGRect>?
    var header: Anchor<CGRect>?
    var headerBounds: Anchor<CGRect>?
}

/// The rows the sheet's smallest detent rests on. Of two rows in one part,
/// the later wins.
struct KozmosMapShellPeekAnchorKey: PreferenceKey {
    static var defaultValue = KozmosPanelPeekAnchors()
    static func reduce(value: inout KozmosPanelPeekAnchors, nextValue: () -> KozmosPanelPeekAnchors) {
        let next = nextValue()
        value = KozmosPanelPeekAnchors(
            content: next.content ?? value.content,
            header: next.header ?? value.header,
            headerBounds: next.headerBounds ?? value.headerBounds
        )
    }
}

/// The resolved peek edge, in points from the sheet's top.
struct KozmosMapShellPeekBottomKey: PreferenceKey {
    static var defaultValue: CGFloat = 0
    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) { value = max(value, nextValue()) }
}

/// The panel header's bottom edge, in points from the sheet's top; zero with
/// no header, or one that draws nothing.
struct KozmosMapShellPanelHeaderBottomKey: PreferenceKey {
    static var defaultValue: CGFloat = 0
    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) { value = max(value, nextValue()) }
}

/// The vertical scroll view for content that lives in the shell's sheet.
///
/// A plain `ScrollView` scrolls at every detent and never tells the shell
/// where it is, so a finger on a list can only ever scroll the list. This one
/// yields to the shell: it scrolls only when the shell allows it (at the
/// largest detent, with no drag in progress) and reports its offset, so the
/// shell can grow the sheet under an upward drag and hand a downward drag to
/// the content until the content is back at its top. Outside a shell it is a
/// plain scroll view.
public struct KozmosPanelScrollView<Content: View>: View {
    @Environment(\.kozmosPanelScrollEnabled) private var scrollEnabled
    @Environment(\.kozmosPanelFitsContent) private var fitsContent
    @State private var contentHeight: CGFloat?
    private let showsIndicators: Bool
    private let content: Content

    public init(showsIndicators: Bool = true, @ViewBuilder content: () -> Content) {
        self.showsIndicators = showsIndicators
        self.content = content()
    }

    public var body: some View {
        ScrollView(.vertical, showsIndicators: showsIndicators) {
            content
                .background(
                    GeometryReader { proxy in
                        Color.clear.preference(
                            key: KozmosPanelScrollOffsetKey.self,
                            value: max(-proxy.frame(in: .named(KozmosPanelScrollView.spaceName)).minY, 0)
                        )
                        .preference(key: KozmosScrollContentHeightKey.self, value: proxy.size.height)
                    }
                )
        }
        .frame(maxHeight: fitsContent ? contentHeight : nil)
        .onPreferenceChange(KozmosScrollContentHeightKey.self) { contentHeight = $0 }
        .coordinateSpace(name: Self.spaceName)
        .scrollDisabled(!scrollEnabled)
        // The sheet's scrolling content runs under the home indicator, as a
        // scroll view's does, its content inset so the last row is reachable;
        // a peek then shows what the prototype's shows, not 34 points less.
        .ignoresSafeArea(.container, edges: .bottom)
    }

    private static var spaceName: String { "kozmosPanelScroll" }
}

public extension View {
    /// Marks the row the sheet's smallest detent rests on: `.collapsed` then
    /// resolves to this view's bottom edge plus a margin, within a quarter and
    /// three quarters of the shell — the prototype's place card peeks at its
    /// Go row. Without an anchor `.collapsed` is a fifth of the shell, or as
    /// much more as the whole panel header needs. A row in the panel header
    /// counts as one in the content does, and outranks it.
    func kozmosPanelPeekAnchor() -> some View {
        anchorPreference(key: KozmosMapShellPeekAnchorKey.self, value: .bounds) { KozmosPanelPeekAnchors(content: $0) }
    }
}

/// What a drag that starts on the sheet does, decided once at its first move.
/// Pure, so the rule can be tested without a finger.
public enum KozmosPanelDragKind: Equatable, Sendable {
    /// Started on the grab handle, which has its own gesture.
    case handle
    /// Left to the content: a sideways move, or a scroll at the largest detent.
    case content
    /// Moves the sheet between its detents.
    case sheet

    /// The prototype's rule: a sideways move is the content's, and so is, at the
    /// largest detent, an upward drag or any drag once the content has scrolled.
    /// Everything else moves the sheet.
    public static func decide(
        startsInHandle: Bool,
        translation: CGSize,
        atLargestDetent: Bool,
        scrollOffset: CGFloat
    ) -> KozmosPanelDragKind {
        if startsInHandle { return .handle }
        if abs(translation.width) > abs(translation.height) { return .content }
        if atLargestDetent, translation.height < 0 || scrollOffset > 0 { return .content }
        return .sheet
    }
}
