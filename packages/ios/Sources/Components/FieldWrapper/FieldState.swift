import SwiftUI

/// What a native field says of its state on the field itself (GAP-235,
/// GAP-236), for VoiceOver.
public enum KozmosFieldState {
    /// Said on a read-only field: UIKit has no read-only trait. A product
    /// that translates passes its own through each field's `readOnlyLabel`.
    public static let readOnlyLabel = "Read only"

    /// The field's hint: what it already says (OTPInput's digit count), then
    /// "Read only" when read only, then its error message while in error, as
    /// React's `aria-describedby` puts the message on the field. UIKit has no
    /// invalid state, so the message is the error. Empty, no hint.
    static func hint(
        readOnly: Bool,
        readOnlyLabel: String,
        inError: Bool,
        errorMessage: String?,
        leading: [String] = []
    ) -> String {
        (leading
            + [readOnly ? readOnlyLabel : nil, inError ? errorMessage : nil].compactMap { $0 })
            .filter { !$0.isEmpty }
            .joined(separator: ". ")
    }
}

/// A read-only field's value (decision 222, GAP-235), drawn in place of the
/// field's text field: at full strength, never dimmed, selectable and
/// copyable, and one VoiceOver element that says the field's name, its
/// value and "Read only", never "dimmed". SwiftUI's text field has no
/// read-only mode, and `.disabled` dims it and keeps its value from being
/// selected. A secure value is drawn as dots and cannot be copied.
struct KozmosReadOnlyValue: View {
    let text: String
    let placeholder: String
    let textColor: Color
    let placeholderColor: Color
    let alignment: Alignment
    let accessibilityName: String
    let hint: String
    var secure: Bool = false

    /// What is drawn: the value, its dots when secure, or the placeholder.
    var shown: String {
        if text.isEmpty { return placeholder }
        return secure ? String(repeating: "\u{2022}", count: text.count) : text
    }

    /// What VoiceOver says as the value: the text, never a secret.
    var spokenValue: String { secure ? "" : text }

    var body: some View {
        Group {
            if secure || text.isEmpty {
                Text(verbatim: shown)
            } else {
                Text(verbatim: shown).textSelection(.enabled)
            }
        }
        .foregroundColor(text.isEmpty ? placeholderColor : textColor)
        .lineLimit(1)
        .truncationMode(.tail)
        .frame(maxWidth: .infinity, alignment: alignment)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(Text(verbatim: accessibilityName))
        .accessibilityValue(Text(verbatim: spokenValue))
        .accessibilityHint(Text(verbatim: hint))
    }
}
