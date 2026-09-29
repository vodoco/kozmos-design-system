import SwiftUI

public enum KozmosIconSize {
    case xs
    case sm
    case md
    case lg
    case xl

    var pointSize: CGFloat {
        switch self {
        case .xs: return 12
        case .sm: return 16
        case .md: return 20
        case .lg: return 24
        case .xl: return 32
        }
    }
}

public enum KozmosIconColor {
    case `default`
    case muted
    case primary
    case destructive

    var swiftUIColor: Color {
        switch self {
        case .default: return KozmosColors.primitivesColorsForeground100
        case .muted: return KozmosColors.primitivesColorsForeground500
        case .primary: return KozmosColors.primitivesColorsTheme500
        case .destructive: return KozmosColors.primitivesColorsEmotionalDanger600
        }
    }
}

/// The colour a `KozmosIcon` at `.default` takes inside a part that sets it:
/// the map status pill's mark takes its tone's, as a Compose icon takes
/// `LocalContentColor`. Unset, `.default` is foreground/100.
struct KozmosIconHostInkKey: EnvironmentKey {
    static let defaultValue: Color? = nil
}

extension EnvironmentValues {
    var kozmosIconHostInk: Color? {
        get { self[KozmosIconHostInkKey.self] }
        set { self[KozmosIconHostInkKey.self] = newValue }
    }
}

public struct KozmosIcon: View {
    let name: String
    let size: KozmosIconSize
    let color: KozmosIconColor
    let accessibilityLabel: String?
    @Environment(\.kozmosIconHostInk) private var hostInk

    public init(
        _ name: String = "home-line",
        size: KozmosIconSize = .md,
        color: KozmosIconColor = .default,
        accessibilityLabel: String? = nil
    ) {
        self.name = name
        self.size = size
        self.color = color
        self.accessibilityLabel = accessibilityLabel
    }

    public var body: some View {
        Group {
            if let glyph = KozmosPointrGlyph.named(Self.resolvedIconName(name)) {
                // SF Symbols has nothing for this name: Pointr's own outline.
                glyph.stroke(style: KozmosPointrGlyph.style(size: size.pointSize))
            } else {
                Image(systemName: Self.symbolName(for: name))
                    .font(.system(size: size.pointSize, weight: .medium))
            }
        }
        .foregroundColor(color == .default ? hostInk ?? color.swiftUIColor : color.swiftUIColor)
        .frame(width: size.pointSize, height: size.pointSize)
        .accessibilityHidden(accessibilityLabel == nil)
        .accessibilityLabel(accessibilityLabel ?? "")
    }

    static func symbolName(for rawName: String) -> String {
        let name = resolvedIconName(rawName)

        switch name {
        case "activity": return "waveform.path.ecg"
        case "alert-circle": return "exclamationmark.circle"
        case "alert-triangle": return "exclamationmark.triangle"
        case "arrow-left": return "arrow.left"
        case "arrow-right": return "arrow.right"
        case "bell-01": return "bell"
        case "building-01": return "building.2"
        case "bus": return "bus"
        case "calendar": return "calendar"
        case "check": return "checkmark"
        case "chevron-down": return "chevron.down"
        case "chevron-left": return "chevron.left"
        case "chevron-right": return "chevron.right"
        case "chevron-up": return "chevron.up"
        case "clock": return "clock"
        case "compass-01": return "compass"
        case "download-01": return "arrow.down.to.line"
        case "edit-01": return "pencil"
        case "home-line": return "house"
        case "info-circle": return "info.circle"
        case "lock-01": return "lock"
        case "map-01": return "map"
        case "marker-pin-01": return "mappin"
        case "menu-01": return "line.3.horizontal"
        case "minus": return "minus"
        case "navigation-pointer-01": return "location.north"
        case "plus": return "plus"
        case "qr-code-01": return "qrcode"
        case "route": return "point.topleft.down.curvedto.point.bottomright.up"
        case "scan": return "viewfinder"
        case "search-md": return "magnifyingglass"
        case "settings-01": return "gearshape"
        case "trash-01": return "trash"
        case "upload-01": return "arrow.up.to.line"
        case "user-01": return "person"
        case "users-01": return "person.2"
        case "wifi": return "wifi"
        case "x-close": return "xmark"
        default: return "questionmark.circle"
        }
    }

    private static func resolvedIconName(_ name: String) -> String {
        switch name {
        case "add": return "plus"
        case "back": return "arrow-left"
        case "close", "x": return "x-close"
        case "delete": return "trash-01"
        case "edit": return "edit-01"
        case "home": return "home-line"
        case "location", "map-pin": return "marker-pin-01"
        case "menu": return "menu-01"
        case "next": return "arrow-right"
        case "notifications": return "bell-01"
        case "search": return "search-md"
        case "settings": return "settings-01"
        case "user": return "user-01"
        case "users": return "users-01"
        case "warning": return "alert-triangle"
        default: return name
        }
    }
}

public typealias Icon = KozmosIcon
