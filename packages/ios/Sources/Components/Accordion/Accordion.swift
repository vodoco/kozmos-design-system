import SwiftUI

/// How an accordion's sections are drawn, mirroring React's `variant`.
public enum KozmosAccordionVariant: String, CaseIterable, Sendable {
    /// Rows divided by a rule.
    case `default`
    /// Decision 149: each header a box of its own, 8 apart, a hairline while
    /// closed and a fill of theme 900 while open, with the section's content
    /// in the page's flow under it.
    case boxed
}

private struct KozmosAccordionVariantKey: EnvironmentKey {
    static let defaultValue = KozmosAccordionVariant.default
}

private struct KozmosAccordionItemDisabledKey: EnvironmentKey {
    static let defaultValue = false
}

private extension EnvironmentValues {
    var kozmosAccordionVariant: KozmosAccordionVariant {
        get { self[KozmosAccordionVariantKey.self] }
        set { self[KozmosAccordionVariantKey.self] = newValue }
    }

    var kozmosAccordionItemDisabled: Bool {
        get { self[KozmosAccordionItemDisabledKey.self] }
        set { self[KozmosAccordionItemDisabledKey.self] = newValue }
    }
}

public struct KozmosAccordion<Content: View>: View {
    let variant: KozmosAccordionVariant
    let content: Content
    public init(variant: KozmosAccordionVariant = .default, @ViewBuilder content: () -> Content) {
        self.variant = variant
        self.content = content()
    }
    public var body: some View {
        VStack(spacing: variant == .boxed ? KozmosDimensions.primitivesLayoutSpacing100 : 0) { content }
            .environment(\.kozmosAccordionVariant, variant)
    }
}

public struct KozmosAccordionItem<Content: View>: View {
    let disabled: Bool
    let content: Content
    /// `disabled` takes no tap on the item's trigger, as React's item does: its
    /// content is left alone, so an open item stays open and its fields live.
    public init(disabled: Bool = false, @ViewBuilder content: () -> Content) {
        self.disabled = disabled
        self.content = content()
    }
    public var body: some View {
        VStack(spacing: 0) { content }
            .environment(\.kozmosAccordionItemDisabled, disabled)
    }
}

public struct KozmosAccordionTrigger: View {
    let value: String
    @Binding var selection: String?
    let title: String
    /// The boxed form's small line over the title, and the product's words.
    let label: String?
    /// The boxed form's mark at the start, drawn 20 square.
    let icon: AnyView?
    let loading: Bool
    let loadingLabel: String
    /// What a UI test finds the trigger by, as `app.buttons["…"]`.
    let identifier: String?
    @Environment(\.kozmosAnalytics) var trackEvent
    @Environment(\.kozmosAccordionVariant) private var variant
    @Environment(\.kozmosAccordionItemDisabled) private var itemDisabled
    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    /// `accessibilityIdentifier` is set on the trigger's one button alone:
    /// from iOS 18 the UIKit element laid over the trigger, and before iOS 18
    /// the button. A SwiftUI `.accessibilityIdentifier` applied to the
    /// trigger from outside does not set the UIKit element's own: XCUITest
    /// finds it on that button, but on the rule under the trigger as well.
    ///
    /// `label` is drawn by the boxed form alone. `loading` draws a spinner
    /// where the chevron is and disables the trigger while it is set, in
    /// either form; SwiftUI has no busy state, so VoiceOver hears
    /// `loadingLabel` as the trigger's value.
    public init(
        value: String,
        title: String,
        selection: Binding<String?>,
        label: String? = nil,
        loading: Bool = false,
        loadingLabel: String = "Loading",
        accessibilityIdentifier: String? = nil
    ) {
        self.value = value
        self.title = title
        self._selection = selection
        self.label = label
        self.icon = nil
        self.loading = loading
        self.loadingLabel = loadingLabel
        self.identifier = accessibilityIdentifier
    }

    /// The same, with the boxed form's `icon`, decoration to VoiceOver. It
    /// takes the header's ink: pass a `KozmosIcon`.
    public init<Icon: View>(
        value: String,
        title: String,
        selection: Binding<String?>,
        label: String? = nil,
        loading: Bool = false,
        loadingLabel: String = "Loading",
        accessibilityIdentifier: String? = nil,
        @ViewBuilder icon: () -> Icon
    ) {
        self.value = value
        self.title = title
        self._selection = selection
        self.label = label
        self.icon = AnyView(icon())
        self.loading = loading
        self.loadingLabel = loadingLabel
        self.identifier = accessibilityIdentifier
    }

