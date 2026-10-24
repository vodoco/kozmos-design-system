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
        showsCalendarPreview: Bool = false
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
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing75) {
            if let label = label {
                Text(label)
                    .font(.subheadline.weight(.semibold))
                    .foregroundColor(labelColor)
            }

            HStack(alignment: .top, spacing: KozmosDimensions.primitivesLayoutSpacing150) {
                KozmosDateRangeField(
                    date: $startDate,
                    label: startLabel,
                    disabled: disabled,
                    readOnly: readOnly,
                    status: status
                )
                KozmosDateRangeField(
                    date: $endDate,
                    label: endLabel,
                    disabled: disabled,
                    readOnly: readOnly,
                    status: status
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

    private var rangePreview: some View {
        HStack(spacing: KozmosDimensions.primitivesLayoutSpacing100) {
            Text(Self.displayFormatter.string(from: startDate))
            // Muted; disabled, the dates' disabled colour, never darker than them.
            Text("to")
                .foregroundColor(disabled ? KozmosColors.primitivesColorsForeground500 : KozmosColors.primitivesColorsForeground400)
            Text(Self.displayFormatter.string(from: endDate))
        }
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
            return KozmosColors.primitivesColorsForeground400
        }
    }

    private static let displayFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM d, yyyy"
        formatter.locale = Locale(identifier: "en_US_POSIX")
        return formatter
    }()
}

private struct KozmosDateRangeField: View {
    @Binding var date: Date

    let label: String
    let disabled: Bool
    let readOnly: Bool
    let status: KozmosInputStatus

    var body: some View {
        VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing75) {
            Text(label)
                .font(.subheadline.weight(.semibold))
                .foregroundColor(disabled ? KozmosColors.primitivesColorsForeground500 : KozmosColors.primitivesColorsForeground100)

            HStack(spacing: KozmosDimensions.primitivesLayoutSpacing100) {
                Image(systemName: "calendar")
                    .font(.subheadline.weight(.semibold))
                    .foregroundColor(iconColor)

                DatePicker("", selection: $date, displayedComponents: .date)
                    .datePickerStyle(.compact)
                    .labelsHidden()
                    .disabled(disabled || readOnly)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            .padding(.horizontal, KozmosDimensions.primitivesLayoutSpacing150)
            .frame(maxWidth: .infinity, minHeight: 44, maxHeight: 44, alignment: .center)
            .background(fieldBackgroundColor)
            .clipShape(RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl))
            .overlay(
                RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl)
                    .stroke(fieldBorderColor, lineWidth: 1)
            )
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var fieldBackgroundColor: Color {
        (disabled || readOnly) ? KozmosColors.primitivesColorsBackground100 : KozmosColors.primitivesColorsBackground0
    }

    private var fieldBorderColor: Color {
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

    private var iconColor: Color {
        disabled ? KozmosColors.primitivesColorsForeground500 : KozmosColors.primitivesColorsForeground400
    }
}
