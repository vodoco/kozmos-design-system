import SwiftUI

/// The parts of the manoeuvre card VoiceOver can be on.
enum KozmosManoeuvreCardPart: Hashable {
    case instruction, itinerary, bar
}

/// The current manoeuvre, floating over the map during navigation: its arrow,
/// the instruction, how far and how long, and a grab bar that opens the full
/// itinerary in its place. Theme-filled by default, with contrasting instruction
/// and detail text. A `surface:` named with no `appearance:` is the neutral
/// solid or glass surface it names, as a 0.5.0 call got (D6); an `appearance:`
/// named wins, `.background` on `surface` or solid. The 36 × 5 grab bar has a
/// minimum 44-point activation area.
///
/// The card owns the toggle and what VoiceOver hears of it. The itinerary it
/// opens into is the caller's — `KozmosItinerary`, in the products — so the
/// card never decides what a route is made of. Open, the card is as tall as
/// the itinerary up to `maxItineraryHeight`, past which the itinerary scrolls:
/// a long route must not cover the map.
///
/// The instruction shows whole, and the card grows with it (GAP-094): two
/// lines cut ordinary instructions short of the level, the side, or in German
/// the turn itself. A product that wants a limit passes `instructionLines`.
///
/// VoiceOver's focus goes with the disclosure (review T4): opening takes the
/// instruction away and closing hides the grab bar, so focus that was on the
/// part that went moves to the one that took its place — the itinerary on
/// opening, the instruction on closing. Focus anywhere else is left alone,
/// whether the change came from the card or from the product.
public struct KozmosManoeuvreCard<Itinerary: View>: View {
    let type: DirectionType
    let instructionParts: [KozmosInstructionPart]
    var instruction: String { instructionParts.map(\.text).joined() }
    let detail: String?
    let instructionLines: Int?
    let isExpanded: Bool
    let onToggle: () -> Void
    let expandLabel: String
    let collapseLabel: String
    let manoeuvreLabel: String
    let surface: KozmosSurfaceStyle
    let appearance: KozmosManoeuvreAppearance
    let maxItineraryHeight: CGFloat
    let itinerary: Itinerary

    typealias FocusedPart = KozmosManoeuvreCardPart

    /// Which part VoiceOver is on, and where it goes as the card opens or closes.
    @AccessibilityFocusState private var voiceOverFocus: FocusedPart?
    /// Where VoiceOver goes once the card's own toggle has opened or closed
    /// it, decided as the toggle is pressed: VoiceOver is on the part then.
    @State private var focusAfterToggle: FocusedPart?

    /// - Parameter instructionLines: The most lines the instruction is drawn
    ///   in before it ends in an ellipsis. Nil, the default, shows the whole
    ///   instruction; so does a value under one. VoiceOver hears the whole
    ///   instruction either way.
    public init(
        type: DirectionType,
        instruction: String,
        detail: String? = nil,
        instructionLines: Int? = nil,
        isExpanded: Bool,
        onToggle: @escaping () -> Void,
        expandLabel: String = "Show itinerary",
        collapseLabel: String = "Hide itinerary",
        manoeuvreLabel: String = "Current manoeuvre",
        surface: KozmosSurfaceStyle? = nil,
        maxItineraryHeight: CGFloat = 320,
        appearance: KozmosManoeuvreAppearance? = nil,
        @ViewBuilder itinerary: () -> Itinerary
    ) {
        self.init(type: type, instruction: [KozmosInstructionPart(text: instruction)], detail: detail,
                  instructionLines: instructionLines, isExpanded: isExpanded, onToggle: onToggle,
                  expandLabel: expandLabel, collapseLabel: collapseLabel, manoeuvreLabel: manoeuvreLabel,
                  surface: surface, maxItineraryHeight: maxItineraryHeight, appearance: appearance, itinerary: itinerary)
    }

