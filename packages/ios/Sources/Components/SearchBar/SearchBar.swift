import SwiftUI

public struct KozmosSearchBar<Trailing: View>: View {
    @Environment(\.kozmosAnalytics) var trackEvent
    @Binding var text: String
    let placeholder: String
    let onClear: (() -> Void)?
    /// The host's focus for the field, so a sheet can open when the field is
    /// tapped and the host can end the search from a Cancel of its own.
    let focused: FocusState<Bool>.Binding?
    /// What sits at the end of the search row — the assistant's button, in the
    /// SDK's sheet. The row is the component's, not the caller's: composed by
    /// hand the pair ends up on two lines the moment the row is narrow, and on
    /// the web it did exactly that. Nothing here can put them apart.
    let trailing: Trailing

    public init(
        text: Binding<String>,
        placeholder: String = "Search...",
        focused: FocusState<Bool>.Binding? = nil,
        onClear: (() -> Void)? = nil,
        @ViewBuilder trailing: () -> Trailing
    ) {
        self._text = text
        self.placeholder = placeholder
        self.focused = focused
        self.onClear = onClear
        self.trailing = trailing()
    }

    public var body: some View {
        HStack(spacing: KozmosDimensions.primitivesLayoutSpacing100) {
            field_row
            trailing
        }
    }

    private var field_row: some View {
        HStack(spacing: KozmosDimensions.primitivesLayoutSpacing100) {
            Image(systemName: "magnifyingglass")
                .font(.system(size: 16, weight: .medium))
                .foregroundColor(KozmosColors.primitivesColorsForeground500)
                // Decoration: the field says what it is. Left audible, the
                // symbol read "Search" before it.
                .accessibilityHidden(true)
            
            field
                .onSubmit {
                    trackEvent(KozmosAnalyticsEvent(eventName: "search_initiated", component: "SearchBar", properties: ["query": text]))
                }
                
            if !text.isEmpty {
                Button(action: {
                    trackEvent(KozmosAnalyticsEvent(eventName: "search_cleared", component: "SearchBar"))
                    text = ""
                    onClear?()
                }) {
                    // A 24 grey circle to see; the 44 button around it to hit.
                    Image(systemName: "xmark")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(KozmosColors.primitivesColorsForeground500)
                        .frame(width: KozmosDimensions.primitivesLayoutSizing300, height: KozmosDimensions.primitivesLayoutSizing300)
                        .background(Circle().fill(KozmosColors.primitivesColorsBackground300))
                        .frame(width: 44, height: 44)
                        .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Clear search")
                .transition(KozmosTransitions.reveal)
            }
        }
        // The clear circle comes and goes on the quick motion, not at once.
        .animation(KozmosMotion.quick, value: text.isEmpty)
        .padding(.horizontal, KozmosDimensions.primitivesLayoutSpacing150)
        // 44 tall: a control's height, the prototype's field.
        .frame(height: 44)
        .background(KozmosColors.primitivesColorsBackground0)
        .cornerRadius(KozmosDimensions.semanticsRadiusControl)
        .kozmosElevation(KozmosShadows.semanticsElevationFloating)
        // No outer margins. A component that pads itself decides its caller's
        // layout for them, and here it meant the field could never sit the same
        // distance from the top of a sheet as it did from the sides.
    }

    @ViewBuilder private var field: some View {
        if let focused {
            TextField(placeholder, text: $text).focused(focused)
        } else {
            TextField(placeholder, text: $text)
        }
    }
}

extension KozmosSearchBar where Trailing == EmptyView {
    /// A field with nothing after it. `EmptyView` here is the whole content of
    /// the trailing slot, not a child of a layout that would mis-measure it.
    public init(
        text: Binding<String>,
        placeholder: String = "Search...",
        focused: FocusState<Bool>.Binding? = nil,
        onClear: (() -> Void)? = nil
    ) {
        self.init(
            text: text,
            placeholder: placeholder,
            focused: focused,
            onClear: onClear,
            trailing: { EmptyView() }
        )
    }

}
