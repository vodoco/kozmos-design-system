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
        .environment(\.isInKozmosAlert, true)
        .padding()
        .background(KozmosColors.semanticsSurface0)
        // A container's corner, 20, as React's rounded-container (decision 156).
        .cornerRadius(KozmosDimensions.semanticsRadiusContainer)
        .overlay(
            RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusContainer)
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

private struct IsInKozmosAlertKey: EnvironmentKey {
    static let defaultValue = false
}

extension EnvironmentValues {
    /// The variant of the alert a part is in: `.default` outside one.
    var kozmosAlertVariant: KozmosAlert<AnyView>.KozmosAlertVariant {
        get { self[KozmosAlertVariantKey.self] }
        set { self[KozmosAlertVariantKey.self] = newValue }
    }

    /// Whether a part is in an alert's row, where words shorter than the
    /// icon are centred on it.
    var isInKozmosAlert: Bool {
        get { self[IsInKozmosAlertKey.self] }
        set { self[IsInKozmosAlertKey.self] = newValue }
    }
}

/// The icon's line: 24 at the default text size, as Figma's and Compose's
/// alert icon, growing as Dynamic Type grows the icon's title3.
private let kozmosAlertIconLine = KozmosDimensions.primitivesLayoutSpacing300

extension View {
    /// Words shorter than the icon's `line` sit centred on it, in the
    /// alert's row: one line of description with no title, which sat at the
    /// icon's top with the icon's extra height below it, 16 above the words
    /// and 20.7 below (GAP-269). Words as tall as the icon or taller, a
    /// title and its description or a longer description, stay at the top.
    func kozmosAlertCentredOnIcon(line: CGFloat, in alert: Bool) -> some View {
        alignmentGuide(.top) { d in
            alert ? -max(0, line - d.height) / 2 : d[.top]
        }
    }
}

public struct KozmosAlertIcon: View {
    let variant: KozmosAlert<AnyView>.KozmosAlertVariant?
    @Environment(\.kozmosAlertVariant) private var alertVariant
    @ScaledMetric(relativeTo: .title3) private var line: CGFloat = kozmosAlertIconLine

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
            // On a line of its own, every symbol the same height: a line of
            // words shorter than it is centred on it.
            .frame(height: line)
    }
}

public struct KozmosAlertContent<Content: View>: View {
    let content: Content
    @Environment(\.isInKozmosAlert) private var inAlert
    @ScaledMetric(relativeTo: .title3) private var line: CGFloat = kozmosAlertIconLine

    public init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing50) {
            content
        }
        .kozmosAlertCentredOnIcon(line: line, in: inAlert)
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
    @Environment(\.isInKozmosAlert) private var inAlert
    @ScaledMetric(relativeTo: .title3) private var line: CGFloat = kozmosAlertIconLine

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
            .kozmosAlertCentredOnIcon(line: line, in: inAlert)
    }
}
