import SwiftUI
#if canImport(UIKit)
import UIKit
#elseif canImport(AppKit)
import AppKit
#endif

public enum KozmosInputStatus {
    case `default`
    case error
    case warning
    case success
}

/// A button inside the field's end (GAP-154, decision 137), drawn as
/// PasswordInput's reveal is: as tall as the field, its target.
public enum KozmosInputAction {
    /// Copies the field's value and says so: "Copied" is announced and a
    /// check stands in for the copy icon for two seconds. For a read-only
    /// value a product shows and never edits, a feature's ID; it copies from
    /// a read-only field too.
    case copy(label: String = "Copy", copiedLabel: String = "Copied", onCopy: ((String) -> Void)? = nil)
    /// A pressed button with its own name, as the reveal is: the Featured
    /// star at a field's end. `icon` is the product's image, drawn at 16 in the
    /// button's colour, `Image(systemName: "star")`. Pressed, it is
    /// drawn as a pressed ToggleButton is, the theme fill under the icon in a
    /// shape inside the button (decisions 164 and 165), so pressed is a shape
    /// and not a colour alone; it is selected to VoiceOver.
    case toggle(label: String, icon: Image, isPressed: Binding<Bool>)

    /// The button's name.
    var label: String {
        switch self {
        case .copy(let label, _, _): return label
        case .toggle(let label, _, _): return label
        }
    }
}

/// The button at a field's end: what decision 164 draws inside it, 4 in from
/// its edges, 36 across in a 44 field, with the control radius less 4.
enum KozmosFieldAction {
    static let inset: CGFloat = 4
    static var fillCornerRadius: CGFloat { max(0, KozmosDimensions.semanticsRadiusControl - inset) }
    /// How long the copy's check stays, as the web's.
    static let copiedDuration: TimeInterval = 2
}

public struct KozmosInput: View {
    @Binding var text: String
    let label: String?
    let placeholder: String
    let disabled: Bool
    let readOnly: Bool
    let status: KozmosInputStatus
    let error: Bool
    let helperText: String?
    let errorMessage: String?
    let action: KozmosInputAction?
    /// The copy's check, while it shows: a count, so a second copy restarts it.
    @State private var copiedCount = 0
    /// The field stands for several values that differ, and shows none
    /// (GAP-153): `KozmosMixedValue` has the whole of it.
    let mixed: Bool
    let mixedLabel: String
    let onResetMixed: (() -> Void)?
    let resetMixedLabel: String
    @AccessibilityFocusState private var fieldAccessibilityFocused: Bool
    
    public init(
        text: Binding<String>,
        label: String? = nil,
        placeholder: String = "",
        disabled: Bool = false,
        readOnly: Bool = false,
        status: KozmosInputStatus = .default,
        error: Bool = false,
        helperText: String? = nil,
        errorMessage: String? = nil,
        action: KozmosInputAction? = nil,
        mixed: Bool = false,
        mixedLabel: String = KozmosMixedValue.label,
        onResetMixed: (() -> Void)? = nil,
        resetMixedLabel: String = KozmosMixedValue.resetLabel
    ) {
        self._text = text
        self.label = label
        self.placeholder = placeholder
        self.disabled = disabled
        self.readOnly = readOnly
        self.status = status
        self.error = error
        self.helperText = helperText
        self.errorMessage = errorMessage
        self.action = action
        self.mixed = mixed
        self.mixedLabel = mixedLabel
        self.onResetMixed = onResetMixed
        self.resetMixedLabel = resetMixedLabel
    }
    
