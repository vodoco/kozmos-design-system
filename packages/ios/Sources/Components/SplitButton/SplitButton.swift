import SwiftUI

/// An entry in a split button's menu (GAP-168), as React's `menuItems`: an
/// action, with an icon or disabled if need be, or a line between groups.
public enum KozmosSplitButtonMenuItem {
    /// An action. `icon` is drawn before its words, which are its name;
    /// `disabled` greys it, and VoiceOver says it is dimmed.
    case action(String, icon: Image? = nil, disabled: Bool = false, action: () -> Void)
    /// A line between groups of actions.
    case separator
}

public struct KozmosSplitButton: View {
    let label: String
    let mainAction: () -> Void
    let items: [KozmosSplitButtonMenuItem]
    let menuContent: AnyView?
    let menuLabel: String
    
    /// `menuLabel` is what VoiceOver calls the menu half, which shows only a
    /// chevron: "More options" by default, as React's `menuLabel`; a product
    /// that translates passes its own.
    public init(label: String, mainAction: @escaping () -> Void, menuItems: [(String, () -> Void)] = [], menuLabel: String = "More options") {
        self.label = label
        self.mainAction = mainAction
        self.items = menuItems.map { .action($0.0, action: $0.1) }
        self.menuContent = nil
        self.menuLabel = menuLabel
    }

    /// A split button whose menu takes full items (GAP-168): actions with
    /// an icon or disabled, and separators.
    public init(label: String, mainAction: @escaping () -> Void, items: [KozmosSplitButtonMenuItem], menuLabel: String = "More options") {
        self.label = label
        self.mainAction = mainAction
        self.items = items
        self.menuContent = nil
        self.menuLabel = menuLabel
    }

    /// A split button whose menu also draws custom content after `items`
    /// (GAP-168): what SwiftUI's `Menu` takes, such as `Button`, `Toggle`,
    /// `Picker`, `Section` and `Divider`.
    public init<MenuContent: View>(
        label: String,
        mainAction: @escaping () -> Void,
        items: [KozmosSplitButtonMenuItem] = [],
        menuLabel: String = "More options",
        @ViewBuilder menuContent: () -> MenuContent
    ) {
        self.label = label
        self.mainAction = mainAction
        self.items = items
        self.menuContent = AnyView(menuContent())
        self.menuLabel = menuLabel
    }

    /// The menu's rows, as the menu half draws them inside SwiftUI's `Menu`.
    var menuRows: KozmosSplitButtonMenuRows {
        KozmosSplitButtonMenuRows(items: items, content: menuContent)
    }
    
    @Environment(\.layoutDirection) private var layoutDirection
    /// False under a `.disabled` set round it: both halves are drawn from
    /// the disabled pair (decision 197), the pair's fill under its
    /// foreground, not at half. The seam between them is unchanged.
    @Environment(\.isEnabled) private var isEnabled

    /// A half's fill: the theme fill, or the disabled pair's.
    private func fill(isPressed: Bool, isFocused: Bool) -> Color {
        isEnabled ? KozmosFillStates.background(.themed, isPressed: isPressed, isFocused: isFocused) : KozmosColors.semanticsDisabledFill
    }

    /// What sits on a half's fill.
    private func ink(isPressed: Bool, isFocused: Bool) -> Color {
        isEnabled ? KozmosFillStates.foreground(.themed, isPressed: isPressed, isFocused: isFocused) : KozmosColors.semanticsDisabledForeground
    }

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
                        .background(fill(isPressed: isPressed, isFocused: isFocused))
                        .foregroundColor(ink(isPressed: isPressed, isFocused: isFocused))
                }
            }
            .buttonStyle(KozmosFillButtonStyle(hoverShape: actionShape))
            .clipShape(actionShape)
            
            Menu {
                menuRows
            } label: {
                Image(systemName: "chevron.down")
                    .padding()
                    .background(fill(isPressed: false, isFocused: false))
                    .foregroundColor(ink(isPressed: false, isFocused: false))
            }
            .clipShape(menuShape)
            // The chevron's own name was all VoiceOver had for it.
            .accessibilityLabel(Text(verbatim: menuLabel))
        }
    }
}

/// A split button's menu rows (GAP-168): each action a `Button`, with its
/// icon as a `Label`'s, disabled where it says, each separator a `Divider`,
/// then the custom content. The system draws them inside `Menu`.
struct KozmosSplitButtonMenuRows: View {
    let items: [KozmosSplitButtonMenuItem]
    let content: AnyView?

    var body: some View {
        ForEach(items.indices, id: \.self) { index in
            switch items[index] {
            case let .action(words, icon, disabled, action):
                Button(action: action) {
                    if let icon {
                        Label { Text(words) } icon: { icon.accessibilityHidden(true) }
                    } else {
                        Text(words)
                    }
                }
                .disabled(disabled)
            case .separator:
                Divider()
            }
        }
        if let content {
            content
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
