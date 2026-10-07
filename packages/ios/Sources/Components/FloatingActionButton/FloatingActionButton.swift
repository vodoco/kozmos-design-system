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
            KozmosButtonInteractionReader { isPressed, isFocused in
                Image(systemName: iconName)
                    .font(KozmosTypography.title2)
                    .foregroundColor(KozmosFillStates.foreground(.themed, isPressed: isPressed, isFocused: isFocused))
                    .frame(width: KozmosDimensions.primitivesLayoutSizing700, height: KozmosDimensions.primitivesLayoutSizing700)
                    // Decision 59: a prominent fill is the theme fill, and its mark the
                    // theme foreground; pressed and focused, the themed button's tokens.
                    .background(KozmosFillStates.background(.themed, isPressed: isPressed, isFocused: isFocused))
                    .clipShape(Circle())
                    .shadow(radius: 4, x: 0, y: 4)
            }
        }
        .buttonStyle(KozmosFillButtonStyle(hoverShape: Circle()))
    }
}
// Usage usually involves overlaying this on a ZStack
