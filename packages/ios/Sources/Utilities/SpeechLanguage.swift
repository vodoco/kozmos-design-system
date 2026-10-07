import SwiftUI

#if os(iOS)
  import UIKit
#endif

/// A phrase VoiceOver says, and the BCP 47 language to say it in when that
/// differs from the interface's: a result's authored name, or the summary the
/// model wrote in the query's language. Nil or empty is the interface's.
struct KozmosSpokenPhrase: Equatable {
  let text: String
  let lang: String?

  init(_ text: String, lang: String? = nil) {
    self.text = text
    self.lang = lang
  }

  var hasLanguage: Bool { !(lang ?? "").isEmpty }
}

/// The phrases as one label, ", " between them: what VoiceOver reads.
func kozmosSpokenDescription(_ phrases: [KozmosSpokenPhrase]) -> String {
  phrases.map(\.text).joined(separator: ", ")
}

#if os(iOS)
  /// The same words, each phrase with a language carrying
  /// `.accessibilitySpeechLanguage` over exactly its own range.
  func kozmosSpokenText(_ phrases: [KozmosSpokenPhrase]) -> NSAttributedString {
    let words = NSMutableAttributedString(string: "")
    for (index, phrase) in phrases.enumerated() {
      if index > 0 { words.append(NSAttributedString(string: ", ")) }
      let fragment = NSMutableAttributedString(string: phrase.text)
      if let lang = phrase.lang, !lang.isEmpty {
        fragment.addAttribute(
          .accessibilitySpeechLanguage, value: lang,
          range: NSRange(location: 0, length: fragment.length))
      }
      words.append(fragment)
    }
    return words
  }

  /// SwiftUI's Text accessibility label loses per-range speech language on iOS.
  /// This supported UIKit element replaces only that label, not the visual/touch
  /// view: it lies over the view it speaks for, takes no touches, and is the one
  /// element VoiceOver finds there.
  struct KozmosSpeechLanguageElement: UIViewRepresentable {
    let words: NSAttributedString
    let traits: UIAccessibilityTraits
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
      view.accessibilityTraits = traits
      view.activate = activate
    }
  }

  extension View {
    /// Hides this view from VoiceOver and lays `KozmosSpeechLanguageElement`
    /// over it, saying `words` with each range's speech language.
    func kozmosSpeechLanguageElement(
      _ words: NSAttributedString, traits: UIAccessibilityTraits, hint: String? = nil,
      activate: (() -> Void)? = nil
    ) -> some View {
      self.accessibilityHidden(true)
        .overlay(
          KozmosSpeechLanguageElement(
            words: words, traits: traits, hint: hint, activate: activate))
    }
  }
#endif
