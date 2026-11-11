---
"@kozmos-ds/react": minor
"@kozmos-ds/styles": minor
---

Radio cards and tiles, and a description on Checkbox, Switch and Radio, with Switch's state in words (GAP-158, GAP-162; decision 132).

- **`RadioGroupItem` takes `variant`**: `"default"` (the ring and its label, as before), `"card"` or `"tile"`. A card is a bordered box: `media` (an image or icon) over the ring, the title (`label`) and a `description`. A tile is a smaller box of an icon over the title, for a grid of short choices; lay either out with a `Grid` inside the `RadioGroup`. Each box is one radio named by its title alone, its description read as its description (`aria-describedby`), its media hidden from assistive technology; the group keeps one Tab stop and the arrow keys. Chosen, a box's edge turns theme 600 and a pixel heavier, and the card's ring shows its dot or the tile its check, so the choice is never told by colour alone.
- **`description` on `Checkbox`, `Switch` and `RadioGroupItem`**: a line under the label, read as the control's description and never as part of its name, joined after a caller's `aria-describedby` and before an error's.
- **`Switch` takes `showStateLabel`**, with `onLabel` ("On") and `offLabel` ("Off"): the state in words beside the track, following the switch whether it is controlled or not. The words are not read, as the switch's role already says on or off.

- **Arrows follow the order, not the grid** (the WAI-ARIA radio pattern): every arrow key moves to the next or previous option as written, wrapping. **A box needs a title**: its description is never its name, so a card or tile with no `label` and no `aria-label` has none, and React warns once in development; give an icon-only tile `aria-label`.

SwiftUI: `KozmosCheckbox`, `KozmosSwitch` and `KozmosRadioGroupItem` take `description`, read after the name as high-importance custom content (spoken whatever the Speak Hints setting; its key "Description" is looked up in the app's Localizable strings); `KozmosSwitch` takes `showStateLabel`, `onLabel` and `offLabel`. `KozmosSwitch` and `KozmosCheckbox` now say their state to VoiceOver, which heard only their name: their value is the state in words (`onLabel`/`offLabel`; the checkbox's new `checkedLabel`/`uncheckedLabel`, "Checked"/"Unchecked"), and from iOS 17 they carry the toggle trait. `KozmosRadioGroupItem` takes `variant: .card`/`.tile` and a media view, so it is now generic, `KozmosRadioGroupItem<Media>`: every initialiser compiles unchanged, but code that names the type needs a parameter, `KozmosRadioGroupItem<EmptyView>` for an option without media. An untitled card or tile is logged once in a debug build.

Compose: the same `description`, state label, and `variant = KozmosRadioGroupItemVariant.Card`/`Tile` with `media`; a tile fills its width as a card does. `KozmosCheckbox` is now a toggleable with the Checkbox role, so TalkBack says checked or not (its row was a bare clickable). The default radio's label takes Kozmos's foreground/0, not Material's onSurface.

The Figma importer paints Radio's new Variant axis (Default, Card, Tile), Description Text and Show Description on Checkbox, Radio and Switch, Show State Label on Switch and Show Media on Radio; the audit's style guess knows the descriptions and state words are regular. Vue's bridge passes the new props; a bridged `KozmosRadioGroupItem` still cannot reach a bridged group (GAP-230), so a working group of cards cannot be drawn through it yet.
