import SwiftUI
import Figma

struct KozmosDateRangePickerConnect: FigmaConnect {
    let component = KozmosDateRangePicker.self
    let figmaNodeUrl = "https://figma.com/design/Yj4O8p6Y9h2Sa9zJVoAiVY?node-id=443-10939"

    @FigmaString("Label Text")
    var label: String = "Date range"

    @FigmaString("Start Label Text")
    var startLabel: String = "Start date"

    @FigmaString("End Label Text")
    var endLabel: String = "End date"

    @FigmaString("Start Value Text")
    var startValue: String = "May 21, 2026"

    @FigmaString("End Value Text")
    var endValue: String = "May 25, 2026"

    @FigmaString("Helper Text")
    var helperText: String = "Choose a date range."

    @FigmaBoolean("Show Helper Text")
    var showHelperText: Bool = false

    @FigmaEnum(
        "State",
        mapping: [
            "Default": "default",
            "Focus": "focus",
            "Disabled": "disabled",
            "Readonly": "readonly",
            "Mixed": "mixed"
        ]
    )
    var state: String = "default"

    // GAP-255: its way back to the several values, once edited.
    @FigmaBoolean("Reset Mixed")
    var resetMixed: Bool = false

    @FigmaString("Mixed Text")
    var mixedLabel: String = "Multiple values"

    @FigmaString("Reset Mixed Text")
    var resetMixedLabel: String = "Reset to multiple values"

    @FigmaEnum(
        "Status",
        mapping: [
            "Default": KozmosInputStatus.`default`,
            "Error": KozmosInputStatus.error,
            "Warning": KozmosInputStatus.warning,
            "Success": KozmosInputStatus.success
        ]
    )
    var status: KozmosInputStatus = .default

    @FigmaEnum(
        "Content",
        mapping: [
            "Closed": false,
            "Open": true
        ]
    )
    var showsCalendarPreview: Bool = false

    var body: some View {
        KozmosDateRangePicker(
            startDate: .constant(figmaDate(self.startValue, fallback: "2026-05-21")),
            endDate: .constant(figmaDate(self.endValue, fallback: "2026-05-25")),
            label: self.label,
            startLabel: self.startLabel,
            endLabel: self.endLabel,
            helperText: self.showHelperText ? self.helperText : nil,
            disabled: self.state == "disabled",
            readOnly: self.state == "readonly",
            status: self.status,
            showsCalendarPreview: self.showsCalendarPreview,
            mixed: self.state == "mixed",
            mixedLabel: self.mixedLabel,
            onResetMixed: self.resetMixed ? {} : nil,
            resetMixedLabel: self.resetMixedLabel
        )
    }
}

private func figmaDate(_ value: String, fallback: String) -> Date {
    for formatter in [figmaIsoDateFormatter, figmaDisplayDateFormatter] {
        if let date = formatter.date(from: value) {
            return date
        }
    }
    return figmaIsoDateFormatter.date(from: fallback) ?? Date()
}

private let figmaIsoDateFormatter: DateFormatter = {
    let formatter = DateFormatter()
    formatter.dateFormat = "yyyy-MM-dd"
    formatter.locale = Locale(identifier: "en_US_POSIX")
    formatter.timeZone = TimeZone(secondsFromGMT: 0)
    return formatter
}()

private let figmaDisplayDateFormatter: DateFormatter = {
    let formatter = DateFormatter()
    formatter.dateFormat = "MMM d, yyyy"
    formatter.locale = Locale(identifier: "en_US_POSIX")
    formatter.timeZone = TimeZone(secondsFromGMT: 0)
    return formatter
}()
