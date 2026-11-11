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
    
    public var body: some View {
        Button(action: {
            trackEvent(KozmosAnalyticsEvent(eventName: "select_value_changed", component: "Select", properties: ["value": value]))
            selection = value
        }) {
            if let count {
                // Not in an HStack: a menu keeps a stack's first Text and
                // drops the rest, where it draws a second Text as the
                // subtitle.
                Text(label)
                Text(count.formatted())
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
        .modifier(KozmosSelectItemCountLabel(label: label, count: count))
    }
}

/// The label and count as one name, only where there is a count: an option
/// without one keeps the name the menu gives it.
private struct KozmosSelectItemCountLabel: ViewModifier {
    let label: String
    let count: Int?

    func body(content: Content) -> some View {
        if let count {
            content.accessibilityLabel("\(label), \(count.formatted())")
        } else {
            content
        }
    }
}
