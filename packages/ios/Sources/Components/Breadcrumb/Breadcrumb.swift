import SwiftUI

public struct KozmosBreadcrumb: View {
    let items: [String]
    let onSelect: (Int) -> Void
    
    public init(items: [String], onSelect: @escaping (Int) -> Void) {
        self.items = items
        self.onSelect = onSelect
    }
    
    public var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
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
                    
                    if index < items.count - 1 {
                        Image(systemName: "chevron.forward")
                            .font(KozmosTypography.caption)
                            .foregroundColor(KozmosColors.primitivesColorsForeground500)
                    }
                }
            }
        }
    }
}
