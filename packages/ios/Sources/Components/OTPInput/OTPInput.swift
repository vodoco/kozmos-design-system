import SwiftUI
#if canImport(UIKit)
import UIKit
#elseif canImport(AppKit)
import AppKit
#endif

/// A segmented numeric code field: one text field holds the whole code, and
/// the cells are drawn from it, as Compose's is.
///
/// Every edit goes through that one field, typed, deleted, pasted, filled by
/// the keyboard's one-time code, from a hardware keyboard or from VoiceOver.
/// Any decimal digit is taken, as its ASCII digit ("٣" is 3), and nothing
/// else, up to `length`. A paste or a one-time code replaces the code,
/// whatever its length, as React's paste does. The code is the host's: the
/// field passes each edit on through `value`, and draws what the host puts
/// there. Until the host changes `value`, the cells keep the code the user
/// entered, as React's do.
///
/// VoiceOver hears one text field, named by `label` ("Verification code"
/// without one), with the code as its value and `digitCountLabel(length)`,
/// "6 digits" unless the product gives its own words, as its hint. React
/// names each cell instead, "Digit 1 of 6". Read-only, the field is not
/// dimmed: it can be focused and read, and takes no edit. Disabled, it is
/// dimmed.
public struct KozmosOTPInput: View {
    @Binding var value: String
    let length: Int
    let label: String?
    let disabled: Bool
    let readOnly: Bool
    let status: KozmosInputStatus
    let error: Bool
    let helperText: String?
    let errorMessage: String?
    /// The words VoiceOver hears as the field's hint, for its number of cells.
    let digitCountLabel: (Int) -> String
    /// The code the field holds and the cells draw: the user's last edit, or
    /// what the host last put in `value`, kept to digits and `length`.
    @State private var code: String
    @State private var isFocused = false
    /// When the caret last moved, so it shows at once after an edit and then
    /// blinks, as a text field's caret does.
    @State private var caretEpoch = Date()
    /// The caret's height, as UIKit gives a text field's caret in the cells'
    /// font: the field reports it once laid out.
    @State private var caretHeight: CGFloat?
    /// The product's analytics: `otp_code_completed`, as React's OTPInput sends it.
    @Environment(\.kozmosAnalytics) private var trackEvent
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize

