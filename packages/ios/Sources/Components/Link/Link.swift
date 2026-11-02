import SwiftUI

public struct KozmosLink: View {
    let label: String
    let destination: URL
    let external: Bool
    let externalLabel: String

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
                // starts a line alone. SwiftUI never says what size a font
                // is, so two spaces in the link's own font say it: a no-break
                // space, the gap, as React's is; and an em space, one em
                // wide, which is the icon's side, as React's is the text's
                // 1em, whatever `.font(_:)` or text size the link is in.
                HStack(alignment: .lastTextBaseline, spacing: 0) {
                    Text(label)
                    Text(verbatim: "\u{00A0}").hidden()
                    Text(verbatim: "\u{2003}").hidden().overlay { newTabIcon }
                }
            }
            .foregroundColor(KozmosColors.primitivesColorsTheme600)
            .accessibilityHint(externalLabel)
        } else {
            Link(label, destination: destination)
                .foregroundColor(KozmosColors.primitivesColorsTheme600)
        }
    }

    /// The new-tab icon, a square as wide as its box, centred in the line, so
    /// on the capitals, as React's is.
    private var newTabIcon: some View {
        GeometryReader { box in
            Self.newTabGlyph
                .stroke(style: KozmosPointrGlyph.style(size: box.size.width))
                .frame(width: box.size.width, height: box.size.width)
                // It points to the link's end: mirrored right to left, as
                // SwiftUI's arrow.up.forward is.
                .scaleEffect(x: layoutDirection == .rightToLeft ? -1 : 1, y: 1)
                .frame(height: box.size.height)
        }
        .accessibilityHidden(true)
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
