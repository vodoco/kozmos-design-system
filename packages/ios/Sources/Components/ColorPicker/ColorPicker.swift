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

    // Each box fills the width the row gives it; the row decides that width
    // from the box's KozmosColorFormatBox, as the HStack it replaced did from
    // the boxes' own frames.
    private var formatControls: some View {
        KozmosColorFormatRowLayout(
            spacing: KozmosDimensions.primitivesLayoutSpacing75,
            // React's columns: minmax(3.5rem, 1fr), and 6rem for HEX.
            minimumColumn: currentFormat == .hex ? 96 : 56
        ) {
            Menu {
                Button("HEX") { currentFormat = .hex }
                Button("RGB") { currentFormat = .rgb }
                Button("HSL") { currentFormat = .hsl }
            } label: {
                Text(currentFormat.label)
                    .font(.subheadline.weight(.semibold))
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.plain)
            .frame(minHeight: 36)
            .padding(.horizontal, KozmosDimensions.primitivesLayoutSpacing100)
            .background(KozmosColors.primitivesColorsBackground0)
            .clipShape(RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl))
            .overlay(
                RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl)
                    .stroke(KozmosColors.semanticsBorderInput, lineWidth: 1)
            )
            .layoutValue(key: KozmosColorFormatBox.self, value: KozmosColorFormatBox(narrowest: 72))

            // By place, not by value: two channels can read the same, as
            // #FF0000's green and blue do.
            ForEach(Array(channelLabels.enumerated()), id: \.offset) { _, channel in
                Text(channel)
                    .font(.subheadline.monospacedDigit())
                    .foregroundColor(KozmosColors.primitivesColorsForeground0)
                    .frame(maxWidth: .infinity, minHeight: 36)
                    .padding(.horizontal, KozmosDimensions.primitivesLayoutSpacing100)
                    .background(KozmosColors.primitivesColorsBackground0)
                    .clipShape(RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl))
                    .overlay(
                        RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl)
                            .stroke(KozmosColors.semanticsBorderInput, lineWidth: 1)
                    )
                    .layoutValue(
                        key: KozmosColorFormatBox.self,
                        value: currentFormat == .hex
                            ? KozmosColorFormatBox(narrowest: 120, widest: .infinity)
                            : KozmosColorFormatBox(narrowest: 60, widest: 72)
                    )
            }

            Text("\(Int(alpha))%")
                .font(.subheadline.monospacedDigit())
                .foregroundColor(KozmosColors.primitivesColorsForeground0)
                .frame(maxWidth: .infinity, minHeight: 36)
                .background(KozmosColors.primitivesColorsBackground0)
                .clipShape(RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl))
                .overlay(
                    RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl)
                        .stroke(KozmosColors.semanticsBorderInput, lineWidth: 1)
                )
                // It has no padding of its own: in a column it keeps 8pt
                // either side of its text, as the other boxes do.
                .layoutValue(key: KozmosColorFormatBox.self, value: KozmosColorFormatBox(narrowest: 52, inset: 16))
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

/// How wide the format row may draw one of its boxes while they all fit on
/// one line. Never narrower than the box's text needs.
private struct KozmosColorFormatBox: LayoutValueKey {
    static let defaultValue = KozmosColorFormatBox()

    /// The narrowest the line draws the box.
    var narrowest: CGFloat = 0
    /// The widest the line lets it grow; nil: as wide as its text, and no wider.
    var widest: CGFloat?
    /// What a column must give the box beyond its own width for its text to
    /// clear its rounded ends.
    var inset: CGFloat = 0
}

/// The open colour picker's format row: the format menu, the value boxes and
/// the opacity box.
///
/// Where every box fits on one line at its text's width it is laid out as the
/// HStack it replaces laid it out: the least flexible box first, each offered
/// an equal share of what is left and drawn between its `narrowest` and
/// `widest` (the menu 72pt, a value box 60–72, the opacity box 52 or its
/// text). That HStack could not shrink below 328pt, so the open picker
/// needed 352 and grew past a phone's 343, and at accessibility text sizes
/// it squeezed the boxes' text: digits one above another, the menu's label
/// an ellipsis.
///
/// Where they do not fit, it wraps as React's format grid does,
/// `repeat(auto-fit, minmax(3.5rem, 1fr))`: as many equal columns to a line
/// as fit, each at least `minimumColumn` and at least as wide as the widest
/// box's text, the boxes in reading order. Placement is logical; SwiftUI
/// mirrors it right to left.
private struct KozmosColorFormatRowLayout: Layout {
    var spacing: CGFloat
    var minimumColumn: CGFloat