    public init(
        type: DirectionType,
        instruction: [KozmosInstructionPart],
        detail: String? = nil,
        instructionLines: Int? = nil,
        isExpanded: Bool,
        onToggle: @escaping () -> Void,
        expandLabel: String = "Show itinerary",
        collapseLabel: String = "Hide itinerary",
        manoeuvreLabel: String = "Current manoeuvre",
        surface: KozmosSurfaceStyle? = nil,
        maxItineraryHeight: CGFloat = 320,
        appearance: KozmosManoeuvreAppearance? = nil,
        @ViewBuilder itinerary: () -> Itinerary
    ) {
        self.type = type
        self.instructionParts = instruction
        self.detail = detail
        self.instructionLines = instructionLines
        self.isExpanded = isExpanded
        self.onToggle = onToggle
        self.expandLabel = expandLabel
        self.collapseLabel = collapseLabel
        self.manoeuvreLabel = manoeuvreLabel
        // Nil is what the caller left out: only a surface named turns the theme fill off.
        self.surface = surface ?? .solid
        self.appearance = appearance ?? (surface == nil ? .theme : .background)
        self.maxItineraryHeight = maxItineraryHeight
        self.itinerary = itinerary()
    }

    /// What VoiceOver reads for the closed card: the instruction, then the
    /// detail. The arrow says nothing the instruction does not.
    static func accessibilityDescription(instruction: String, detail: String?) -> String {
        [instruction, detail].compactMap { $0 }.filter { !$0.isEmpty }.joined(separator: ", ")
    }

    /// The lines the instruction is cut at: none, unless the product asks
    /// for one line or more.
    static func instructionLineLimit(_ lines: Int?) -> Int? {
        guard let lines, lines >= 1 else { return nil }
        return lines
    }

    /// Where VoiceOver goes as the card opens or closes, from the part it was
    /// on: nil leaves it where it is. Opening takes away the instruction, so
    /// focus on it moves to the itinerary that took its place; closing takes
    /// away the itinerary and silences the grab bar, so focus on either moves
    /// to the instruction. Focus anywhere else was not in what changed.
    static func voiceOverFocus(afterExpanding expanded: Bool, from part: FocusedPart?) -> FocusedPart? {
        switch (expanded, part) {
        case (true, .instruction): return .itinerary
        case (false, .itinerary), (false, .bar): return .instruction
        default: return nil
        }
    }

    /// The card's own toggle: it decides where VoiceOver goes while VoiceOver
    /// is still on the part that was pressed, then asks the product to flip.
    private func toggle() {
        focusAfterToggle = Self.voiceOverFocus(afterExpanding: !isExpanded, from: voiceOverFocus)
        onToggle()
    }

