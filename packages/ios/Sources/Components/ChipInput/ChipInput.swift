import SwiftUI
#if canImport(UIKit) && !os(watchOS)
import UIKit
#endif

/// The edits a ChipInput makes to its entries, apart from any view, so each
/// rule is the same wherever it is typed: Return or a comma adds the text,
/// trimmed, as an entry; text with commas or line breaks in it (a paste)
/// adds each part before the last and keeps the last typed; an entry already
/// in the field is not added again, and its text stays, so nothing typed is
/// lost unseen; Delete in the empty field removes the last entry.
public enum KozmosChipInputEdit {
    public struct Result: Equatable {
        /// Every entry after the edit.
        public let entries: [String]
        /// The text left in the field.
        public let text: String
        /// The entries the edit added, in order.
        public let added: [String]
        /// The entry that was already in the field, if one was typed again.
        public let duplicate: String?
    }

    static let separators = CharacterSet(charactersIn: ",\n\r")

    /// Typed or pasted text: nil while it holds no comma or line break.
    public static func typed(_ text: String, into entries: [String]) -> Result? {
        guard text.rangeOfCharacter(from: separators) != nil else { return nil }
        var parts = text.components(separatedBy: separators)
        let rest = parts.removeLast()
        return adding(parts, to: entries, rest: String(rest.drop { $0.isWhitespace }))
    }

    /// Return pressed: nil when the field holds only spaces, which leaves
    /// Return to the host.
    public static func submitted(_ text: String, into entries: [String]) -> Result? {
        let entry = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !entry.isEmpty else { return nil }
        return adding([entry], to: entries, rest: "")
    }

    /// Delete in the empty field: nil with no entry to remove.
    public static func deletedInEmptyField(_ entries: [String]) -> [String]? {
        entries.isEmpty ? nil : Array(entries.dropLast())
    }

    static func adding(_ candidates: [String], to entries: [String], rest: String) -> Result {
        var next = entries
        var added: [String] = []
        var duplicate: String?
        for candidate in candidates {
            let entry = candidate.trimmingCharacters(in: .whitespacesAndNewlines)
            guard !entry.isEmpty else { continue }
            if next.contains(entry) {
                duplicate = entry
            } else {
                next.append(entry)
                added.append(entry)
            }
        }
        return Result(entries: next, text: duplicate ?? rest, added: added, duplicate: duplicate)
    }
}

/// A field that takes free text and holds each entry as a removable chip
/// inside it (GAP-222, decision 216), as React's `ChipInput`: keywords,
/// aliases, e-mail addresses. `KozmosMultiSelect` picks only from its
/// options; this takes what the visitor types. Return or a comma adds the
/// text, Delete in the empty field removes the last entry (from the
/// on-screen keyboard too), and each chip has its own remove button, named
/// by `removeLabel`. Each addition and removal is announced in the
/// product's words, and sent to `\.kozmosAnalytics` as React's are:
/// `entry_added` for each entry added and `entry_removed` for each entry
/// removed, each with its `value`.
public struct KozmosChipInput: View {
    @Binding public var values: [String]
    public let label: String?
    public let placeholder: String
    public let disabled: Bool
    public let readOnly: Bool
    public let status: KozmosInputStatus
    public let error: Bool
    public let helperText: String?
    public let errorMessage: String?
    public let removeLabel: (String) -> String
    public let addedLabel: (String) -> String
    public let removedLabel: (String) -> String
    public let duplicateLabel: (String) -> String

    @State private var text: String
    @Environment(\.kozmosAnalytics) private var trackEvent

