import SwiftUI

/// The side of the view a tooltip opens on.
///
/// `top`, `right`, `bottom` and `left` are the view's own sides, the same in
/// every language, as React's Radix `side` and Figma's Side are: `.right` is
/// the view's right left to right and right to left. `leading` and `trailing`
/// follow the reading direction: `.trailing` is the view's right left to
/// right and its left right to left. Until 2026-10-21 `.left` and `.right`
/// followed the reading direction, as `.leading` and `.trailing` do now.
public enum KozmosTooltipSide: Sendable {
    case top
    case right
    case bottom
    case left
    /// Before the view in the reading direction: its left left to right, its
    /// right right to left.
    case leading
    /// After the view in the reading direction: its right left to right, its
    /// left right to left.
    case trailing

    /// The side as drawn, in a layout direction.
    func edge(in direction: LayoutDirection) -> KozmosTooltipEdge {
        let rightToLeft = direction == .rightToLeft
        switch self {
        case .top: return .top
        case .right: return .right
        case .bottom: return .bottom
        case .left: return .left
        case .leading: return rightToLeft ? .right : .left
        case .trailing: return rightToLeft ? .left : .right
        }
    }
}

/// A side of the view as drawn, which the bubble and its tip are laid out by.
enum KozmosTooltipEdge: Sendable {
    case top, right, bottom, left

    var isSide: Bool { self == .left || self == .right }
}

public struct KozmosTooltip: ViewModifier {
    let text: String
    let side: KozmosTooltipSide
    /// Whether assistive technology hears the text as the view's hint, as it
    /// does by default. Pass `false` where the text repeats the view's own
    /// label, or VoiceOver reads it twice; the bubble still shows.
    let isAccessibilityHint: Bool

    @State private var isPresented: Bool
    @Environment(\.layoutDirection) private var layoutDirection

    public init(text: String, side: KozmosTooltipSide = .top, isAccessibilityHint: Bool = true) {
        self.init(text: text, side: side, isAccessibilityHint: isAccessibilityHint, isPresented: false)
    }

    /// Shown from the start, so a test can draw it without pressing anything.
    init(text: String, side: KozmosTooltipSide, isAccessibilityHint: Bool, isPresented: Bool) {
        self.text = text
        self.side = side
        self.isAccessibilityHint = isAccessibilityHint
        _isPresented = State(initialValue: isPresented)
    }

    /// Where the bubble goes in the layout: the side as drawn, which is the
    /// layout's leading or trailing side by the reading direction.
    private var placement: KozmosTooltipPlacement {
        switch side.edge(in: layoutDirection) {
        case .top: return .top
        case .bottom: return .bottom
        case .right: return layoutDirection == .rightToLeft ? .leading : .trailing
        case .left: return layoutDirection == .rightToLeft ? .trailing : .leading
        }
    }

    public func body(content: Content) -> some View {
        content
            .overlay(alignment: overlayAlignment) {
                // The guides that put the bubble beside the view are set on a
                // container round the conditional bubble: set on the bubble
                // inside it they were lost, and the bubble was drawn over
                // the view, against its edge, until 2026-10-21.
                ZStack {
                    if isPresented {
                        KozmosTooltipBubble(text: text, side: side)
                            .fixedSize()
                            .transition(.opacity.combined(with: .scale(scale: 0.96)))
                    }
                }
                .modifier(KozmosTooltipPosition(placement: placement))
                .allowsHitTesting(false)
            }
            .onHover { hovering in
                withAnimation(.easeOut(duration: 0.12)) {
                    isPresented = hovering
                }
            }
            .onLongPressGesture(
                minimumDuration: 0.45,
                pressing: { pressing in
                    withAnimation(.easeOut(duration: 0.12)) {
                        isPresented = pressing
                    }
                },
                perform: {
                    withAnimation(.easeOut(duration: 0.12)) {
                        isPresented = true
                    }
                }
            )
            .simultaneousGesture(
                TapGesture()
                    .onEnded {
                        withAnimation(.easeOut(duration: 0.12)) {
                            isPresented = false
                        }
                    }
            )
            .modifier(KozmosTooltipHint(text: text, isActive: isAccessibilityHint))
    }

    private var overlayAlignment: Alignment {
        switch placement {
        case .top: return .top
        case .trailing: return .trailing
        case .bottom: return .bottom
        case .leading: return .leading
        }
    }

}

/// The text as the view's hint. `help` sets that hint as well (measured on
/// iOS 26.5), so a tooltip that is not the hint leaves out both. On a Mac
/// that drops the system's help tag too; the bubble still shows.
private struct KozmosTooltipHint: ViewModifier {
    let text: String
    let isActive: Bool

    @ViewBuilder
    func body(content: Content) -> some View {
        if isActive {
            content
                .accessibilityHint(text)
                .help(text)
        } else {
            content
        }
    }
}

/// Where the bubble sits round the view, in the layout's own terms.
enum KozmosTooltipPlacement {
    case top, bottom, leading, trailing
}