    public var body: some View {
        VStack(spacing: KozmosDimensions.primitivesLayoutSpacing150) {
            if isExpanded {
                // The itinerary as it is when it fits the cap, in a scroll
                // view when it does not: decided in one layout pass, so the
                // card never shows a frame at the wrong height. A scroll view
                // alone would take the whole cap for a route of three steps,
                // and so would `.frame(maxHeight:)`, which takes all of the
                // proposal up to its maximum; the layout below proposes the
                // cap and is only as tall as what it holds.
                KozmosCappedHeightLayout(cap: maxItineraryHeight) {
                    ViewThatFits(in: .vertical) {
                        itinerary
                            .frame(maxWidth: .infinity, alignment: .leading)
                        ScrollView {
                            itinerary
                                .frame(maxWidth: .infinity, alignment: .leading)
                        }
                    }
                }
                // Where VoiceOver is sent as the card opens: the itinerary,
                // one container around whatever the product put in it.
                .accessibilityElement(children: .contain)
                .kozmosVoiceOverFocus($voiceOverFocus, .itinerary)
            } else {
                // The instruction row is the button: a tap anywhere on it opens
                // the itinerary, and VoiceOver hears the manoeuvre with that hint.
                Button(action: toggle) {
                    HStack(alignment: .top, spacing: KozmosDimensions.primitivesLayoutSpacing150) {
                        KozmosDirectionGlyph(type: type, size: 22)
                            // On the theme fill, the theme foreground; on a surface, theme
                            // 600, the theme's text role (decision 59).
                            .foregroundColor(appearance == .theme ? KozmosColors.componentsPrimaryButtonsThemedButtonForegroundContentIdle : KozmosColors.primitivesColorsTheme600)
                            .frame(width: KozmosDimensions.primitivesLayoutSizing400, height: KozmosDimensions.primitivesLayoutSizing400)
                        VStack(alignment: .leading, spacing: KozmosDimensions.primitivesLayoutSpacing25) {
                            // Whole unless the product asks for a limit (GAP-094).
                            KozmosInstructionText(parts: instructionParts)
                                .font(KozmosTypography.title3.weight(.semibold))
                                .foregroundColor(appearance == .theme ? KozmosColors.componentsPrimaryButtonsThemedButtonForegroundContentIdle : KozmosColors.primitivesColorsForeground100)
                                .lineLimit(Self.instructionLineLimit(instructionLines))
                                .fixedSize(horizontal: false, vertical: true)
                            if let detail, !detail.isEmpty {
                                // Muted, and on glass the foreground colour
                                // (decision 48): the card's surface says which.
                                Text(detail)
                                    .font(KozmosTypography.subheadline)
                                    .kozmosMutedText()
                            }
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .kozmosInstructionAccessibility(instructionParts, suffix: [detail].compactMap { $0 },
                                                hint: expandLabel, activate: toggle)
                .kozmosVoiceOverFocus($voiceOverFocus, .instruction)
            }
            // The grab bar: the sign that the card opens, and the way to close it.
            Button(action: toggle) {
                Capsule()
                    .fill(appearance == .theme ? KozmosColors.componentsPrimaryButtonsThemedButtonForegroundContentIdle : KozmosColors.primitivesColorsBackground300)
                    .frame(width: 36, height: 5)
                    .padding(.vertical, KozmosDimensions.primitivesLayoutSpacing50)
                    .frame(maxWidth: .infinity, minHeight: 44)
                    .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel(isExpanded ? collapseLabel : expandLabel)
            // Closed, the instruction row already offers the way in.
            .accessibilityHidden(!isExpanded)
            .kozmosVoiceOverFocus($voiceOverFocus, .bar)
        }
        // Opened or closed, by the card's toggle or by the product: focus
        // that was on the part that went follows to the part in its place.
        // The toggle decided while VoiceOver was still on what it pressed;
        // a change from the product reads where VoiceOver is now.
        .onChange(of: isExpanded) { expanded in
            let target = focusAfterToggle ?? Self.voiceOverFocus(afterExpanding: expanded, from: voiceOverFocus)
            focusAfterToggle = nil
            if let target { voiceOverFocus = target }
        }
        .padding(.top, KozmosDimensions.primitivesLayoutSpacing200)
        .padding(.horizontal, KozmosDimensions.primitivesLayoutSpacing200)
        .padding(.bottom, KozmosDimensions.primitivesLayoutSpacing50)
        .frame(maxWidth: .infinity)
        .modifier(KozmosGuidanceSurface(appearance: appearance, surface: surface))
        .kozmosElevation(KozmosShadows.semanticsElevationFloating)
        .accessibilityElement(children: .contain)
        // Keep the card named even when custom itinerary content has no
        // container of its own. Contain, rather than combine, its controls.
        .accessibilityLabel(manoeuvreLabel)
    }
}

private extension View {
    /// Binds VoiceOver's focus on this view to `part`. iOS only, as
    /// FloorSelector's is: on a Mac `ImageRenderer` draws nothing of a view
    /// that carries it (FloorSelector measured it), and VoiceOver on a Mac is
    /// not what the card is for.
    @ViewBuilder
    func kozmosVoiceOverFocus(
        _ focus: AccessibilityFocusState<KozmosManoeuvreCardPart?>.Binding,
        _ part: KozmosManoeuvreCardPart
    ) -> some View {
        #if os(iOS)
        accessibilityFocused(focus, equals: part)
        #else
        self
        #endif
    }
}
