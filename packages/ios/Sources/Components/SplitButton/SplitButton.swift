import SwiftUI

public struct KozmosSplitButton: View {
    let label: String
    let mainAction: () -> Void
    let menuItems: [(String, () -> Void)]
    
    public init(label: String, mainAction: @escaping () -> Void, menuItems: [(String, () -> Void)] = []) {
        self.label = label
        self.mainAction = mainAction
        self.menuItems = menuItems
    }
    
    public var body: some View {
        HStack(spacing: KozmosDimensions.primitivesLayoutSpacing25) {
            Button(action: mainAction) {
                Text(label)
                    .padding()
                    .background(KozmosColors.componentsPrimaryButtonsThemedButtonBackgroundIdle)
                    .foregroundColor(KozmosColors.componentsPrimaryButtonsThemedButtonForegroundContentIdle)
            }
            .clipShape(UnevenRoundedRectangle(topLeadingRadius: KozmosDimensions.semanticsRadiusControl, bottomLeadingRadius: KozmosDimensions.semanticsRadiusControl, bottomTrailingRadius: KozmosDimensions.semanticsRadiusNone, topTrailingRadius: KozmosDimensions.semanticsRadiusNone))
            
            Menu {
                ForEach(menuItems.indices, id: \.self) { index in
                    Button(action: menuItems[index].1) {
                        Text(menuItems[index].0)
                    }
                }
            } label: {
                Image(systemName: "chevron.down")
                    .padding()
                    .background(KozmosColors.componentsPrimaryButtonsThemedButtonBackgroundIdle)
                    .foregroundColor(KozmosColors.componentsPrimaryButtonsThemedButtonForegroundContentIdle)
            }
            .clipShape(UnevenRoundedRectangle(topLeadingRadius: KozmosDimensions.semanticsRadiusNone, bottomLeadingRadius: KozmosDimensions.semanticsRadiusNone, bottomTrailingRadius: KozmosDimensions.semanticsRadiusControl, topTrailingRadius: KozmosDimensions.semanticsRadiusControl))
        }
    }
}
