import SwiftUI

public enum KozmosDrawerSide: String, CaseIterable {
    case left
    case right
    case top
    case bottom

    fileprivate var alignment: Alignment {
        switch self {
        case .left: return .leading
        case .right: return .trailing
        case .top: return .top
        case .bottom: return .bottom
        }
    }

    fileprivate var transitionEdge: Edge {
        switch self {
        case .left: return .leading
        case .right: return .trailing
        case .top: return .top
        case .bottom: return .bottom
        }
    }

    fileprivate var horizontal: Bool {
        self == .left || self == .right
    }
}

/// Where a drawer is drawn (GAP-198), as React's `placement`.
public enum KozmosDrawerPlacement: String, CaseIterable {
    /// Over the whole screen from its edge, over a scrim that closes it: the
    /// drawer as it always was.
    case fixed
    /// In place, in the region its parent gives it, with no scrim: a panel
    /// beside the page, so a header above the region stays usable. A left or
    /// right one floats there (decisions 139 and 148).
    case inline
}

public struct KozmosDrawer<Content: View>: View {
    @Binding private var isPresented: Bool
    private let side: KozmosDrawerSide
    private let placement: KozmosDrawerPlacement
    private let label: String?
    private let title: String?
    private let description: String?
    private let bodyText: String?
    private let showsCloseButton: Bool
    private let content: () -> Content

    public init(
        isPresented: Binding<Bool>,
        side: KozmosDrawerSide = .right,
        placement: KozmosDrawerPlacement = .fixed,
        title: String,
        description: String? = nil,
        bodyText: String? = nil,
        showsCloseButton: Bool = true,
        @ViewBuilder content: @escaping () -> Content
    ) {
        self._isPresented = isPresented
        self.side = side
        self.placement = placement
        self.label = title
        self.title = title
        self.description = description
        self.bodyText = bodyText
        self.showsCloseButton = showsCloseButton
        self.content = content
    }

    public init(
        isPresented: Binding<Bool>,
        side: KozmosDrawerSide = .right,
        placement: KozmosDrawerPlacement = .fixed,
        label: String? = nil,
        showsCloseButton: Bool = true,
        @ViewBuilder content: @escaping () -> Content
    ) {
        self._isPresented = isPresented
        self.side = side
        self.placement = placement
        self.label = label
        self.title = nil
        self.description = nil
        self.bodyText = nil
        self.showsCloseButton = showsCloseButton
        self.content = content
    }

    public init(
        isPresented: Binding<Bool>,
        side: KozmosDrawerSide = .right,
        placement: KozmosDrawerPlacement = .fixed,
        title: String,
        description: String? = nil,
        bodyText: String? = nil,
        showsCloseButton: Bool = true
    ) where Content == EmptyView {
        self._isPresented = isPresented
        self.side = side
        self.placement = placement
        self.label = title
        self.title = title
        self.description = description
        self.bodyText = bodyText
        self.showsCloseButton = showsCloseButton
        self.content = { EmptyView() }
    }

    public var body: some View {
        if placement == .inline {
            inlineBody
        } else {
            fixedBody
        }
    }

    // MARK: - Inline (GAP-198)

