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

    @State private var isPresented = false

    public init(text: String, side: KozmosTooltipSide = .top, isAccessibilityHint: Bool = true) {
        self.text = text
        self.side = side
        self.isAccessibilityHint = isAccessibilityHint
    }

    public func body(content: Content) -> some View {
        content
            .overlay(alignment: overlayAlignment) {
                if isPresented {
                    KozmosTooltipBubble(text: text, side: side)
                        .fixedSize()
                        .modifier(KozmosTooltipPosition(side: side))
                        .transition(.opacity.combined(with: .scale(scale: 0.96)))
                        .allowsHitTesting(false)
                }
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

private struct KozmosTooltipPosition: ViewModifier {
    let side: KozmosTooltipSide

    @ViewBuilder
    func body(content: Content) -> some View {
        let gap = KozmosDimensions.primitivesLayoutSpacing50

        switch side {
        case .top:
            content.alignmentGuide(.top) { dimensions in
                dimensions[.bottom] + gap
            }
        case .right:
            content.alignmentGuide(.trailing) { dimensions in
                dimensions[.leading] - gap
            }
        case .bottom:
            content.alignmentGuide(.bottom) { dimensions in
                dimensions[.top] - gap
            }
        case .left:
            content.alignmentGuide(.leading) { dimensions in
                dimensions[.trailing] + gap
            }
        }
    }
}

private struct KozmosTooltipBubble: View {
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

    var body: some View {
        KozmosTooltipTipShape(side: side)
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

private struct KozmosTooltipTipShape: Shape {
    let side: KozmosTooltipSide

    func path(in rect: CGRect) -> Path {
        Path { path in
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
    }
}

public extension View {
    /// Shows `text` in a bubble on hover or a long press. Pass
    /// `isAccessibilityHint: false` where the text repeats the view's label.
    func kozmosTooltip(_ text: String, side: KozmosTooltipSide = .top, isAccessibilityHint: Bool = true) -> some View {
        modifier(KozmosTooltip(text: text, side: side, isAccessibilityHint: isAccessibilityHint))
    }
}
