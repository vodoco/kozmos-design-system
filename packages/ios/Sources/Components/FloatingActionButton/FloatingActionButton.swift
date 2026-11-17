import SwiftUI

/// The prominent action over a screen. Disabled with SwiftUI's `.disabled`,
/// it is drawn from the disabled pair (decision 197): the pair's fill under
/// its foreground, not at half. It still takes no touch, and VoiceOver hears
/// it dimmed.
public struct KozmosFloatingActionButton: View {
    let action: () -> Void
    let iconName: String
    @Environment(\.isEnabled) private var isEnabled

    public init(iconName: String = "plus", action: @escaping () -> Void) {
        self.iconName = iconName
        self.action = action
    }
    
    public var body: some View {
        Button(action: action) {
            KozmosButtonInteractionReader { isPressed, isFocused in
                Image(systemName: iconName)
                    .font(KozmosTypography.title2)
                    .foregroundColor(isEnabled
                        ? KozmosFillStates.foreground(.themed, isPressed: isPressed, isFocused: isFocused)
                        : KozmosColors.semanticsDisabledForeground)
                    .frame(width: KozmosDimensions.primitivesLayoutSizing700, height: KozmosDimensions.primitivesLayoutSizing700)
                    // Decision 59: a prominent fill is the theme fill, and its mark the
                    // theme foreground; pressed and focused, the themed button's tokens.
                    .background(isEnabled
                        ? KozmosFillStates.background(.themed, isPressed: isPressed, isFocused: isFocused)
                        : KozmosColors.semanticsDisabledFill)
                    .clipShape(Circle())
                    .shadow(radius: 4, x: 0, y: 4)
            }
        }
        .buttonStyle(KozmosFillButtonStyle(hoverShape: Circle()))
    }
}
// Usage usually involves overlaying this on a ZStack