    public init(
        length: Int = 6,
        value: Binding<String>,
        label: String? = nil,
        disabled: Bool = false,
        readOnly: Bool = false,
        status: KozmosInputStatus = .default,
        error: Bool = false,
        helperText: String? = nil,
        errorMessage: String? = nil,
        digitCountLabel: @escaping (Int) -> String = { $0 == 1 ? "1 digit" : "\($0) digits" }
    ) {
        self._value = value
        self.length = max(length, 1)
        self.label = label
        self.disabled = disabled
        self.readOnly = readOnly
        self.status = status
        self.error = error
        self.helperText = helperText
        self.errorMessage = errorMessage
        self.digitCountLabel = digitCountLabel
        self._code = State(initialValue: Self.sanitize(value.wrappedValue, length: max(length, 1)))
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing75) {
            if let label = label {
                Text(label)
                    .font(.subheadline.weight(.semibold))
                    .foregroundColor(labelColor)
                    // The field says it: it is the field's name. Replaced by
                    // nothing, not hidden, so XCUITest finds no second element.
                    .accessibilityRepresentation { EmptyView() }
            }

            HStack(spacing: KozmosDimensions.primitivesLayoutSpacing100) {
                ForEach(0..<length, id: \.self) { index in
                    cell(index)
                }
            }
            // The cells are the field's drawing: the field is the element.
            .accessibilityRepresentation { EmptyView() }
            .overlay(field)

            if let supportingText = supportingText, !supportingText.isEmpty {
                Text(supportingText)
                    .font(KozmosTypography.subheadline)
                    .foregroundColor(supportingTextColor)
            }
        }
        // A code the host sets is drawn, and is never the user's edit.
        .onChange(of: value) { newValue in
            let next = Self.sanitize(newValue, length: length)
            if next != code { code = next }
        }
        .onChange(of: length) { newLength in
            code = Self.sanitize(value, length: max(newLength, 1))
        }
    }

    // MARK: The code

    /// The code in `text`: each decimal digit, in any script, as its ASCII
    /// digit ("٣" and "३" are 3), and nothing else, at most `length` of them.
    /// Compose keeps the same rule, so the host always receives ASCII.
    static func sanitize(_ text: String, length: Int) -> String {
        String(text.compactMap(asciiDigit).prefix(length))
    }

    private static func asciiDigit(_ character: Character) -> Character? {
        guard character.unicodeScalars.count == 1, let scalar = character.unicodeScalars.first,
              scalar.properties.numericType == .decimal,
              let value = scalar.properties.numericValue, value >= 0, value <= 9 else { return nil }
        return Character(String(Int(value)))
    }

    /// The user's edit, from the one field, from the code it held to the
    /// code it holds now. It is passed on to the host through `value`, and
    /// analytics hears a code completed, as React's OTPInput does: once, when
    /// the edit fills the last empty cell. An edit to a full code is no new
    /// completion; a code the host sets never comes this way; and a code a
    /// shorter `length` makes full was entered by no one.
    private func edit(from before: String, to after: String) {
        guard !disabled && !readOnly, after != before else { return }
        code = after
        value = after
        caretEpoch = Date()
        if before.count < length && after.count == length {
            trackEvent(KozmosAnalyticsEvent(eventName: "otp_code_completed", component: "OTPInput",
                                            properties: ["length": length]))
        }
    }

    // MARK: Drawing

    /// The cell the next digit goes to, or the last when the code is full.
    private var activeIndex: Int { min(code.count, length - 1) }

    private func digit(at index: Int) -> String? {
        guard index < code.count else { return nil }
        return String(code[code.index(code.startIndex, offsetBy: index)])
    }

    private func cell(_ index: Int) -> some View {
        let active = isFocused && index == activeIndex && !disabled && !readOnly
        let digit = digit(at: index)
        return ZStack {
            // The digit's line box is centred in the cell, as Figma's painter
            // centres it (auto layout CENTER, the text's line height).
            if let digit = digit {
                Text(digit)
                    .overlay(alignment: .trailing) {
                        if active {
                            caret.alignmentGuide(.trailing) { $0[.leading] }
                        }
                    }
            } else if active {
                caret
            }
        }
        .frame(width: 44, height: 50)
        .background(cellBackgroundColor)
        .cornerRadius(KozmosDimensions.semanticsRadiusControl)
        .overlay(
            RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl)
                .stroke(cellBorderColor(active: active), lineWidth: active ? 2 : 1)
        )
        .font(.subheadline.weight(.semibold))
        .foregroundColor(textColor)
    }

    /// The text field's caret, drawn where the next digit goes: 2 wide, in
    /// the tint, as tall as UIKit makes a text field's caret in the cells'
    /// font (the line's height until the field reports it), centred on the
    /// line. The field itself draws nothing.
    private var caret: some View {
        let height = caretHeight ?? Self.lineHeight(for: dynamicTypeSize)
        return TimelineView(.periodic(from: caretEpoch, by: 0.5)) { context in
            let phase = Int(max(0, context.date.timeIntervalSince(caretEpoch)) / 0.5)
            RoundedRectangle(cornerRadius: 1)
                .fill(Color.accentColor)
                .frame(width: 2, height: height)
                .opacity(phase % 2 == 0 ? 1 : 0)
        }
        .frame(width: 2, height: height)
    }

    /// The cells' font's line height: the caret's height before the field
    /// reports UIKit's.
    private static func lineHeight(for size: DynamicTypeSize) -> CGFloat {
        #if canImport(UIKit)
        return cellFont(for: size).lineHeight
        #else
        return NSFont.preferredFont(forTextStyle: .subheadline).boundingRectForFont.height
        #endif
    }

    #if canImport(UIKit)
    /// The cells' font as UIKit names it: the subheadline style, semibold, at
    /// the view's Dynamic Type size.
    static func cellFont(for size: DynamicTypeSize) -> UIFont {
        let traits = UITraitCollection(preferredContentSizeCategory: UIContentSizeCategory(size))
        let style = UIFont.preferredFont(forTextStyle: .subheadline, compatibleWith: traits)
        return UIFont.systemFont(ofSize: style.pointSize, weight: .semibold)
    }
    #endif

    // MARK: The field

    private var accessibilityName: String { label ?? "Verification code" }

    private var accessibilityHint: String { digitCountLabel(length) }

    @ViewBuilder
    private var field: some View {
        #if canImport(UIKit)
        KozmosOTPField(
            code: code,
            length: length,
            enabled: !disabled,
            readOnly: readOnly,
            label: accessibilityName,
            hint: accessibilityHint,
            font: Self.cellFont(for: dynamicTypeSize),
            isFocused: $isFocused,
            caretHeight: $caretHeight,
            onFocus: { caretEpoch = Date() },
            onEdit: edit(from:to:)
        )
        // SwiftUI's own element for the field reads this, not the UIKit
        // field's: disabled, VoiceOver and XCUITest hear it dimmed.
        .disabled(disabled)
        #else
        TextField("", text: Binding(
            get: { code },
            set: { edit(from: code, to: Self.sanitize($0, length: length)) }
        ))
        .textFieldStyle(.plain)
        .foregroundColor(.clear)
        .disabled(disabled)
        .accessibilityLabel(accessibilityName)
        .accessibilityHint(accessibilityHint)
        #endif
    }

    // MARK: Colours

    private var effectiveStatus: KozmosInputStatus {
        error ? .error : status
    }

    private var supportingText: String? {
        errorMessage ?? helperText
    }

    private var cellBackgroundColor: Color {
        (disabled || readOnly) ? KozmosColors.primitivesColorsBackground100 : KozmosColors.primitivesColorsBackground0
    }

    private func cellBorderColor(active: Bool) -> Color {
        // The active cell's edge is a ring on a surface: theme 600, as
        // every focus ring is (decision 59).
        if active {
            return KozmosColors.primitivesColorsTheme600
        }

        switch effectiveStatus {
        case .error:
            return KozmosColors.primitivesColorsEmotionalDanger600
        case .warning:
            return KozmosColors.primitivesColorsEmotionalAlert600
        case .success:
            return KozmosColors.primitivesColorsEmotionalSuccess600
        case .default:
            return KozmosColors.primitivesColorsForeground500
        }
    }

    private var labelColor: Color {
        if disabled { return KozmosColors.primitivesColorsForeground500 }
        switch effectiveStatus {
        case .error:
            return KozmosColors.primitivesColorsEmotionalDanger600
        case .warning:
            return KozmosColors.primitivesColorsEmotionalAlert600
        case .success:
            return KozmosColors.primitivesColorsEmotionalSuccess600
        case .default:
            return KozmosColors.primitivesColorsForeground100
        }
    }

    private var supportingTextColor: Color {
        if disabled { return KozmosColors.primitivesColorsForeground500 }
        switch effectiveStatus {
        case .error:
            return KozmosColors.primitivesColorsEmotionalDanger600
        case .warning:
            return KozmosColors.primitivesColorsEmotionalAlert600
        case .success:
            return KozmosColors.primitivesColorsEmotionalSuccess600
        case .default:
            return KozmosColors.primitivesColorsForeground400
        }
    }

    private var textColor: Color {
        if disabled { return KozmosColors.primitivesColorsForeground500 }
        switch effectiveStatus {
        case .error:
            return KozmosColors.primitivesColorsEmotionalDanger600
        case .warning:
            return KozmosColors.primitivesColorsEmotionalAlert600
        case .success:
            return KozmosColors.primitivesColorsEmotionalSuccess600
        case .default:
            return KozmosColors.primitivesColorsForeground0
        }
    }
}

