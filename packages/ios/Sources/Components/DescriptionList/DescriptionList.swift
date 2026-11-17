import SwiftUI

/// How a DescriptionList's items are laid out (GAP-221).
public enum KozmosDescriptionListLayout: Hashable, Sendable {
    /// One under another.
    case stack
    /// Side by side, as many as fit, wrapping onto the next line.
    case row
}

/// A label over its value with no field chrome (GAP-221, decision 199): a
/// record's read-only view, as MAP-619's Read-Only unit draws its values. A
/// value is text, a yes or no in words, or any view (tags), and an item can
/// carry a trailing action, such as Copy. It is not `KozmosMetaStrip`, a
/// strip of tiles that scrolls sideways.
///
/// VoiceOver hears each item as one element, its label, then its value; the
/// action is an element of its own after it.
public struct KozmosDescriptionList<Content: View>: View {
    let layout: KozmosDescriptionListLayout
    let content: Content

    /// 16 between items, down a stack and across and down a row.
    static var itemSpacing: CGFloat { KozmosDimensions.primitivesLayoutSpacing200 }
    /// The narrowest an item sits beside another in `.row`.
    static var minimumColumnWidth: CGFloat { 160 }

    public init(layout: KozmosDescriptionListLayout = .stack, @ViewBuilder content: () -> Content) {
        self.layout = layout
        self.content = content()
    }

    public var body: some View {
        switch layout {
        case .stack:
            VStack(alignment: .leading, spacing: Self.itemSpacing) { content }
                .frame(maxWidth: .infinity, alignment: .leading)
        case .row:
            LazyVGrid(
                columns: [GridItem(.adaptive(minimum: Self.minimumColumnWidth), spacing: Self.itemSpacing, alignment: .topLeading)],
                alignment: .leading,
                spacing: Self.itemSpacing
            ) { content }
        }
    }
}

/// One item of a `KozmosDescriptionList`: a label, 12/16 in foreground 400,
/// over its value, 14/20 in foreground 100, 4 apart, with no border and no
/// fill; an action, if any, at the trailing end, centred on the value.
public struct KozmosDescriptionListItem<Value: View, Action: View>: View {
    let label: String
    /// The value as words, for VoiceOver; nil for a value drawn as a view,
    /// whose own elements' words are read.
    let valueWords: String?
    let value: Value
    let action: Action?

    /// 4 between the label and its value.
    static var labelSpacing: CGFloat { KozmosDimensions.primitivesLayoutSpacing50 }

    public var body: some View {
        HStack(alignment: .center, spacing: KozmosDimensions.primitivesLayoutSpacing100) {
            VStack(alignment: .leading, spacing: Self.labelSpacing) {
                Text(label)
                    .font(KozmosTypography.caption)
                    .foregroundColor(KozmosColors.primitivesColorsForeground400)
                value
                    .font(KozmosTypography.subheadline)
                    .foregroundColor(KozmosColors.primitivesColorsForeground100)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .modifier(KozmosDescriptionListSpeech(label: label, valueWords: valueWords))
            if let action { action }
        }
    }
}

/// One element, heard as the label, then the value: the words given, or,
/// for a value drawn as a view, its own elements' words, combined.
private struct KozmosDescriptionListSpeech: ViewModifier {
    let label: String
    let valueWords: String?

    func body(content: Content) -> some View {
        if let valueWords {
            content
                .accessibilityElement(children: .ignore)
                .accessibilityLabel(label)
                .accessibilityValue(valueWords)
        } else {
            content
                .accessibilityElement(children: .combine)
        }
    }
}

public extension KozmosDescriptionListItem where Value == Text, Action == EmptyView {
    /// A value in words.
    init(label: String, value: String) {
        self.init(label: label, valueWords: value, value: Text(value), action: nil)
    }

    /// A yes or no, in words: `yesLabel` or `noLabel`, "Yes" and "No"
    /// unless the product gives its own.
    init(label: String, isOn: Bool, yesLabel: String = "Yes", noLabel: String = "No") {
        let words = isOn ? yesLabel : noLabel
        self.init(label: label, valueWords: words, value: Text(words), action: nil)
    }
}

public extension KozmosDescriptionListItem where Value == Text {
    /// A value in words with a trailing action, such as Copy.
    init(label: String, value: String, @ViewBuilder action: () -> Action) {
        self.init(label: label, valueWords: value, value: Text(value), action: action())
    }
}

public extension KozmosDescriptionListItem where Action == EmptyView {
    /// Any value drawn as a view, tags among them: VoiceOver reads its words
    /// after the label.
    init(label: String, @ViewBuilder value: () -> Value) {
        self.init(label: label, valueWords: nil, value: value(), action: nil)
    }
}

public extension KozmosDescriptionListItem {
    /// Any value drawn as a view, with a trailing action.
    init(label: String, @ViewBuilder value: () -> Value, @ViewBuilder action: () -> Action) {
        self.init(label: label, valueWords: nil, value: value(), action: action())
    }
}
