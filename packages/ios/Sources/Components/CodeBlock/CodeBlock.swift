import SwiftUI
#if canImport(UIKit)
import UIKit
#elseif canImport(AppKit)
import AppKit
#endif

/// A read-only block of code (GAP-216, decision 225), as React's
/// `CodeBlock`: the code in the mono family (`KozmosTypography.mono`), in
/// the foreground on the muted surface (background/100), on the control
/// radius, 12 inside. Long lines wrap (the default); with `wrap: false` each
/// line stays whole and the block scrolls sideways. An optional copy at the
/// top end copies the code and says so, in the product's words. No syntax
/// colouring: the code is plain text, selectable.
///
/// MAP-619's merged unit shows a custom field's JSON in one. VoiceOver finds
/// a container named `label` holding the code, and the copy beside it.
public struct KozmosCodeBlock: View {
    let code: String
    let label: String
    let wrap: Bool
    let maxHeight: CGFloat?
    let copyable: Bool
    let copyLabel: String
    let copiedLabel: String
    let onCopy: ((String) -> Void)?
    /// The copy's check, while it shows: a count, so a second copy restarts it.
    @State private var copiedCount = 0

    /// Inside the block, layout spacing 150.
    static let padding: CGFloat = KozmosDimensions.primitivesLayoutSpacing150
    /// The control radius.
    static let cornerRadius: CGFloat = KozmosDimensions.semanticsRadiusControl
    /// The copy's target, and the 4 between it and the block's edges.
    static let copySize: CGFloat = 44
    static let copyInset: CGFloat = KozmosDimensions.primitivesLayoutSpacing50

    /// - Parameters:
    ///   - code: shown as written, every space and line kept.
    ///   - label: the block's name to VoiceOver, "mergedUnit JSON".
    ///   - wrap: long lines wrap; `false` scrolls the block sideways.
    ///   - maxHeight: the block's tallest, so a long value never pushes the
    ///     page: past it the code scrolls inside the block. Unset (nil), the
    ///     block is as tall as its code.
    ///   - copyable: a copy button at the top end.
    ///   - copyLabel: the copy's name, "Copy" by default.
    ///   - copiedLabel: what is announced once copied, "Copied" by default.
    ///   - onCopy: called with the code once it is copied.
    public init(
        _ code: String,
        label: String,
        wrap: Bool = true,
        maxHeight: CGFloat? = nil,
        copyable: Bool = false,
        copyLabel: String = "Copy",
        copiedLabel: String = "Copied",
        onCopy: ((String) -> Void)? = nil
    ) {
        self.code = code
        self.label = label
        self.wrap = wrap
        self.maxHeight = maxHeight
        self.copyable = copyable
        self.copyLabel = copyLabel
        self.copiedLabel = copiedLabel
        self.onCopy = onCopy
    }

    public var body: some View {
        ZStack(alignment: .topTrailing) {
            if let maxHeight {
                // The code as it is when it fits the cap, in a scroll view
                // when it does not, decided in one layout pass: a scroll view
                // alone, or `.frame(maxHeight:)`, would take the whole cap for
                // a short value (as ManoeuvreCard's itinerary).
                KozmosCappedHeightLayout(cap: maxHeight) {
                    ViewThatFits(in: .vertical) {
                        unscrolled
                        ScrollView(wrap ? .vertical : [.horizontal, .vertical]) {
                            wrap ? AnyView(codeText) : AnyView(codeText.fixedSize(horizontal: true, vertical: false))
                        }
                    }
                }
            } else {
                unscrolled
            }
            if copyable {
                copyButton.padding(Self.copyInset)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: Self.cornerRadius, style: .continuous)
                .fill(KozmosColors.primitivesColorsBackground100)
        )
        .clipShape(RoundedRectangle(cornerRadius: Self.cornerRadius, style: .continuous))
        .accessibilityElement(children: .contain)
        .accessibilityLabel(label)
    }

    /// The code at its own height: wrapped, or in a sideways scroll.
    @ViewBuilder
    private var unscrolled: some View {
        if wrap {
            codeText
        } else {
            ScrollView(.horizontal) {
                codeText.fixedSize(horizontal: true, vertical: false)
            }
        }
    }

    private var codeText: some View {
        Text(verbatim: code)
            .font(KozmosTypography.mono(.subheadline))
            .foregroundColor(KozmosColors.primitivesColorsForeground0)
            .multilineTextAlignment(.leading)
            .textSelection(.enabled)
            .frame(maxWidth: wrap ? .infinity : nil, alignment: .leading)
            .padding(Self.padding)
            // The code is kept clear of the copy.
            .padding(.trailing, copyable ? Self.copySize + Self.copyInset - Self.padding : 0)
    }

    private var copyButton: some View {
        Button(action: copy) {
            Image(systemName: copiedCount > 0 ? "checkmark" : "doc.on.doc")
                .font(.system(size: 16, weight: .medium))
                .frame(width: Self.copySize, height: Self.copySize)
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .foregroundColor(KozmosColors.primitivesColorsForeground400)
        .accessibilityLabel(copyLabel)
    }

    private func copy() {
        #if canImport(UIKit) && !os(watchOS)
        UIPasteboard.general.string = code
        UIAccessibility.post(notification: .announcement, argument: copiedLabel)
        #elseif canImport(AppKit)
        NSPasteboard.general.clearContents()
        NSPasteboard.general.setString(code, forType: .string)
        #endif
        copiedCount += 1
        let count = copiedCount
        DispatchQueue.main.asyncAfter(deadline: .now() + KozmosFieldAction.copiedDuration) {
            if copiedCount == count { copiedCount = 0 }
        }
        onCopy?(code)
    }
}
