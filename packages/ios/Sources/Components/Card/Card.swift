import SwiftUI

/// How much room a card gives its content.
///
/// `default` is 24 on every side, the card as the system has always drawn it.
/// `compact` is 16, for a card that is one setting in a column of settings
/// rather than a thing on its own (GAP-034).
///
/// It is set on `KozmosCard` and reaches the parts through the environment,
/// because a card padded one amount at the header and another at the content
/// is the bug, not the fix.
public enum KozmosCardPadding: Sendable, Hashable, CaseIterable {
    case `default`
    case compact

    var length: CGFloat {
        switch self {
        case .default: return KozmosDimensions.primitivesLayoutSpacing300
        case .compact: return KozmosDimensions.primitivesLayoutSpacing200
        }
    }
}

private struct KozmosCardPaddingKey: EnvironmentKey {
    static let defaultValue: KozmosCardPadding = .default
}

extension EnvironmentValues {
    var kozmosCardPadding: KozmosCardPadding {
        get { self[KozmosCardPaddingKey.self] }
        set { self[KozmosCardPaddingKey.self] = newValue }
    }
}

public struct KozmosCard<Content: View>: View {
    let content: Content
    let padding: KozmosCardPadding

    public init(padding: KozmosCardPadding = .default, @ViewBuilder content: () -> Content) {
        self.padding = padding
        self.content = content()
    }
    
    public var body: some View {
        KozmosCardColumn(lead: padding.length) {
            content
        }
        .background(KozmosColors.primitivesColorsBackground0)
        .cornerRadius(KozmosDimensions.semanticsRadiusContainer)
        .kozmosElevation(KozmosShadows.semanticsElevationRaised)
        .overlay(
            RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusContainer)
                .stroke(KozmosColors.primitivesColorsBackground200, lineWidth: 1)
        )
        .environment(\.kozmosCardPadding, padding)
    }
}

/// Whether a subview of the card pays the card's padding above it when it is
/// the card's first subview: `KozmosCardContent` and `KozmosCardFooter` do.
/// The header pays its own, and anything else is the caller's to space.
private struct KozmosCardLeadKey: LayoutValueKey {
    static let defaultValue = false
}

/// The card's column: a `VStack`, leading and with no spacing, as the card
/// always was, that also pays the card's padding above its first subview
/// when that subview is content or a footer (GAP-194).
///
/// Content and a footer pad their sides and bottom only, because a header
/// above them has already paid the top. With no header, the one that came
/// first touched the card's top edge. A part cannot see where it sits in a
/// stack, but the stack can: its subviews are the card's own children, in
/// order, each with the layout values it carries. So the card reads its
/// first subview, and if that is content or a footer, lays the column out
/// that far down. It is React's rule, where the card sets the top on its own
/// first child (`[&>:first-child]`): a header-led card is drawn as before; a
/// part inside a wrapper (a `VStack` around the parts, as Card's Code Connect
/// examples have) is not the card's subview and is left alone; a view placed
/// before the part keeps it from being first; and a nested card reads only
/// its own subviews.
///
/// The top is the card's, above the part. Below it the subviews are sized
/// and placed as `VStack(alignment: .leading, spacing: 0)` sizes and places
/// them, because that is what the card was: `VStackLayout` cannot be asked to
/// do it for another layout (its `Layout` methods are not public), so this
/// shares out a height as a stack does. `KozmosCardColumnTests` holds it to a
/// `VStack` drawing the same subviews, flexible ones and spacers among them.
struct KozmosCardColumn: Layout {
    let lead: CGFloat

    static var layoutProperties: LayoutProperties {
        var properties = LayoutProperties()
        // A spacer in the card stretches down, as in the VStack it was.
        properties.stackOrientation = .vertical
        return properties
    }

    /// The top the card pays above its subviews.
    func top(_ subviews: Subviews) -> CGFloat {
        subviews.first?[KozmosCardLeadKey.self] == true ? lead : 0
    }

    /// What each subview is offered, and the size it takes, in the room
    /// below the top: as a `VStack` with no spacing shares out a height.
    /// Offered no height, or an unbounded one, each subview is offered the
    /// same. Offered a height, the subviews of a higher layout priority go
    /// first, keeping back the least the others can take; within one
    /// priority the least flexible go first, each offered an even share of
    /// what is left.
    private func shares(_ subviews: [LayoutSubview], width: CGFloat?, height: CGFloat?) -> [(offer: ProposedViewSize, size: CGSize)] {
        guard let height, height.isFinite else {
            let offer = ProposedViewSize(width: width, height: height)
            return subviews.map { (offer, $0.sizeThatFits(offer)) }
        }
        let least = subviews.map { $0.sizeThatFits(ProposedViewSize(width: width, height: 0)).height }
        let most = subviews.map { $0.sizeThatFits(ProposedViewSize(width: width, height: .infinity)).height }
        var shares = [(offer: ProposedViewSize, size: CGSize)](repeating: (.zero, .zero), count: subviews.count)
        var left = height
        for priority in Set(subviews.map(\.priority)).sorted(by: >) {
            let group = subviews.indices
                .filter { subviews[$0].priority == priority }
                .sorted { (most[$0] - least[$0], $0) < (most[$1] - least[$1], $1) }
            let keptBack = subviews.indices
                .filter { subviews[$0].priority < priority }
                .reduce(CGFloat(0)) { $0 + least[$1] }
            var room = max(0, left - keptBack)
            for (taken, index) in group.enumerated() {
                let offer = ProposedViewSize(width: width, height: max(0, room / CGFloat(group.count - taken)))
                let size = subviews[index].sizeThatFits(offer)
                shares[index] = (offer, size)
                room -= size.height
                left -= size.height
            }
        }
        return shares
    }

