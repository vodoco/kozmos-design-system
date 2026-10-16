---
"@kozmos-ds/react": patch
---

Core fixes from an independent review:

- **Switch** keeps a caller's `aria-describedby` and joins its own error to it, and keeps a caller's `aria-invalid`; it replaced both.
- **Checkbox** runs a caller's `onCheckedChange` and still reports `checkbox_toggled`: the caller's handler replaced the analytics wrapper. A caller's `aria-describedby` is joined with the error's, and a caller cannot clear an error with `aria-invalid={false}`.
- **Toast** reads its direction: the room for its close (`pe-8`), the close itself (`end-2`) and the space between its words and its action (`gap-4`, which was `space-x-4`) follow a right-to-left toast. A toast marked `destructive` draws its close in the destructive roles, not Tailwind's red-300 to red-600.
- **Search**'s icon and the room the text leaves for it are at the inline start, in a right-to-left field too; in Safari the text no longer runs under the icon. A caller's `aria-describedby` is joined with the error's, a caller cannot clear an error, and a caller's `id` coming or going no longer breaks the hook order.
- **Tag**'s remove button has a 24 by 24 target round its 16px mark (WCAG 2.2's 2.5.8), from owned CSS, so the Tag draws no larger, and a new `removeLabel` prop names it in the product's language ("Remove" by default).
- **Slider** documents `thumbLabels`, which names each thumb in the product's language.
