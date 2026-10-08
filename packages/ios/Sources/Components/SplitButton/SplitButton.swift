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
    
    /// The action half's shape: rounded at the leading end only.
    private var actionShape: UnevenRoundedRectangle {
        UnevenRoundedRectangle(topLeadingRadius: KozmosDimensions.semanticsRadiusControl, bottomLeadingRadius: KozmosDimensions.semanticsRadiusControl, bottomTrailingRadius: KozmosDimensions.semanticsRadiusNone, topTrailingRadius: KozmosDimensions.semanticsRadiusNone)
    }

    public var body: some View {
        HStack(spacing: KozmosDimensions.primitivesLayoutSpacing25) {
            Button(action: mainAction) {
                // Pressed and focused, the themed button's tokens. The menu
                // half is a `Menu`, whose press SwiftUI draws: a `Menu` does
                // not run a custom button style's pressed state, and keeping
                // the system's press there is a deliberate platform
                // difference (decision 64; Olcay, 2026-10-08).
                KozmosButtonInteractionReader { isPressed, isFocused in
                    Text(label)
                        .padding()
                        .background(KozmosFillStates.background(.themed, isPressed: isPressed, isFocused: isFocused))
                        .foregroundColor(KozmosFillStates.foreground(.themed, isPressed: isPressed, isFocused: isFocused))
                }
            }
            .buttonStyle(KozmosFillButtonStyle(hoverShape: actionShape))
            .clipShape(actionShape)
            
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
