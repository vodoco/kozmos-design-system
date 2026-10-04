import SwiftUI

public struct KozmosWayfindingCard<Content: View>: View {
    let title: String
    let closeLabel: String
    let onClose: (() -> Void)?
    let content: Content
    
    public init(title: String = "Navigation", closeLabel: String = "Close navigation", onClose: (() -> Void)? = nil, @ViewBuilder content: () -> Content) {
        self.title = title
        self.closeLabel = closeLabel
        self.onClose = onClose
        self.content = content()
    }
    
    public var body: some View {
        VStack(spacing: KozmosDimensions.primitivesLayoutSpacing0) {
            HStack {
                Text(title)
                    .font(KozmosTypography.headline)
                Spacer()
                if let onClose = onClose {
                    Button(action: onClose) {
                        Image(systemName: "xmark")
                            .foregroundColor(KozmosColors.primitivesColorsForeground500)
                            .frame(width: 44, height: 44)
                            .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(closeLabel)
                }
            }
            .padding()
            
            content
                .padding(.horizontal)
                .padding(.bottom)
        }
        .background(KozmosColors.primitivesColorsBackground0)
        .cornerRadius(KozmosDimensions.semanticsRadiusContainer)
        .kozmosElevation(KozmosShadows.semanticsElevationFloating)
    }
}

/// An origin and a destination, as React's `WayfindingInputRow` lays them
/// out: a rail — a ring where the route starts, a line, a pin where it ends —
/// beside two borderless raised fields, with the swap button floating over
/// them at the end. Until 2026-09-22 SwiftUI drew two outlined fields with the
/// swap between them in a row of its own, no rail, and no name on the button.
public struct KozmosWayfindingInputRow: View {
    @Environment(\.kozmosAnalytics) var trackEvent
    @Binding var originValue: String
    @Binding var destinationValue: String
    let originPlaceholder: String
    let destinationPlaceholder: String
    let originLabel: String
    let destinationLabel: String
    let swapLabel: String
    let onSwap: () -> Void

    public init(
        originValue: Binding<String>,
        destinationValue: Binding<String>,
        originPlaceholder: String = "Choose starting point...",
        destinationPlaceholder: String = "Choose destination...",
        originLabel: String = "Origin",
        destinationLabel: String = "Destination",
        swapLabel: String = "Swap origin and destination",
        onSwap: @escaping () -> Void
    ) {
        self._originValue = originValue
        self._destinationValue = destinationValue
        self.originPlaceholder = originPlaceholder
        self.destinationPlaceholder = destinationPlaceholder
        self.originLabel = originLabel
        self.destinationLabel = destinationLabel
        self.swapLabel = swapLabel
        self.onSwap = onSwap
    }

    public var body: some View {
        HStack(alignment: .top, spacing: 12) {
            VStack(spacing: 0) {
                Circle()
                    .strokeBorder(KozmosColors.primitivesColorsTheme600, lineWidth: 2)
                    .frame(width: 10, height: 10)
                Capsule()
                    .fill(KozmosColors.semanticsBorderSubtle)
                    .frame(width: 2)
                    .frame(maxHeight: .infinity)
                Image(systemName: "mappin")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(KozmosColors.primitivesColorsTheme600)
                    .frame(width: 16, height: 16)
            }
            .padding(.vertical, 12)
            .frame(width: 16)
            .frame(maxHeight: .infinity)
            .accessibilityHidden(true)

            ZStack(alignment: .trailing) {
                VStack(spacing: 8) {
                    KozmosWayfindingField(text: $originValue, placeholder: originPlaceholder, label: originLabel)
                    KozmosWayfindingField(text: $destinationValue, placeholder: destinationPlaceholder, label: destinationLabel)
                }
                Button(action: {
                    trackEvent(KozmosAnalyticsEvent(eventName: "wayfinding_route_swapped", component: "WayfindingInputRow"))
                    onSwap()
                }) {
                    Image(systemName: "arrow.up.arrow.down")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(KozmosColors.primitivesColorsForeground0)
                        .frame(width: 44, height: 44)
                        .background(
                            Circle()
                                .fill(KozmosColors.primitivesColorsBackground200)
                                .kozmosElevation(KozmosShadows.semanticsElevationRaised)
                        )
                }
                .buttonStyle(.plain)
                .accessibilityLabel(swapLabel)
                .padding(.trailing, 12)
            }
        }
        // The rail stretches to the fields' height, and no further.
        .fixedSize(horizontal: false, vertical: true)
    }
}

/// One of the row's fields: 40 high, the control radius, 12 in from the start
/// and 64 from the end so the text clears the swap button, the raised shadow
/// and no border. Focus draws React's 1 pt ring in the accent, 2 pt out.
///
/// The fill is background/50, opaque. React washes the field in muted at half,
/// and the row sits on the card's background/0, where that wash is exactly
/// background/50 in both themes (#F1F2F4, #0C0D0E). Opaque, because a shadow
/// in SwiftUI is cast by what is drawn and shows through a translucent fill;
/// CSS draws a box shadow outside the box only.
private struct KozmosWayfindingField: View {
    @Binding var text: String
    let placeholder: String
    let label: String
    @FocusState private var focused: Bool

    var body: some View {
        let radius = KozmosDimensions.semanticsRadiusControl
        TextField(
            "",
            text: $text,
            prompt: Text(placeholder).foregroundColor(KozmosColors.primitivesColorsForeground400)
        )
        .font(KozmosTypography.subheadline)
        .foregroundColor(KozmosColors.primitivesColorsForeground0)
        .tint(KozmosColors.primitivesColorsTheme600)
        .focused($focused)
        .accessibilityLabel(label)
        .padding(.leading, 12)
        .padding(.trailing, 64)
        .frame(height: 40)
        .background(
            RoundedRectangle(cornerRadius: radius)
                .fill(KozmosColors.primitivesColorsBackground50)
                .kozmosElevation(KozmosShadows.semanticsElevationRaised)
        )
        .overlay(
            RoundedRectangle(cornerRadius: radius + 2.5)
                .stroke(KozmosColors.primitivesColorsTheme600, lineWidth: 1)
                .padding(-2.5)
                .opacity(focused ? 1 : 0)
        )
    }
}
