import SwiftUI

/// What a container's side padding responds to, as React's `inset`.
public enum KozmosContainerInset: Sendable, Equatable {
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
}

public struct KozmosContainer<Content: View>: View {
    let content: Content
    let inset: KozmosContainerInset?
    @State private var width: CGFloat = 0

    /// Pads all four sides by the platform's default, as before `inset`.
    public init(@ViewBuilder content: () -> Content) {
        self.content = content()
        self.inset = nil
    }

    /// Pads the sides only, as React's Container does: `.panel` keeps 16,
    /// `.window` steps with the width the container is given.
    public init(inset: KozmosContainerInset, @ViewBuilder content: () -> Content) {
        self.content = content()
        self.inset = inset
    }

    public var body: some View {
        if let inset {
            content
                .padding(.horizontal, KozmosContainerInset.padding(inset, width: width))
                .frame(maxWidth: .infinity, alignment: .topLeading)
                // The container's own width, outside its padding, so the
                // padding it picks never changes what it measures.
                .background(GeometryReader { proxy in
                    Color.clear
                        .onAppear { width = proxy.size.width }
                        .onChange(of: proxy.size.width) { width = $0 }
                })
        } else {
            content
                .padding()
                .frame(maxWidth: .infinity, alignment: .topLeading)
        }
    }
}
