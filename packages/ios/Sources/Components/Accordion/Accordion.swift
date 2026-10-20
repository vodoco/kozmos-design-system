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

    private var isExpanded: Bool { selection == value }

    private func toggle() {
        if !isExpanded {
            trackEvent(KozmosAnalyticsEvent(eventName: "accordion_toggled", component: "Accordion", properties: ["value": value]))
            withAnimation { selection = value }
        } else {
            withAnimation { selection = nil }
        }
    }
    
    public var body: some View {
        let button = Button(action: toggle) {
            HStack {
                Text(title)
                    .font(KozmosTypography.subheadline)
                    .foregroundColor(KozmosColors.primitivesColorsForeground100)
                Spacer()
                Image(systemName: "chevron.down")
                    .rotationEffect(.degrees(isExpanded ? 180 : 0))
                    .foregroundColor(KozmosColors.primitivesColorsForeground500)
            }
            .padding(.vertical, KozmosDimensions.primitivesLayoutSpacing200)
        }
        .buttonStyle(PlainButtonStyle())
        #if os(iOS)
        if #available(iOS 18.0, *) {
            // VoiceOver is given the UIKit element laid over the trigger
            // instead, as React's trigger has `aria-expanded`: it says
            // "collapsed" or "expanded" in the visitor's own language, which
            // SwiftUI has no modifier for. Touches still reach the button
            // underneath. Before iOS 18 UIKit has no such status either, and
            // VoiceOver hears the button itself, as it always has.
            button
                .accessibilityHidden(true)
                .overlay(KozmosAccordionTriggerElement(label: title, isExpanded: isExpanded, toggle: toggle))
        } else {
            button
        }
        #else
        button
        #endif
        // The rule is decoration, as React's item border.
        Divider().overlay(KozmosColors.semanticsBorderSubtle)
            .accessibilityHidden(true)
    }
}

#if os(iOS)
import UIKit

/// The accordion trigger as VoiceOver hears it from iOS 18: a button named by
/// its title that says whether its panel is open, through UIKit's
/// `accessibilityExpandedStatus`. It takes no touches, which reach the SwiftUI
/// button underneath, and acts only for VoiceOver: activation opens or closes
/// the panel. The floor switcher's tile is given to VoiceOver the same way.
@available(iOS 18.0, *)
struct KozmosAccordionTriggerElement: UIViewRepresentable {
    let label: String
    let isExpanded: Bool
    let toggle: () -> Void

    func makeUIView(context: Context) -> ElementView { ElementView() }

    func updateUIView(_ view: ElementView, context: Context) {
        view.accessibilityLabel = label
        view.toggle = toggle
        view.isExpanded = isExpanded
    }

    final class ElementView: UIView {
        var toggle: () -> Void = {}
        var isExpanded = false {
            didSet { report() }
        }

        override init(frame: CGRect) {
            super.init(frame: frame)
            backgroundColor = .clear
            isUserInteractionEnabled = false
            isAccessibilityElement = true
            accessibilityTraits = .button
            report()
        }

        required init?(coder: NSCoder) { nil }

        private func report() {
            accessibilityExpandedStatus = isExpanded ? .expanded : .collapsed
        }

        override func accessibilityActivate() -> Bool {
            toggle()
            return true
        }
    }
}
#endif

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
