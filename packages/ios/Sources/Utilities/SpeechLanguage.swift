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

/// A named action VoiceOver offers on an element besides its activation, as
/// a result's "Open details" (decision 72).
struct KozmosSpokenAction {
  let name: String
  let perform: () -> Void
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
  /// element VoiceOver finds there, and XCUITest too (measured on iOS 26.5 and
  /// 18.2; iOS 16 and 17 and Mac Catalyst were not measured).
  struct KozmosSpeechLanguageElement: UIViewRepresentable {
    let words: NSAttributedString
    let traits: UIAccessibilityTraits
    let hint: String?
    /// The identifier a UI test finds the view by. The view's accessibility is
    /// replaced by nothing, so an identifier set on the view itself reaches no
    /// element: the element carries it instead.
    let identifier: String?
    let activate: (() -> Void)?
    /// The element's named actions, in VoiceOver's actions rotor.
    var actions: [KozmosSpokenAction] = []

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
      view.accessibilityIdentifier = identifier
      view.accessibilityTraits = traits
      view.activate = activate
      view.accessibilityCustomActions =
        actions.isEmpty
        ? nil
        : actions.map { action in
          UIAccessibilityCustomAction(name: action.name) { _ in
            action.perform()
            return true
          }
        }
    }
  }

  extension View {
    /// Lays `KozmosSpeechLanguageElement` over this view, saying `words` with
    /// each range's speech language, and replaces this view's accessibility
    /// with nothing, so the element is the one VoiceOver finds, and the one
    /// XCUITest finds (measured on iOS 26.5 and 18.2; iOS 16 and 17 and Mac
    /// Catalyst were not measured).
    func kozmosSpeechLanguageElement(
      _ words: NSAttributedString, traits: UIAccessibilityTraits, hint: String? = nil,
      identifier: String? = nil, activate: (() -> Void)? = nil,
      actions: [KozmosSpokenAction] = []
    ) -> some View {
      // `.accessibilityHidden(true)` hid the view from assistive
      // technologies but not from XCUITest: XCUITest still listed it, with
      // its texts, beside the element at the same frame, so a result's
      // identifier matched two buttons, as the accordion trigger's title did
      // (measured on iOS 26.5 and 18.2; iOS 16 and 17 and Mac Catalyst were
      // not measured).
      self.accessibilityRepresentation { EmptyView() }
        .overlay(
          KozmosSpeechLanguageElement(
            words: words, traits: traits, hint: hint, identifier: identifier,
            activate: activate, actions: actions))
    }
  }
#endif
