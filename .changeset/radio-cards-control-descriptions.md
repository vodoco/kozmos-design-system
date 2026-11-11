---
"@kozmos-ds/react": minor
"@kozmos-ds/styles": minor
---

Radio cards and tiles, and a description on Checkbox, Switch and Radio, with Switch's state in words (GAP-158, GAP-162; decision 132).

- **`RadioGroupItem` takes `variant`**: `"default"` (the ring and its label, as before), `"card"` or `"tile"`. A card is a bordered box: `media` (an image or icon) over the ring, the title (`label`) and a `description`. A tile is a smaller box of an icon over the title, for a grid of short choices; lay either out with a `Grid` inside the `RadioGroup`. Each box is one radio named by its title alone, its description read as its description (`aria-describedby`), its media hidden from assistive technology; the group keeps one Tab stop and the arrow keys. Chosen, a box's edge turns theme 600 and a pixel heavier, and the card's ring shows its dot or the tile its check, so the choice is never told by colour alone.
- **`description` on `Checkbox`, `Switch` and `RadioGroupItem`**: a line under the label, read as the control's description and never as part of its name, joined after a caller's `aria-describedby` and before an error's.
- **`Switch` takes `showStateLabel`**, with `onLabel` ("On") and `offLabel` ("Off"): the state in words beside the track, following the switch whether it is controlled or not. The words are not read, as the switch's role already says on or off.

SwiftUI's `KozmosCheckbox`, `KozmosSwitch` and `KozmosRadioGroupItem` take the same `description` (the control's accessibility hint), `showStateLabel`/`onLabel`/`offLabel`, and `variant: .card`/`.tile` with a media view; Compose's take `description` (read after the label in the one node), the state label, and `variant = KozmosRadioGroupItemVariant.Card`/`Tile` with `media`. The Figma importer paints Radio's new Variant axis (Default, Card, Tile), Description Text and Show Description on Checkbox, Radio and Switch, Show State Label on Switch and Show Media on Radio. Vue's bridge passes the new props; a bridged `KozmosRadioGroupItem` still cannot reach a bridged group (GAP-230).