#if canImport(UIKit)
/// The one text field, laid over the cells and drawing nothing itself: no
/// text, no caret, no selection. It is a `UITextField` because SwiftUI's
/// `TextField` cannot hold the code the cells draw. Measured on iOS 26.5 with
/// a binding kept to six digits: typing 1234567 left 1234567 in the field
/// with the code at 123456, so the next Backspace deleted the hidden seventh
/// digit and nothing seen; and a tap at the field's start put the caret
/// there, so a 9 made 912345 (it has no selection to set before iOS 18).
/// Here the delegate makes every edit itself: the caret stays at the end, and
/// the field holds exactly the code the cells draw.
struct KozmosOTPField: UIViewRepresentable {
    let code: String
    let length: Int
    /// Not disabled: the field takes the focus and is read, not dimmed.
    let enabled: Bool
    /// Focused and read, never edited: as React's read-only cells.
    let readOnly: Bool
    let label: String
    let hint: String
    /// The cells' font, so UIKit's caret is measured in it.
    let font: UIFont
    @Binding var isFocused: Bool
    @Binding var caretHeight: CGFloat?
    let onFocus: () -> Void
    let onEdit: (_ before: String, _ after: String) -> Void

    func makeCoordinator() -> Coordinator { Coordinator(self) }

    func makeUIView(context: Context) -> KozmosOTPTextField {
        let field = KozmosOTPTextField()
        field.delegate = context.coordinator
        field.pasteDelegate = context.coordinator
        field.keyboardType = .numberPad
        field.textContentType = .oneTimeCode
        field.autocorrectionType = .no
        field.spellCheckingType = .no
        field.smartInsertDeleteType = .no
        field.borderStyle = .none
        field.backgroundColor = .clear
        field.textColor = .clear
        field.tintColor = .clear
        field.setContentHuggingPriority(.defaultLow, for: .horizontal)
        field.setContentCompressionResistancePriority(.defaultLow, for: .horizontal)
        return field
    }

    func updateUIView(_ field: KozmosOTPTextField, context: Context) {
        context.coordinator.parent = self
        if field.text != code { field.text = code }
        field.isEnabled = enabled
        field.isReadOnly = readOnly
        if field.font != font { field.font = font }
        field.onCaretHeight = { height in
            guard caretHeight != height else { return }
            DispatchQueue.main.async { caretHeight = height }
        }
        // Said outright, so VoiceOver is given them however UIKit's own
        // accessibility is loaded: the field's name, the code and its length.
        field.isAccessibilityElement = true
        field.accessibilityLabel = label
        field.accessibilityValue = code
        field.accessibilityHint = hint
    }

