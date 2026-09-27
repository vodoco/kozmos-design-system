---
"@kozmos-ds/react": minor
---

The assistant's parts can be found, named and told apart.

**`AICompanionPanel` is a region named by its title**, and the title is a heading: an `h2` by
default, set with `titleLevel` (2 to 6) to fit the page's outline. It was a `p`. The panel moves
focus into itself when it mounts and hands it back when it closes; `onOpenAutoFocus` and
`onCloseAutoFocus` let a product send focus elsewhere, or keep it where it is with
`event.preventDefault()`.

**`AIMessage` and `UserMessage` say who spoke.** Each begins with a visually hidden "Assistant said"
or "You said", so a screen reader reading the log can tell the turns apart. The defaults are
English; pass a translated `speakerLabel`.

**`AIInputBar`** draws its focus ring around the whole bar while the field has focus, draws a
disabled field as disabled, takes `inputRef` to reach the field, and its send button is 44px.
