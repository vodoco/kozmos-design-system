import SwiftUI

public struct KozmosFloatingActionButton: View {
    let action: () -> Void
    let iconName: String
    
    public init(iconName: String = "plus", action: @escaping () -> Void) {
        self.iconName = iconName
        self.action = action
    }
    
    public var body: some View {
        Button(action: action) {
            Image(systemName: iconName)
                .font(KozmosTypography.title2)
                .foregroundColor(KozmosColors.componentsPrimaryButtonsThemedButtonForegroundContentIdle)
                .frame(width: KozmosDimensions.primitivesLayoutSizing700, height: KozmosDimensions.primitivesLayoutSizing700)
                // Decision 59: a prominent fill is the theme fill, and its mark the theme foreground.
                .background(KozmosColors.componentsPrimaryButtonsThemedButtonBackgroundIdle)
                .clipShape(Circle())
                .shadow(radius: 4, x: 0, y: 4)
        }
    }
}
// Usage usually involves overlaying this on a ZStack
