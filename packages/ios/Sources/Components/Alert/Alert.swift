import SwiftUI

public struct KozmosAlert<Content: View>: View {
    let variant: KozmosAlertVariant
    let content: Content

    public enum KozmosAlertVariant {
        case `default`, info, success, warning, destructive

        var foregroundColor: Color {
            switch self {
            case .default: return KozmosColors.primitivesColorsForeground0
            case .info: return KozmosColors.primitivesColorsTheme600
            case .success: return KozmosColors.primitivesColorsEmotionalSuccess900
            case .warning: return KozmosColors.primitivesColorsEmotionalAlert900
            case .destructive: return KozmosColors.primitivesColorsEmotionalDanger600
            }
        }

        var borderColor: Color {
            switch self {
            case .default: return KozmosColors.primitivesColorsForeground500
            default: return foregroundColor
            }
        }

        var icon: String {
            switch self {
            case .default: return "info.circle"
            case .info: return "info.circle"
            case .success: return "checkmark.circle"
            case .warning: return "exclamationmark.triangle"
            case .destructive: return "xmark.circle"
            }
        }
    }

    public init(variant: KozmosAlertVariant = .default, @ViewBuilder content: () -> Content) {
        self.variant = variant
        self.content = content()
    }

    public var body: some View {
        HStack(alignment: .top, spacing: KozmosDimensions.primitivesLayoutSpacing150) {
            content
        }
        // The icon, title and description inside take the alert's variant,
        // as React's inherit its colour and Figma binds them to it.
        .environment(\.kozmosAlertVariant, variant.shared)
        .padding()
        .background(KozmosColors.semanticsSurface0)
        .cornerRadius(KozmosDimensions.semanticsRadiusControl)
        .overlay(
            RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl)
                .stroke(variant.borderColor, lineWidth: 1)
        )
    }
}

extension KozmosAlert.KozmosAlertVariant {
    /// The same variant as the parts take it, whatever the alert holds: a
    /// variant nested in the generic alert is a type of its own for each
    /// content.
    var shared: KozmosAlert<AnyView>.KozmosAlertVariant {
        switch self {
        case .default: return .default
        case .info: return .info
        case .success: return .success
        case .warning: return .warning
        case .destructive: return .destructive
        }
    }
}

private struct KozmosAlertVariantKey: EnvironmentKey {
    static let defaultValue: KozmosAlert<AnyView>.KozmosAlertVariant = .default
}

extension EnvironmentValues {
    /// The variant of the alert a part is in: `.default` outside one.
    var kozmosAlertVariant: KozmosAlert<AnyView>.KozmosAlertVariant {
        get { self[KozmosAlertVariantKey.self] }
        set { self[KozmosAlertVariantKey.self] = newValue }
    }
}

public struct KozmosAlertIcon: View {
    let variant: KozmosAlert<AnyView>.KozmosAlertVariant?
    @Environment(\.kozmosAlertVariant) private var alertVariant

    /// `variant` nil, the default, draws the symbol and colour of the alert
    /// the icon is in. It drew the default's info symbol in foreground/0
    /// unless given the alert's variant again, until 2026-10-20.
    public init(variant: KozmosAlert<AnyView>.KozmosAlertVariant? = nil) {
        self.variant = variant
    }

    public var body: some View {
        let shown = variant ?? alertVariant
        Image(systemName: shown.icon)
            .foregroundColor(shown.foregroundColor)
            .font(KozmosTypography.title3)
    }
}

public struct KozmosAlertContent<Content: View>: View {
    let content: Content

    public init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing50) {
            content
        }
    }
}

public struct KozmosAlertTitle: View {
    let title: String
    let color: Color?
    @Environment(\.kozmosAlertVariant) private var alertVariant

    /// `color` nil, the default, is the colour of the alert the title is in,
    /// as Figma draws it: foreground/0 in a default alert. It was
    /// foreground/0 in every alert until 2026-10-20.
    public init(_ title: String, color: Color? = nil) {
        self.title = title
        self.color = color
    }

    public var body: some View {
        Text(title)
            .font(KozmosTypography.headline)
            .bold()
            .foregroundColor(color ?? alertVariant.foregroundColor)
    }
}

public struct KozmosAlertDescription: View {
    let description: String
    let color: Color?
    @Environment(\.kozmosAlertVariant) private var alertVariant

    /// `color` nil, the default, is the colour of the alert the description
    /// is in, as Figma draws it and React's inherits it: foreground/0 in a
    /// default alert. It was foreground/500 in every alert until 2026-10-20.
    public init(_ description: String, color: Color? = nil) {
        self.description = description
        self.color = color
    }

    public var body: some View {
        Text(description)
            .font(KozmosTypography.subheadline)
            .foregroundColor(color ?? alertVariant.foregroundColor)
    }
}
