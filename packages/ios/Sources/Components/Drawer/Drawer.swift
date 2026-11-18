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

/// A drawer's outline (GAP-252): the container's corner on the two corners
/// that face the page, and square ones at the screen's edge, as Compose's
/// `drawerShape` and React's `rounded-*-container` draw it. A left drawer is
/// at the leading edge, so its page-facing corners are its trailing ones, on
/// the left right to left. The corners are placed from the layout direction
/// it is given and the shape is never mirrored: SwiftUI mirrors a shape only
/// in an app that deploys to iOS 17 or later (as `KozmosEndRoundedRectangle`
/// found), and `UnevenRoundedRectangle` is iOS 17.
struct KozmosDrawerShape: InsettableShape {
    var side: KozmosDrawerSide
    var layoutDirection: LayoutDirection
    var radius: CGFloat
    /// An inline side drawer floats in its region, all four corners round.
    var floats = false
    var insetAmount: CGFloat = 0

    func inset(by amount: CGFloat) -> KozmosDrawerShape {
        var shape = self
        shape.insetAmount += amount
        return shape
    }

    /// Whether each corner, as drawn, is round.
    var roundCorners: (topLeft: Bool, topRight: Bool, bottomLeft: Bool, bottomRight: Bool) {
        if floats { return (true, true, true, true) }
        let leading = side == .left
        let rightToLeft = layoutDirection == .rightToLeft
        switch side {
        case .left, .right:
            // A leading drawer faces the page with its trailing side.
            let roundsRight = leading != rightToLeft
            return (!roundsRight, roundsRight, !roundsRight, roundsRight)
        case .top:
            return (false, false, true, true)
        case .bottom:
            return (true, true, false, false)
        }
    }

    func path(in outer: CGRect) -> Path {
        let rect = outer.insetBy(dx: insetAmount, dy: insetAmount)
        let r = max(0, min(radius - insetAmount, min(rect.width, rect.height) / 2))
        let round = roundCorners
        let tl = round.topLeft ? r : 0, tr = round.topRight ? r : 0
        let bl = round.bottomLeft ? r : 0, br = round.bottomRight ? r : 0
        var path = Path()
        path.move(to: CGPoint(x: rect.minX + tl, y: rect.minY))
        path.addLine(to: CGPoint(x: rect.maxX - tr, y: rect.minY))
        if tr > 0 {
            path.addArc(center: CGPoint(x: rect.maxX - tr, y: rect.minY + tr), radius: tr,
                        startAngle: .degrees(270), endAngle: .degrees(0), clockwise: false)
        }
        path.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY - br))
        if br > 0 {
            path.addArc(center: CGPoint(x: rect.maxX - br, y: rect.maxY - br), radius: br,
                        startAngle: .degrees(0), endAngle: .degrees(90), clockwise: false)
        }
        path.addLine(to: CGPoint(x: rect.minX + bl, y: rect.maxY))
        if bl > 0 {
            path.addArc(center: CGPoint(x: rect.minX + bl, y: rect.maxY - bl), radius: bl,
                        startAngle: .degrees(90), endAngle: .degrees(180), clockwise: false)
        }
        path.addLine(to: CGPoint(x: rect.minX, y: rect.minY + tl))
        if tl > 0 {
            path.addArc(center: CGPoint(x: rect.minX + tl, y: rect.minY + tl), radius: tl,
                        startAngle: .degrees(180), endAngle: .degrees(270), clockwise: false)
        }
        path.closeSubpath()
        return path
    }

    @available(iOS 17.0, macOS 14.0, *)
    var layoutDirectionBehavior: LayoutDirectionBehavior { .fixed }
}

public struct KozmosDrawer<Content: View>: View {
    @Binding private var isPresented: Bool
    @Environment(\.layoutDirection) private var layoutDirection
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
        // A container's corner, 20 (decision 156): on every side of a
        // floating side drawer; on the two that face the page of a top or
        // bottom one, which stays at its edge (GAP-252).
        let radius = KozmosDimensions.semanticsRadiusContainer
        let outline = KozmosDrawerShape(side: side, layoutDirection: layoutDirection, radius: radius,
                                        floats: side.horizontal)
        // As tall as its content, and scrolling only past the region: the
        // first child that fits is drawn, so content that fits never scrolls.
        let surface = ViewThatFits(in: .vertical) {
            drawerStack
            ScrollView { drawerStack }
        }
        .background(KozmosColors.semanticsSurface0)
        .clipShape(outline)
        .overlay(
            outline
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
        // A container's corner, 20, as React's rounded-*-container (decision
        // 156), on the two corners that face the page only (GAP-252).
        .clipShape(fixedOutline)
        .overlay(
            fixedOutline
                .stroke(KozmosColors.semanticsBorderSubtle, lineWidth: 1)
        )
        .kozmosElevation(KozmosShadows.semanticsElevationOverlay)
        .edgesIgnoringSafeArea(side.horizontal ? .vertical : .horizontal)
    }

    private var fixedOutline: KozmosDrawerShape {
        KozmosDrawerShape(side: side, layoutDirection: layoutDirection,
                          radius: KozmosDimensions.semanticsRadiusContainer)
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
