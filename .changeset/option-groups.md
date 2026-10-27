---
"@kozmos-ds/react": minor
---

`ComboboxOption` takes `group` (GAP-192), so Combobox, Listbox and MultiSelect list their options under their groups, as MAP-64's content type picker lists types under their families.

- **Order.** Options with no `group` come first, unlabelled, before every group, so none reads as part of the group above it. Then come the groups, in the order they first appear in `options`, each group's options together in their own order. A group's name is trimmed, and a blank one is no group. A list with no groups draws as before.
- **The label** is drawn as `SelectLabel` draws its own: 14/20 semibold, 6 above and below, 12 at the sides. It is an owned rule, `.kozmos-option-group-label`, so it holds where no `@scope` rule reaches.
- **Spacing.** Combobox's and MultiSelect's lists keep their 2 between rows at every join: a label and its first row, a group's last row and the next label, and the rows with no group and the first label. Listbox's grid keeps its 4 throughout.
- **Filtering** keeps a group's label while any of its options matches and drops it when none does. A group keeps its element and its label's id as filtering moves it.
- **Accessibility.** Each group is a `role="group"` named by its label through `aria-labelledby`. The label is not an option: the arrow keys move through the options in the order they are drawn and never stop on a label, as Home and End do in Combobox and Listbox (MultiSelect has neither). With a group's first option active, the group's label is scrolled into view with it. Filtering, the first match made active and `aria-activedescendant` are unchanged.
- **Presses.** A press on a group's label, or on the list's padding or the gap between rows, leaves Combobox's and MultiSelect's list open and focus in the field, where it closed the list and dropped focus to the page. A press on a row in a Listbox group keeps focus on the list.
- **Figma.** Combobox, MultiSelect and Listbox take Show Group Labels, Group 1 Text and Group 2 Text. Their Code Connect maps them to `group` as two connections, so a snippet with the labels off names no group at all.

SwiftUI and Compose do not group yet.
