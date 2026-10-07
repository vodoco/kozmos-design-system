import SwiftUI

/// Which step of the type ramp a piece of text sits on.
///
/// Mirrors `KozmosTypography`, so a caller picks a named step rather than
/// reaching past the component for `.font(...)`.
public enum KozmosTextStyle: String, CaseIterable, Sendable {
    case title2
    case title3
    case headline
    case body
    case subheadline
    case footnote
    case caption
    case caption2

    var font: Font {
        switch self {
        case .title2: return KozmosTypography.title2
        case .title3: return KozmosTypography.title3
        case .headline: return KozmosTypography.headline
        case .body: return KozmosTypography.body
        case .subheadline: return KozmosTypography.subheadline
        case .footnote: return KozmosTypography.footnote
        case .caption: return KozmosTypography.caption
        case .caption2: return KozmosTypography.caption2
        }
    }
}

/// What the text is doing, rather than what colour it is.
public enum KozmosTextTone: String, CaseIterable, Sendable {
    /// Ordinary reading text.
    case `default`
    /// Supporting text: captions, counts, secondary lines.
    case muted
    /// Text carrying the brand colour, for emphasis inside a sentence.
    case brand
    case success
    case warning
    case danger
    /// For text sitting on a filled brand surface, the theme fill: the theme
    /// foreground, white in both appearances (decision 59).
    case onEmphasis
    /// For text sitting on a filled danger surface: white in light, black in
    /// the dark, where the danger fill is light (#E95A77; black reads 6.19:1,
    /// white 3.39:1).
    case onDanger

    var color: Color {
        switch self {
        case .default: return KozmosColors.primitivesColorsForeground100
        case .muted: return KozmosColors.primitivesColorsForeground500
        // Theme-coloured text on a surface: theme 600 (decision 59).
        case .brand: return KozmosColors.primitivesColorsTheme600
        case .success: return KozmosColors.primitivesColorsEmotionalSuccess600
        case .warning: return KozmosColors.primitivesColorsEmotionalAlert600
        case .danger: return KozmosColors.primitivesColorsEmotionalDanger600
        // Split on 2026-10-07 (Olcay): background/0 turned black on the theme
        // fill in the dark (3.74:1), and no one colour reads on both fills there.
        case .onEmphasis: return KozmosColors.componentsPrimaryButtonsThemedButtonForegroundContentIdle
        case .onDanger: return KozmosColors.primitivesColorsBackground0
        }
    }
}

/// A run of text on the design system's type ramp.
///
/// Previously this took a string and nothing else, hard-coding
/// `KozmosTypography.body` — so anything that was not body copy had to reach
/// past it to a raw `Text` and set the font by hand, which is how a type ramp
/// stops being one. Style and tone are named here instead.
public struct KozmosText: View {
    let text: String
    let style: KozmosTextStyle
    let tone: KozmosTextTone
    let weight: Font.Weight?
    let lineLimit: Int?

    public init(
        _ text: String,
        style: KozmosTextStyle = .body,
        tone: KozmosTextTone = .default,
        weight: Font.Weight? = nil,
        lineLimit: Int? = nil
    ) {
        self.text = text
        self.style = style
        self.tone = tone
        self.weight = weight
        self.lineLimit = lineLimit
    }

    public var body: some View {
        Text(text)
            .font(style.font)
            .fontWeight(weight)
            .foregroundColor(tone.color)
            .lineLimit(lineLimit)
    }
}
