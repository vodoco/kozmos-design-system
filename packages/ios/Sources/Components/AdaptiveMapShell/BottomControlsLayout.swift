import SwiftUI

/// Two logical corners in one measured region. Keep both subviews in the
/// same tree when wrapping so focus and local state survive a resize.
struct KozmosBottomControlsLayout: Layout {
    var gap: CGFloat = KozmosDimensions.primitivesLayoutSpacing200

    static func frames(width: CGFloat, start: CGSize, end: CGSize, gap: CGFloat, rtl: Bool) -> [CGRect] {
        let width = max(0, width)
        let both = start.width > 0 && end.width > 0
        let wraps = both && start.width + gap + end.width > width
        let height = wraps ? start.height + gap + end.height : max(start.height, end.height)
        let a = CGRect(x: rtl ? width - start.width : 0,
                       y: wraps ? 0 : height - start.height,
                       width: start.width, height: start.height)
        let b = CGRect(x: rtl ? 0 : width - end.width,
                       y: height - end.height, width: end.width, height: end.height)
        return [a, b]
    }

    private func frames(_ proposal: ProposedViewSize, _ subviews: Subviews) -> [CGRect] {
        let width = max(0, proposal.width ?? 0)
        let sizes = subviews.map { $0.sizeThatFits(ProposedViewSize(width: width, height: nil)) }
        // SwiftUI mirrors Layout placement coordinates in RTL. Keep the
        // algorithm logical here; mirroring twice would restore LTR.
        return Self.frames(width: width, start: sizes[0], end: sizes[1], gap: gap, rtl: false)
    }

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        CGSize(width: max(0, proposal.width ?? 0), height: frames(proposal, subviews).map(\.maxY).max() ?? 0)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        for (view, frame) in zip(subviews, frames(ProposedViewSize(width: bounds.width, height: nil), subviews)) {
            view.place(at: CGPoint(x: bounds.minX + frame.minX, y: bounds.minY + frame.minY),
                       anchor: .topLeading, proposal: ProposedViewSize(frame.size))
        }
    }
}

struct KozmosBottomControlsHeightKey: PreferenceKey {
    static var defaultValue: CGFloat = 0
    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) { value = max(value, nextValue()) }
}

struct KozmosAttributionHeightKey: PreferenceKey {
    static var defaultValue: CGFloat = 0
    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) { value = max(value, nextValue()) }
}

struct KozmosBottomCornerWidthsKey: PreferenceKey {
    static var defaultValue: [Int: CGFloat] = [:]
    static func reduce(value: inout [Int: CGFloat], nextValue: () -> [Int: CGFloat]) {
        value.merge(nextValue(), uniquingKeysWith: { _, new in new })
    }
}