    private var isExpanded: Bool { selection == value }
    private var isBoxed: Bool { variant == .boxed }
    private var isInert: Bool { loading || itemDisabled || !isEnabled }

    private func change(to next: String?) {
        // The boxed form is still under reduced motion, as React's is. The
        // default form animates as it always has.
        if isBoxed && reduceMotion {
            selection = next
        } else {
            withAnimation { selection = next }
        }
    }

    private func toggle() {
        guard !isInert else { return }
        if !isExpanded {
            trackEvent(KozmosAnalyticsEvent(eventName: "accordion_toggled", component: "Accordion", properties: ["value": value]))
            change(to: value)
        } else {
            change(to: nil)
        }
    }

    private var chevron: some View {
        Image(systemName: "chevron.down")
            .rotationEffect(.degrees(isExpanded ? 180 : 0))
    }

    private var defaultRow: some View {
        HStack {
            Text(title)
                .font(KozmosTypography.subheadline)
                .foregroundColor(KozmosColors.primitivesColorsForeground100)
            Spacer()
            if loading {
                KozmosSpinner(size: .sm, color: KozmosColors.primitivesColorsForeground500)
                    .accessibilityHidden(true)
            } else {
                chevron.foregroundColor(KozmosColors.primitivesColorsForeground500)
            }
        }
        .padding(.vertical, KozmosDimensions.primitivesLayoutSpacing200)
        // The whole row takes a tap, as React's trigger does: with no
        // fill, the trigger took one only on its title and its chevron.
        .contentShape(Rectangle())
    }

    private var isFilled: Bool { isExpanded && !isInert }

    /// The header's words and marks: foreground 1000 on theme 900 turns over
    /// with the theme, so it reads in both.
    private var ink: Color {
        if isInert { return KozmosColors.primitivesColorsForeground400 }
        return isFilled ? KozmosColors.primitivesColorsForeground1000 : KozmosColors.primitivesColorsForeground0
    }

    private var labelInk: Color {
        isFilled ? KozmosColors.primitivesColorsTheme300 : KozmosColors.primitivesColorsForeground400
    }

    private var fill: Color {
        if isInert { return KozmosColors.primitivesColorsBackground100 }
        return isFilled ? KozmosColors.primitivesColorsTheme900 : KozmosColors.primitivesColorsBackground0
    }

    /// The boxed form's row: 44 at least, as this platform's targets are, and
    /// as React's is at touch; the live page's 40 is compact's, which has no
    /// counterpart here. 8 inside a hairline that stays, clear, while open, as
    /// React's does, so nothing moves.
    private var boxedRow: some View {
        let shape = RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl)
        return HStack(spacing: KozmosDimensions.primitivesLayoutSpacing100) {
            if let icon {
                icon
                    .environment(\.kozmosIconHostInk, ink)
                    .foregroundColor(ink)
                    .frame(width: 20, height: 20)
                    .accessibilityHidden(true)
            }
            VStack(alignment: .leading, spacing: 0) {
                if let label {
                    Text(label)
                        .font(KozmosTypography.caption2)
                        .lineSpacing(KozmosTypography.caption2On14ptLineSpacing)
                        .foregroundColor(labelInk)
                        .fixedSize(horizontal: false, vertical: true)
                }
                Text(title)
                    .font(KozmosTypography.footnote)
                    .foregroundColor(ink)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            if loading {
                KozmosSpinner(diameter: 20, color: ink)
                    .accessibilityHidden(true)
            } else if !isInert {
                chevron
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(ink)
                    .frame(width: 20, height: 20)
                    .accessibilityHidden(true)
            }
        }
        .padding(.horizontal, KozmosDimensions.primitivesLayoutSpacing100 + 1)
        .padding(.vertical, 3)
        .frame(minHeight: 44)
        .background(shape.fill(fill))
        .overlay(shape.strokeBorder(isFilled ? Color.clear : KozmosColors.semanticsBorderSubtle, lineWidth: 1))
        .contentShape(shape)
    }

    /// What VoiceOver is given: the small line, then the title, as React's
    /// trigger is named.
    private var spokenLabel: String {
        guard isBoxed, let label else { return title }
        return "\(label), \(title)"
    }

    /// A disabled button dims its label at half under `PlainButtonStyle`: the
    /// boxed form draws its own greyed state, so it asks for no such thing.
    private struct BoxedButtonStyle: ButtonStyle {
        func makeBody(configuration: Configuration) -> some View { configuration.label }
    }

