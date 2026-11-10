import SwiftUI

/// A key, or a combination of keys, drawn as key caps and read by the key's
/// name (GAP-156): "Esc" is drawn as a key and VoiceOver reads "Escape".
///
/// One accessibility element. Its label is each key's spoken name, a
/// combination joined with "+" ("Control+C"), or `label` when given. The
/// caller writes the glyph a platform uses (⌘ or Ctrl): nothing is mapped.
///
/// Drawn as React's `<Kbd>` is: a cap 20 tall and at least 20 wide, 4 either
/// side of its glyph, the marker radius, a 1pt border in the border colour on
/// the muted fill, its glyph 12 medium in the foreground colour. The caps of a
/// combination sit 4 apart with a "+" between, in the muted foreground.
public struct KozmosKbd: View {
    let keys: [String]
    let label: String?

    /// One key. - Parameters:
    ///   - key: The glyph drawn on the cap, as the caller writes it: "Esc", "⌘".
    ///   - label: What VoiceOver reads instead of the key's spoken name.
    public init(_ key: String, label: String? = nil) {
        self.keys = [key]
        self.label = label
    }

    /// A combination, pressed together: `KozmosKbd(keys: ["Ctrl", "C"])`,
    /// read "Control+C".
    public init(keys: [String], label: String? = nil) {
        self.keys = keys
        self.label = label
    }

    /// What VoiceOver reads: `label`, or the keys' spoken names joined with "+".
    var spokenLabel: String {
        label ?? keys.map(Self.spokenName).joined(separator: "+")
    }

    public var body: some View {
        HStack(spacing: KozmosDimensions.primitivesLayoutSpacing50) {
            ForEach(Array(keys.enumerated()), id: \.offset) { index, key in
                if index > 0 {
                    Text(verbatim: "+")
                        .font(KozmosTypography.caption.weight(.medium))
                        .foregroundColor(KozmosColors.primitivesColorsForeground400)
                }
                cap(key)
            }
        }
        .fixedSize()
        // One element, read by the keys' names; the glyphs are not read.
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(Text(verbatim: spokenLabel))
    }

    private func cap(_ key: String) -> some View {
        let shape = RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusMarker, style: .continuous)
        return Text(verbatim: key)
            // React's text-xs font-medium: 12 on a 16 line, the caption style,
            // which grows with Dynamic Type.
            .font(KozmosTypography.caption.weight(.medium))
            .foregroundColor(KozmosColors.primitivesColorsForeground0)
            .lineLimit(1)
            .padding(.horizontal, KozmosDimensions.primitivesLayoutSpacing50)
            // React's h-5 min-w-5: 20 tall, at least 20 wide. No token is 20.
            .frame(minWidth: 20, minHeight: 20)
            .background(shape.fill(KozmosColors.primitivesColorsBackground100))
            .overlay(shape.strokeBorder(KozmosColors.semanticsBorderSubtle, lineWidth: 1))
    }

    /// A key's spoken name, English by default: exact for symbols, any case
    /// for words; any other key is read as written.
    static func spokenName(_ key: String) -> String {
        spokenNames[key.lowercased()] ?? key
    }

    /// The names, by the key lowercased; a symbol is its own lower case.
    static let spokenNames: [String: String] = [
        "esc": "Escape",
        "ctrl": "Control",
        "cmd": "Command",
        "⌘": "Command",
        "opt": "Option",
        "⌥": "Option",
        "⇧": "Shift",
        "⌃": "Control",
        "↵": "Enter",
        "⏎": "Enter",
        "⌫": "Backspace",
        "bksp": "Backspace",
        "del": "Delete",
        "⌦": "Delete",
        "⇥": "Tab",
        "↑": "Up arrow",
        "↓": "Down arrow",
        "←": "Left arrow",
        "→": "Right arrow",
        "pgup": "Page up",
        "pgdn": "Page down",
        "␣": "Space",
        "ins": "Insert",
        "⇪": "Caps lock",
        "win": "Windows",
    ]
}
