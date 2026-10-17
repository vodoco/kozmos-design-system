import Foundation
import SwiftUI

public enum KozmosColorPickerFormat {
    case hex
    case rgb
    case hsl

    var label: String {
        switch self {
        case .hex:
            return "HEX"
        case .rgb:
            return "RGB"
        case .hsl:
            return "HSL"
        }
    }
}

public struct KozmosColorPicker: View {
    @Binding public var value: String
    @Binding public var alpha: Double

    public let label: String?
    public let helperText: String?
    public let paletteLabel: String
    public let presets: [String]
    public let disabled: Bool
    public let readOnly: Bool
    public let status: KozmosInputStatus

    @State private var isOpen: Bool
    @State private var currentFormat: KozmosColorPickerFormat
    @Environment(\.kozmosAnalytics) private var trackEvent

    public init(
        value: Binding<String> = .constant("#135BEC"),
        alpha: Binding<Double> = .constant(100),
        label: String? = nil,
        helperText: String? = nil,
        paletteLabel: String = "Kozmos Design System 2.0",
        presets: [String] = KozmosColorPickerDefaultPresets,
        format: KozmosColorPickerFormat = .hsl,
        defaultOpen: Bool = false,
        disabled: Bool = false,
        readOnly: Bool = false,
        status: KozmosInputStatus = .default
    ) {
        self._value = value
        self._alpha = alpha
        self.label = label
        self.helperText = helperText
        self.paletteLabel = paletteLabel
        self.presets = presets
        self.disabled = disabled
        self.readOnly = readOnly
        self.status = status
        self._isOpen = State(initialValue: defaultOpen)
        self._currentFormat = State(initialValue: format)
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing75) {
            if let label = label {
                Text(label)
                    .font(.subheadline.weight(.semibold))
                    .foregroundColor(labelColor)
            }

            Button(action: toggleOpen) {
                HStack(spacing: KozmosDimensions.primitivesLayoutSpacing100) {
                    RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusMarker)
                        .fill(color)
                        .frame(width: 32, height: 32)
                        .overlay(
                            RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusMarker)
                                .stroke(KozmosColors.semanticsBorderInput, lineWidth: 1)
                        )

                    Text(normalizedValue)
                        .font(.subheadline.weight(.semibold))
                        .foregroundColor(textColor)
                        .lineLimit(1)

                    Spacer(minLength: KozmosDimensions.primitivesLayoutSpacing100)

                    Image(systemName: "chevron.down")
                        .font(.subheadline.weight(.semibold))
                        .rotationEffect(.degrees(isOpen ? 180 : 0))
                        .foregroundColor(KozmosColors.primitivesColorsForeground500)
                }
                .padding(.horizontal, KozmosDimensions.primitivesLayoutSpacing150)
                .frame(maxWidth: .infinity, minHeight: 44, maxHeight: 44)
                .background(fieldBackgroundColor)
                .clipShape(RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl))
                .overlay(
                    RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl)
                        .stroke(fieldBorderColor, lineWidth: 1)
                )
            }
            .buttonStyle(.plain)
            .disabled(disabled || readOnly)
            .accessibilityLabel(label ?? "Color")
            .accessibilityValue(normalizedValue)
            .accessibilityHint(isOpen ? "Closes the color picker" : "Opens the color picker")

            if isOpen {
                pickerPanel
            }

            if let helperText = helperText, !helperText.isEmpty {
                Text(helperText)
                    .font(KozmosTypography.subheadline)
                    .foregroundColor(helperTextColor)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var pickerPanel: some View {
        VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing150) {
            saturationLightnessArea

            labeledSlider(
                label: "Hue",
                value: Binding(
                    get: { currentHsl.h },
                    set: { updateColor(h: $0, s: currentHsl.s, l: currentHsl.l) }
                ),
                range: 0...360
            )

            labeledSlider(
                label: "Opacity",
                value: Binding(
                    get: { alpha },
                    set: { alpha = min(max($0, 0), 100) }
                ),
                range: 0...100
            )

            formatControls
            paletteSelector
            presetGrid
        }
        .padding(KozmosDimensions.primitivesLayoutSpacing150)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(KozmosColors.primitivesColorsBackground0)
        .clipShape(RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl))
        .overlay(
            RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl)
                .stroke(KozmosColors.semanticsBorderInput, lineWidth: 1)
        )
        .kozmosElevation(KozmosShadows.semanticsElevationOverlay)
    }

    private var saturationLightnessArea: some View {
        GeometryReader { proxy in
            let handleSize: CGFloat = 18
            let handleX = max(0, proxy.size.width - handleSize) * CGFloat(currentHsl.s / 100)
            let handleY = max(0, proxy.size.height - handleSize) * CGFloat(1 - (currentHsl.l / 100))

            ZStack(alignment: .topLeading) {
                RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl)
                    .fill(
                        LinearGradient(
                            colors: [.white, hueColor],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .overlay(
                        LinearGradient(
                            colors: [.clear, .black],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                        .clipShape(RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl))
                    )

                Circle()
                    .fill(KozmosColors.primitivesColorsBackground0)
                    .frame(width: handleSize, height: handleSize)
                    .overlay(Circle().stroke(KozmosColors.primitivesColorsForeground0, lineWidth: 1.5))
                    .shadow(color: KozmosColors.primitivesColorsForeground900.opacity(0.2), radius: 2, x: 0, y: 1)
                    .offset(x: handleX, y: handleY)
            }
        }
        .frame(maxWidth: .infinity, minHeight: 144, maxHeight: 144)
        .clipShape(RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl))
        .overlay(
            RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl)
                .stroke(KozmosColors.semanticsBorderSubtle, lineWidth: 1)
        )
        // The square is drawn physically, as React draws it: white at the
        // left and the hue at the right in either reading direction. Laid
        // out right to left, the handle's top-leading alignment and offset
        // mirrored while the gradient did not, so the handle sat over the
        // wrong end of it.
        .environment(\.layoutDirection, .leftToRight)
        .accessibilityLabel("Saturation and lightness")
        .accessibilityValue("\(Int(currentHsl.s)) percent saturation, \(Int(currentHsl.l)) percent lightness")
    }

    private func labeledSlider(
        label: String,
        value: Binding<Double>,
        range: ClosedRange<Double>
    ) -> some View {
        VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing50) {
            Text(label)
                .font(KozmosTypography.caption)
                .foregroundColor(KozmosColors.primitivesColorsForeground500)
            KozmosSlider(value: value, range: range)
                .disabled(disabled || readOnly)
        }
    }

    private var formatControls: some View {
        HStack(spacing: KozmosDimensions.primitivesLayoutSpacing75) {
            Menu {
                Button("HEX") { currentFormat = .hex }
                Button("RGB") { currentFormat = .rgb }
                Button("HSL") { currentFormat = .hsl }
            } label: {
                Text(currentFormat.label)
                    .font(.subheadline.weight(.semibold))
                    .frame(minWidth: 56)
            }
            .buttonStyle(.plain)
            .frame(height: 36)
            .padding(.horizontal, KozmosDimensions.primitivesLayoutSpacing100)
            .background(KozmosColors.primitivesColorsBackground0)
            .clipShape(RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl))
            .overlay(
                RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl)
                    .stroke(KozmosColors.semanticsBorderInput, lineWidth: 1)
            )

            ForEach(channelLabels, id: \.self) { channel in
                Text(channel)
                    .font(.subheadline.monospacedDigit())
                    .foregroundColor(KozmosColors.primitivesColorsForeground0)
                    .frame(minWidth: currentFormat == .hex ? 104 : 44, maxWidth: currentFormat == .hex ? .infinity : 56, minHeight: 36)
                    .padding(.horizontal, KozmosDimensions.primitivesLayoutSpacing100)
                    .background(KozmosColors.primitivesColorsBackground0)
                    .clipShape(RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl))
                    .overlay(
                        RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl)
                            .stroke(KozmosColors.semanticsBorderInput, lineWidth: 1)
                    )
            }

            Text("\(Int(alpha))%")
                .font(.subheadline.monospacedDigit())
                .foregroundColor(KozmosColors.primitivesColorsForeground0)
                .frame(minWidth: 52, minHeight: 36)
                .background(KozmosColors.primitivesColorsBackground0)
                .clipShape(RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl))
                .overlay(
                    RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl)
                        .stroke(KozmosColors.semanticsBorderInput, lineWidth: 1)
                )
        }
    }

    private var paletteSelector: some View {
        HStack {
            Text(paletteLabel)
                .font(KozmosTypography.subheadline)
                .foregroundColor(KozmosColors.primitivesColorsForeground0)
                .lineLimit(1)
            Spacer(minLength: KozmosDimensions.primitivesLayoutSpacing100)
            Image(systemName: "chevron.down")
                .font(.caption.weight(.semibold))
                .foregroundColor(KozmosColors.primitivesColorsForeground500)
        }
        .padding(.horizontal, KozmosDimensions.primitivesLayoutSpacing150)
        .frame(maxWidth: .infinity, minHeight: 40)
        .background(KozmosColors.primitivesColorsBackground0)
        .clipShape(RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl))
        .overlay(
            RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl)
                .stroke(KozmosColors.semanticsBorderInput, lineWidth: 1)
        )
    }

    private var presetGrid: some View {
        LazyVGrid(
            columns: Array(repeating: GridItem(.flexible(), spacing: KozmosDimensions.primitivesLayoutSpacing100), count: 8),
            alignment: .leading,
            spacing: KozmosDimensions.primitivesLayoutSpacing100
        ) {
            ForEach(presets.map(normalizedHexColor), id: \.self) { preset in
                Button(action: { commitValue(preset) }) {
                    RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusMarker)
                        .fill(colorFromHex(preset))
                        .aspectRatio(1, contentMode: .fit)
                        .overlay(
                            RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusMarker)
                                .stroke(KozmosColors.semanticsBorderInput, lineWidth: preset == normalizedValue ? 2 : 1)
                        )
                }
                .buttonStyle(.plain)
                .disabled(disabled || readOnly)
                .accessibilityLabel("Use \(preset)")
            }
        }
        .frame(maxWidth: .infinity)
    }

    private var normalizedValue: String {
        normalizedHexColor(value)
    }

    private var color: Color {
        colorFromHex(normalizedValue)
    }

    private var hueColor: Color {
        colorFromHex(rgbToHex(hslToRgb(h: currentHsl.h, s: 100, l: 50)))
    }

    private var currentHsl: HSLColor {
        rgbToHsl(hexToRgb(normalizedValue))
    }

    private var channelLabels: [String] {
        switch currentFormat {
        case .hex:
            return [normalizedValue]
        case .rgb:
            let rgb = hexToRgb(normalizedValue)
            return ["\(rgb.r)", "\(rgb.g)", "\(rgb.b)"]
        case .hsl:
            let hsl = currentHsl
            return ["\(Int(hsl.h))", "\(Int(hsl.s))", "\(Int(hsl.l))"]
        }
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

    private var labelColor: Color {
        disabled ? KozmosColors.primitivesColorsForeground500 : KozmosColors.primitivesColorsForeground100
    }

    private var helperTextColor: Color {
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

    private var textColor: Color {
        disabled ? KozmosColors.primitivesColorsForeground500 : KozmosColors.primitivesColorsForeground0
    }

    private func toggleOpen() {
        guard !disabled, !readOnly else { return }
        isOpen.toggle()
    }

    private func commitValue(_ nextValue: String) {
        value = normalizedHexColor(nextValue)
        trackEvent(KozmosAnalyticsEvent(eventName: "color_changed", component: "ColorPicker", properties: ["value": value]))
    }

    private func updateColor(h: Double, s: Double, l: Double) {
        commitValue(rgbToHex(hslToRgb(h: h, s: s, l: l)))
    }
}

public let KozmosColorPickerDefaultPresets = [
    "#135BEC", "#8FB4FF", "#7C3AED", "#0F766E",
    "#1492A6", "#2E97CC", "#0EA5E9", "#38BDF8",
    "#C2410C", "#B91C1C", "#A16207", "#CA8A04",
    "#15803D", "#22C55E", "#BE185D", "#EC4899",
    "#4F46E5", "#6366F1", "#7E22CE", "#A855F7",
    "#111827", "#374151", "#747B8B", "#C7CAD1"
]

private struct RGBColor {
    let r: Int
    let g: Int
    let b: Int
}

private struct HSLColor {
    let h: Double
    let s: Double
    let l: Double
}

private func normalizedHexColor(_ value: String) -> String {
    let raw = value.trimmingCharacters(in: .whitespacesAndNewlines).replacingOccurrences(of: "#", with: "")
    if raw.count == 3, raw.range(of: #"^[0-9a-fA-F]{3}$"#, options: .regularExpression) != nil {
        return "#" + raw.map { "\($0)\($0)" }.joined().uppercased()
    }
    if raw.count == 6, raw.range(of: #"^[0-9a-fA-F]{6}$"#, options: .regularExpression) != nil {
        return "#\(raw.uppercased())"
    }
    return "#135BEC"
}

private func colorFromHex(_ value: String) -> Color {
    #if canImport(UIKit)
    return Color(UIColor(hex: normalizedHexColor(value)))
    #elseif canImport(AppKit)
    return Color(NSColor(hex: normalizedHexColor(value)))
    #else
    return KozmosColors.primitivesColorsTheme500
    #endif
}

private func hexToRgb(_ value: String) -> RGBColor {
    let hex = normalizedHexColor(value).dropFirst()
    let scanner = Scanner(string: String(hex))
    var int: UInt64 = 0
    scanner.scanHexInt64(&int)
    return RGBColor(
        r: Int((int >> 16) & 0xFF),
        g: Int((int >> 8) & 0xFF),
        b: Int(int & 0xFF)
    )
}

private func rgbToHex(_ rgb: RGBColor) -> String {
    String(format: "#%02X%02X%02X", clampInt(rgb.r, 0, 255), clampInt(rgb.g, 0, 255), clampInt(rgb.b, 0, 255))
}

private func rgbToHsl(_ rgb: RGBColor) -> HSLColor {
    let red = Double(rgb.r) / 255
    let green = Double(rgb.g) / 255
    let blue = Double(rgb.b) / 255
    let maxValue = max(red, green, blue)
    let minValue = min(red, green, blue)
    let lightness = (maxValue + minValue) / 2
    let delta = maxValue - minValue

    guard delta != 0 else {
        return HSLColor(h: 0, s: 0, l: round(lightness * 100))
    }

    let saturation = lightness > 0.5 ? delta / (2 - maxValue - minValue) : delta / (maxValue + minValue)
    var hue: Double
    if maxValue == red {
        hue = (green - blue) / delta + (green < blue ? 6 : 0)
    } else if maxValue == green {
        hue = (blue - red) / delta + 2
    } else {
        hue = (red - green) / delta + 4
    }

    return HSLColor(h: round(hue * 60), s: round(saturation * 100), l: round(lightness * 100))
}

private func hslToRgb(h: Double, s: Double, l: Double) -> RGBColor {
    let hue = ((h.truncatingRemainder(dividingBy: 360) + 360).truncatingRemainder(dividingBy: 360)) / 360
    let saturation = min(max(s, 0), 100) / 100
    let lightness = min(max(l, 0), 100) / 100

    guard saturation != 0 else {
        let value = Int(round(lightness * 255))
        return RGBColor(r: value, g: value, b: value)
    }

    let q = lightness < 0.5 ? lightness * (1 + saturation) : lightness + saturation - lightness * saturation
    let p = 2 * lightness - q
    func channel(_ offset: Double) -> Int {
        var t = hue + offset
        if t < 0 { t += 1 }
        if t > 1 { t -= 1 }
        let result: Double
        if t < 1 / 6 {
            result = p + (q - p) * 6 * t
        } else if t < 1 / 2 {
            result = q
        } else if t < 2 / 3 {
            result = p + (q - p) * (2 / 3 - t) * 6
        } else {
            result = p
        }
        return clampInt(Int(round(result * 255)), 0, 255)
    }

    return RGBColor(r: channel(1 / 3), g: channel(0), b: channel(-1 / 3))
}

private func clampInt(_ value: Int, _ minValue: Int, _ maxValue: Int) -> Int {
    min(max(value, minValue), maxValue)
}
