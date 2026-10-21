import SwiftUI

public struct KozmosBreadcrumb: View {
    let items: [String]
    let onSelect: (Int) -> Void
    
    public init(items: [String], onSelect: @escaping (Int) -> Void) {
        self.items = items
        self.onSelect = onSelect
    }
    
    public var body: some View {
        ScrollView(.horizontal, showsIndicators: false) { trail }
    }

    /// The crumbs and their separators, as the scroll view holds them: on
    /// their own for the tests, which cannot read inside a SwiftUI scroll view.
    var trail: some View {
        HStack(spacing: KozmosDimensions.primitivesLayoutSpacing50) {
            ForEach(0..<items.count, id: \.self) { index in
                Button(action: {
                    onSelect(index)
                }) {
                    Text(items[index])
                        .font(KozmosTypography.subheadline)
                        .foregroundColor(index == items.count - 1 ? KozmosColors.primitivesColorsForeground100 : KozmosColors.primitivesColorsForeground500)
                }
                .disabled(index == items.count - 1)
                // The page the visitor is on, as React's `aria-current="page"`:
                // selected is the platform's word for the current item of a
                // set, as the bottom navigation's current tab is.
                .accessibilityAddTraits(index == items.count - 1 ? .isSelected : [])
                
                if index < items.count - 1 {
                    // Decoration, as React's aria-hidden separator: VoiceOver
                    // read the symbol's own "Forward" between the crumbs.
                    Image(systemName: "chevron.forward")
                        .font(KozmosTypography.caption)
                        .foregroundColor(KozmosColors.primitivesColorsForeground500)
                        .accessibilityHidden(true)
                }
            }
        }
    }
}
