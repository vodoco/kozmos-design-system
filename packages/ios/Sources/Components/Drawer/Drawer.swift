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

public struct KozmosDrawer<Content: View>: View {
    @Binding private var isPresented: Bool
    private let side: KozmosDrawerSide
    private let title: String?
    private let description: String?
    private let bodyText: String?
    private let showsCloseButton: Bool
    private let content: () -> Content

    public init(
        isPresented: Binding<Bool>,
        side: KozmosDrawerSide = .right,
        title: String,
        description: String? = nil,
        bodyText: String? = nil,
        showsCloseButton: Bool = true,
        @ViewBuilder content: @escaping () -> Content
    ) {
        self._isPresented = isPresented
        self.side = side
        self.title = title
        self.description = description
        self.bodyText = bodyText
        self.showsCloseButton = showsCloseButton
        self.content = content
    }

    public init(
        isPresented: Binding<Bool>,
        side: KozmosDrawerSide = .right,
        showsCloseButton: Bool = true,
        @ViewBuilder content: @escaping () -> Content
    ) {
        self._isPresented = isPresented
        self.side = side
        self.title = nil
        self.description = nil
        self.bodyText = nil
        self.showsCloseButton = showsCloseButton
        self.content = content
    }

    public init(
        isPresented: Binding<Bool>,
        side: KozmosDrawerSide = .right,
        title: String,
        description: String? = nil,
        bodyText: String? = nil,
        showsCloseButton: Bool = true
    ) where Content == EmptyView {
        self._isPresented = isPresented
        self.side = side
        self.title = title
        self.description = description
        self.bodyText = bodyText
        self.showsCloseButton = showsCloseButton
        self.content = { EmptyView() }
    }

    public var body: some View {
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