    public var body: some View {
        VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing75) {
            if let label = label {
                Text(label)
                    .font(.subheadline.weight(.semibold))
                    .foregroundColor(labelColor)
            }

            HStack(spacing: 0) {
                TextField(mixed ? mixedLabel : placeholder, text: shownText)
                    .accessibilityFocused($fieldAccessibilityFocused)
                    .disabled(disabled || readOnly)
                    .padding(.leading, KozmosDimensions.primitivesLayoutSpacing150)
                    .padding(.trailing, action == nil ? KozmosDimensions.primitivesLayoutSpacing150 : 0)
                if let action {
                    actionButton(action)
                }
            }
                .frame(height: 44, alignment: .center)
                .background(fieldBackgroundColor)
                .clipShape(RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl))
                .overlay(
                    RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl)
                        .stroke(fieldBorderColor, lineWidth: 1)
                )
                .font(KozmosTypography.subheadline)
                .foregroundColor(textColor)

            if KozmosMixedValue.showsReset(mixed: mixed, onReset: onResetMixed, disabled: disabled, readOnly: readOnly) {
                KozmosMixedReset(label: resetMixedLabel) {
                    // The reset goes as the field turns mixed again: VoiceOver
                    // goes to the field, which says its several values.
                    fieldAccessibilityFocused = true
                    onResetMixed?()
                }
            }

            if let supportingText = supportingText, !supportingText.isEmpty {
                Text(supportingText)
                    .font(KozmosTypography.subheadline)
                    .foregroundColor(supportingTextColor)
            }
        }
    }

    /// Mixed, the field shows none of its own text; the visitor's typing
    /// still reaches the product, which clears `mixed`.
    private var shownText: Binding<String> {
        Binding(get: { mixed ? "" : text }, set: { text = $0 })
    }

    // MARK: - Action (GAP-154)

    private var isCopy: Bool {
        if case .copy = action { return true }
        return false
    }

    /// As tall as the field, 44 square, its target; what it draws is inside
    /// it, 4 in from its edges. Only `disabled` disables it: a read-only
    /// field's value is still there to copy.
    @ViewBuilder
    private func actionButton(_ action: KozmosInputAction) -> some View {
        switch action {
        case .copy(let label, let copiedLabel, let onCopy):
            Button {
                copy(announcing: copiedLabel, onCopy: onCopy)
            } label: {
                Image(systemName: copiedCount > 0 ? "checkmark" : "doc.on.doc")
                    .font(.system(size: 16, weight: .medium))
                    .frame(width: 44, height: 44)
                    .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            // Mixed (GAP-153), there is no value of its own to copy: the copy
            // is disabled, never "Copied" over nothing.
            .disabled(disabled || mixed)
            .foregroundColor(actionColor(pressed: false))
            .accessibilityLabel(label)
        case .toggle(let label, let icon, let isPressed):
            Button {
                isPressed.wrappedValue.toggle()
            } label: {
                icon
                    .renderingMode(.template)
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(actionColor(pressed: isPressed.wrappedValue))
                    .frame(width: 44, height: 44)
                    .background(
                        RoundedRectangle(cornerRadius: KozmosFieldAction.fillCornerRadius)
                            .fill(isPressed.wrappedValue
                                  ? KozmosColors.componentsPrimaryButtonsThemedButtonBackgroundIdle
                                  : Color.clear)
                            .padding(KozmosFieldAction.inset)
                    )
                    .opacity(disabled && isPressed.wrappedValue ? 0.5 : 1)
                    .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .disabled(disabled)
            .accessibilityLabel(label)
            // Pressed is selected, as ToggleButton's and the reveal's are.
            .accessibilityAddTraits(isPressed.wrappedValue ? .isSelected : [])
        }
    }

    private func copy(announcing copiedLabel: String, onCopy: ((String) -> Void)?) {
        guard !mixed else { return }
        let value = text
        #if canImport(UIKit) && !os(watchOS)
        UIPasteboard.general.string = value
        UIAccessibility.post(notification: .announcement, argument: copiedLabel)
        #elseif canImport(AppKit)
        NSPasteboard.general.clearContents()
        NSPasteboard.general.setString(value, forType: .string)
        #endif
        copiedCount += 1
        let count = copiedCount
        DispatchQueue.main.asyncAfter(deadline: .now() + KozmosFieldAction.copiedDuration) {
            if copiedCount == count { copiedCount = 0 }
        }
        onCopy?(value)
    }

    /// The icon's colour: muted at rest, as the reveal's; the theme
    /// foreground on the pressed fill; dimmed when disabled.
    private func actionColor(pressed: Bool) -> Color {
        if pressed { return KozmosColors.componentsPrimaryButtonsThemedButtonForegroundContentIdle }
        if disabled || (mixed && isCopy) { return KozmosColors.primitivesColorsForeground500 }
        return KozmosColors.primitivesColorsForeground400
    }

    private var effectiveStatus: KozmosInputStatus {
        error ? .error : status
    }

    private var supportingText: String? {
        errorMessage ?? helperText
    }

    private var fieldBackgroundColor: Color {
        (disabled || readOnly) ? KozmosColors.primitivesColorsBackground100 : KozmosColors.primitivesColorsBackground0
    }

    private var fieldBorderColor: Color {
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
        if effectiveStatus == .error { return KozmosColors.primitivesColorsEmotionalDanger600 }
        return KozmosColors.primitivesColorsForeground0
    }
}
