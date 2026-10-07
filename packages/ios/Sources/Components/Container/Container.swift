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

public struct KozmosContainer<Content: View>: View {
    let content: Content
    let inset: KozmosContainerInset?

    /// Pads all four sides by the platform's default, as before `inset`.
    public init(@ViewBuilder content: () -> Content) {
        self.content = content()
        self.inset = nil
    }

    /// Pads the sides only, as React's Container does: `.panel` keeps 16,
    /// `.window` steps with the width the container is given. Content of
    /// several views stacks top to bottom with no space between, as a React
    /// Container's children do.
    public init(inset: KozmosContainerInset, @ViewBuilder content: () -> Content) {
        self.content = content()
        self.inset = inset
    }

    public var body: some View {
        if let inset {
            KozmosContainerInsetLayout(inset: inset) {
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

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        if let width = proposal.width {
            let inner = ProposedViewSize(
                width: max(0, width - 2 * KozmosContainerInset.padding(inset, width: width)),
                height: proposal.height
            )
            return CGSize(width: width, height: subviews.map { $0.sizeThatFits(inner).height }.max() ?? 0)
        }
        let sizes = subviews.map { $0.sizeThatFits(ProposedViewSize(width: nil, height: proposal.height)) }
        let content = sizes.map(\.width).max() ?? 0
        return CGSize(
            width: content + 2 * KozmosContainerInset.padding(inset, around: content),
            height: sizes.map(\.height).max() ?? 0
        )
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let side = KozmosContainerInset.padding(inset, width: bounds.width)
        let inner = ProposedViewSize(width: max(0, bounds.width - 2 * side), height: bounds.height)
        for subview in subviews {
            subview.place(at: CGPoint(x: bounds.minX + side, y: bounds.minY), anchor: .topLeading, proposal: inner)
        }
    }
}