    public init(
        values: Binding<[String]>,
        label: String? = nil,
        placeholder: String = "",
        disabled: Bool = false,
        readOnly: Bool = false,
        status: KozmosInputStatus = .default,
        error: Bool = false,
        helperText: String? = nil,
        errorMessage: String? = nil,
        initialText: String = "",
        removeLabel: @escaping (String) -> String = { "Remove \($0)" },
        addedLabel: @escaping (String) -> String = { "\($0) added" },
        removedLabel: @escaping (String) -> String = { "\($0) removed" },
        duplicateLabel: @escaping (String) -> String = { "\($0) is already added" }
    ) {
        self._values = values
        self.label = label
        self.placeholder = placeholder
        self.disabled = disabled
        self.readOnly = readOnly
        self.status = status
        self.error = error
        self.helperText = helperText
        self.errorMessage = errorMessage
        self._text = State(initialValue: initialText)
        self.removeLabel = removeLabel
        self.addedLabel = addedLabel
        self.removedLabel = removedLabel
        self.duplicateLabel = duplicateLabel
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing75) {
            if let label {
                Text(label)
                    .font(.subheadline.weight(.semibold))
                    .foregroundColor(labelColor)
                    .accessibilityHidden(true)
            }

            // MultiSelect's field, with no clear and no chevron.
            VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing75) {
                if !values.isEmpty {
                    KozmosChipGroup(spacing: KozmosDimensions.primitivesLayoutSpacing75) {
                        ForEach(values, id: \.self) { entry in
                            KozmosChip(
                                text: entry,
                                size: .sm,
                                selected: true,
                                disabled: locked,
                                removeLabel: removeLabel(entry),
                                onRemove: { remove(entry) }
                            )
                        }
                    }
                }
                entryField
                    .frame(maxWidth: .infinity, minHeight: 36, alignment: .leading)
            }
            .padding(.horizontal, KozmosDimensions.primitivesLayoutSpacing100)
            .padding(.vertical, KozmosDimensions.primitivesLayoutSpacing75)
            .frame(maxWidth: .infinity, minHeight: 44, alignment: .leading)
            .background(fieldBackgroundColor)
            .clipShape(RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl))
            .overlay(
                RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl)
                    .stroke(fieldBorderColor, lineWidth: 1)
            )

            if let supportingText, !supportingText.isEmpty {
                Text(supportingText)
                    .font(KozmosTypography.subheadline)
                    .foregroundColor(supportingTextColor)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    var locked: Bool { disabled || readOnly }

    /// The text field's VoiceOver name: the label, or the placeholder.
    var fieldName: String { label ?? placeholder }

    @ViewBuilder
    private var entryField: some View {
        #if canImport(UIKit) && !os(watchOS)
        KozmosChipInputTextField(
            text: typedText,
            placeholder: values.isEmpty ? placeholder : "",
            enabled: !disabled,
            readOnly: readOnly,
            label: fieldName,
            hint: supportingText ?? "",
            textColor: UIColor(textColor),
            onReturn: submit,
            onDeleteInEmptyField: removeLast
        )
        #else
        TextField(values.isEmpty ? placeholder : "", text: typedText)
            .textFieldStyle(.plain)
            .font(KozmosTypography.subheadline)
            .foregroundColor(textColor)
            .disabled(disabled)
            .onSubmit { _ = submit() }
            .modifier(KozmosChipInputDeleteKey(enabled: !locked, isEmpty: text.isEmpty, removeLast: removeLast))
            .accessibilityLabel(fieldName)
        #endif
    }

    /// The field's text: a comma or a line break in it adds what comes before.
    private var typedText: Binding<String> {
        Binding(
            get: { text },
            set: { next in
                guard !locked else { return }
                if let result = KozmosChipInputEdit.typed(next, into: values) {
                    apply(result)
                } else {
                    text = next
                }
            }
        )
    }

    /// Return: true when it added the text, false to leave it to the host.
    @discardableResult
    private func submit() -> Bool {
        guard !locked, let result = KozmosChipInputEdit.submitted(text, into: values) else { return false }
        apply(result)
        return true
    }

    private func removeLast() {
        guard !locked, let last = values.last, let next = KozmosChipInputEdit.deletedInEmptyField(values) else { return }
        values = next
        announce(removedLabel(last))
        trackRemoved(last)
    }

    private func remove(_ entry: String) {
        guard !locked else { return }
        values.removeAll { $0 == entry }
        announce(removedLabel(entry))
        trackRemoved(entry)
    }

    private func apply(_ result: KozmosChipInputEdit.Result) {
        if result.entries != values { values = result.entries }
        text = result.text
        if let duplicate = result.duplicate {
            announce(duplicateLabel(duplicate))
        } else if !result.added.isEmpty {
            announce(result.added.map(addedLabel).joined(separator: ", "))
        }
        // React's entry_added: one per entry added, never for one already in the field.
        for entry in result.added {
            trackEvent(KozmosAnalyticsEvent(eventName: "entry_added", component: "ChipInput", properties: ["value": entry]))
        }
    }

    /// React's entry_removed, for an entry removed by Delete or its chip's remove.
    private func trackRemoved(_ entry: String) {
        trackEvent(KozmosAnalyticsEvent(eventName: "entry_removed", component: "ChipInput", properties: ["value": entry]))
    }

    private func announce(_ words: String) {
        #if canImport(UIKit) && !os(watchOS)
        UIAccessibility.post(notification: .announcement, argument: words)
        #endif
    }

    private var effectiveStatus: KozmosInputStatus { error ? .error : status }

    private var supportingText: String? { errorMessage ?? helperText }

    private var fieldBackgroundColor: Color {
        locked ? KozmosColors.primitivesColorsBackground100 : KozmosColors.primitivesColorsBackground0
    }

    private var fieldBorderColor: Color {
        switch effectiveStatus {
        case .error: return KozmosColors.primitivesColorsEmotionalDanger600
        case .warning: return KozmosColors.primitivesColorsEmotionalAlert600
        case .success: return KozmosColors.primitivesColorsEmotionalSuccess600
        case .default: return KozmosColors.primitivesColorsForeground500
        }
    }

    private var labelColor: Color {
        if disabled { return KozmosColors.primitivesColorsForeground500 }
        switch effectiveStatus {
        case .error: return KozmosColors.primitivesColorsEmotionalDanger600
        case .warning: return KozmosColors.primitivesColorsEmotionalAlert600
        case .success: return KozmosColors.primitivesColorsEmotionalSuccess600
        case .default: return KozmosColors.primitivesColorsForeground100
        }
    }

    private var supportingTextColor: Color {
        if disabled { return KozmosColors.primitivesColorsForeground500 }
        switch effectiveStatus {
        case .error: return KozmosColors.primitivesColorsEmotionalDanger600
        case .warning: return KozmosColors.primitivesColorsEmotionalAlert600
        case .success: return KozmosColors.primitivesColorsEmotionalSuccess600
        case .default: return KozmosColors.primitivesColorsForeground400
        }
    }

    private var textColor: Color {
        if disabled { return KozmosColors.primitivesColorsForeground500 }
        if effectiveStatus == .error { return KozmosColors.primitivesColorsEmotionalDanger600 }
        return KozmosColors.primitivesColorsForeground0
    }
}

