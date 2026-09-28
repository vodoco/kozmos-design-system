import SwiftUI

public enum KozmosMapControlButtonPresentation {
    case iconOnly
    case labelled
}

/// How an active map control reads.
///
/// `tinted` keeps the map surface and lets the mark and the words carry the
/// state, which is what the SDK draws — a control over a map has to stay
/// legible against the tiles behind it, and a solid fill hides the very thing
/// it sits on. Off, the mark and the words are grey; on, the mark is the
/// theme's blue and the words navy. No edge, in either (decision 40).
/// `filled` is the inverted treatment this component shipped before
/// 2026-09-15, kept for callers that want the heavier emphasis.
public enum KozmosMapControlButtonEmphasis {
    case tinted
    case filled
}

/// Where a control's state sits relative to its label.
///
/// `inline` runs them along one line. `stacked` sets the state under the
/// label, which is how a map pill fits a two-word state into a control that
/// has to stay thumb-sized.
public enum KozmosMapControlButtonLabelPlacement {
    case inline
    case stacked
}

/// What a map control's state resolves to, before any colour is chosen.
///
/// Kept apart from the view because this decision is the part a design ruling
/// changes — tinted became the default on 2026-09-15, and the SDK's tones and
/// no edge on 2026-09-28 (decision 40) — and it can be tested without
/// rendering anything.
struct KozmosMapControlButtonAppearance: Equatable {
    enum Surface: Equatable { case chrome, filled }
    /// `themeText` is the theme ramp's deepest step, the SDK's navy "On"; the
    /// ramp turns over in the dark, where it is the palest.
    enum Tone: Equatable { case ink, muted, theme, themeText, onFill }

    let surface: Surface
    /// The mark's tone.
    let icon: Tone
    /// Both lines' tone: the SDK sets the name and the state as equals.
    let label: Tone

    init(pressed: Bool?, emphasis: KozmosMapControlButtonEmphasis) {
        switch (pressed, emphasis) {
        case (true?, .filled):
            surface = .filled
            icon = .onFill
            label = .onFill
        case (true?, .tinted):
            // The SDK's "Focus On": the mark in the theme's blue, the words
            // navy, and no edge — the words and the mark carry the state.
            surface = .chrome
            icon = .theme
            label = .themeText
        case (false?, _):
            // The SDK's "Focus⏎Off": the mark and the words grey.
            surface = .chrome
            icon = .muted
            label = .muted
        case (nil, _):
            // Not a toggle — zoom, compass — so neither off nor on: the ink,
            // as the SDK's own floor tile keeps.
            surface = .chrome
            icon = .ink
            label = .ink
        }
    }
}

/// The part of a control's state a reveal watches.
///
/// Either half can be what changed: a toggle flips `pressed`, while a control
/// that cycles through modes changes only its state label — following and
/// heading are both pressed. The mark is not part of it; a new drawing alone
/// says nothing new.
struct KozmosMapControlButtonRevealValue: Hashable {
    let pressed: Bool
    let stateLabel: String?
}

/// A single floating map control.
///
/// Mirrors the React `MapControlButton`. `label` is the localized action name
/// and always becomes the accessible name; `stateLabel` is appended so screen
/// reader users hear the current state without relying on visual styling.
///
/// It wears the SDK's Tracking Indicator (decision 40, Figma
/// `ce7phRJR1sCkH6zT8EMH8I`, `434:31572`): a 48 square, the page's own
/// surface with no edge, the Control corner and the map controls' three
/// shadows, and its words bold on a 16 line, in the toggle's tone.
public struct KozmosMapControlButton<Icon: View>: View {
    /// The SDK's 48 square. 44 stays the floor of every target; this is above it.
    static var size: CGFloat { KozmosDimensions.primitivesLayoutSizing600 }

    private let icon: Icon
    private let label: String
    private let stateLabel: String?
    private let presentation: KozmosMapControlButtonPresentation
    private let emphasis: KozmosMapControlButtonEmphasis
    private let labelPlacement: KozmosMapControlButtonLabelPlacement
    let revealOnChange: Bool
    let revealDuration: TimeInterval
    let revealDelay: TimeInterval
    private let stateDescription: String?
    private let showsLabel: Bool
    private let pressed: Bool?
    private let isDisabled: Bool
    let isLoading: Bool
    private let action: () -> Void

    /// Someone who has asked iOS to reduce motion still needs to read the new
    /// state; they just should not watch the control grow to show it.
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    /// The SDK's words sit on a 16 line: the callout's 16 at the default size,
    /// scaled with it.
    @ScaledMetric(relativeTo: .callout) private var lineHeight: CGFloat = 16

    @StateObject private var reveal = KozmosRevealOnChange()

