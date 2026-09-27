import SwiftUI

/// How much room a card gives its content.
///
/// `default` is 24 on every side, the card as the system has always drawn it.
/// `compact` is 16, for a card that is one setting in a column of settings
/// rather than a thing on its own (GAP-034).
///
/// It is set on `KozmosCard` and reaches the parts through the environment,
/// because a card padded one amount at the header and another at the content
/// is the bug, not the fix.
public enum KozmosCardPadding: Sendable, Hashable, CaseIterable {
    case `default`
    case compact

    var length: CGFloat {
        switch self {
        case .default: return KozmosDimensions.primitivesLayoutSpacing300
        case .compact: return KozmosDimensions.primitivesLayoutSpacing200
        }
    }
}

private struct KozmosCardPaddingKey: EnvironmentKey {
    static let defaultValue: KozmosCardPadding = .default
}

extension EnvironmentValues {
    var kozmosCardPadding: KozmosCardPadding {
        get { self[KozmosCardPaddingKey.self] }
        set { self[KozmosCardPaddingKey.self] = newValue }
    }
}

public struct KozmosCard<Content: View>: View {
    let content: Content
    let padding: KozmosCardPadding

    public init(padding: KozmosCardPadding = .default, @ViewBuilder content: () -> Content) {
        self.padding = padding
        self.content = content()
    }
    
    public var body: some View {
        VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing0) {
            content
        }
        .background(KozmosColors.primitivesColorsBackground0)
        .cornerRadius(KozmosDimensions.semanticsRadiusContainer)
        .kozmosElevation(KozmosShadows.semanticsElevationRaised)
        .overlay(
            RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusContainer)
                .stroke(KozmosColors.primitivesColorsBackground200, lineWidth: 1)
        )
        .environment(\.kozmosCardPadding, padding)
    }
}

public struct KozmosCardHeader<Content: View>: View {
    @Environment(\.kozmosCardPadding) private var padding
    let content: Content

    public init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing100) {
            content
        }
        .padding(padding.length)
    }
}

public struct KozmosCardTitle: View {
    let title: String
    
    public init(_ title: String) {
        self.title = title
    }
    
    public var body: some View {
        Text(title)
            .font(KozmosTypography.title3)
            .fontWeight(.semibold)
            .foregroundColor(KozmosColors.primitivesColorsForeground100)
    }
}

public struct KozmosCardDescription: View {
    let description: String
    
    public init(_ description: String) {
        self.description = description
    }
    
    public var body: some View {
        Text(description)
            .font(KozmosTypography.subheadline)
            .foregroundColor(KozmosColors.primitivesColorsForeground400)
    }
}

public struct KozmosCardContent<Content: View>: View {
    @Environment(\.kozmosCardPadding) private var padding
    let content: Content

    public init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing0) {
            content
        }
        // Sides and bottom only: a header above has already paid the top.
        .padding(.horizontal, padding.length)
        .padding(.bottom, padding.length)
    }
}

public struct KozmosCardFooter<Content: View>: View {
    @Environment(\.kozmosCardPadding) private var padding
    let content: Content

    public init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    public var body: some View {
        HStack(alignment: .center, spacing: KozmosDimensions.primitivesLayoutSpacing0) {
            content
        }
        // Sides and bottom only: a header above has already paid the top.
        .padding(.horizontal, padding.length)
        .padding(.bottom, padding.length)
    }
}
