import SwiftUI

public struct KozmosAccordion<Content: View>: View {
    let content: Content
    public init(@ViewBuilder content: () -> Content) { self.content = content() }
    public var body: some View { VStack(spacing: 0) { content } }
}

public struct KozmosAccordionItem<Content: View>: View {
    let content: Content
    public init(@ViewBuilder content: () -> Content) { self.content = content() }
    public var body: some View { VStack(spacing: 0) { content } }
}

public struct KozmosAccordionTrigger: View {
    let value: String
    @Binding var selection: String?
    let title: String
    @Environment(\.kozmosAnalytics) var trackEvent
    
    public init(value: String, title: String, selection: Binding<String?>) {
        self.value = value
        self.title = title
        self._selection = selection
    }
    
    public var body: some View {
        Button(action: {
            let isExpanding = (selection != value)
            if isExpanding {
                 trackEvent(KozmosAnalyticsEvent(eventName: "accordion_toggled", component: "Accordion", properties: ["value": value]))
                 withAnimation { selection = value }
            } else {
                 withAnimation { selection = nil }
            }
        }) {
            HStack {
                Text(title)
                    .font(KozmosTypography.subheadline)
                    .foregroundColor(KozmosColors.primitivesColorsForeground100)
                Spacer()
                Image(systemName: "chevron.down")
                    .rotationEffect(.degrees(selection == value ? 180 : 0))
                    .foregroundColor(KozmosColors.primitivesColorsForeground500)
            }
            .padding(.vertical, KozmosDimensions.primitivesLayoutSpacing200)
            // The whole row takes a tap, as React's trigger does: with no
            // fill, the trigger took one only on its title and its chevron.
            .contentShape(Rectangle())
        }
        .buttonStyle(PlainButtonStyle())
        Divider().overlay(KozmosColors.semanticsBorderSubtle)
    }
}

public struct KozmosAccordionContent<Content: View>: View {
    let value: String
    @Binding var selection: String?
    let content: Content
    
    public init(value: String, selection: Binding<String?>, @ViewBuilder content: () -> Content) {
        self.value = value
        self._selection = selection
        self.content = content()
    }
    
    public var body: some View {
        if selection == value {
            content
                .padding(.horizontal, KozmosDimensions.primitivesLayoutSpacing200)
                .padding(.vertical, KozmosDimensions.primitivesLayoutSpacing100)
        }
    }
}
