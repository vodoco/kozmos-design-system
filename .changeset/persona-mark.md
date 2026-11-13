---
"@kozmos-ds/react": minor
"@kozmos-ds/styles": minor
---

`PersonaMark` and `PersonaMarkGroup` are new (GAP-106; decisions 132 and 166): a persona's colour drawn as a small diamond beside its name, as Pointr Cloud marks each persona in a feature's persona visibility list and in its persona menu.

- **`PersonaMark`** takes `color`, the persona's colour as the product holds it (any CSS colour, such as `"#FF9800"`), drawn as given in both themes on `--kozmos-persona-color` and mapped to no token. The diamond is 12 by 12, a square turned an eighth with its points on the box's edges, on the text's middle. Beside the persona's name, as in a checkbox's label, it is decoration, `aria-hidden`, so the name is read once; with `name` it stands alone, `role="img"` named by the persona.
- **`PersonaMarkGroup`** takes `personas`, each `{ name, color }`, and draws their marks 2 apart in the order given: the personas a tree row is visible to. It is one image, named by `label` and every persona's name, "Assigned personas: Customer, Visitor, Staff"; `label` is English by default. With no persona it draws nothing.
- In forced colours the diamond is drawn in `CanvasText`: the system's colours replace the product's, the shape stays, and the persona is told by its name, never by colour alone. The rules are `.kozmos-persona-mark`, `.kozmos-persona-mark-shape` and `.kozmos-persona-marks` in `@kozmos-ds/styles`.

SwiftUI has `KozmosPersonaMark(color:name:)` and `KozmosPersonaMarkGroup(_:label:)` with `KozmosPersonaMarkPersona`; Compose has `KozmosPersonaMark(color, name)` and `KozmosPersonaMarkGroup(personas, label)` with `KozmosPersonaMarkPersona`: hidden from VoiceOver and TalkBack beside a name, an image standing alone, and a group one image read by its label and names. The Figma importer paints a PersonaMark set, its Form Single or Group. Vue's bridge exports `KozmosPersonaMark` and `KozmosPersonaMarkGroup`.
