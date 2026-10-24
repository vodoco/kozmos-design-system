import SwiftUI

public struct KozmosPagination<Content: View>: View {
    let content: Content
    
    public init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }
    
    /// One row that wraps, as React's `flex-wrap` row does: Code Connect's
    /// Ellipsis composition is 385pt with 44pt links, wider than the 370pt
    /// column of a 402pt phone, and a row that cannot wrap squeezed
    /// "Previous" until its word broke.
    public var body: some View {
        KozmosPaginationRowLayout(spacing: KozmosDimensions.primitivesLayoutSpacing50) {
            content
        }
    }
}

/// React's PaginationContent, `flex flex-row flex-wrap justify-center
/// items-center gap-1`: each part keeps the size it asks for, a part that
/// would pass the end of the row starts the next one, and each row is
/// centred, its parts on its middle line, `spacing` apart both ways. A part
/// wider than the whole row is offered the row's width. Placement is
/// logical; SwiftUI mirrors it right to left.
struct KozmosPaginationRowLayout: Layout {
    var spacing: CGFloat

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let rows = arrange(width: proposal.width, subviews).1
        let height = rows.map(\.height).reduce(0, +) + spacing * CGFloat(max(rows.count - 1, 0))
        return CGSize(width: rows.map(\.width).max() ?? 0, height: height)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        // Arranged for the width offered, as the size was, so both passes
        // come out the same by construction: the bounds are the widest row's
        // width rounded to the screen's pixels, and arranged again for them
        // a part alone on that row could be measured narrower than it asks
        // to be, or the last part of a row pushed onto the next. With no
        // width offered the size was one row, and so is this. The bounds
        // give only the origin and the centre.
        let (sizes, rows) = arrange(width: proposal.width, subviews)
        var y = bounds.minY
        for row in rows {
            var x = bounds.minX + (bounds.width - row.width) / 2
            for index in row.indices {
                let size = sizes[index]
                subviews[index].place(at: CGPoint(x: x, y: y + (row.height - size.height) / 2),
                                      proposal: ProposedViewSize(size))
                x += size.width + spacing
            }
            y += row.height + spacing
        }
    }

    private struct Row {
        var indices: [Int] = []
        var width: CGFloat = 0
        var height: CGFloat = 0
    }

    /// Each part's size and the rows they make, for a width offered (none,
    /// or an infinite one, is one row).
    private func arrange(width: CGFloat?, _ subviews: Subviews) -> ([CGSize], [Row]) {
        let offered = width.flatMap { $0.isFinite ? $0 : nil }
        let sizes = measure(subviews, width: offered)
        return (sizes, rows(sizes, width: offered))
    }

    /// Each part's own size, or, for one wider than `width`, its size at `width`.
    private func measure(_ subviews: Subviews, width: CGFloat?) -> [CGSize] {
        subviews.map { subview in
            let ideal = subview.sizeThatFits(.unspecified)
            guard let width, ideal.width > width + 0.25 else { return ideal }
            return subview.sizeThatFits(ProposedViewSize(width: width, height: nil))
        }
    }

    private func rows(_ sizes: [CGSize], width: CGFloat?) -> [Row] {
        var rows: [Row] = []
        var current = Row()
        for (index, size) in sizes.enumerated() {
            let extended = current.indices.isEmpty ? size.width : current.width + spacing + size.width
            // A quarter point of slack: the row's own width, rounded to the
            // screen's pixels, comes back as its bounds.
            if let width, extended > width + 0.25, !current.indices.isEmpty {
                rows.append(current)
                current = Row(indices: [index], width: size.width, height: size.height)
            } else {
                current.indices.append(index)
                current.width = extended
                current.height = max(current.height, size.height)
            }
        }
        if !current.indices.isEmpty { rows.append(current) }
        return rows
    }
}

public struct KozmosPaginationLink: View {
    let isActive: Bool
    let text: String
    let action: () -> Void
    @Environment(\.kozmosAnalytics) var trackEvent
    
    public init(text: String, isActive: Bool = false, action: @escaping () -> Void) {
        self.text = text
        self.isActive = isActive
        self.action = action
    }
    
    public var body: some View {
        Button(action: {
            trackEvent(KozmosAnalyticsEvent(eventName: "page_changed", component: "Pagination"))
            action()
        }) {
            // 44pt square, as React's touch link (Button's icon size), and
            // all of it hittable: a plain button's frame adds nothing without
            // a content shape, and an inactive link took a tap only on its
            // digit.
            Text(text)
                .font(KozmosTypography.subheadline)
                .frame(minWidth: 44, minHeight: 44)
                // The active page's words, edge and tint are theme 600, as
                // React's (decision 59).
                .background(isActive ? KozmosColors.primitivesColorsTheme600.opacity(0.1) : Color.clear)
                .foregroundColor(isActive ? KozmosColors.primitivesColorsTheme600 : KozmosColors.primitivesColorsForeground100)
                .cornerRadius(KozmosDimensions.semanticsRadiusControl)
                .overlay(
                    RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl)
                        .stroke(isActive ? KozmosColors.primitivesColorsTheme600 : Color.clear, lineWidth: 1)
                )
                .contentShape(RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl))
        }
        .buttonStyle(PlainButtonStyle())
    }
}

public struct KozmosPaginationPrevious: View {
    let action: () -> Void
    
    public init(action: @escaping () -> Void) {
        self.action = action
    }
    
    public var body: some View {
        Button(action: action) {
            HStack(spacing: KozmosDimensions.primitivesLayoutSpacing50) {
                Image(systemName: "chevron.backward")
                    .font(KozmosTypography.caption)
                Text("Previous")
                    .font(KozmosTypography.subheadline)
            }
            .padding(.horizontal, KozmosDimensions.primitivesLayoutSpacing100)
            // As tall as the page links, 44pt, as React's are (decision 82).
            // The default style takes a tap across the whole label.
            .frame(minHeight: 44)
            .foregroundColor(KozmosColors.primitivesColorsForeground100)
        }
    }
}

public struct KozmosPaginationNext: View {
    let action: () -> Void
    
    public init(action: @escaping () -> Void) {
        self.action = action
    }
    
    public var body: some View {
        Button(action: action) {
            HStack(spacing: KozmosDimensions.primitivesLayoutSpacing50) {
                Text("Next")
                    .font(KozmosTypography.subheadline)
                Image(systemName: "chevron.forward")
                    .font(KozmosTypography.caption)
            }
            .padding(.horizontal, KozmosDimensions.primitivesLayoutSpacing100)
            .frame(minHeight: 44)
            .foregroundColor(KozmosColors.primitivesColorsForeground100)
        }
    }
}

public struct KozmosPaginationEllipsis: View {
    public init() {}
    
    public var body: some View {
        Image(systemName: "ellipsis")
            .foregroundColor(KozmosColors.primitivesColorsForeground500)
            .frame(width: 36, height: 36)
    }
}
