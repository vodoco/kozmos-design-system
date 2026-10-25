import SwiftUI

public struct KozmosSplitButton: View {
    let label: String
    let mainAction: () -> Void
    let menuItems: [(String, () -> Void)]
    let menuLabel: String
    
    /// `menuLabel` is what VoiceOver calls the menu half, which shows only a
    /// chevron: "More options" by default, as React's `menuLabel`; a product
    /// that translates passes its own.
    public init(label: String, mainAction: @escaping () -> Void, menuItems: [(String, () -> Void)] = [], menuLabel: String = "More options") {
        self.label = label
        self.mainAction = mainAction
        self.menuItems = menuItems
        self.menuLabel = menuLabel
    }
    
    @Environment(\.layoutDirection) private var layoutDirection

    /// The action half's shape: rounded at the leading end only, as React's
    /// half is `rounded-e-none`: the right end, right to left.
    private var actionShape: KozmosEndRoundedRectangle {
        KozmosEndRoundedRectangle(radius: KozmosDimensions.semanticsRadiusControl, roundsLeft: layoutDirection == .leftToRight)
    }

    /// The menu half's: rounded at the trailing end only.
    private var menuShape: KozmosEndRoundedRectangle {
        KozmosEndRoundedRectangle(radius: KozmosDimensions.semanticsRadiusControl, roundsLeft: layoutDirection == .rightToLeft)
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
            .clipShape(menuShape)
            // The chevron's own name was all VoiceOver had for it.
            .accessibilityLabel(Text(verbatim: menuLabel))
        }
    }
}

/// A rectangle rounded at one end, the left or the right as drawn: the split
/// button says which from its layout direction. `UnevenRoundedRectangle`
/// names its corners leading and trailing, but draws them left and right
/// unless SwiftUI mirrors it, and SwiftUI mirrors a shape right to left only
/// in an app that deploys to iOS 17 or later: in one that deploys to iOS 16,
/// a split button right to left was rounded where its halves meet and square
/// at its ends. So this places its corners itself, and is never mirrored.
struct KozmosEndRoundedRectangle: Shape {
    var radius: CGFloat
    var roundsLeft: Bool

    func path(in rect: CGRect) -> Path {
        let left = roundsLeft ? radius : 0, right = roundsLeft ? 0 : radius
        // Drawn as it is, its leading corners are its left ones.
        return UnevenRoundedRectangle(topLeadingRadius: left, bottomLeadingRadius: left,
                                      bottomTrailingRadius: right, topTrailingRadius: right).path(in: rect)
    }

    @available(iOS 17.0, macOS 14.0, *)
    var layoutDirectionBehavior: LayoutDirectionBehavior { .fixed }
}