    private struct Arrangement {
        var size: CGSize
        var frames: [CGRect]
    }

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        arrange(width: proposal.width, subviews).size
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        // Arranged for the width offered, as the size was: the line can be
        // narrower than its bounds, and shared out again over its own width
        // it would come out differently.
        let arrangement = arrange(width: proposal.width ?? bounds.width, subviews)
        for (subview, frame) in zip(subviews, arrangement.frames) {
            subview.place(
                at: CGPoint(x: bounds.minX + frame.minX, y: bounds.minY + frame.minY),
                anchor: .topLeading,
                proposal: ProposedViewSize(frame.size)
            )
        }
    }

    private func arrange(width: CGFloat?, _ subviews: Subviews) -> Arrangement {
        guard !subviews.isEmpty else { return Arrangement(size: .zero, frames: []) }
        let offered = width.flatMap { $0.isFinite ? $0 : nil }
        let ideals = subviews.map { $0.sizeThatFits(.unspecified).width }
        let boxes = subviews.map { $0[KozmosColorFormatBox.self] }
        return line(width: offered, subviews, ideals, boxes) ?? columns(width: offered, subviews, ideals, boxes)
    }

    /// The boxes on one line, or nil when they do not all fit at their
    /// text's width.
    private func line(width: CGFloat?, _ subviews: Subviews, _ ideals: [CGFloat], _ boxes: [KozmosColorFormatBox]) -> Arrangement? {
        let count = subviews.count
        let gaps = spacing * CGFloat(count - 1)
        let lower = boxes.map(\.narrowest)
        let upper = boxes.indices.map { max(boxes[$0].narrowest, boxes[$0].widest ?? ideals[$0]) }
        var widths = ideals.indices.map { min(max(ideals[$0], lower[$0]), upper[$0]) }
        if let width {
            // As the HStack shared it out: least flexible first, ties in order.
            let order = boxes.indices.sorted { (upper[$0] - lower[$0], $0) < (upper[$1] - lower[$1], $1) }
            var remaining = width - gaps
            for (taken, index) in order.enumerated() {
                let offer = remaining / CGFloat(count - taken)
                widths[index] = min(max(offer, lower[index]), upper[index])
                remaining -= widths[index]
            }
            guard widths.reduce(0, +) + gaps <= width + 0.001 else { return nil }
        }
        guard widths.indices.allSatisfy({ widths[$0] + 0.001 >= ideals[$0] }) else { return nil }
        let heights = subviews.indices.map { subviews[$0].sizeThatFits(ProposedViewSize(width: widths[$0], height: nil)).height }
        let height = heights.max() ?? 0
        var x: CGFloat = 0
        let frames = subviews.indices.map { index -> CGRect in
            defer { x += widths[index] + spacing }
            return CGRect(x: x, y: (height - heights[index]) / 2, width: widths[index], height: heights[index])
        }
        return Arrangement(size: CGSize(width: widths.reduce(0, +) + gaps, height: height), frames: frames)
    }

    /// The boxes in equal columns, as many to a line as fit.
    private func columns(width: CGFloat?, _ subviews: Subviews, _ ideals: [CGFloat], _ boxes: [KozmosColorFormatBox]) -> Arrangement {
        let count = subviews.count
        let floor = max(minimumColumn, ideals.indices.map { ideals[$0] + boxes[$0].inset }.max() ?? 0)
        let width = width ?? floor * CGFloat(count) + spacing * CGFloat(count - 1)
        let perLine = max(1, min(count, Int((width + spacing) / (floor + spacing))))
        let column = max(0, (width - spacing * CGFloat(perLine - 1)) / CGFloat(perLine))
        let heights = subviews.map { $0.sizeThatFits(ProposedViewSize(width: column, height: nil)).height }
        var frames: [CGRect] = []
        var y: CGFloat = 0
        for start in stride(from: 0, to: count, by: perLine) {
            let indices = start..<min(count, start + perLine)
            let height = indices.map { heights[$0] }.max() ?? 0
            for index in indices {
                let x = CGFloat(index - start) * (column + spacing)
                frames.append(CGRect(x: x, y: y + (height - heights[index]) / 2, width: column, height: heights[index]))
            }
            y += height + spacing
        }
        return Arrangement(size: CGSize(width: width, height: max(0, y - spacing)), frames: frames)
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