#if canImport(UIKit) && !os(watchOS)
/// The text field. A `UITextField`, because SwiftUI's `TextField` hears no
/// Delete in an empty field from the on-screen keyboard, and the empty
/// field's Delete removes the last entry.
struct KozmosChipInputTextField: UIViewRepresentable {
    @Binding var text: String
    let placeholder: String
    let enabled: Bool
    let readOnly: Bool
    let label: String
    let hint: String
    let textColor: UIColor
    let onReturn: () -> Bool
    let onDeleteInEmptyField: () -> Void

    func makeCoordinator() -> Coordinator { Coordinator(self) }

    func makeUIView(context: Context) -> KozmosChipInputUITextField {
        let field = KozmosChipInputUITextField()
        field.delegate = context.coordinator
        field.addTarget(context.coordinator, action: #selector(Coordinator.edited(_:)), for: .editingChanged)
        field.font = UIFont.preferredFont(forTextStyle: .subheadline)
        field.adjustsFontForContentSizeCategory = true
        field.borderStyle = .none
        field.backgroundColor = .clear
        field.autocorrectionType = .no
        field.autocapitalizationType = .none
        field.returnKeyType = .done
        field.setContentHuggingPriority(.defaultLow, for: .horizontal)
        field.setContentCompressionResistancePriority(.defaultLow, for: .horizontal)
        return field
    }

    func updateUIView(_ field: KozmosChipInputUITextField, context: Context) {
        context.coordinator.parent = self
        if field.markedTextRange == nil, field.text != text { field.text = text }
        field.placeholder = placeholder
        field.isEnabled = enabled
        field.textColor = textColor
        field.onDeleteInEmptyField = { [weak field] in
            guard field?.isReadOnly == false else { return }
            onDeleteInEmptyField()
        }
        field.isReadOnly = readOnly
        // Said outright, so VoiceOver is given them however UIKit's own
        // accessibility is loaded, as OTPInput's field is.
        field.isAccessibilityElement = true
        field.accessibilityLabel = label
        field.accessibilityValue = text
        field.accessibilityHint = hint.isEmpty ? nil : hint
    }

    /// As wide as it is offered, one line tall: a text field otherwise takes
    /// every point of height it is offered.
    func sizeThatFits(_ proposal: ProposedViewSize, uiView: KozmosChipInputUITextField, context: Context) -> CGSize? {
        CGSize(width: proposal.width ?? 0, height: 36)
    }

    final class Coordinator: NSObject, UITextFieldDelegate {
        var parent: KozmosChipInputTextField

        init(_ parent: KozmosChipInputTextField) { self.parent = parent }

        @objc func edited(_ field: UITextField) {
            // Not while a keyboard composes: its marked text is not typed yet.
            guard field.markedTextRange == nil else { return }
            parent.text = field.text ?? ""
        }

        func textField(_ field: UITextField, shouldChangeCharactersIn range: NSRange, replacementString string: String) -> Bool {
            !parent.readOnly
        }

        func textFieldShouldReturn(_ field: UITextField) -> Bool {
            if !parent.onReturn() { field.resignFirstResponder() }
            return false
        }
    }
}

/// Hears Delete in the empty field, which `UITextField` otherwise ignores.
final class KozmosChipInputUITextField: UITextField {
    var onDeleteInEmptyField: (() -> Void)?
    var isReadOnly = false {
        didSet {
            guard isReadOnly != oldValue else { return }
            // Focused and read, with no keyboard, as a read-only field is.
            inputView = isReadOnly ? UIView() : nil
            if isFirstResponder { reloadInputViews() }
        }
    }

    override func deleteBackward() {
        if (text ?? "").isEmpty { onDeleteInEmptyField?() }
        super.deleteBackward()
    }
}
#else
/// Delete in the empty field removes the last entry, from a keyboard.
/// `onKeyPress` is macOS 14.
private struct KozmosChipInputDeleteKey: ViewModifier {
    let enabled: Bool
    let isEmpty: Bool
    let removeLast: () -> Void

    func body(content: Content) -> some View {
        if #available(macOS 14.0, *) {
            content.onKeyPress(.delete) {
                guard enabled, isEmpty else { return .ignored }
                removeLast()
                return .handled
            }
        } else {
            content
        }
    }
}
#endif
