import SwiftUI

/// One column per subview, all the same width, `spacing` apart, in reading
/// order: RouteSummary's actions (GAP-110, GAP-111), as the web's
/// `.kozmos-route-summary-actions` grid draws them. The row is as tall as its
/// tallest subview, and each is offered the whole of its cell, as the web's
/// grid stretches its items: one that can grow fills it, as a KozmosButton
/// told to (`kozmosButtonFillsCell`) does, so it matches the others. One that
/// keeps a size of its own sits at the cell's top and inline start, where the
/// web and Compose put one; a layout cannot make it grow.
///
/// Any number of subviews, none included: an `if` that is false, or an
/// `EmptyView`, is no subview at all, so nothing here reads a subview by
/// index. Placement is logical; SwiftUI mirrors it in right-to-left.
struct KozmosEqualColumnsLayout: Layout {
    var spacing: CGFloat

    private func column(_ width: CGFloat, _ count: Int) -> CGFloat {
        max(0, (width - spacing * CGFloat(count - 1)) / CGFloat(count))
    }

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        guard !subviews.isEmpty else { return .zero }
        let count = subviews.count
        let width: CGFloat
        if let proposed = proposal.width, proposed.isFinite {
            width = proposed
        } else {
            // Ideal: every column as wide as the widest subview wants.
            let widest = subviews.map { $0.sizeThatFits(.unspecified).width }.max() ?? 0
            width = widest * CGFloat(count) + spacing * CGFloat(count - 1)
        }
        let each = ProposedViewSize(width: column(width, count), height: nil)
        let height = subviews.map { $0.sizeThatFits(each).height }.max() ?? 0
        return CGSize(width: width, height: height)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        guard !subviews.isEmpty else { return }
        let width = column(bounds.width, subviews.count)
        for (index, subview) in subviews.enumerated() {
            subview.place(at: CGPoint(x: bounds.minX + CGFloat(index) * (width + spacing), y: bounds.minY),
                          anchor: .topLeading, proposal: ProposedViewSize(width: width, height: bounds.height))
        }
    }
}
