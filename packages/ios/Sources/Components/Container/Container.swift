import SwiftUI

/// What a container's side padding responds to, as React's `inset`.
public enum KozmosContainerInset: Sendable, Hashable, CaseIterable {
    /// Steps 16, 24 and 32 with the width the container is given (from 640
    /// and from 1024 points): right for a page.
    case window
    /// 16 whatever the width: right for anything inside a fixed-width region,
    /// such as a map shell's sheet or side panel.
    case panel

    /// The side padding for a container this wide.
    static func padding(_ inset: KozmosContainerInset, width: CGFloat) -> CGFloat {
        switch inset {
        case .panel:
            return KozmosDimensions.primitivesLayoutSpacing200
        case .window:
            if width >= 1024 { return KozmosDimensions.primitivesLayoutSpacing400 }
            if width >= 640 { return KozmosDimensions.primitivesLayoutSpacing300 }
            return KozmosDimensions.primitivesLayoutSpacing200
        }
    }

    /// The side padding for a container offered no width, around content this
    /// wide: the narrowest step that the width it makes picks. A step only
    /// ever widens the container, so this settles within the three.
    static func padding(_ inset: KozmosContainerInset, around content: CGFloat) -> CGFloat {
        var side = padding(inset, width: content)
        for _ in 0..<3 {
            let next = padding(inset, width: content + 2 * side)
            if next == side { break }
            side = next
        }
        return side
    }
}

/// A step of a container's block (top and bottom) inset, as React's
/// `block` (GAP-116): `none` 0, `sm` 16, `md` 24, `lg` 32, the layout
/// spacing steps 200, 300 and 400.
public enum KozmosContainerBlockInset: Sendable, Hashable, CaseIterable {
    case none
    case sm
    case md
    case lg

    /// The step's length.
    var length: CGFloat {
        switch self {
        case .none: return 0
        case .sm: return KozmosDimensions.primitivesLayoutSpacing200
        case .md: return KozmosDimensions.primitivesLayoutSpacing300
        case .lg: return KozmosDimensions.primitivesLayoutSpacing400
        }
    }
}

/// The clear space above (`start`) and below (`end`) a container's content,
/// as React's `block`: `.sm` is 16 on both, `.init(start: .lg, end: .md)`
/// PageHeader's 32 above and 24 below. It holds whatever the width: a
/// region's top and bottom space does not step as its sides do.
public struct KozmosContainerBlock: Sendable, Hashable {
    public var start: KozmosContainerBlockInset
    public var end: KozmosContainerBlockInset

    public init(start: KozmosContainerBlockInset = .none, end: KozmosContainerBlockInset = .none) {
        self.start = start
        self.end = end
    }

    /// No space above or below: a container as it always was.
    public static let none = KozmosContainerBlock()
    /// 16 above and below.
    public static let sm = KozmosContainerBlock(start: .sm, end: .sm)
    /// 24 above and below.
    public static let md = KozmosContainerBlock(start: .md, end: .md)
    /// 32 above and below.
    public static let lg = KozmosContainerBlock(start: .lg, end: .lg)
}

public struct KozmosContainer<Content: View>: View {
    let content: Content
    let inset: KozmosContainerInset?
    let block: KozmosContainerBlock

    /// Pads all four sides by the platform's default, as before `inset`.
    public init(@ViewBuilder content: () -> Content) {
        self.content = content()
        self.inset = nil
        self.block = .none
    }

    /// Pads the sides only, as React's Container does: `.panel` keeps 16,
    /// `.window` steps with the width the container is given. Content of
    /// several views stacks top to bottom with no space between, as a React
    /// Container's children do. `block` gives the content clear space above
    /// and below (GAP-116), none unless given.
    public init(
        inset: KozmosContainerInset,
        block: KozmosContainerBlock = .none,
        @ViewBuilder content: () -> Content
    ) {
        self.content = content()
        self.inset = inset
        self.block = block
    }

    public var body: some View {
        if let inset {
            KozmosContainerInsetLayout(inset: inset, block: block) {
                VStack(alignment: .leading, spacing: 0) { content }
                    .frame(maxWidth: .infinity, alignment: .topLeading)
            }
        } else {
            content
                .padding()
                .frame(maxWidth: .infinity, alignment: .topLeading)
        }
    }
}

/// Fills the width it is offered and gives its content that width less the
/// step's padding on each side. Offered no width, it is its content's width
/// and the step that width picks.
///
/// A layout, so the step comes from the width in the proposal, in the one
/// pass: a GeometryReader writing the width into state padded a first
/// measure for a width of 0 and took the step only once a frame had been
/// laid out.
private struct KozmosContainerInsetLayout: Layout {
    let inset: KozmosContainerInset
    var block: KozmosContainerBlock = .none

    /// The block inset above and below, together.
    private var blockLength: CGFloat { block.start.length + block.end.length }

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let height = proposal.height.map { max(0, $0 - blockLength) }
        if let width = proposal.width {
            let inner = ProposedViewSize(
                width: max(0, width - 2 * KozmosContainerInset.padding(inset, width: width)),
                height: height
            )
            return CGSize(
                width: width,
                height: (subviews.map { $0.sizeThatFits(inner).height }.max() ?? 0) + blockLength
            )
        }
        let sizes = subviews.map { $0.sizeThatFits(ProposedViewSize(width: nil, height: height)) }
        let content = sizes.map(\.width).max() ?? 0
        return CGSize(
            width: content + 2 * KozmosContainerInset.padding(inset, around: content),
            height: (sizes.map(\.height).max() ?? 0) + blockLength
        )
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let side = KozmosContainerInset.padding(inset, width: bounds.width)
        let inner = ProposedViewSize(
            width: max(0, bounds.width - 2 * side),
            height: max(0, bounds.height - blockLength)
        )
        for subview in subviews {
            subview.place(
                at: CGPoint(x: bounds.minX + side, y: bounds.minY + block.start.length),
                anchor: .topLeading,
                proposal: inner
            )
        }
    }
}
