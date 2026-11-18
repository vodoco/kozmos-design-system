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
