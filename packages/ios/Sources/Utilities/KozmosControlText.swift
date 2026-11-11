import SwiftUI
import os

/// The words beside a Checkbox, Switch or default Radio: the label, and under
/// it the description (GAP-162, decision 132), as React's control draws them
/// — the description in the field message's muted ink, foreground/400.
struct KozmosControlText: View {
    let label: String?
    let description: String?
    let labelColor: Color
    let disabled: Bool

    var body: some View {
        if label != nil || description != nil {
            VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing50) {
                if let label = label {
                    Text(label)
                        .font(KozmosTypography.subheadline)
                        .foregroundColor(labelColor)
                }
                if let description = description {
                    KozmosControlDescriptionText(description, disabled: disabled)
                }
            }
            .fixedSize(horizontal: false, vertical: true)
        }
    }
}

/// A control's description line: footnote, foreground/400, foreground/500
/// when the control is disabled.
struct KozmosControlDescriptionText: View {
    let text: String
    let disabled: Bool
    var alignment: TextAlignment = .leading

    init(_ text: String, disabled: Bool, alignment: TextAlignment = .leading) {
        self.text = text
        self.disabled = disabled
        self.alignment = alignment
    }

    var body: some View {
        Text(text)
            .font(KozmosTypography.footnote)
            .foregroundColor(disabled ? KozmosColors.primitivesColorsForeground500 : KozmosColors.primitivesColorsForeground400)
            .multilineTextAlignment(alignment)
    }
}

extension View {
    /// A control with a description is still one element named by its
    /// label. The description is read after the name as the element's
    /// custom content, at high importance, so VoiceOver speaks it by default
    /// whatever the reader's "Speak Hints" setting, as React's
    /// `aria-describedby` is read; it is never part of the name. Its key,
    /// "Description", is looked up in the app's Localizable strings.
    /// Without a description nothing changes, so the name stays what the
    /// control's words, or a caller's own `accessibilityLabel`, make it.
    /// `nameFromLabel` names it by the label even with no description: a
    /// switch drawing its state in words keeps those words out of its name.
    @ViewBuilder
    func kozmosControlDescription(label: String?, description: String?, nameFromLabel: Bool = false) -> some View {
        if let description = description {
            self
                .accessibilityLabel(Text(label ?? ""))
                .accessibilityCustomContent(Text("Description"), Text(description), importance: .high)
        } else if nameFromLabel, let label = label {
            self.accessibilityLabel(Text(label))
        } else {
            self
        }
    }

    /// A two-state control's state, read by VoiceOver: its value is the
    /// state in words (the caller's, English by default), and from iOS 17 it
    /// is a toggle, so VoiceOver says it can be switched.
    @ViewBuilder
    func kozmosToggleState(_ words: String) -> some View {
        if #available(iOS 17, macOS 14, macCatalyst 17, *) {
            self
                .accessibilityValue(Text(words))
                .accessibilityAddTraits(.isToggle)
        } else {
            self.accessibilityValue(Text(words))
        }
    }
}

/// GAP-158: a card or tile with no title is named by nothing. In a debug
/// build Kozmos logs it once, never asserting, and says what to pass.
enum KozmosUntitledOption {
    /// The message for an option drawn as `variant` with `label`, or nil.
    static func warning(variant: KozmosRadioGroupItemVariant, label: String?) -> String? {
        guard variant != .default, (label ?? "").isEmpty else { return nil }
        return "KozmosRadioGroupItem: a \(variant == .card ? "card" : "tile") has no label, so VoiceOver names it by nothing; its description is never its name. Pass label, or .accessibilityLabel(_:) for an icon-only tile."
    }

    static func log(variant: KozmosRadioGroupItemVariant, label: String?) {
        #if DEBUG
        guard let message = warning(variant: variant, label: label) else { return }
        logOnce(message)
        #endif
    }

    #if DEBUG
    private static let logged = KozmosOnceFlag()
    private static func logOnce(_ message: String) {
        guard logged.claim() else { return }
        Logger(subsystem: "com.kozmos", category: "accessibility").debug("\(message, privacy: .public)")
    }
    #endif
}

#if DEBUG
/// A flag claimed once, safely from any thread.
final class KozmosOnceFlag: @unchecked Sendable {
    private let lock = NSLock()
    private var claimed = false
    func claim() -> Bool {
        lock.lock(); defer { lock.unlock() }
        if claimed { return false }
        claimed = true
        return true
    }
}
#endif
