import SwiftUI

/// A Kozmos field around the system date or time picker (decision 104): the
/// label above it, the field with Kozmos's icon and the picker, and the
/// helper below, coloured by the status, as React's pickers sit in its
/// `FieldWrapper`. iOS keeps its own picker, which opens the system calendar
/// or the time wheels.
///
/// The picker carries the field's name and its helper as its hint, as React's
/// input takes its label and `aria-describedby`; the drawn label and helper
/// are not said apart from it, so VoiceOver hears each once.
struct KozmosTemporalField: View {
    @Binding var selection: Date
    let label: String
    let helperText: String?
    let status: KozmosInputStatus
    let disabled: Bool
    let readOnly: Bool
    let minimumDate: Date?
    let maximumDate: Date?
    let components: DatePickerComponents
    let iconName: String

    var body: some View {
        VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing75) {
            if !label.isEmpty {
                Text(label)
                    .font(.subheadline.weight(.semibold))
                    .foregroundColor(KozmosTemporalFieldColors.label(status: status, disabled: disabled))
                    .accessibilityHidden(true)
            }
            KozmosTemporalFieldBox(
                selection: $selection, label: label, hint: helperText, status: status, disabled: disabled,
                readOnly: readOnly, minimumDate: minimumDate, maximumDate: maximumDate,
                components: components, iconName: iconName
            )
            if let helperText, !helperText.isEmpty {
                Text(helperText)
                    .font(KozmosTypography.subheadline)
                    .foregroundColor(KozmosTemporalFieldColors.helper(status: status, disabled: disabled))
                    .fixedSize(horizontal: false, vertical: true)
                    .accessibilityHidden(true)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

/// The field itself: Kozmos's icon and the system's compact picker on the
/// field's fill, in a border the status colours, 44pt tall and growing with
/// its text.
struct KozmosTemporalFieldBox: View {
    @Binding var selection: Date
    let label: String
    let hint: String?
    let status: KozmosInputStatus
    let disabled: Bool
    let readOnly: Bool
    let minimumDate: Date?
    let maximumDate: Date?
    let components: DatePickerComponents
    let iconName: String

    var body: some View {
        HStack(spacing: KozmosDimensions.primitivesLayoutSpacing100) {
            // Kozmos's icon in the field's muted ink, as React's field draws it.
            KozmosIcon(iconName, size: .sm)
                .environment(\.kozmosIconHostInk, disabled ? KozmosColors.primitivesColorsForeground500 : KozmosColors.primitivesColorsForeground400)
            picker
                .datePickerStyle(.compact)
                .labelsHidden()
                .accessibilityHint(hint ?? "")
                .disabled(disabled || readOnly)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(.horizontal, KozmosDimensions.primitivesLayoutSpacing150)
        .frame(maxWidth: .infinity, minHeight: 44, alignment: .center)
        .background((disabled || readOnly) ? KozmosColors.primitivesColorsBackground100 : KozmosColors.primitivesColorsBackground0)
        .clipShape(RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl))
        .overlay(
            RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl)
                .stroke(KozmosTemporalFieldColors.border(status: status), lineWidth: 1)
        )
    }

    /// The system picker, bounded as React's `min` and `max` bound its input.
    @ViewBuilder private var picker: some View {
        switch (minimumDate, maximumDate) {
        case let (minimum?, maximum?) where minimum <= maximum:
            DatePicker(label, selection: $selection, in: minimum...maximum, displayedComponents: components)
        case let (minimum?, nil):
            DatePicker(label, selection: $selection, in: minimum..., displayedComponents: components)
        case let (nil, maximum?):
            DatePicker(label, selection: $selection, in: ...maximum, displayedComponents: components)
        default:
            DatePicker(label, selection: $selection, displayedComponents: components)
        }
    }
}

/// The field's colours by its status, as the other Kozmos fields colour them.
enum KozmosTemporalFieldColors {
    static func label(status: KozmosInputStatus, disabled: Bool) -> Color {
        if disabled { return KozmosColors.primitivesColorsForeground500 }
        return emotion(status) ?? KozmosColors.primitivesColorsForeground100
    }

    /// The muted colour, as `KozmosFieldWrapper`'s helper; disabled, the
    /// disabled text's colour, never darker than the dimmed words beside it.
    static func helper(status: KozmosInputStatus, disabled: Bool) -> Color {
        if disabled { return KozmosColors.primitivesColorsForeground500 }
        return emotion(status) ?? KozmosColors.primitivesColorsForeground400
    }

    static func border(status: KozmosInputStatus) -> Color {
        emotion(status) ?? KozmosColors.primitivesColorsForeground500
    }

    private static func emotion(_ status: KozmosInputStatus) -> Color? {
        switch status {
        case .error: return KozmosColors.primitivesColorsEmotionalDanger600
        case .warning: return KozmosColors.primitivesColorsEmotionalAlert600
        case .success: return KozmosColors.primitivesColorsEmotionalSuccess600
        case .default: return nil
        }
    }
}
