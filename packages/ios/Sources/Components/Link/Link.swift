import SwiftUI

public struct KozmosLink: View {
    let label: String
    let destination: URL
    let external: Bool
    let externalLabel: String

    /// The new-tab icon is the body text's size, 17 at the default text
    /// size, and grows with it, as React's is the text's 1em.
    @ScaledMetric(relativeTo: .body) private var iconSide: CGFloat = 17
    @Environment(\.layoutDirection) private var layoutDirection

    /// - Parameters:
    ///   - external: The link leaves the app (GAP-202, decision 122): the
    ///     new-tab icon, Pointr's `link-external-01`, at its end, and
    ///     `externalLabel` as VoiceOver's hint. Opening is still the
    ///     system's, through the environment's `openURL`.
    ///   - externalLabel: What VoiceOver says after the link when
    ///     `external`, as a hint: "Opens in your browser" by default. Pass
    ///     the product's own words; empty, it says nothing more.
    public init(
        _ label: String,
        destination: URL,
        external: Bool = false,
        externalLabel: String = "Opens in your browser"
    ) {
        self.label = label
        self.destination = destination
        self.external = external
        self.externalLabel = externalLabel
    }

    public var body: some View {
        // Decision 59: theme-coloured text on a surface is theme 600, as
        // React's; 500 read 3.13:1 on a dark sheet.
        if external {
            Link(destination: destination) {
                // The icon sits beside the label's last line, so it never
                // starts a line alone, its bottom an eighth of its side under
                // the baseline, centred on the capitals as React's is.
                HStack(alignment: .lastTextBaseline, spacing: iconSide / 4) {
                    Text(label)
                    Self.newTabGlyph
                        .stroke(style: KozmosPointrGlyph.style(size: iconSide))
                        .frame(width: iconSide, height: iconSide)
                        // It points to the link's end: mirrored right to
                        // left, as SwiftUI's arrow.up.forward is.
                        .scaleEffect(x: layoutDirection == .rightToLeft ? -1 : 1, y: 1)
                        .alignmentGuide(.lastTextBaseline) { $0.height * 7 / 8 }
                        .accessibilityHidden(true)
                }
            }
            .foregroundColor(KozmosColors.primitivesColorsTheme600)
            .accessibilityHint(externalLabel)
        } else {
            Link(label, destination: destination)
                .foregroundColor(KozmosColors.primitivesColorsTheme600)
        }
    }

    /// Pointr's `link-external-01`, as `@kozmos-ds/icons` exports it,
    /// `LinkExternal01`.
    static let newTabGlyph: KozmosPointrGlyph = {
        guard let data = KozmosPointrIconPaths.part("LinkExternal01"),
              let glyph = KozmosPointrGlyph.outline(data.joined(separator: " ")) else {
            preconditionFailure("LinkExternal01 is generated into PointrIcons.generated.swift")
        }
        return glyph
    }()
}
