import SwiftUI

/// How much room an empty state takes.
///
/// `default` pads itself and fills its region, which is right when the empty
/// state IS the screen. `compact` is for a slot that already draws a box round
/// it — a result list's empty slot, a card, a panel section. Measured on the
/// web, the same content came to 258pt in a result list and about 128 compact
/// (GAP-009).
public enum KozmosEmptyStateSize: Sendable, Hashable, CaseIterable {
    case `default`
    case compact

    var padding: CGFloat { self == .compact ? 16 : 24 }
    var stackSpacing: CGFloat { self == .compact ? 8 : 16 }
}

public struct KozmosEmptyState<Icon: View, Action: View>: View {
    public let title: String
    public let description: String?
    public let icon: Icon?
    public let action: Action?
    public let size: KozmosEmptyStateSize

    public init(
        title: String,
        description: String? = nil,
        size: KozmosEmptyStateSize = .default,
        @ViewBuilder icon: () -> Icon,
        @ViewBuilder action: () -> Action
    ) {
        self.title = title
        self.description = description
        self.size = size
        self.icon = icon()
        self.action = action()
    }

    public var body: some View {
        VStack(spacing: size.stackSpacing) {
            if let icon = icon {
                icon
                    .foregroundColor(KozmosColors.primitivesColorsForeground300)
            }
            
            VStack(spacing: 4) {
                Text(title)
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(KozmosColors.primitivesColorsForeground100)
                    .multilineTextAlignment(.center)
                
                if let description = description {
                    Text(description)
                        .font(.system(size: 14))
                        .foregroundColor(KozmosColors.primitivesColorsForeground300)
                        .multilineTextAlignment(.center)
                }
            }
            
            if let action = action {
                action
            }
        }
        .padding(size.padding)
        .frame(maxWidth: .infinity)
    }
}

// Convenience init for no views
public extension KozmosEmptyState where Icon == EmptyView, Action == EmptyView {
    init(title: String, description: String? = nil, size: KozmosEmptyStateSize = .default) {
        self.title = title
        self.description = description
        self.size = size
        self.icon = nil
        self.action = nil
    }
}
