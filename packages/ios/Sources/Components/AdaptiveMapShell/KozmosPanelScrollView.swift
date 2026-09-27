import SwiftUI

// The sheet's content and the shell that holds it share three things here: whether
// the content may scroll, how far it has scrolled, and where its peek ends. The
// prototype's rule, driven and measured (docs/pointr-prototype-initial-sheet-
// 2026-09-20.md §2): the content scrolls under a finger only at the largest
// detent; below it an upward drag grows the sheet first; at the largest detent
// a downward drag empties the scroll before the sheet moves.

/// Whether the sheet's content may scroll. The shell sets it false below the
/// largest detent and while the sheet is being dragged; outside a shell it is
/// true and a `KozmosPanelScrollView` is a plain scroll view.
struct KozmosPanelScrollEnabledKey: EnvironmentKey {
    static let defaultValue = true
}

public extension EnvironmentValues {
    var kozmosPanelScrollEnabled: Bool {
        get { self[KozmosPanelScrollEnabledKey.self] }
        set { self[KozmosPanelScrollEnabledKey.self] = newValue }
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
                    }
                )
        }
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

    /// The prototype's rule (docs/pointr-prototype-initial-sheet-2026-09-20.md §2).
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
