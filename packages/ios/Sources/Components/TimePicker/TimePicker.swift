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
        maximumDate: Date? = nil
    ) {
        self._selection = selection
        self.label = label
        self.helperText = helperText
        self.status = status
        self.disabled = disabled
        self.readOnly = readOnly
        self.minimumDate = minimumDate
        self.maximumDate = maximumDate
    }

    public var body: some View {
        KozmosTemporalField(
            selection: $selection, label: label, helperText: helperText, status: status, disabled: disabled,
            readOnly: readOnly, minimumDate: minimumDate, maximumDate: maximumDate,
            components: .hourAndMinute, iconName: "clock"
        )
    }
}
