import SwiftUI

public struct KozmosNavbar: View {
    let logoInset: Bool
    let logo: AnyView?
    let context: AnyView?
    let navigation: AnyView?
    let primaryAction: AnyView?
    let actions: AnyView?
    let utilities: AnyView?
    let account: AnyView?

    public init<L: View, T: View>(
        title: String,
        @ViewBuilder leading: () -> L,
        @ViewBuilder trailing: () -> T
    ) {
        self.logoInset = false
        self.logo = AnyView(Text(title).font(KozmosTypography.headline))
        self.context = AnyView(leading())
        self.navigation = nil
        self.primaryAction = nil
        self.actions = AnyView(trailing())
        self.utilities = nil
        self.account = nil
    }

    public init(title: String) {
        self.logoInset = false
        self.logo = AnyView(Text(title).font(KozmosTypography.headline))
        self.context = nil
        self.navigation = nil
        self.primaryAction = nil
        self.actions = nil
        self.utilities = nil
        self.account = nil
    }

    /// - Parameter logoInset: Sets `logo` in a column as wide as KozmosSidebar's
    ///   rail, from the bar's edge (GAP-208), over a rail at the screen's
    ///   leading edge: the logo centred over the rail's items, and what follows
    ///   past the rail. Right to left, the column mirrors.
    public init<
        Logo: View,
        Context: View,
        Navigation: View,
        PrimaryAction: View,
        Actions: View,
        Utilities: View,
        Account: View
    >(
        logoInset: Bool = false,
        @ViewBuilder logo: () -> Logo,
        @ViewBuilder context: () -> Context,
        @ViewBuilder navigation: () -> Navigation,
        @ViewBuilder primaryAction: () -> PrimaryAction,
        @ViewBuilder actions: () -> Actions,
        @ViewBuilder utilities: () -> Utilities,
        @ViewBuilder account: () -> Account
    ) {
        self.logoInset = logoInset
        self.logo = AnyView(logo())
        self.context = AnyView(context())
        self.navigation = AnyView(navigation())
        self.primaryAction = AnyView(primaryAction())
        self.actions = AnyView(actions())
        self.utilities = AnyView(utilities())
        self.account = AnyView(account())
    }

    public var body: some View {
        HStack(spacing: KozmosDimensions.primitivesLayoutSpacing200) {
            if let logo = logo {
                if logoInset {
                    logo
                        .frame(width: kozmosRailWidth)
                } else {
                    logo
                        .frame(alignment: .leading)
                }
            }
            if let context = context {
                context
                    .frame(alignment: .leading)
            }
            if let primaryAction = primaryAction {
                primaryAction
                    .frame(alignment: .leading)
            }
            if let navigation = navigation {
                navigation
                    .frame(maxWidth: .infinity, alignment: .center)
            } else {
                Spacer(minLength: KozmosDimensions.primitivesLayoutSpacing200)
            }
            HStack(spacing: KozmosDimensions.primitivesLayoutSpacing100) {
                if let actions = actions {
                    actions
                }
                if let utilities = utilities {
                    utilities
                }
                if let account = account {
                    account
                }
            }
            .frame(alignment: .trailing)
        }
        // A slot of EmptyView takes no room, so with nothing to fill it the
        // bar's content starts at its leading edge, not in its middle.
        .frame(maxWidth: .infinity, minHeight: 64, alignment: .leading)
        // The logo's column starts at the bar's edge.
        .padding(.leading, logoInset ? 0 : KozmosDimensions.primitivesLayoutSpacing200)
        .padding(.trailing, KozmosDimensions.primitivesLayoutSpacing200)
        .background(KozmosColors.primitivesColorsBackground0)
        .overlay(
            Rectangle()
                .frame(height: 1)
                .foregroundColor(KozmosColors.primitivesColorsBackground300),
            alignment: .bottom
        )
    }
}
