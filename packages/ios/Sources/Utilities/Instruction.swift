import SwiftUI

#if os(iOS)
  import UIKit
#endif

/// One wrapping/bidi sentence; a qualifier is not a separate horizontal layout item.
struct KozmosInstructionText: View {
  let parts: [KozmosInstructionPart]
  @Environment(\.kozmosSurfaceStyle) private var surface
  @Environment(\.kozmosGuidanceForeground) private var guidance
  var body: some View {
    parts.reduce(Text("")) { sentence, part in
      let text = Text(verbatim: part.text)
      return sentence
        + (part.role == .secondary
          ? text.fontWeight(.regular).foregroundColor(guidance ?? kozmosMutedForeground(on: surface))
          : text)
    }
  }
}

func kozmosInstructionDescription(_ parts: [KozmosInstructionPart], suffix: [String] = []) -> String
{
  ([parts.map(\.text).joined()] + suffix).filter { !$0.isEmpty }.joined(separator: ", ")
}

#if os(iOS)
  func kozmosInstructionSpokenText(_ parts: [KozmosInstructionPart], suffix: [String])
    -> NSAttributedString
  {
    let words = NSMutableAttributedString(string: "")
    for part in parts {
      let fragment = NSMutableAttributedString(string: part.text)
      if let lang = part.lang, !lang.isEmpty {
        fragment.addAttribute(
          .accessibilitySpeechLanguage, value: lang,
          range: NSRange(location: 0, length: fragment.length))
      }
      words.append(fragment)
    }
    for text in suffix where !text.isEmpty {
      words.append(NSAttributedString(string: (words.length == 0 ? "" : ", ") + text))
    }
    return words
  }

  /// SwiftUI's Text accessibility label loses per-range speech language on iOS.
  /// This supported UIKit element replaces only that label, not the visual/touch view.
  private struct KozmosInstructionElement: UIViewRepresentable {
    let words: NSAttributedString
    let selected: Bool
    let hint: String?
    let activate: (() -> Void)?

    final class Element: UIView {
      var activate: (() -> Void)?
      override var accessibilityFrame: CGRect {
        get {
          guard let window else { return .zero }
          return window.convert(convert(bounds, to: window), to: window.screen.coordinateSpace)
        }
        set { super.accessibilityFrame = newValue }
      }
      override func accessibilityActivate() -> Bool {
        guard let activate else { return false }
        activate()
        return true
      }
    }

    func makeUIView(context: Context) -> Element {
      let view = Element()
      view.backgroundColor = .clear
      view.isUserInteractionEnabled = false
      view.isAccessibilityElement = true
      return view
    }
    func updateUIView(_ view: Element, context: Context) {
      view.accessibilityAttributedLabel = words
      view.accessibilityHint = hint
      view.accessibilityTraits = activate == nil ? .staticText : .button
      if selected { view.accessibilityTraits.insert(.selected) }
      view.activate = activate
    }
  }
#endif

extension View {
  @ViewBuilder
  func kozmosInstructionAccessibility(
    _ parts: [KozmosInstructionPart], suffix: [String] = [],
    selected: Bool = false, hint: String? = nil,
    activate: (() -> Void)? = nil
  ) -> some View {
    #if os(iOS)
      if parts.contains(where: { !($0.lang ?? "").isEmpty }) {
        self.accessibilityHidden(true)
          .overlay(
            KozmosInstructionElement(
              words: kozmosInstructionSpokenText(parts, suffix: suffix),
              selected: selected, hint: hint, activate: activate))
      } else {
        self.accessibilityElement(children: .ignore)
          .accessibilityLabel(kozmosInstructionDescription(parts, suffix: suffix))
          .accessibilityHint(hint ?? "")
          .accessibilityAddTraits(selected ? .isSelected : [])
          .accessibilityAddTraits(activate == nil ? [] : .isButton)
      }
    #else
      self.accessibilityElement(children: .ignore)
        .accessibilityLabel(kozmosInstructionDescription(parts, suffix: suffix))
        .accessibilityHint(hint ?? "")
        .accessibilityAddTraits(selected ? .isSelected : [])
        .accessibilityAddTraits(activate == nil ? [] : .isButton)
    #endif
  }
}
