import SwiftUI

/// The rail's width, its edge included. KozmosNavbar's `logoInset` column reads
/// it too (GAP-208), so the two can't part.
let kozmosRailWidth: CGFloat = 96

public enum KozmosSidebarVariant {
    case expanded
    case rail
}

/// The room above `KozmosSidebar`'s first slot, as React's `inset` (GAP-199).
public enum KozmosSidebarInset: Sendable, Hashable, CaseIterable {
    /// The top padded as the bottom is: 24.
    case `default`
    /// No room above the first slot, so it starts at the sidebar's top edge:
    /// a rail's first item flush under a fixed header, as Pointr Cloud draws
    /// its side menu. The bottom keeps its 24.
    case flush
}

public struct KozmosSidebar<Content: View>: View {
    let variant: KozmosSidebarVariant
    let inset: KozmosSidebarInset
    let header: AnyView?
    let content: Content
    let tools: AnyView?
    let footer: AnyView?

    public init(
        variant: KozmosSidebarVariant = .expanded,
        inset: KozmosSidebarInset = .default,
        @ViewBuilder content: () -> Content
    ) {
        self.variant = variant
        self.inset = inset
        self.header = nil
        self.content = content()
        self.tools = nil
        self.footer = nil
    }

    public init<Header: View, Tools: View, Footer: View>(
        variant: KozmosSidebarVariant = .expanded,
        inset: KozmosSidebarInset = .default,
        @ViewBuilder header: () -> Header,
        @ViewBuilder navigation: () -> Content,
        @ViewBuilder tools: () -> Tools,
        @ViewBuilder footer: () -> Footer
    ) {
        self.variant = variant
        self.inset = inset
        self.header = AnyView(header())
        self.content = navigation()
        self.tools = AnyView(tools())
        self.footer = AnyView(footer())
    }

    public var body: some View {
        HStack(spacing: KozmosDimensions.primitivesLayoutSpacing0) {
            VStack(alignment: stackAlignment, spacing: KozmosDimensions.primitivesLayoutSpacing200) {
                if let header = header {
                    header
                        .frame(maxWidth: .infinity, alignment: contentAlignment)
                }

                ScrollView {
                    content
                        .frame(maxWidth: .infinity, alignment: contentAlignment)
                }
                .frame(maxHeight: .infinity)

                if let tools = tools {
                    tools
                        .frame(maxWidth: .infinity, alignment: contentAlignment)
                }

                if let footer = footer {
                    footer
                        .frame(maxWidth: .infinity, alignment: contentAlignment)
                }
            }
            .padding(.horizontal, horizontalPadding)
            // Flush, the first slot starts at the top edge (GAP-199). React
            // drops its navigation's own 16 there too, on a rail with no
            // header; this navigation has none, so the 24 is all there is.
            .padding(.top, inset == .flush ? 0 : KozmosDimensions.primitivesLayoutSpacing300)
            .padding(.bottom, KozmosDimensions.primitivesLayoutSpacing300)
            // The edge is inside the width, as a CSS border is, so what the
            // sidebar holds ends where the edge begins.
            .padding(.trailing, 1)
            .frame(width: width)
            .frame(maxHeight: .infinity)
            .background(KozmosColors.semanticsSurface0)
            // Its 1pt edge, in the border role, at the trailing side: the
            // right, and the left in a right-to-left layout.
            .overlay(
                Rectangle()
                    .frame(width: 1)
                    .foregroundColor(KozmosColors.semanticsBorderSubtle),
                alignment: .trailing
            )

            Spacer()
        }
    }

    /// The rail is 96pt, its edge included, and its KozmosNavigationItems
    /// fill it (decision 42), so it has no horizontal padding.
    private var width: CGFloat {
        variant == .rail ? kozmosRailWidth : 256
    }

    private var horizontalPadding: CGFloat {
        variant == .rail ? 0 : KozmosDimensions.primitivesLayoutSpacing200
    }

    private var stackAlignment: HorizontalAlignment {
        variant == .rail ? .center : .leading
    }

    private var contentAlignment: Alignment {
        variant == .rail ? .center : .leading
    }
}