    /// Where each subview's leading edge goes, so that their leading
    /// alignment guides line up, as a leading `VStack` lines them up; and
    /// the width that takes.
    private func leadingEdges(_ subviews: [LayoutSubview], _ shares: [(offer: ProposedViewSize, size: CGSize)]) -> (edges: [CGFloat], width: CGFloat) {
        let guides = zip(subviews, shares).map { subview, share in
            subview.dimensions(in: share.offer)[HorizontalAlignment.leading]
        }
        let line = guides.max() ?? 0
        let edges = guides.map { line - $0 }
        let width = zip(edges, shares).map { $0 + $1.size.width }.max() ?? 0
        return (edges, width)
    }

    func spacing(subviews: Subviews, cache: inout ()) -> ViewSpacing {
        // A vertical stack's: its first subview's above, its last's below,
        // and every subview's at the sides.
        var spacing = ViewSpacing()
        guard let first = subviews.first, let last = subviews.last else { return spacing }
        spacing.formUnion(first.spacing, edges: .top)
        spacing.formUnion(last.spacing, edges: .bottom)
        for subview in subviews { spacing.formUnion(subview.spacing, edges: .horizontal) }
        return spacing
    }

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let top = top(subviews)
        let views = Array(subviews)
        let shares = shares(views, width: proposal.width, height: proposal.height.map { max(0, $0 - top) })
        let width = leadingEdges(views, shares).width
        return CGSize(width: width, height: top + shares.reduce(0) { $0 + $1.size.height })
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let top = top(subviews)
        let views = Array(subviews)
        let shares = shares(views, width: proposal.width, height: proposal.height.map { max(0, $0 - top) })
        let edges = leadingEdges(views, shares).edges
        var y = bounds.minY + top
        for (index, subview) in views.enumerated() {
            subview.place(at: CGPoint(x: bounds.minX + edges[index], y: y), anchor: .topLeading, proposal: shares[index].offer)
            y += shares[index].size.height
        }
    }

    /// A text baseline is the first or last subview's, where it is placed,
    /// as a `VStack` gives it: a card lines up with text beside it as before.
    func explicitAlignment(of guide: VerticalAlignment, in bounds: CGRect, proposal: ProposedViewSize,
                           subviews: Subviews, cache: inout ()) -> CGFloat? {
        guard guide == .firstTextBaseline || guide == .lastTextBaseline, !subviews.isEmpty else { return nil }
        let top = top(subviews)
        let views = Array(subviews)
        let shares = shares(views, width: proposal.width, height: proposal.height.map { max(0, $0 - top) })
        let index = guide == .firstTextBaseline ? 0 : views.count - 1
        let above = shares[..<index].reduce(top) { $0 + $1.size.height }
        return bounds.minY + above + views[index].dimensions(in: shares[index].offer)[guide]
    }
}

public struct KozmosCardHeader<Content: View>: View {
    @Environment(\.kozmosCardPadding) private var padding
    let content: Content

    public init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing100) {
            content
        }
        .padding(padding.length)
    }
}

public struct KozmosCardTitle: View {
    let title: String
    
    public init(_ title: String) {
        self.title = title
    }
    
    public var body: some View {
        Text(title)
            .font(KozmosTypography.title3)
            .fontWeight(.semibold)
            .foregroundColor(KozmosColors.primitivesColorsForeground100)
    }
}

public struct KozmosCardDescription: View {
    let description: String
    
    public init(_ description: String) {
        self.description = description
    }
    
    public var body: some View {
        Text(description)
            .font(KozmosTypography.subheadline)
            .foregroundColor(KozmosColors.primitivesColorsForeground400)
    }
}

public struct KozmosCardContent<Content: View>: View {
    @Environment(\.kozmosCardPadding) private var padding
    let content: Content

    public init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing0) {
            content
        }
        // Sides and bottom only: a header above has already paid the top.
        // As the card's first subview, the card pays it (KozmosCardColumn).
        .padding(.horizontal, padding.length)
        .padding(.bottom, padding.length)
        .layoutValue(key: KozmosCardLeadKey.self, value: true)
    }
}

public struct KozmosCardFooter<Content: View>: View {
    @Environment(\.kozmosCardPadding) private var padding
    let content: Content

    public init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    public var body: some View {
        HStack(alignment: .center, spacing: KozmosDimensions.primitivesLayoutSpacing0) {
            content
        }
        // As KozmosCardContent: sides and bottom, and the top is the card's
        // to pay when the footer is its first subview.
        .padding(.horizontal, padding.length)
        .padding(.bottom, padding.length)
        .layoutValue(key: KozmosCardLeadKey.self, value: true)
    }
}
