import SwiftUI

public struct KozmosSelect<Trigger: View, Content: View>: View {
    let trigger: Trigger
    let content: Content
    
    public init(@ViewBuilder trigger: () -> Trigger, @ViewBuilder content: () -> Content) {
        self.trigger = trigger()
        self.content = content()
    }
    
    public var body: some View {
        Menu {
            content
        } label: {
            trigger
        }
    }
}

/// One option. With a `count` (GAP-164), the count is the menu item's
/// subtitle: the system menu draws only text and images, so it is the
/// number under the label, not a drawn Counter. VoiceOver reads it with the
/// label, "Gates, 12", where the menu alone reads a subtitle's item by its
/// title. The count is never part of `label`, so a trigger that shows the
/// chosen option's `label` does not repeat it. Unset, the option is drawn
/// and read as it always was.
///
/// The count is written once, in the reader's own number format, grouped
/// ("1,234" in English, "1.234" in German), and the drawn subtitle and the
/// spoken name both take that one string, as React and Compose do.
///
/// Chosen or not, an option with a count is the same item, a title and a
/// subtitle; only the checkmark, the item's image, comes and goes. The menu
/// starts the subtitle where it starts the title, so a count never moves
/// when the choice does.
public struct KozmosSelectItem: View {
    let value: String
    let label: String
    let count: Int?
    @Binding var selection: String
    @Environment(\.kozmosAnalytics) var trackEvent
    
    public init(value: String, label: String, count: Int? = nil, selection: Binding<String>) {
        self.value = value
        self.label = label
        self.count = count
        self._selection = selection
    }

    /// The count as it is drawn and read: locale-grouped.
    var countText: String? { count.map { $0.formatted() } }
    
    public var body: some View {
        Button(action: {
            trackEvent(KozmosAnalyticsEvent(eventName: "select_value_changed", component: "Select", properties: ["value": value]))
            selection = value
        }) {
            if let countText {
                // Not in an HStack: a menu keeps a stack's first Text and
                // drops the rest, where it draws a second Text as the
                // subtitle.
                Text(label)
                Text(countText)
                if selection == value {
                    Image(systemName: "checkmark")
                }
            } else {
                HStack {
                    Text(label)
                    if selection == value {
                        Image(systemName: "checkmark")
                    }
                }
            }
        }
        .modifier(KozmosSelectItemCountLabel(label: label, countText: countText))
    }
}

/// The label and count as one name, "Gates, 12", only where there is a
/// count: an option without one keeps the name the menu gives it.
private struct KozmosSelectItemCountLabel: ViewModifier {
    let label: String
    let countText: String?

    func body(content: Content) -> some View {
        if let countText {
            content.accessibilityLabel("\(label), \(countText)")
        } else {
            content
        }
    }
}