    @ViewBuilder private var button: some View {
        if isBoxed {
            Button(action: toggle) { boxedRow }
                .buttonStyle(BoxedButtonStyle())
                .disabled(isInert)
        } else {
            Button(action: toggle) { defaultRow }
                .buttonStyle(PlainButtonStyle())
                .disabled(isInert)
        }
    }

    public var body: some View {
        let busyLabel = loading ? loadingLabel : nil
        #if os(iOS)
        if #available(iOS 18.0, *) {
            // VoiceOver is given the UIKit element laid over the trigger
            // instead, as React's trigger has `aria-expanded`: it says
            // "collapsed" or "expanded" in the visitor's own language, which
            // SwiftUI has no modifier for. Touches still reach the button
            // underneath. Before iOS 18 UIKit has no such status either, and
            // VoiceOver hears the button itself, as it always has.
            //
            // The button's accessibility is replaced by nothing, so the
            // element is the trigger's one button for VoiceOver and for
            // XCUITest alike. `.accessibilityHidden(true)` hid it from
            // VoiceOver only: XCUITest still found it, with its title and
            // its chevron, beside the element, and `app.buttons["Hours"]`
            // matched two (measured, iOS 26.5).
            button
                .accessibilityRepresentation { EmptyView() }
                .overlay(KozmosAccordionTriggerElement(
                    label: spokenLabel,
                    identifier: identifier,
                    isExpanded: isExpanded,
                    isEnabled: !isInert,
                    busyLabel: busyLabel,
                    toggle: toggle
                ))
        } else {
            button.modifier(KozmosAccordionTriggerIdentifier(identifier: identifier, busyLabel: busyLabel))
        }
        #else
        button.modifier(KozmosAccordionTriggerIdentifier(identifier: identifier, busyLabel: busyLabel))
        #endif
        if !isBoxed {
            // The rule is decoration, as React's item border.
            Divider().overlay(KozmosColors.semanticsBorderSubtle)
                .accessibilityHidden(true)
        }
    }
}

/// The trigger's identifier on its button, where the button is what
/// VoiceOver and XCUITest read; nothing where it has none. And what it says
/// while loading, as the value iOS has in place of a busy state.
private struct KozmosAccordionTriggerIdentifier: ViewModifier {
    let identifier: String?
    let busyLabel: String?

    @ViewBuilder func body(content: Content) -> some View {
        switch (identifier, busyLabel) {
        case let (identifier?, busyLabel?):
            content.accessibilityIdentifier(identifier).accessibilityValue(busyLabel)
        case let (identifier?, nil):
            content.accessibilityIdentifier(identifier)
        case let (nil, busyLabel?):
            content.accessibilityValue(busyLabel)
        case (nil, nil):
            content
        }
    }
}

#if os(iOS)
import UIKit

/// The accordion trigger as VoiceOver hears it from iOS 18: a button named by
/// its title that says whether its panel is open, through UIKit's
/// `accessibilityExpandedStatus`. It takes no touches, which reach the SwiftUI
/// button underneath, and acts only for VoiceOver: activation opens or closes
/// the panel. The floor switcher's tile is given to VoiceOver the same way.
/// Disabled or loading it is dimmed and acts for nothing, and loading it says
/// so as its value, which is what iOS has in place of a busy state.
@available(iOS 18.0, *)
struct KozmosAccordionTriggerElement: UIViewRepresentable {
    let label: String
    let identifier: String?
    let isExpanded: Bool
    var isEnabled = true
    var busyLabel: String?
    let toggle: () -> Void

    func makeUIView(context: Context) -> ElementView { ElementView() }

    func updateUIView(_ view: ElementView, context: Context) {
        view.accessibilityLabel = label
        view.accessibilityIdentifier = identifier
        view.accessibilityValue = busyLabel
        view.accessibilityTraits = isEnabled ? .button : [.button, .notEnabled]
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
            guard !accessibilityTraits.contains(.notEnabled) else { return false }
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
    @Environment(\.kozmosAccordionVariant) private var variant
    
    public init(value: String, selection: Binding<String?>, @ViewBuilder content: () -> Content) {
        self.value = value
        self._selection = selection
        self.content = content()
    }
    
    public var body: some View {
        if selection == value {
            if variant == .boxed {
                // In the page's flow under its header, 8 below it.
                content
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.top, KozmosDimensions.primitivesLayoutSpacing100)
            } else {
                content
                    .padding(.horizontal, KozmosDimensions.primitivesLayoutSpacing200)
                    .padding(.vertical, KozmosDimensions.primitivesLayoutSpacing100)
            }
        }
    }
}