/// Puts the bubble beside the view, 4 from it, on its placement's side. Every
/// guide is set, each for its own placement, as the location pin's label
/// sets them: a guide set inside a `switch` is lost, as one set inside the
/// conditional bubble is.
private struct KozmosTooltipPosition: ViewModifier {
    let placement: KozmosTooltipPlacement

    func body(content: Content) -> some View {
        let gap = KozmosDimensions.primitivesLayoutSpacing50
        return content
            .alignmentGuide(.top) { placement == .top ? $0[.bottom] + gap : $0[.top] }
            .alignmentGuide(.bottom) { placement == .bottom ? $0[.top] - gap : $0[.bottom] }
            .alignmentGuide(.leading) { placement == .leading ? $0[.trailing] + gap : $0[.leading] }
            .alignmentGuide(.trailing) { placement == .trailing ? $0[.leading] - gap : $0[.trailing] }
    }
}

/// The bubble the tooltip shows, with its tip toward the view it explains.
/// Internal so a test can draw it without pressing anything.
///
/// Laid out left to right, so the tip is on the side of the bubble the view
/// is on, as drawn, in every language; its text keeps the reading direction
/// it was given.
struct KozmosTooltipBubble: View {
    let text: String
    let side: KozmosTooltipSide
    @Environment(\.layoutDirection) private var layoutDirection

    var body: some View {
        let edge = side.edge(in: layoutDirection)
        Group {
            switch edge {
            case .top:
                VStack(spacing: 0) {
                    content
                    KozmosTooltipTip(edge: edge)
                }
            case .bottom:
                VStack(spacing: 0) {
                    KozmosTooltipTip(edge: edge)
                    content
                }
            case .right:
                HStack(spacing: 0) {
                    KozmosTooltipTip(edge: edge)
                    content
                }
            case .left:
                HStack(spacing: 0) {
                    content
                    KozmosTooltipTip(edge: edge)
                }
            }
        }
        .environment(\.layoutDirection, .leftToRight)
    }

    private var content: some View {
        Text(text)
            .environment(\.layoutDirection, layoutDirection)
            .font(.system(size: 14, weight: .regular))
            .lineLimit(1)
            .foregroundColor(KozmosColors.primitivesColorsForeground0)
            .padding(.horizontal, KozmosDimensions.primitivesLayoutSpacing150)
            .padding(.vertical, KozmosDimensions.primitivesLayoutSpacing75)
            .background(
                RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl)
                    .fill(KozmosColors.primitivesColorsBackground0)
            )
            .overlay(
                RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl)
                    .stroke(KozmosColors.primitivesColorsBackground200, lineWidth: 1)
            )
            .kozmosElevation(KozmosShadows.semanticsElevationOverlay)
    }
}

private struct KozmosTooltipTip: View {
    let edge: KozmosTooltipEdge

    var body: some View {
        KozmosTooltipTipShape(edge: edge)
            .fill(KozmosColors.primitivesColorsBackground0)
            .frame(width: edge.isSide ? 4 : 8, height: edge.isSide ? 8 : 4)
    }
}

/// The tip, pointing at the view the bubble explains, as drawn: from a bubble
/// on the view's right it points left. SwiftUI must not mirror it: unset, a
/// shape mirrors itself right to left in an app that deploys to iOS 17 or
/// later and not in one that deploys to iOS 16.
struct KozmosTooltipTipShape: Shape {
    let edge: KozmosTooltipEdge

    func path(in rect: CGRect) -> Path {
        Path { path in
            switch edge {
            case .top:
                path.move(to: CGPoint(x: rect.midX, y: rect.maxY))
                path.addLine(to: CGPoint(x: rect.minX, y: rect.minY))
                path.addLine(to: CGPoint(x: rect.maxX, y: rect.minY))
            case .bottom:
                path.move(to: CGPoint(x: rect.midX, y: rect.minY))
                path.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY))
                path.addLine(to: CGPoint(x: rect.minX, y: rect.maxY))
            case .right:
                path.move(to: CGPoint(x: rect.minX, y: rect.midY))
                path.addLine(to: CGPoint(x: rect.maxX, y: rect.minY))
                path.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY))
            case .left:
                path.move(to: CGPoint(x: rect.maxX, y: rect.midY))
                path.addLine(to: CGPoint(x: rect.minX, y: rect.maxY))
                path.addLine(to: CGPoint(x: rect.minX, y: rect.minY))
            }
            path.closeSubpath()
        }
    }

    @available(iOS 17.0, macOS 14.0, *)
    var layoutDirectionBehavior: LayoutDirectionBehavior { .fixed }
}

public extension View {
    /// Shows `text` in a bubble on hover or a long press. Pass
    /// `isAccessibilityHint: false` where the text repeats the view's label.
    func kozmosTooltip(_ text: String, side: KozmosTooltipSide = .top, isAccessibilityHint: Bool = true) -> some View {
        modifier(KozmosTooltip(text: text, side: side, isAccessibilityHint: isAccessibilityHint))
    }
}