    /// - Parameters:
    ///   - stateDescription: Said after the state and never drawn: what the
    ///     words on the control leave out. The location control's heading
    ///     mode shows "On", as following does — the SDK's "Focus / On" — and
    ///     its mark tells them apart on screen; VoiceOver hears "Focus, On, map
    ///     turns with you". After the words, so the name still begins with what
    ///     a Voice Control user sees. Not a change to reveal: the words did not
    ///     change.
    ///   - showsLabel: Draw the name beside the state. Off, a labelled control
    ///     draws its state alone — the SDK's "No Location" has no "Focus" over
    ///     it — and the name still starts the accessible name. With no state
    ///     to draw, the name is drawn anyway.
    ///   - revealOnChange: Let the control resolve its own presentation:
    ///     icon-only at rest, widening to `labelled` for `revealDuration`
    ///     whenever `pressed` or `stateLabel` changes, then collapsing so it
    ///     stops covering the map — the SDK's map toggles, and React's
    ///     `revealOnChange`. While it is set, `presentation` is ignored. Off by
    ///     default (row 77).
    ///   - revealDuration: How long the label stays, in seconds. React's
    ///     2500ms.
    ///   - revealDelay: How long to wait before revealing. A change that takes
    ///     time to settle — a route being recalculated — reveals its new state
    ///     once the work is done rather than while it is still wrong.
    ///   - pressed: A toggle's state. Leave it unset for a control that is not
    ///     a toggle — zoom, compass — which keeps the ink; `false` is a toggle
    ///     that is off, drawn grey, and `true` one that is on.
    ///   - isLoading: The system's arc turns in the icon's place, and the
    ///     control waits: React's Button disables itself while it loads, and
    ///     so does this. The name still says what is happening.
    public init(
        label: String,
        stateLabel: String? = nil,
        stateDescription: String? = nil,
        showsLabel: Bool = true,
        presentation: KozmosMapControlButtonPresentation = .iconOnly,
        emphasis: KozmosMapControlButtonEmphasis = .tinted,
        labelPlacement: KozmosMapControlButtonLabelPlacement = .inline,
        revealOnChange: Bool = false,
        revealDuration: TimeInterval = 2.5,
        revealDelay: TimeInterval = 0,
        pressed: Bool? = nil,
        isDisabled: Bool = false,
        isLoading: Bool = false,
        action: @escaping () -> Void,
        @ViewBuilder icon: () -> Icon
    ) {
        self.label = label
        self.stateLabel = stateLabel
        self.stateDescription = stateDescription
        self.showsLabel = showsLabel
        self.presentation = presentation
        self.emphasis = emphasis
        self.labelPlacement = labelPlacement
        self.revealOnChange = revealOnChange
        self.revealDuration = revealDuration
        self.revealDelay = revealDelay
        self.pressed = pressed
        self.isDisabled = isDisabled
        self.isLoading = isLoading
        self.action = action
        self.icon = icon()
    }

    /// The name VoiceOver hears: the name, the state, and what the words leave
    /// out, in that order.
    var accessibleLabel: String {
        [label, stateLabel, stateDescription].compactMap { $0 }.joined(separator: ", ")
    }

    /// The words the control draws while labelled: the name over the state,
    /// or the state alone when the name is not shown.
    var drawnLines: [String] {
        let name = showsLabel || stateLabel == nil ? [label] : []
        return name + (stateLabel.map { [$0] } ?? [])
    }

    var appearance: KozmosMapControlButtonAppearance {
        KozmosMapControlButtonAppearance(pressed: pressed, emphasis: emphasis)
    }

    /// `pressed` is read as a boolean, as React reads it, so a toggle going
    /// from unset to `false` while its state loads does not announce a change
    /// nobody made.
    var revealValue: KozmosMapControlButtonRevealValue {
        KozmosMapControlButtonRevealValue(pressed: pressed ?? false, stateLabel: stateLabel)
    }

    /// While the control reveals on change it decides: icon-only at rest,
    /// labelled while it says its new state, whatever `presentation` says.
    static func resolvedPresentation(
        _ presentation: KozmosMapControlButtonPresentation,
        revealOnChange: Bool,
        isRevealed: Bool
    ) -> KozmosMapControlButtonPresentation {
        guard revealOnChange else { return presentation }
        return isRevealed ? .labelled : .iconOnly
    }

    private var shownPresentation: KozmosMapControlButtonPresentation {
        Self.resolvedPresentation(presentation, revealOnChange: revealOnChange, isRevealed: reveal.isRevealed)
    }

    private func observeReveal(_ value: KozmosMapControlButtonRevealValue, enabled: Bool) {
        reveal.observe(value, enabled: enabled, duration: revealDuration, delay: revealDelay)
    }

    private func color(_ tone: KozmosMapControlButtonAppearance.Tone) -> Color {
        switch tone {
        case .ink:
            return KozmosColors.primitivesColorsForeground100
        case .muted:
            return KozmosColors.primitivesColorsForeground400
        case .theme:
            return KozmosColors.primitivesColorsTheme600
        case .themeText:
            return KozmosColors.primitivesColorsTheme1000
        case .onFill:
            return KozmosColors.componentsPrimaryButtonsThemedButtonForegroundContentIdle
        }
    }

