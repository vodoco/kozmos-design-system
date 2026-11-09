import SwiftUI

/// A search field: a magnifying glass, the query, and — `clearable` — a clear
/// button at the trailing end while the field holds text (GAP-161, decision
/// 132), as React's `clearable` Search.
///
/// The clear is named by `clearLabel`, "Clear search" unless the product
/// gives its own words. Pressing it empties the binding, calls `onClear`,
/// sends `search_cleared` (no query: the query is never sent) and puts the
/// focus back in the field. Escape from a hardware keyboard clears the same
/// way while the field holds text (iOS 17 and later); with an empty field it
/// is left to the container. It is hidden while the field is disabled.
public struct KozmosSearch: View {
    @Binding var text: String
    let placeholder: String
    let clearable: Bool
    let clearLabel: String
    let onClear: (() -> Void)?

    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.kozmosAnalytics) private var trackEvent
    @FocusState private var focused: Bool

    /// The clear's hit target: as tall as the field, 44.
    static var clearHitArea: CGFloat { 44 }

    public init(
        text: Binding<String>,
        placeholder: String = "Search",
        clearable: Bool = false,
        clearLabel: String = "Clear search",
        onClear: (() -> Void)? = nil
    ) {
        self._text = text
        self.placeholder = placeholder
        self.clearable = clearable
        self.clearLabel = clearLabel
        self.onClear = onClear
    }

    var showsClear: Bool { clearable && isEnabled && !text.isEmpty }

    public var body: some View {
        HStack(spacing: KozmosDimensions.primitivesLayoutSpacing100) {
            Image(systemName: "magnifyingglass")
                .foregroundColor(KozmosColors.primitivesColorsForeground400)
                .accessibilityHidden(true)

            TextField(placeholder, text: $text)
                .focused($focused)
                .modifier(KozmosEscapeClears(enabled: showsClear, clear: clear))

            if showsClear {
                Button(action: clear) {
                    Image(systemName: "xmark")
                        .font(.subheadline.weight(.semibold))
                        .frame(width: Self.clearHitArea, height: Self.clearHitArea)
                        .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .foregroundColor(KozmosColors.primitivesColorsForeground400)
                .accessibilityLabel(clearLabel)
                // The button is the field's height and sits on its trailing
                // edge: the padding it would have is its own inset.
                .padding(.vertical, -KozmosDimensions.primitivesLayoutSpacing100)
                .padding(.trailing, -KozmosDimensions.primitivesLayoutSpacing150)
            }
        }
        // The field is 44 tall, the clear's target, with the clear or
        // without, so it does not grow when the first letter is typed.
        .frame(minHeight: Self.clearHitArea - 2 * KozmosDimensions.primitivesLayoutSpacing100)
        .padding(EdgeInsets(top: KozmosDimensions.primitivesLayoutSpacing100, leading: KozmosDimensions.primitivesLayoutSpacing150, bottom: KozmosDimensions.primitivesLayoutSpacing100, trailing: KozmosDimensions.primitivesLayoutSpacing150))
        .background(KozmosColors.primitivesColorsBackground0)
        .cornerRadius(KozmosDimensions.semanticsRadiusControl)
        .overlay(
            RoundedRectangle(cornerRadius: KozmosDimensions.semanticsRadiusControl)
                .stroke(KozmosColors.semanticsBorderInput, lineWidth: 1)
        )
    }

    /// Empties the field through its binding, tells the product, and gives
    /// the field the focus back: the button it was on is gone.
    func clear() {
        text = ""
        onClear?()
        trackEvent(KozmosAnalyticsEvent(eventName: "search_cleared", component: "Search"))
        focused = true
    }
}

/// Escape clears the field while `enabled`, and is consumed; otherwise it is
/// left to the container. `onKeyPress` is iOS 17 and macOS 14.
private struct KozmosEscapeClears: ViewModifier {
    let enabled: Bool
    let clear: () -> Void

    func body(content: Content) -> some View {
        if #available(iOS 17.0, macOS 14.0, *) {
            content.onKeyPress(.escape) {
                guard enabled else { return .ignored }
                clear()
                return .handled
            }
        } else {
            content
        }
    }
}
