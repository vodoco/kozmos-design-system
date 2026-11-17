import SwiftUI

/// A time in a Kozmos field: the label above, Kozmos's clock icon and the
/// system's compact picker in the field, and the helper below, as React's
/// TimePicker (decision 104). The system picker opens the system time wheels,
/// in the device's 12- or 24-hour clock.
public struct KozmosTimePicker: View {
    @Binding var selection: Date
    let label: String
    let helperText: String?
    let status: KozmosInputStatus
    let disabled: Bool
    let readOnly: Bool
    let minimumDate: Date?
    let maximumDate: Date?
    /// The field stands for several values that differ (GAP-153, GAP-255).
    /// `KozmosMixedValue` has the whole of it.
    let mixed: Bool
    let mixedLabel: String
    let onResetMixed: (() -> Void)?
    let resetMixedLabel: String

    /// `minimumDate` and `maximumDate` bound the picker, as React's `min` and
    /// `max`. The label is drawn above the field and names the picker for
    /// VoiceOver; empty, the field draws none. It was hidden until 2026-10-21.
    public init(
        selection: Binding<Date>,
        label: String = "",
        helperText: String? = nil,
        status: KozmosInputStatus = .default,
        disabled: Bool = false,
        readOnly: Bool = false,
        minimumDate: Date? = nil,
        maximumDate: Date? = nil,
        mixed: Bool = false,
        mixedLabel: String = KozmosMixedValue.label,
        onResetMixed: (() -> Void)? = nil,
        resetMixedLabel: String = KozmosMixedValue.resetLabel
    ) {
        self._selection = selection
        self.label = label
        self.helperText = helperText
        self.status = status
        self.disabled = disabled
        self.readOnly = readOnly
        self.minimumDate = minimumDate
        self.maximumDate = maximumDate
        self.mixed = mixed
        self.mixedLabel = mixedLabel
        self.onResetMixed = onResetMixed
        self.resetMixedLabel = resetMixedLabel
    }

    public var body: some View {
        KozmosTemporalField(
            selection: $selection, label: label, helperText: helperText, status: status, disabled: disabled,
            readOnly: readOnly, minimumDate: minimumDate, maximumDate: maximumDate,
            components: .hourAndMinute, iconName: "clock",
            mixed: mixed, mixedLabel: mixedLabel, onResetMixed: onResetMixed, resetMixedLabel: resetMixedLabel
        )
    }
}
