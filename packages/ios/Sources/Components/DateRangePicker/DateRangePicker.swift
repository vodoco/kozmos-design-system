import SwiftUI

public struct KozmosDateRangePicker: View {
    @Binding public var startDate: Date
    @Binding public var endDate: Date

    public let label: String?
    public let startLabel: String
    public let endLabel: String
    public let helperText: String?
    public let disabled: Bool
    public let readOnly: Bool
    public let status: KozmosInputStatus
    public let showsCalendarPreview: Bool
    /// The earliest and latest days either end may take, as React's `min` and `max`.
    public let minimumDate: Date?
    public let maximumDate: Date?
    @Environment(\.locale) private var locale
    @Environment(\.calendar) private var calendar
    @Environment(\.timeZone) private var timeZone

    public init(
        startDate: Binding<Date> = .constant(Date(timeIntervalSince1970: 1_769_299_200)),
        endDate: Binding<Date> = .constant(Date(timeIntervalSince1970: 1_769_644_800)),
        label: String? = nil,
        startLabel: String = "Start date",
        endLabel: String = "End date",
        helperText: String? = nil,
        disabled: Bool = false,
        readOnly: Bool = false,
        status: KozmosInputStatus = .default,
        showsCalendarPreview: Bool = false,
        minimumDate: Date? = nil,
        maximumDate: Date? = nil
    ) {
        self._startDate = startDate
        self._endDate = endDate
        self.label = label
        self.startLabel = startLabel
        self.endLabel = endLabel
        self.helperText = helperText
        self.disabled = disabled
        self.readOnly = readOnly
        self.status = status
        self.showsCalendarPreview = showsCalendarPreview
        self.minimumDate = minimumDate
        self.maximumDate = maximumDate
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing75) {
            if let label = label {
                Text(label)
                    .font(.subheadline.weight(.semibold))
                    .foregroundColor(labelColor)
            }

            HStack(alignment: .top, spacing: KozmosDimensions.primitivesLayoutSpacing150) {
                // Each end bounds the other, as React's do: the start no
                // later than the end, the end no earlier than the start.
                KozmosTemporalField(
                    selection: $startDate, label: startLabel, helperText: nil, status: status,
                    disabled: disabled, readOnly: readOnly,
                    minimumDate: minimumDate, maximumDate: Self.earlier(endDate, maximumDate),
                    components: .date, iconName: "calendar"
                )
                KozmosTemporalField(
                    selection: $endDate, label: endLabel, helperText: nil, status: status,
                    disabled: disabled, readOnly: readOnly,
                    minimumDate: Self.later(startDate, minimumDate), maximumDate: maximumDate,
                    components: .date, iconName: "calendar"
                )
            }

            if showsCalendarPreview {
                rangePreview
            }

            if let helperText = helperText, !helperText.isEmpty {
                Text(helperText)
                    .font(KozmosTypography.subheadline)
                    .foregroundColor(helperTextColor)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    /// The range as the locale writes an interval, its own separator and
    /// order: it was `en_US_POSIX` "MMM d, yyyy" with a fixed English "to"
    /// until 2026-10-21.
    private var rangePreview: some View {
        Text(summary)
            .font(.caption.weight(.semibold))
            .foregroundColor(disabled ? KozmosColors.primitivesColorsForeground500 : KozmosColors.primitivesColorsForeground0)
            .padding(KozmosDimensions.primitivesLayoutSpacing150)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(KozmosColors.primitivesColorsBackground0)
            .clipShape(RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl))
            .overlay(
                RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl)
                    .stroke(KozmosColors.semanticsBorderInput, lineWidth: 1)
            )
    }

    private var labelColor: Color {
        if disabled { return KozmosColors.primitivesColorsForeground500 }
        switch status {
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

    private var helperTextColor: Color {
        if disabled { return KozmosColors.primitivesColorsForeground500 }
        switch status {
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

    var summary: String {
        var style = Date.IntervalFormatStyle(date: .abbreviated, time: .omitted)
        style.locale = locale
        style.calendar = calendar
        style.timeZone = timeZone
        return (min(startDate, endDate)..<max(startDate, endDate)).formatted(style)
    }

    static func earlier(_ a: Date, _ b: Date?) -> Date { b.map { min(a, $0) } ?? a }
    static func later(_ a: Date, _ b: Date?) -> Date { b.map { max(a, $0) } ?? a }
}