    /// The page's own surface, opaque, as the SDK's is; the Button's primary
    /// fill when filled. It was 90% of the surface.
    private var surfaceColor: Color {
        appearance.surface == .filled
            ? KozmosColors.componentsPrimaryButtonsThemedButtonBackgroundIdle
            : KozmosColors.primitivesColorsBackground0
    }

    private var surfaceShape: RoundedRectangle {
        RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl, style: .continuous)
    }

    @ViewBuilder
    private var labelContent: some View {
        if shownPresentation == .labelled {
            let lines = drawnLines
            if labelPlacement == .stacked {
                // Two equal lines, the SDK's "Focus⏎Off".
                VStack(alignment: .leading, spacing: 0) {
                    ForEach(lines.indices, id: \.self) { index in
                        line(lines[index])
                    }
                }
            } else {
                HStack(spacing: KozmosDimensions.primitivesLayoutSpacing50) {
                    ForEach(lines.indices, id: \.self) { index in
                        line(lines[index])
                    }
                }
            }
        }
    }

    /// One line of the SDK's words: bold, the callout's 16, on a 16 line.
    private func line(_ text: String) -> some View {
        Text(text)
            .font(KozmosTypography.font(.callout).weight(.bold))
            .lineLimit(1)
            .truncationMode(.tail)
            .frame(height: lineHeight)
    }

    public var body: some View {
        let shown = shownPresentation
        let shape = surfaceShape

        Button(action: action) {
            HStack(spacing: KozmosDimensions.primitivesLayoutSpacing100) {
                icon
                    // Kept in place, unseen, under the spinner, so a labelled
                    // control's text does not move while it waits.
                    .opacity(isLoading ? 0 : 1)
                    .overlay {
                        if isLoading {
                            // The system's arc, as a loading Button draws it:
                            // one drawing on all four platforms.
                            KozmosSpinner(size: .sm, color: color(appearance.icon))
                        }
                    }
                    .foregroundColor(color(appearance.icon))
                    .accessibilityHidden(true)

                labelContent
            }
            .foregroundColor(color(appearance.label))
            // The SDK's padding: 12 at the sides once labelled, 8 above and
            // below, round a 48 square that grows with its words.
            .padding(.horizontal, shown == .labelled ? KozmosDimensions.primitivesLayoutSpacing150 : 0)
            .padding(.vertical, KozmosDimensions.primitivesLayoutSpacing100)
            .frame(minWidth: Self.size, minHeight: Self.size)
            .frame(width: shown == .iconOnly ? Self.size : nil)
            .frame(maxWidth: shown == .labelled ? 256 : nil)
            .background(surfaceColor)
            .clipShape(shape)
            .contentShape(shape)
            // No edge in any state, and one lift: the words and the mark carry
            // the state.
            .kozmosElevation(KozmosShadows.semanticsElevationMapControl, in: shape, fill: surfaceColor)
        }
        .buttonStyle(.plain)
        .disabled(isDisabled || isLoading)
        .opacity(isDisabled ? 0.5 : 1)
        // Reduce Motion stops the control growing, not the reveal: the new
        // state is still said, and still said for as long.
        .animation(reduceMotion ? nil : .easeInOut(duration: 0.3), value: shown == .labelled)
        .accessibilityLabel(accessibleLabel)
        .accessibilityAddTraits(pressed == true ? [.isButton, .isSelected] : .isButton)
        // The first value only sets the baseline; see `KozmosRevealOnChange`.
        .onAppear { observeReveal(revealValue, enabled: revealOnChange) }
        .onChange(of: revealValue) { observeReveal($0, enabled: revealOnChange) }
        .onChange(of: revealOnChange) { observeReveal(revealValue, enabled: $0) }
    }
}

public extension KozmosMapControlButton where Icon == Image {
    /// Convenience initializer for SF Symbol artwork.
    init(
        label: String,
        systemImage: String,
        stateLabel: String? = nil,
        stateDescription: String? = nil,
        showsLabel: Bool = true,
        presentation: KozmosMapControlButtonPresentation = .iconOnly,
        emphasis: KozmosMapControlButtonEmphasis = .tinted,
        labelPlacement: KozmosMapControlButtonLabelPlacement = .inline,
        revealOnChange: Bool = false,
        revealDuration: TimeInterval = 2.5,
        revealDelay: TimeInterval = 0,
        pressed: Bool? = nil,
        isDisabled: Bool = false,
        isLoading: Bool = false,
        action: @escaping () -> Void
    ) {
        self.init(
            label: label,
            stateLabel: stateLabel,
            stateDescription: stateDescription,
            showsLabel: showsLabel,
            presentation: presentation,
            emphasis: emphasis,
            labelPlacement: labelPlacement,
            revealOnChange: revealOnChange,
            revealDuration: revealDuration,
            revealDelay: revealDelay,
            pressed: pressed,
            isDisabled: isDisabled,
            isLoading: isLoading,
            action: action
        ) {
            Image(systemName: systemImage)
        }
    }
}
