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
        // SwiftUI's label would lose each part's speech language: a UIKit
        // element says the instruction instead (SpeechLanguage.swift).
        self.kozmosSpeechLanguageElement(
          kozmosInstructionSpokenText(parts, suffix: suffix),
          traits: (activate == nil ? UIAccessibilityTraits.staticText : .button)
            .union(selected ? .selected : []),
          hint: hint, activate: activate)
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
