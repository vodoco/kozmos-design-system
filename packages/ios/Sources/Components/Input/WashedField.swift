import SwiftUI

/// A field washed rather than outlined, as React draws the route points and
/// the feedback box: no edge, black at 5 % on light and white at 10 % on dark,
/// doubled while focused, the control radius, and the standard focus ring —
/// 2 pt in the ring role, 2 pt out. `multiline` makes it a text area, 80 high
/// at least and growing with its text, as React's is.
struct KozmosWashedField: View {
    @Environment(\.colorScheme) private var colorScheme
    @Binding var text: String
    let placeholder: String
    var multiline: Bool = false
    var label: String? = nil
    @FocusState private var focused: Bool

    var body: some View {
        let radius = KozmosDimensions.semanticsRadiusControl
        let wash = (colorScheme == .dark ? 0.10 : 0.05) * (focused ? 2 : 1)
        let prompt = Text(placeholder).foregroundColor(KozmosColors.primitivesColorsForeground400)
        Group {
            if multiline {
                TextField("", text: $text, prompt: prompt, axis: .vertical)
                    .padding(.vertical, KozmosDimensions.primitivesLayoutSpacing100)
                    .frame(minHeight: 80, alignment: .topLeading)
            } else {
                TextField("", text: $text, prompt: prompt)
                    .frame(height: 40)
            }
        }
        .textFieldStyle(.plain)
        .font(KozmosTypography.subheadline)
        .foregroundColor(KozmosColors.primitivesColorsForeground0)
        .tint(KozmosColors.primitivesColorsTheme600)
        .focused($focused)
        .accessibilityLabel(label ?? placeholder)
        .padding(.horizontal, KozmosDimensions.primitivesLayoutSpacing150)
        .background(
            RoundedRectangle(cornerRadius: radius, style: .continuous)
                .fill(KozmosColors.primitivesColorsForeground0.opacity(wash))
        )
        .overlay(
            RoundedRectangle(cornerRadius: radius + 3, style: .continuous)
                .stroke(KozmosColors.primitivesColorsTheme600, lineWidth: 2)
                .padding(-3)
                .opacity(focused ? 1 : 0)
        )
    }
}
