import SwiftUI

public enum KozmosPopoverSide: String, CaseIterable {
    case top
    case right
    case bottom
    case left

    var arrowEdge: Edge {
        switch self {
        case .top: return .top
        case .right: return .trailing
        case .bottom: return .bottom
        case .left: return .leading
        }
    }
}

public struct KozmosPopover<PopoverContent: View>: ViewModifier {
    @Binding var isPresented: Bool
    let side: KozmosPopoverSide
    let title: String?
    let description: String?
    let popoverContent: () -> PopoverContent
    
    public init(
        isPresented: Binding<Bool>,
        side: KozmosPopoverSide = .top,
        @ViewBuilder content: @escaping () -> PopoverContent
    ) {
        self._isPresented = isPresented
        self.side = side
        self.title = nil
        self.description = nil
        self.popoverContent = content
    }

    public init(
        isPresented: Binding<Bool>,
        side: KozmosPopoverSide = .top,
        title: String,
        description: String? = nil
    ) where PopoverContent == EmptyView {
        self._isPresented = isPresented
        self.side = side
        self.title = title
        self.description = description
        self.popoverContent = { EmptyView() }
    }
    
    public func body(content: Content) -> some View {
        content
            .popover(isPresented: $isPresented, arrowEdge: side.arrowEdge) {
                if #available(iOS 16.4, macOS 13.3, *) {
                    popoverBody
                        .presentationCompactAdaptation(.popover)
                } else {
                    popoverBody
                }
            }
    }

    @ViewBuilder
    private var popoverBody: some View {
        if let title {
            VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing100) {
                Text(title)
                    .font(KozmosTypography.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(KozmosColors.primitivesColorsForeground100)

                if let description {
                    Text(description)
                        .font(KozmosTypography.footnote)
                        .foregroundColor(KozmosColors.primitivesColorsForeground400)
                }
            }
            .padding(KozmosDimensions.primitivesLayoutSpacing200)
            .frame(width: 288, alignment: .leading)
            .background(KozmosColors.semanticsSurface0)
        } else {
            popoverContent()
        }
    }
}

public extension View {
    func kozmosPopover<Content: View>(
        isPresented: Binding<Bool>,
        side: KozmosPopoverSide = .top,
        @ViewBuilder content: @escaping () -> Content
    ) -> some View {
        self.modifier(KozmosPopover(isPresented: isPresented, side: side, content: content))
    }

    func kozmosPopover(
        isPresented: Binding<Bool>,
        side: KozmosPopoverSide = .top,
        title: String,
        description: String? = nil
    ) -> some View {
        self.modifier(
            KozmosPopover<EmptyView>(
                isPresented: isPresented,
                side: side,
                title: title,
                description: description
            )
        )
    }
}