    func sizeThatFits(_ proposal: ProposedViewSize, uiView: KozmosOTPTextField, context: Context) -> CGSize? {
        CGSize(width: proposal.width ?? 0, height: proposal.height ?? 50)
    }

    final class Coordinator: NSObject, UITextFieldDelegate, UITextPasteDelegate {
        var parent: KozmosOTPField

        init(_ parent: KozmosOTPField) { self.parent = parent }

        func textField(_ textField: UITextField, shouldChangeCharactersIn range: NSRange,
                       replacementString string: String) -> Bool {
            // Read-only: no edit at all, typed or deleted. (A paste comes
            // through `performPasteOf` below.)
            if parent.readOnly { return false }
            let before = textField.text ?? ""
            let after: String
            if string.count > 1 {
                // The keyboard's one-time code, or more than one character at
                // once: the whole code, as a paste replaces it.
                after = KozmosOTPInput.sanitize(string, length: parent.length)
                if after.isEmpty { return false }
            } else {
                let held = before as NSString
                guard range.location != NSNotFound, NSMaxRange(range) <= held.length else { return false }
                after = KozmosOTPInput.sanitize(held.replacingCharacters(in: range, with: string), length: parent.length)
            }
            if after != before {
                textField.text = after
                parent.onEdit(before, after)
            }
            KozmosOTPTextField.moveCaretToEnd(textField)
            return false
        }

        /// A paste, from the edit menu or a keyboard's Paste, whatever its
        /// length: it replaces the code, as React's paste does. UIKit loads
        /// the pasteboard after Paste is chosen and hands the text here. One
        /// with no digit in it, or any paste while read-only, changes nothing.
        func textPasteConfigurationSupporting(_ textPasteConfigurationSupporting: UITextPasteConfigurationSupporting,
                                              performPasteOf attributedString: NSAttributedString,
                                              to textRange: UITextRange) -> UITextRange {
            guard let field = textPasteConfigurationSupporting as? UITextField else { return textRange }
            let before = field.text ?? ""
            let after = KozmosOTPInput.sanitize(attributedString.string, length: parent.length)
            if !parent.readOnly, !after.isEmpty, after != before {
                field.text = after
                parent.onEdit(before, after)
            }
            let end = field.endOfDocument
            return field.textRange(from: end, to: end) ?? textRange
        }

        func textFieldDidBeginEditing(_ textField: UITextField) {
            KozmosOTPTextField.moveCaretToEnd(textField)
            let parent = parent
            DispatchQueue.main.async {
                parent.isFocused = true
                parent.onFocus()
            }
        }

        func textFieldDidEndEditing(_ textField: UITextField) {
            let parent = parent
            DispatchQueue.main.async { parent.isFocused = false }
        }

        func textFieldDidChangeSelection(_ textField: UITextField) {
            guard let selection = textField.selectedTextRange,
                  selection.start != textField.endOfDocument || !selection.isEmpty else { return }
            KozmosOTPTextField.moveCaretToEnd(textField)
        }
    }
}

/// A text field whose caret is always after the last digit: a tap anywhere
/// over the cells puts it there, and only Paste is offered. Read-only, it
/// still takes the focus, with no keyboard, and offers nothing.
final class KozmosOTPTextField: UITextField {
    var isReadOnly = false {
        didSet {
            guard isReadOnly != oldValue else { return }
            // No keyboard while read-only: the field is focused and read only.
            inputView = isReadOnly ? UIView() : nil
            if isFirstResponder { reloadInputViews() }
        }
    }
    /// Called with UIKit's caret height in the field's font, once laid out.
    var onCaretHeight: ((CGFloat) -> Void)?

    static func moveCaretToEnd(_ field: UITextField) {
        let end = field.endOfDocument
        if field.selectedTextRange?.start != end || field.selectedTextRange?.isEmpty == false {
            field.selectedTextRange = field.textRange(from: end, to: end)
        }
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        let caret = caretRect(for: endOfDocument)
        if caret.height > 0 { onCaretHeight?(caret.height) }
    }

    override func closestPosition(to point: CGPoint) -> UITextPosition? { endOfDocument }

    override func closestPosition(to point: CGPoint, within range: UITextRange) -> UITextPosition? { endOfDocument }

    override func selectionRects(for range: UITextRange) -> [UITextSelectionRect] { [] }

    override func canPerformAction(_ action: Selector, withSender sender: Any?) -> Bool {
        action == #selector(UIResponderStandardEditActions.paste(_:)) && !isReadOnly
            ? super.canPerformAction(action, withSender: sender)
            : false
    }
}
#endif
