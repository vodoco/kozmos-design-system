import SwiftUI

public enum KozmosTooltipSide: Sendable {
    case top
    case right
    case bottom
    case left
}

public struct KozmosTooltip: ViewModifier {
    let text: String
    let side: KozmosTooltipSide
    /// Whether assistive technology hears the text as the view's hint, as it
    /// does by default. Pass `false` where the text repeats the view's own
    /// label, or VoiceOver reads it twice; the bubble still shows.
    let isAccessibilityHint: Bool

    @State private var isPresented: Bool

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
                .modifier(KozmosTooltipPosition(side: side))
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
        switch side {
        case .top: return .top
        case .right: return .trailing
        case .bottom: return .bottom
        case .left: return .leading
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

/// Puts the bubble beside the view, 4 from it, on its side. Every guide is
/// set, each for its own side, as the location pin's label sets them: a
/// guide set inside a `switch` is lost, as one set inside the conditional
/// bubble is.
private struct KozmosTooltipPosition: ViewModifier {
    let side: KozmosTooltipSide

    func body(content: Content) -> some View {
        let gap = KozmosDimensions.primitivesLayoutSpacing50
        return content
            .alignmentGuide(.top) { side == .top ? $0[.bottom] + gap : $0[.top] }
            .alignmentGuide(.bottom) { side == .bottom ? $0[.top] - gap : $0[.bottom] }
            .alignmentGuide(.leading) { side == .left ? $0[.trailing] + gap : $0[.leading] }
            .alignmentGuide(.trailing) { side == .right ? $0[.leading] - gap : $0[.trailing] }
    }
}

/// The bubble the tooltip shows, with its tip toward the view it explains.
/// Internal so a test can draw it without pressing anything.
struct KozmosTooltipBubble: View {
    let text: String
    let side: KozmosTooltipSide

    var body: some View {
        switch side {
        case .top:
            VStack(spacing: 0) {
                content
                KozmosTooltipTip(side: side)
            }
        case .bottom:
            VStack(spacing: 0) {
                KozmosTooltipTip(side: side)
                content
            }
        case .right:
            HStack(spacing: 0) {
                KozmosTooltipTip(side: side)
                content
            }
        case .left:
            HStack(spacing: 0) {
                content
                KozmosTooltipTip(side: side)
            }
        }
    }

    private var content: some View {
        Text(text)
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
    let side: KozmosTooltipSide
    @Environment(\.layoutDirection) private var layoutDirection

    var body: some View {
        KozmosTooltipTipShape(side: side, rightToLeft: layoutDirection == .rightToLeft)
            .fill(KozmosColors.primitivesColorsBackground0)
            .frame(width: tipWidth, height: tipHeight)
    }

    private var tipWidth: CGFloat {
        side == .left || side == .right ? 4 : 8
    }

    private var tipHeight: CGFloat {
        side == .left || side == .right ? 8 : 4
    }
}

/// The tip, pointing at the view the bubble explains. A side tip sits at the
/// bubble's leading end (`.right`) or trailing end (`.left`), which a
/// right-to-left layout puts on the other side, so the tip mirrors itself
/// there, and SwiftUI must not mirror it again: unset, a shape mirrors itself
/// right to left in an app that deploys to iOS 17 or later and not in one
/// that deploys to iOS 16, where a side tip pointed into its own bubble.
struct KozmosTooltipTipShape: Shape {
    let side: KozmosTooltipSide
    var rightToLeft = false

    func path(in rect: CGRect) -> Path {
        let path = Path { path in
            switch side {
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
        return rightToLeft ? path.applying(CGAffineTransform(a: -1, b: 0, c: 0, d: 1, tx: rect.minX + rect.maxX, ty: 0)) : path
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