    /// Inline, the drawer is a panel in its parent's region, not a modal: no
    /// scrim, so the page around it keeps its touches and its readers, and
    /// nothing outside closes it. A left or right one floats (decisions 139
    /// and 148): 16 from every edge of the region it reaches, 420 wide or the
    /// region less 16 each side, as tall as its content up to the region less
    /// 16 above and below, and then it scrolls; the container's corners and
    /// its border all the way round. A top or bottom one stays at its edge,
    /// across the region, and stops at the region's far edge.
    private var inlineBody: some View {
        ZStack(alignment: side.alignment) {
            if isPresented {
                inlineSurface
                    .transition(.move(edge: side.transitionEdge))
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: side.alignment)
        .animation(.easeInOut(duration: 0.22), value: isPresented)
    }

    /// The floating panel's width in a region this wide: 420, or the region
    /// less 16 on each side when that is narrower.
    static func inlineWidth(inRegionWidth width: CGFloat) -> CGFloat {
        max(0, min(Self.inlineMaximumWidth, width - Self.inlineEdge * 2))
    }

    static var inlineMaximumWidth: CGFloat { 420 }
    static var inlineEdge: CGFloat { KozmosDimensions.primitivesLayoutSpacing200 }

    private var inlineSurface: some View {
        let radius = side.horizontal
            ? KozmosDimensions.semanticsRadiusContainer
            : KozmosDimensions.semanticsRadiusControl
        // As tall as its content, and scrolling only past the region: the
        // first child that fits is drawn, so content that fits never scrolls.
        let surface = ViewThatFits(in: .vertical) {
            drawerStack
            ScrollView { drawerStack }
        }
        .background(KozmosColors.semanticsSurface0)
        .clipShape(RoundedRectangle(cornerRadius: radius))
        .overlay(
            RoundedRectangle(cornerRadius: radius)
                .stroke(KozmosColors.semanticsBorderSubtle, lineWidth: 1)
        )
        .kozmosElevation(KozmosShadows.semanticsElevationOverlay)
        // A panel beside the page, named by its title, holding what it draws.
        .accessibilityElement(children: .contain)
        .accessibilityLabel(label ?? "")
        // VoiceOver's escape, from inside the panel only: it is the panel's.
        .accessibilityAction(.escape) {
            withAnimation { isPresented = false }
        }
        return GeometryReader { region in
            Group {
                // Proposed the room it may take, the surface takes what its
                // content needs of it; the frame round it is empty map.
                if side.horizontal {
                    surface
                        .frame(width: Self.inlineWidth(inRegionWidth: region.size.width))
                        .frame(maxHeight: max(0, region.size.height - Self.inlineEdge * 2), alignment: .top)
                        .padding(Self.inlineEdge)
                } else {
                    surface
                        .frame(maxWidth: .infinity, maxHeight: min(360, region.size.height),
                               alignment: side == .top ? .top : .bottom)
                }
            }
            .frame(width: region.size.width, height: region.size.height, alignment: inlineAlignment)
        }
    }

    /// A floating side drawer hangs from the region's top; a top or bottom
    /// one keeps to its edge.
    private var inlineAlignment: Alignment {
        switch side {
        case .left: return .topLeading
        case .right: return .topTrailing
        case .top: return .top
        case .bottom: return .bottom
        }
    }

    private var drawerStack: some View {
        VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing300) {
            drawerHeader
            drawerContent
                .frame(maxWidth: .infinity, alignment: .topLeading)
        }
        .padding(KozmosDimensions.primitivesLayoutSpacing300)
    }

    // MARK: - Fixed

    private var fixedBody: some View {
        ZStack(alignment: side.alignment) {
            if isPresented {
                KozmosColors.semanticsOverlayScrim
                    .edgesIgnoringSafeArea(.all)
                    .onTapGesture {
                        withAnimation {
                            isPresented = false
                        }
                    }

                drawerSurface
                    .transition(.move(edge: side.transitionEdge))
            }
        }
        .animation(.easeInOut(duration: 0.22), value: isPresented)
    }

    private var drawerSurface: some View {
        VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing300) {
            drawerHeader
            drawerContent
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        }
        .padding(KozmosDimensions.primitivesLayoutSpacing300)
        .frame(
            maxWidth: side.horizontal ? 384 : .infinity,
            maxHeight: side.horizontal ? .infinity : 360,
            alignment: .topLeading
        )
        .background(KozmosColors.semanticsSurface0)
        .cornerRadius(KozmosDimensions.semanticsRadiusControl)
        .overlay(
            RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl)
                .stroke(KozmosColors.semanticsBorderSubtle, lineWidth: 1)
        )
        .kozmosElevation(KozmosShadows.semanticsElevationOverlay)
        .edgesIgnoringSafeArea(side.horizontal ? .vertical : .horizontal)
    }

    private var drawerHeader: some View {
        HStack(alignment: .top, spacing: KozmosDimensions.primitivesLayoutSpacing200) {
            VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing100) {
                if let title {
                    Text(title)
                        .font(KozmosTypography.title3)
                        .fontWeight(.semibold)
                        .foregroundColor(KozmosColors.primitivesColorsForeground100)
                }

                if let description {
                    Text(description)
                        .font(KozmosTypography.subheadline)
                        .foregroundColor(KozmosColors.primitivesColorsForeground400)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            if showsCloseButton {
                Button {
                    withAnimation {
                        isPresented = false
                    }
                } label: {
                    Image(systemName: "xmark")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(KozmosColors.primitivesColorsForeground400)
                        .frame(width: 44, height: 44)
                }
                .accessibilityLabel("Close drawer")
            }
        }
    }

    @ViewBuilder
    private var drawerContent: some View {
        VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing200) {
            if let bodyText {
                Text(bodyText)
                    .font(KozmosTypography.body)
                    .foregroundColor(KozmosColors.primitivesColorsForeground100)
            }
            content()
        }
    }
}
